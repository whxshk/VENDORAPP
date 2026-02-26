import { prisma } from "@/lib/db/prisma";

type ImportResult = {
  imported: number;
  scannedPages: number;
  candidatesFound: number;
};

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

function extractLinks(html: string, pageUrl: string): string[] {
  const links = new Set<string>();
  const patterns = [
    /href=["']([^"']+)["']/gi,
    /src=["']([^"']+)["']/gi,
    /content=["']([^"']+)["']/gi
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const raw = match[1];
      if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:")) continue;
      try {
        const absolute = new URL(raw, pageUrl).toString();
        links.add(absolute);
      } catch {
        // ignore invalid URLs
      }
    }
  }

  return Array.from(links);
}

function scoreStreamUrl(url: string): number {
  const low = url.toLowerCase();
  let score = 0;
  if (low.includes(".m3u8")) score += 2000;
  if (low.includes(".mp4")) score += 1000;

  const qualityHints = [2160, 1440, 1080, 720, 480, 360];
  for (const q of qualityHints) {
    if (low.includes(`${q}`) || low.includes(`${q}p`)) {
      score += q;
      break;
    }
  }

  return score;
}

function titleFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const slug = pathname.split("/").filter(Boolean).pop() ?? "Imported Stream";
  return decodeURIComponent(slug).replace(/\.(m3u8|mp4)$/i, "").replace(/[-_]+/g, " ").trim() || "Imported Stream";
}

function tmdbLikeIdFromUrl(url: string): number {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 2_000_000;
}

function isVideoUrl(url: string): boolean {
  return /(\.m3u8|\.mp4)(\?|$)/i.test(url);
}

export async function importSiteCatalog(rootUrl: string, maxPages = 25): Promise<ImportResult> {
  const startUrl = new URL(rootUrl).toString();
  const origin = new URL(startUrl).origin;

  const queue: string[] = [startUrl];
  const visited = new Set<string>();
  const mediaCandidates = new Set<string>();
  const pageTitles = new Map<string, string>();

  while (queue.length > 0 && visited.size < Math.max(5, Math.min(100, maxPages))) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;

    visited.add(current);

    try {
      const response = await fetch(current, { redirect: "follow" });
      const contentType = response.headers.get("content-type") ?? "";

      if (isVideoUrl(current)) {
        mediaCandidates.add(current);
        continue;
      }

      if (!contentType.includes("text/html")) continue;
      const html = await response.text();
      const title = extractTitle(html);
      if (title) pageTitles.set(current, title);

      const links = extractLinks(html, current);
      for (const link of links) {
        if (!link.startsWith(origin)) continue;
        if (isVideoUrl(link)) {
          mediaCandidates.add(link);
          continue;
        }

        const url = new URL(link);
        if (!url.pathname || /\.(jpg|jpeg|png|gif|svg|webp|css|js|json|xml)$/i.test(url.pathname)) continue;
        if (!visited.has(link) && queue.length < 300) queue.push(link);
      }
    } catch {
      // skip failed pages
    }
  }

  const candidates = Array.from(mediaCandidates).sort((a, b) => scoreStreamUrl(b) - scoreStreamUrl(a));
  let imported = 0;

  for (const candidate of candidates) {
    const tmdbId = tmdbLikeIdFromUrl(candidate);
    const matchingPage = Array.from(pageTitles.keys()).find((page) => candidate.startsWith(new URL(page).origin));
    const resolvedTitle = matchingPage ? pageTitles.get(matchingPage) : undefined;

    await prisma.media.upsert({
      where: {
        tmdbId_type: {
          tmdbId,
          type: "movie"
        }
      },
      create: {
        tmdbId,
        title: resolvedTitle ?? titleFromUrl(candidate),
        type: "movie",
        streamUrl: candidate,
        sourceVariants: JSON.stringify([{ url: candidate, label: "Auto" }])
      },
      update: {
        title: resolvedTitle ?? titleFromUrl(candidate),
        streamUrl: candidate,
        sourceVariants: JSON.stringify([{ url: candidate, label: "Auto" }])
      }
    });

    imported += 1;
  }

  return {
    imported,
    scannedPages: visited.size,
    candidatesFound: candidates.length
  };
}
