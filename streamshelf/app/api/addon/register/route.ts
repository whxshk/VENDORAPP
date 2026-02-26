import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { normalizeAddonEndpoint, toManifestUrl } from "@/lib/addon/endpoint";

type StremioManifest = {
  id: string;
  name: string;
  catalogs?: Array<{ id: string; type: string; name: string }>;
};

export async function GET(): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();
    const addons = await prisma.addon.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      addons: addons.map((addon) => {
        const manifest = JSON.parse(addon.manifestJson) as StremioManifest;
        return {
          id: addon.id,
          manifestId: addon.manifestId,
          name: addon.name,
          endpoint: normalizeAddonEndpoint(addon.endpoint),
          catalogs: manifest.catalogs ?? []
        };
      })
    });
  } catch (error) {
    return NextResponse.json({ addons: [], error: error instanceof Error ? error.message : "Failed to load addons" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();
    const payload = (await request.json()) as {
      endpoint?: string;
      manifestUrl?: string;
      manifest?: StremioManifest;
    };

    const normalizedEndpointInput = payload.endpoint ? normalizeAddonEndpoint(payload.endpoint) : "";
    const normalizedManifestInput = payload.manifestUrl ? toManifestUrl(payload.manifestUrl) : "";

    const resolvedEndpoint = normalizedEndpointInput || (normalizedManifestInput ? normalizeAddonEndpoint(normalizedManifestInput) : "");

    if (!resolvedEndpoint) {
      return NextResponse.json({ error: "endpoint or manifestUrl is required" }, { status: 400 });
    }

    let manifest = payload.manifest;
    if (!manifest) {
      const manifestUrl = normalizedManifestInput || toManifestUrl(resolvedEndpoint);
      try {
        const manifestResponse = await fetch(manifestUrl, { cache: "no-store" });
        if (manifestResponse.ok) {
          manifest = (await manifestResponse.json()) as StremioManifest;
        }
      } catch {
        // Network/DNS can fail locally; we'll store a pending addon entry below.
      }
    }

    if (!manifest?.id || !manifest?.name) {
      const host = new URL(toManifestUrl(resolvedEndpoint)).host;
      manifest = {
        id: `pending.${host}`,
        name: `${host} (Pending Manifest Fetch)`,
        catalogs: []
      };
    }

    const addon = await prisma.addon.upsert({
      where: {
        manifestId_endpoint: {
          manifestId: manifest.id,
          endpoint: resolvedEndpoint
        }
      },
      create: {
        manifestId: manifest.id,
        endpoint: resolvedEndpoint,
        name: manifest.name,
        manifestJson: JSON.stringify(manifest)
      },
      update: {
        name: manifest.name,
        manifestJson: JSON.stringify(manifest)
      }
    });

    return NextResponse.json({ addon, catalogs: manifest.catalogs ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to register addon" }, { status: 500 });
  }
}
