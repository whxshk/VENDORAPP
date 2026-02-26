import { startSegmentGc } from "@/lib/ffmpeg/garbageCollector";

let started = false;

export function ensureBackgroundJobs(): void {
  if (started) return;
  startSegmentGc();
  started = true;
}
