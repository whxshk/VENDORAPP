import ffmpeg from "fluent-ffmpeg";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const SEGMENT_ROOT = path.join(os.homedir(), "Library", "Caches", "StreamShelf", "segments");

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function ensureSegmentRoot(): Promise<void> {
  await fs.mkdir(SEGMENT_ROOT, { recursive: true });
}

export async function remuxMp4ToHls(inputUrl: string, mediaId: string): Promise<string> {
  await ensureSegmentRoot();
  const folder = path.join(SEGMENT_ROOT, `${slugify(mediaId)}-${Date.now()}`);
  await fs.mkdir(folder, { recursive: true });

  const outputM3u8 = path.join(folder, "index.m3u8");
  const preferredCodec = process.env.STREAMSHELF_HW_CODEC === "hevc" ? "hevc_videotoolbox" : "h264_videotoolbox";

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputUrl)
      .outputOptions([
        `-c:v ${preferredCodec}`,
        "-c:a aac",
        "-preset ultrafast",
        "-tune zerolatency",
        "-f hls",
        "-hls_time 4",
        "-hls_playlist_type vod",
        "-hls_segment_filename " + path.join(folder, "segment_%03d.ts")
      ])
      .on("end", () => resolve())
      .on("error", (error) => reject(error))
      .save(outputM3u8);
  });

  return outputM3u8;
}

export async function garbageCollectSegments(maxAgeHours = 24): Promise<number> {
  await ensureSegmentRoot();
  const entries = await fs.readdir(SEGMENT_ROOT, { withFileTypes: true });
  const now = Date.now();
  const threshold = maxAgeHours * 60 * 60 * 1000;
  let removed = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const target = path.join(SEGMENT_ROOT, entry.name);
    const stat = await fs.stat(target);
    if (now - stat.mtimeMs <= threshold) continue;
    await fs.rm(target, { recursive: true, force: true });
    removed += 1;
  }

  return removed;
}
