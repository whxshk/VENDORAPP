import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { normalizeAddonEndpoint } from "@/lib/addon/endpoint";

type MetaVideo = {
  id?: string;
  title?: string;
  season?: number | string;
  episode?: number | string;
  released?: string;
  thumbnail?: string;
};

export const runtime = "nodejs";

function parseNumber(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function inferSeasonEpisode(input: string): { season?: number; episode?: number } {
  const match = input.match(/(?:s|season)?\s*(\d{1,3})\s*(?:e|ep|episode|x)\s*(\d{1,4})/i);
  if (!match) return {};
  const season = Number(match[1]);
  const episode = Number(match[2]);
  return {
    season: Number.isFinite(season) ? season : undefined,
    episode: Number.isFinite(episode) ? episode : undefined
  };
}

function candidateMetaUrls(endpoint: string, type: string, id: string): string[] {
  const types = type === "series" ? ["series", "anime"] : type === "anime" ? ["anime", "series"] : [type];
  const urls: string[] = [];
  for (const candidateType of types) {
    urls.push(`${endpoint}/meta/${candidateType}/${id}.json`);
    urls.push(`${endpoint}/meta/${candidateType}/${encodeURIComponent(id)}.json`);
  }
  return Array.from(new Set(urls));
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();

    const payload = (await request.json()) as {
      endpoint?: string;
      type?: string;
      id?: string;
    };

    if (!payload.endpoint || !payload.type || !payload.id) {
      return NextResponse.json({ error: "endpoint, type, id are required" }, { status: 400 });
    }

    const endpoint = normalizeAddonEndpoint(payload.endpoint);
    const urls = candidateMetaUrls(endpoint, payload.type, payload.id);

    let response: Response | null = null;
    let tried = "";

    for (const url of urls) {
      tried = url;
      const attempt = await fetch(url, { cache: "no-store" });
      if (attempt.ok) {
        response = attempt;
        break;
      }
    }
    if (!response) {
      return NextResponse.json({ error: `Meta endpoint unavailable (${tried})` }, { status: 400 });
    }

    const data = (await response.json()) as {
      meta?: {
        id?: string;
        name?: string;
        videos?: MetaVideo[];
      };
    };

    const videos = (data.meta?.videos ?? [])
      .map((video, index) => {
        const guessed = inferSeasonEpisode(`${video.id ?? ""} ${video.title ?? ""}`);
        const season = parseNumber(video.season) ?? guessed.season ?? 1;
        const episode = parseNumber(video.episode) ?? guessed.episode ?? index + 1;

        return {
          id: video.id ?? `${payload.id}:${season}:${episode}`,
          title: video.title ?? `Episode ${episode}`,
          season,
          episode,
          released: video.released,
          thumbnail: video.thumbnail
        };
      })
      .sort((a, b) => a.season - b.season || a.episode - b.episode);

    return NextResponse.json({
      title: data.meta?.name ?? payload.id,
      videos
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load meta" }, { status: 500 });
  }
}
