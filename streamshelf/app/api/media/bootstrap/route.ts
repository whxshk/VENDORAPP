import { NextResponse } from "next/server";
import { ensureDatabaseReady, seedDemoLibraryForce } from "@/lib/db/bootstrap";

export async function POST(): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();
    const count = await seedDemoLibraryForce();
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to seed library" }, { status: 500 });
  }
}
