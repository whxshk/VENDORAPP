import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { normalizeAddonEndpoint } from "@/lib/addon/endpoint";

type ManifestResource = string | { name?: string };

async function fetchAddonCatalogs(query: string) {
  const addons = await prisma.addon.findMany();

  const responses = await Promise.all(
    addons.map(async (addon) => {
      try {
        const manifest = JSON.parse(addon.manifestJson) as {
          catalogs?: Array<{ id: string; type: string }>;
          resources?: ManifestResource[];
        };

        const catalogs = manifest.catalogs ?? [];
        const resources = (manifest.resources ?? []).map((resource) =>
          typeof resource === "string" ? resource.toLowerCase() : (resource.name ?? "").toLowerCase()
        );
        const addonCanStream = resources.includes("stream");
        const endpoint = normalizeAddonEndpoint(addon.endpoint);
        const items = await Promise.all(
          catalogs.map(async (catalog) => {
            const url = `${endpoint}/catalog/${catalog.type}/${catalog.id}/search=${encodeURIComponent(query)}.json`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = (await response.json()) as { metas?: Array<Record<string, unknown>> };
            return (data.metas ?? []).map((meta) => ({
              ...meta,
              addon: addon.name,
              addonEndpoint: endpoint,
              addonCanStream,
              catalogType: catalog.type
            }));
          })
        );

        return items.flat();
      } catch {
        return [];
      }
    })
  );

  return responses.flat();
}

export async function GET(request: Request): Promise<NextResponse> {
  await ensureDatabaseReady();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ local: [], addon: [] });
  }

  const local = await prisma.media.findMany({
    where: {
      title: {
        contains: query
      }
    },
    take: 30
  });

  const addon = await fetchAddonCatalogs(query);

  return NextResponse.json({ local, addon });
}
