function ensureHttpProtocol(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

export function normalizeAddonEndpoint(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const withProtocol = trimmed.startsWith("stremio://")
    ? `https://${trimmed.replace(/^stremio:\/\//i, "")}`
    : ensureHttpProtocol(trimmed);

  const strippedManifest = withProtocol.replace(/\/manifest\.json(\?.*)?$/i, "");
  return strippedManifest.replace(/\/$/, "");
}

export function toManifestUrl(input: string): string {
  return `${normalizeAddonEndpoint(input)}/manifest.json`;
}
