import { NextResponse } from "next/server";
import { decodeHeaders, buildProxyUrl, readOriginFromRequestUrl } from "@/lib/stream/proxy";

export const runtime = "nodejs";
const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function rewriteM3u8(content: string, sourceUrl: string, origin: string, headers: Record<string, string>): string {
  const base = new URL(sourceUrl);
  const lines = content.split(/\r?\n/);
  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;

    try {
      const absolute = new URL(trimmed, base).toString();
      return buildProxyUrl(origin, absolute, headers);
    } catch {
      return line;
    }
  });

  return rewritten.join("\n");
}

function passthroughHeaders(upstream: Headers): Headers {
  const out = new Headers();
  const allowed = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "cache-control",
    "etag",
    "last-modified",
    "content-disposition"
  ];

  for (const [key, value] of upstream.entries()) {
    if (allowed.includes(key.toLowerCase())) {
      out.set(key, value);
    }
  }

  // Inject CORS headers to allow player to consume the stream
  out.set("access-control-allow-origin", "*");
  out.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  out.set("access-control-allow-headers", "Range, Content-Type");
  out.set("access-control-expose-headers", "Content-Length, Content-Range, Accept-Ranges");

  return out;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url") ?? "";
    const encodedHeaders = requestUrl.searchParams.get("h");

    if (!isValidHttpUrl(target)) {
      return NextResponse.json({ error: "Invalid or missing target URL" }, { status: 400 });
    }

    const proxyHeaders = decodeHeaders(encodedHeaders);
    const requestHeaders: Record<string, string> = {
      "User-Agent": proxyHeaders["User-Agent"] || DEFAULT_UA,
      ...(proxyHeaders.Referer ? { Referer: proxyHeaders.Referer } : {}),
      ...(proxyHeaders.Origin ? { Origin: proxyHeaders.Origin } : {})
    };

    const range = request.headers.get("range");
    if (range) requestHeaders.Range = range;

    const upstream = await fetch(target, {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
      redirect: "follow"
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const isM3u8 = contentType.includes("application/vnd.apple.mpegurl") || contentType.includes("application/x-mpegurl") || target.includes(".m3u8");

    if (isM3u8) {
      const text = await upstream.text();
      const rewritten = rewriteM3u8(text, target, readOriginFromRequestUrl(request.url), proxyHeaders);
      const headers = passthroughHeaders(upstream.headers);
      headers.set("content-type", "application/vnd.apple.mpegurl");
      return new Response(rewritten, { status: upstream.status, headers });
    }

    const headers = passthroughHeaders(upstream.headers);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy stream failed" },
      { status: 500 }
    );
  }
}
