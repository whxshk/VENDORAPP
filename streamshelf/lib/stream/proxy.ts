type HeaderMap = Record<string, string>;

function normalizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function encodeHeaders(headers?: HeaderMap): string | null {
  if (!headers) return null;
  const filtered = Object.fromEntries(Object.entries(headers).filter(([, value]) => typeof value === "string" && value.length > 0));
  if (Object.keys(filtered).length === 0) return null;
  return Buffer.from(JSON.stringify(filtered), "utf8").toString("base64url");
}

export function decodeHeaders(encoded?: string | null): HeaderMap {
  if (!encoded) return {};
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HeaderMap;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string")) as HeaderMap;
  } catch {
    return {};
  }
}

export function buildProxyUrl(origin: string, targetUrl: string, headers?: HeaderMap): string {
  const safeTarget = normalizeUrl(targetUrl);
  if (!safeTarget) return targetUrl;

  const proxy = new URL("/api/proxy", origin);
  proxy.searchParams.set("url", safeTarget);
  const encoded = encodeHeaders(headers);
  if (encoded) proxy.searchParams.set("h", encoded);
  return proxy.toString();
}

export function readOriginFromRequestUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}`;
}
