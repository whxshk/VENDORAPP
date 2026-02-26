import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { remuxMp4ToHls } from "@/lib/ffmpeg/transcode";
import { runSegmentGcNow } from "@/lib/ffmpeg/garbageCollector";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();
    const payload = (await request.json()) as { mediaId: string; sourceUrl?: string };
    if (!payload.mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id: payload.mediaId } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const source = payload.sourceUrl ?? media.streamUrl;
    if (!source) {
      return NextResponse.json({ error: "No source URL available" }, { status: 400 });
    }

    const removed = await runSegmentGcNow();

    if (source.endsWith(".mp4")) {
      const shouldRemux = process.env.STREAMSHELF_REMUX_MP4 === "true";

      if (shouldRemux) {
        try {
          const hlsPath = await remuxMp4ToHls(source, media.id);
          return NextResponse.json({
            streamUrl: hlsPath,
            referer: media.refererHeader,
            origin: media.originHeader,
            gcRemoved: removed,
            remuxed: true
          });
        } catch {
          // Fallback to direct MP4 when ffmpeg/remux is unavailable.
        }
      }

      return NextResponse.json({
        streamUrl: source,
        referer: media.refererHeader,
        origin: media.originHeader,
        gcRemoved: removed,
        remuxed: false
      });
    }

    return NextResponse.json({
      streamUrl: source,
      referer: media.refererHeader,
      origin: media.originHeader,
      gcRemoved: removed
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare playback" },
      { status: 500 }
    );
  }
}
