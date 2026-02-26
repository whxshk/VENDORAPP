import { garbageCollectSegments } from "@/lib/ffmpeg/transcode";

let timer: NodeJS.Timeout | undefined;

export function startSegmentGc(): void {
  if (timer) return;

  timer = setInterval(() => {
    void garbageCollectSegments(24);
  }, 60 * 60 * 1000);
}

export async function runSegmentGcNow(): Promise<number> {
  return garbageCollectSegments(24);
}
