import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ensureDatabaseReady } from "@/lib/db/bootstrap";
import { normalizeAddonEndpoint } from "@/lib/addon/endpoint";

type ManifestCatalog = { id: string; type: string; name?: string };
type ManifestResource = string | { name?: string };

type CatalogMeta = {
  id?: string;
  name?: string;
  poster?: string;
  posterShape?: string;
  background?: string;
  type?: string;
};

export async function GET(): Promise<NextResponse> {
  try {
    await ensureDatabaseReady();
    const addons = await prisma.addon.findMany({ orderBy: { createdAt: "desc" }, take: 10 });

    const collections = await Promise.all(
      addons.map(async (addon) => {
        let catalogs: ManifestCatalog[] = [];
        let canStream = false;
        try {
          const parsed = JSON.parse(addon.manifestJson) as {
            catalogs?: ManifestCatalog[];
            resources?: ManifestResource[];
          };
          catalogs = parsed.catalogs ?? [];
          const resources = (parsed.resources ?? []).map((resource) =>
            typeof resource === "string" ? resource.toLowerCase() : (resource.name ?? "").toLowerCase()
          );
          canStream = resources.includes("stream");
        } catch {
          catalogs = [];
          canStream = false;
        }

        const catalogRows = await Promise.all(
          catalogs.slice(0, 4).map(async (catalog) => {
            try {
              const endpoint = normalizeAddonEndpoint(addon.endpoint);
              const url = `${endpoint}/catalog/${catalog.type}/${catalog.id}.json`;
              const response = await fetch(url, { cache: "no-store" });
              if (!response.ok) return null;
              const data = (await response.json()) as { metas?: CatalogMeta[] };
              const metas = (data.metas ?? []).slice(0, 18);

              return {
                key: `${addon.id}:${catalog.type}:${catalog.id}`,
                title: `${catalog.name ?? catalog.id} · ${addon.name}`,
                addonName: addon.name,
                addonEndpoint: endpoint,
                catalogId: catalog.id,
                catalogType: catalog.type,
                canStream,
                items: metas.map((meta) => ({
                  id: meta.id ?? `${catalog.type}:${catalog.id}:${meta.name ?? "item"}`,
                  name: meta.name ?? "Untitled",
                  poster: meta.poster ?? null,
                  background: meta.background ?? null,
                  type: meta.type ?? catalog.type
                }))
              };
            } catch {
              return null;
            }
          })
        );

        return catalogRows.filter((row): row is NonNullable<typeof row> => row !== null);
      })
    );

    return NextResponse.json({ collections: collections.flat() });
  } catch (error) {
    return NextResponse.json(
      { collections: [], error: error instanceof Error ? error.message : "Failed to load addon collections" },
      { status: 500 }
    );
  }
}
