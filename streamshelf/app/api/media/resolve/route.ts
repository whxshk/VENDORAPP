import { NextResponse } from "next/server";
import { resolveStreamingUrl } from "@/lib/resolver/ghostResolver";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();
    const payload = (await request.json()) as {
      url: string;
      tmdbId?: number;
      title?: string;
      type?: string;
    };

    if (!payload.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const result = await resolveStreamingUrl(
      payload.url,
      payload.tmdbId ?? Date.now(),
      payload.title ?? "Resolved Link",
      payload.type ?? "movie"
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to resolve source"
      },
      { status: 500 }
    );
  }
}
