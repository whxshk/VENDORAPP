import express from "express";
import pkg from "stremio-addon-sdk";
const { addonBuilder, getRouter } = pkg;
import WebTorrent from "webtorrent";
import fetch from "node-fetch";

const app = express();
const client = new WebTorrent();
const PORT = 7070;
const JACKETT_KEY = "uqf74oxcaa47674vkc418g51k2divny3";

async function getKitsuTitle(id: string) {
  const res = await fetch(`https://kitsu.io/api/edge/anime/${id.split(':')[1]}`);
  const json: any = await res.json();
  return json?.data?.attributes?.canonicalTitle || null;
}

async function findMagnet(title: string) {
  // ---------------------------------------------------------
  // ANTI-GRAVITY FAULT-TOLERANCE OVERRIDE: 
  // Jackett Cannot Execute Under native macOS Local Sandboxes
  // Direct Nyaa.si HTTP Web Scraping Active As Primary Resolver
  // ---------------------------------------------------------
  try {
    const query = encodeURIComponent(`${title} 1080p`);
    const url = `https://nyaa.si/?f=0&c=0_0&q=${query}&s=seeders&o=desc`;
    const res = await fetch(url);
    const html = await res.text();
    const magnetMatch = html.match(/href="(magnet:\?xt=urn:btih:[^"]+)"/i);
    const result = magnetMatch ? magnetMatch[1] : null;
    console.log(`[HQ Local Bridge] Searching: ${title}. Magnet Found: ${result ? 'YES' : 'NO'}`);
    return result;
  } catch {
    return null;
  }
}

app.get("/stream/:infoHash", (req, res) => {
  const torrent: any = client.get(req.params.infoHash);
  if (!torrent) return res.status(404).send("Initializing...");
  const file = torrent.files?.find((f: any) => f.name.match(/\.(mp4|mkv|avi)$/i));
  if (!file) return res.status(404).send("No video file.");

  const mimeType = file.name.endsWith(".mkv") ? "video/webm" : "video/mp4";

  const range = req.headers.range;
  if (!range) {
    res.setHeader("Content-Length", file.length);
    res.setHeader("Content-Type", mimeType);
    return file.createReadStream().pipe(res);
  }

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
  res.status(206).set({
    "Content-Range": `bytes ${start}-${end}/${file.length}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": mimeType,
  });
  file.createReadStream({ start, end }).pipe(res);
});

const builder = new addonBuilder({
  id: "local.hq.bridge",
  version: "1.0.0",
  name: "⚡ HQ Local Bridge",
  resources: ["stream"],
  types: ["anime", "movie", "series"],
  idPrefixes: ["kitsu:", "tt"],
  catalogs: []
});

builder.defineStreamHandler(async ({ id }) => {
  const title = id.startsWith("kitsu:") ? await getKitsuTitle(id) : id;
  const magnet = await findMagnet(title);
  if (!magnet) return { streams: [], cacheMaxAge: 0 };
  const infoHash = magnet.split("btih:")[1].split("&")[0];
  if (!client.get(infoHash)) {
    client.add(magnet, { path: './tmp' }, (t) => t.select(0, 10, 1));
  }
  return {
    streams: [{
      name: "🚀 HQ-Bridge | 1080p",
      title: `Playing: ${title}`,
      url: `http://localhost:${PORT}/stream/${infoHash}`
    }],
    cacheMaxAge: 0
  };
});

app.use("/", getRouter(builder.getInterface()));
app.listen(PORT, () => console.log("Bridge Online"));
