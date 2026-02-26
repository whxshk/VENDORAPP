import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { importSiteCatalog } from "@/lib/import/siteImporter";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();

    const payload = (await request.json()) as {
      url?: string;
      maxPages?: number;
    };

    if (!payload.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const result = await importSiteCatalog(payload.url, payload.maxPages ?? 25);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Website import failed" }, { status: 500 });
  }
}
