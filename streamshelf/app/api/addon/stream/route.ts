import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { normalizeAddonEndpoint } from "@/lib/addon/endpoint";
import { buildProxyUrl, readOriginFromRequestUrl } from "@/lib/stream/proxy";

type StreamItem = {
  url?: string;
  externalUrl?: string;
  title?: string;
  behaviorHints?: {
    notPeered?: boolean;
    proxyHeaders?: {
      request?: Record<string, string>;
    };
  };
};

type StreamResponseShape = {
  streams?: StreamItem[];
};

function hashToInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 3_000_000;
}

function chooseBestStream(streams: StreamItem[]): StreamItem | undefined {
  const scored = streams
    .map((stream) => {
      const url = stream.url ?? stream.externalUrl ?? "";
      let score = 0;
      if (/\.m3u8/i.test(url)) score += 3000;
      if (/\.mp4/i.test(url)) score += 2000;
      if (/2160|4k/i.test(url)) score += 2160;
      else if (/1080/i.test(url)) score += 1080;
      else if (/720/i.test(url)) score += 720;
      return { stream, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.stream;
}

function getStreamHeaders(stream?: StreamItem): Record<string, string> {
  if (!stream?.behaviorHints?.proxyHeaders?.request) return {};
  const requestHeaders = stream.behaviorHints.proxyHeaders.request;
  return Object.fromEntries(
    Object.entries(requestHeaders).filter(([, value]) => typeof value === "string" && value.length > 0)
  );
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const hit = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return hit?.[1];
}

function candidateTypes(type: string): string[] {
  const base = [type];
  if (type === "series") base.push("anime");
  if (type === "anime") base.push("series");
  return Array.from(new Set(base));
}

function buildStreamCandidates(endpoint: string, type: string, id: string): string[] {
  const base = `${endpoint}/stream/${type}`;
  const encoded = encodeURIComponent(id);
  const urls = [`${base}/${id}.json`, `${base}/${encoded}.json`];

  const colonParts = id.split(":");
  if (colonParts.length > 1) {
    const dropLast = colonParts.slice(0, -1).join(":");
    urls.push(`${base}/${dropLast}.json?video_id=${encodeURIComponent(id)}`);
    urls.push(`${base}/${encodeURIComponent(dropLast)}.json?video_id=${encodeURIComponent(id)}`);
    urls.push(`${base}/${dropLast}.json`);
    urls.push(`${base}/${encodeURIComponent(dropLast)}.json`);
  }

  const slashParts = id.split("/");
  if (slashParts.length > 1) {
    const dropLast = slashParts.slice(0, -1).join("/");
    urls.push(`${base}/${dropLast}.json?video_id=${encodeURIComponent(id)}`);
    urls.push(`${base}/${encodeURIComponent(dropLast)}.json?video_id=${encodeURIComponent(id)}`);
    urls.push(`${base}/${dropLast}.json`);
    urls.push(`${base}/${encodeURIComponent(dropLast)}.json`);
  }

  return Array.from(new Set(urls));
}

async function fetchStreamWithFallback(endpoint: string, type: string, id: string): Promise<{ data?: StreamResponseShape; attempted: string }> {
  let attempted = "";

  for (const candidateType of candidateTypes(type)) {
    const candidates = buildStreamCandidates(endpoint, candidateType, id);
    for (const candidate of candidates) {
      attempted = candidate;
      const response = await fetch(candidate, { cache: "no-store" });
      if (!response.ok) continue;
      const data = (await response.json()) as StreamResponseShape;
      if (data.streams && data.streams.length > 0) {
        return { data, attempted };
      }
    }
  }

  return { attempted };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();

    const payload = (await request.json()) as {
      endpoint?: string;
      type?: string;
      id?: string;
      title?: string;
      poster?: string | null;
      background?: string | null;
    };

    if (!payload.endpoint || !payload.type || !payload.id) {
      return NextResponse.json({ error: "endpoint, type, id are required" }, { status: 400 });
    }

    const endpoint = normalizeAddonEndpoint(payload.endpoint);
    console.log(`[Stream API] Routing request to addon: ${endpoint} | Type: ${payload.type} | ID: ${payload.id}`);

    const { data: streamData, attempted } = await fetchStreamWithFallback(endpoint, payload.type, payload.id);
    console.log(`[Stream API] Addon returned streams:`, JSON.stringify(streamData));

    if (!streamData || !streamData.streams || streamData.streams.length === 0) {
      console.log(`[Stream API] ERROR: Addon returned empty streams. Last attempted URL: ${attempted}`);
      return NextResponse.json(
        {
          error: "No stream returned by this addon for this title.",
          debugAttempted: attempted
        },
        { status: 400 }
      );
    }
    const best = chooseBestStream(streamData.streams);
    console.log(`[Stream API] Chosen best stream candidate:`, JSON.stringify(best));
    const bestUrl = best?.url ?? best?.externalUrl;

    if (!bestUrl) {
      return NextResponse.json({ error: "No playable stream URL found" }, { status: 400 });
    }

    const requestOrigin = readOriginFromRequestUrl(request.url);
    const bestHeaders = getStreamHeaders(best);
    const proxiedBestUrl = buildProxyUrl(requestOrigin, bestUrl, bestHeaders);

    const variants = (streamData.streams ?? [])
      .slice(0, 5)
      .map((stream) => {
        const streamUrl = stream.url ?? stream.externalUrl;
        if (!streamUrl) return null;
        const headers = getStreamHeaders(stream);
        const proxiedUrl = buildProxyUrl(requestOrigin, streamUrl, headers);
        return {
          url: proxiedUrl,
          label: stream.title?.slice(0, 24) || "Auto"
        };
      })
      .filter((item): item is { url: string; label: string } => item !== null);

    const tmdbId = hashToInt(`${endpoint}:${payload.type}:${payload.id}`);
    const media = await prisma.media.upsert({
      where: { tmdbId_type: { tmdbId, type: payload.type } },
      create: {
        tmdbId,
        type: payload.type,
        title: payload.title ?? payload.id,
        streamUrl: proxiedBestUrl,
        poster: payload.poster ?? undefined,
        backdrop: payload.background ?? undefined,
        refererHeader: getHeader(bestHeaders, "Referer"),
        originHeader: getHeader(bestHeaders, "Origin"),
        sourceVariants: JSON.stringify(variants.length > 0 ? variants : [{ url: proxiedBestUrl, label: "Auto" }])
      },
      update: {
        title: payload.title ?? payload.id,
        streamUrl: proxiedBestUrl,
        poster: payload.poster ?? undefined,
        backdrop: payload.background ?? undefined,
        refererHeader: getHeader(bestHeaders, "Referer"),
        originHeader: getHeader(bestHeaders, "Origin"),
        sourceVariants: JSON.stringify(variants.length > 0 ? variants : [{ url: proxiedBestUrl, label: "Auto" }])
      }
    });

    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve addon stream" },
      { status: 500 }
    );
  }
}
