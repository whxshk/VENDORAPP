import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureBackgroundJobs } from "@/lib/ffmpeg/runtime";
import { ensureDatabaseReady, ensureDemoLibrary } from "@/lib/db/bootstrap";

export async function GET(): Promise<NextResponse> {
  try {
    ensureBackgroundJobs();
    await ensureDatabaseReady();
    await ensureDemoLibrary();
    const media = await prisma.media.findMany({
      orderBy: { updatedAt: "desc" },
      include: { playback: true },
      take: 100
    });

    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json(
      {
        media: [],
        error: error instanceof Error ? error.message : "Failed to load media"
      },
      { status: 500 }
    );
  }
}
