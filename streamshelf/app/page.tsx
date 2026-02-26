"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { MediaGrid } from "@/components/MediaGrid";
import { UniversalInput } from "@/components/UniversalInput";
import { ScraperOverlay } from "@/components/ScraperOverlay";
import { SourceDrawer } from "@/components/SourceDrawer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AddonManager } from "@/components/AddonManager";
import { SiteImporter } from "@/components/SiteImporter";
import { AddonCollections } from "@/components/AddonCollections";
import { EpisodePicker } from "@/components/EpisodePicker";
import type { StreamVariant } from "@/lib/types/media";

type Media = {
  id: string;
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  streamUrl?: string | null;
  type: string;
  sourceVariants?: string | null;
  refererHeader?: string | null;
  originHeader?: string | null;
  playback?: {
    timestamp: number;
    duration: number;
  } | null;
};

type AddonCollection = {
  key: string;
  title: string;
  addonName: string;
  addonEndpoint: string;
  catalogId: string;
  catalogType: string;
  canStream?: boolean;
  items: Array<{
    id: string;
    name: string;
    poster?: string | null;
    background?: string | null;
    type: string;
  }>;
};

type SearchAddonResult = {
  id?: string;
  name?: string;
  type?: string;
  addon?: string;
  addonEndpoint?: string;
  addonCanStream?: boolean;
  poster?: string;
  background?: string;
};

type Episode = {
  id: string;
  title: string;
  season: number;
  episode: number;
  released?: string;
};

type AddonPlayPayload = {
  endpoint: string;
  type: string;
  id: string;
  title: string;
  poster?: string | null;
  background?: string | null;
  canStream?: boolean;
  resolveMode?: "auto" | "stream";
  fallbackTried?: boolean;
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"watch" | "manage">("watch");
  const [media, setMedia] = useState<Media[]>([]);
  const [activeMedia, setActiveMedia] = useState<Media | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [sourceHeaders, setSourceHeaders] = useState<{ referer?: string; origin?: string }>({});
  const [variants, setVariants] = useState<StreamVariant[]>([]);
  const [overlayStatus, setOverlayStatus] = useState<"idle" | "bypass" | "extract" | "ready">("idle");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [addonCollections, setAddonCollections] = useState<AddonCollection[]>([]);

  const [watchSearch, setWatchSearch] = useState("");
  const [watchLocalResults, setWatchLocalResults] = useState<Media[]>([]);
  const [watchAddonResults, setWatchAddonResults] = useState<SearchAddonResult[]>([]);

  const [episodePickerOpen, setEpisodePickerOpen] = useState(false);
  const [episodePickerTitle, setEpisodePickerTitle] = useState("");
  const [episodePickerEpisodes, setEpisodePickerEpisodes] = useState<Episode[]>([]);
  const [pendingSeriesPayload, setPendingSeriesPayload] = useState<{
    endpoint: string;
    type: string;
    id: string;
    title: string;
    poster?: string | null;
    background?: string | null;
    canStream?: boolean;
  } | null>(null);

  const nowPlayingRef = useRef<HTMLElement | null>(null);

  function searchSeed(title: string): string {
    const cut = title.split("·")[0]?.trim() ?? title;
    return cut.length > 0 ? cut : title;
  }

  async function findStreamFallback(payload: AddonPlayPayload): Promise<AddonPlayPayload | null> {
    // ---------------------------------------------------------
    // ANTI-GRAVITY FAULT-TOLERANCE OVERRIDE: 
    // Fallback Bridge Interceptor
    // ---------------------------------------------------------
    // If the payload title is literally just an ID (like hits from Kitsufortheweebs),
    // immediately route it to our intelligent HQ Bridge instead of doing a keyword text search.
    if (/^(kitsu:|tt\d+)/i.test(payload.title)) {
      return {
        endpoint: "http://localhost:7070",
        id: payload.id ?? payload.title,
        type: payload.type,
        title: payload.title,
        poster: payload.poster,
        background: payload.background,
        canStream: true,
        fallbackTried: true
      };
    }

    const query = searchSeed(payload.title);
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = (await response.json()) as { addon?: SearchAddonResult[] };
    const pick = (data.addon ?? []).find(
      (item) =>
        item.addonCanStream !== false &&
        !!item.addonEndpoint &&
        !!item.id &&
        !!item.type &&
        item.addonEndpoint !== payload.endpoint
    );

    if (!pick?.addonEndpoint || !pick.id || !pick.type) return null;
    return {
      endpoint: pick.addonEndpoint,
      id: payload.id ?? pick.id,
      type: payload.type ?? pick.type,
      title: pick.name ?? query,
      poster: pick.poster ?? payload.poster,
      background: pick.background ?? payload.background,
      canStream: true,
      fallbackTried: true
    };
  }

  async function loadMedia(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      const text = await response.text();
      const data = text ? (JSON.parse(text) as { media?: Media[] }) : { media: [] };
      const items = data.media ?? [];
      setMedia(items);
      setActiveMedia(items[0] ?? null);
    } catch {
      setMedia([]);
      setActiveMedia(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadAddonCollections(): Promise<void> {
    try {
      const response = await fetch("/api/addon/collections", { cache: "no-store" });
      const data = (await response.json()) as { collections?: AddonCollection[] };
      setAddonCollections(data.collections ?? []);
    } catch {
      setAddonCollections([]);
    }
  }

  useEffect(() => {
    void Promise.all([loadMedia(), loadAddonCollections()]);
  }, []);

  const rows = useMemo(() => {
    const movies = media.filter((item) => item.type === "movie");
    const series = media.filter((item) => item.type === "series");

    return [
      { title: "Trending", items: media.slice(0, 6) },
      { title: "Movies", items: movies },
      { title: "Series", items: series },
      { title: "My Links", items: media }
    ];
  }, [media]);

  async function resolveFromUrl(url: string): Promise<void> {
    try {
      setOverlayStatus("bypass");
      setStatusMessage("Resolving stream URL...");
      await new Promise((resolve) => setTimeout(resolve, 450));
      setOverlayStatus("extract");

      const response = await fetch("/api/media/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          tmdbId: Date.now(),
          title: "Resolved Stream",
          type: "movie"
        })
      });

      const result = (await response.json()) as {
        streamUrl: string;
        referer?: string;
        origin?: string;
        variants: StreamVariant[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Resolve failed");
      }

      setOverlayStatus("ready");
      setSourceUrl(result.streamUrl);
      setSourceHeaders({ referer: result.referer, origin: result.origin });
      setVariants(result.variants ?? []);
      setStatusMessage("Source resolved. Ready to play.");
      await loadMedia();
      nowPlayingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setOverlayStatus("idle");
      setVariants([]);
      setStatusMessage(error instanceof Error ? error.message : "Resolve failed.");
    }
    setTimeout(() => setOverlayStatus("idle"), 1200);
  }

  async function playMedia(item: Media, specificUrl?: string): Promise<void> {
    try {
      setStatusMessage(`Loading ${item.title}...`);

      const response = await fetch("/api/playback/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaId: item.id, sourceUrl: specificUrl })
      });

      const prepared = (await response.json()) as {
        streamUrl: string;
        referer?: string;
        origin?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(prepared.error ?? "Playback preparation failed");
      }

      setActiveMedia(item);
      setSourceUrl(prepared.streamUrl);
      setSourceHeaders({ referer: prepared.referer, origin: prepared.origin });
      nowPlayingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      try {
        const parsed = JSON.parse(item.sourceVariants ?? "[]") as StreamVariant[];
        setVariants(parsed);
      } catch {
        setVariants(item.streamUrl ? [{ url: item.streamUrl, label: "Auto" }] : []);
      }

      setStatusMessage(`Now playing: ${item.title}`);
    } catch (error) {
      setSourceUrl(undefined);
      setStatusMessage(error instanceof Error ? error.message : "Playback failed.");
    }
  }

  async function loadDemoLibrary(): Promise<void> {
    setStatusMessage("Loading demo library...");
    try {
      await fetch("/api/media/bootstrap", { method: "POST" });
      await loadMedia();
      setStatusMessage("Demo library loaded.");
    } catch {
      setStatusMessage("Failed to load demo library.");
    }
  }

  async function playAddonItem(payload: AddonPlayPayload): Promise<void> {
    try {
      if (payload.resolveMode === "stream" && payload.canStream === false && !payload.fallbackTried) {
        const fallback = await findStreamFallback(payload);
        if (fallback) {
          setStatusMessage(`"${payload.title}" is metadata-only here. Switching to a playable source...`);
          await playAddonItem(fallback);
          return;
        }
        // Force attempt anyway if no fallback found instead of hard blocking
        setStatusMessage("This addon lists metadata only. Attempting to force stream resolution anyway...");
      }

      const shouldTryMeta = payload.resolveMode !== "stream" && payload.type !== "movie";

      if (shouldTryMeta) {
        const metaResponse = await fetch("/api/addon/meta", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: payload.endpoint, type: payload.type, id: payload.id })
        });

        const metaData = (await metaResponse.json()) as {
          title?: string;
          videos?: Episode[];
          error?: string;
        };

        if (metaResponse.ok && metaData.videos && metaData.videos.length > 0) {
          setPendingSeriesPayload(payload);
          setEpisodePickerTitle(metaData.title ?? payload.title);
          setEpisodePickerEpisodes(metaData.videos);
          setEpisodePickerOpen(true);
          return;
        }
        setStatusMessage(metaData.error ?? "Episode list unavailable. Playing default source...");
      }

      const response = await fetch("/api/addon/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { media?: Media; error?: string; debugAttempted?: string };
      if (!response.ok || !data.media) {
        const message = data.error ?? "No playable source from addon";
        if (!payload.fallbackTried && /no stream returned|stream endpoint/i.test(message)) {
          const fallback = await findStreamFallback(payload);
          if (fallback) {
            setStatusMessage(`Primary source unavailable. Trying "${fallback.title}" from another addon...`);
            await playAddonItem(fallback);
            return;
          }
        }
        throw new Error("No playable stream was found for this title from your installed stream providers.");
      }

      await loadMedia();
      await playMedia(data.media);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to play addon item.");
    }
  }

  async function searchInWatchTab(): Promise<void> {
    if (!watchSearch.trim()) {
      setWatchLocalResults([]);
      setWatchAddonResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(watchSearch.trim())}`, { cache: "no-store" });
      const data = (await response.json()) as {
        local?: Media[];
        addon?: SearchAddonResult[];
      };

      setWatchLocalResults(data.local ?? []);
      setWatchAddonResults(data.addon ?? []);
    } catch {
      setWatchLocalResults([]);
      setWatchAddonResults([]);
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-8 px-4 py-6 md:px-8 md:py-8">
      <motion.div layout className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-mist">StreamShelf</p>
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("watch")}
              className={`rounded-md px-3 py-1.5 text-xs ${activeTab === "watch" ? "bg-white text-black" : "text-white"}`}
            >
              Watch
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={`rounded-md px-3 py-1.5 text-xs ${activeTab === "manage" ? "bg-white text-black" : "text-white"}`}
            >
              Manage
            </button>
          </div>
        </div>

        {statusMessage ? <p className="text-xs text-mist">{statusMessage}</p> : null}
      </motion.div>

      {activeTab === "watch" ? (
        <>
          <section className="space-y-4 rounded-2xl border border-white/10 bg-steel/40 p-4 md:p-5">
            <UniversalInput onSubmit={resolveFromUrl} />

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void searchInWatchTab();
              }}
            >
              <input
                value={watchSearch}
                onChange={(event) => setWatchSearch(event.target.value)}
                placeholder="Search movies, series, and addon catalogs..."
                className="w-full rounded-lg border border-white/15 bg-chrome/40 px-3 py-2 text-sm text-white outline-none"
              />
              <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">Search</button>
            </form>

            {(watchLocalResults.length > 0 || watchAddonResults.length > 0) ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="mb-2 text-sm font-medium text-white">Local</p>
                  <div className="space-y-2">
                    {watchLocalResults.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void playMedia(item)}
                        className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="mb-2 text-sm font-medium text-white">Addons</p>
                  <div className="space-y-2">
                    {watchAddonResults.slice(0, 8).map((item, index) => (
                      <button
                        key={`${item.id ?? item.name ?? "addon"}-${index}`}
                        type="button"
                        onClick={() => {
                          if (!item.addonEndpoint || !item.id || !item.type) return;
                          void playAddonItem({
                            endpoint: item.addonEndpoint,
                            id: item.id,
                            type: item.type,
                            title: item.name ?? item.id,
                            canStream: item.addonCanStream,
                            poster: item.poster,
                            background: item.background
                          });
                        }}
                        className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white"
                      >
                        {item.name ?? item.id} <span className="text-xs text-mist">{item.addon ? `· ${item.addon}` : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {activeMedia ? (
            <HeroSection title={activeMedia.title} backdrop={activeMedia.backdrop} onResume={() => void playMedia(activeMedia)} />
          ) : null}

          <AnimatePresence mode="wait">
            <motion.section
              ref={nowPlayingRef}
              key={sourceUrl ?? "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Now Playing</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadDemoLibrary()}
                    className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white"
                  >
                    Reload Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white"
                  >
                    Sources
                  </button>
                </div>
              </div>
              <VideoPlayer src={sourceUrl} referer={sourceHeaders.referer} origin={sourceHeaders.origin} />
            </motion.section>
          </AnimatePresence>

          <AddonCollections collections={addonCollections} onPlayItem={(payload) => void playAddonItem(payload)} />

          <MediaGrid
            rows={rows}
            isLoading={loading}
            onSelect={(id) => {
              const item = media.find((entry) => entry.id === id);
              if (item) void playMedia(item);
            }}
          />
        </>
      ) : (
        <section className="space-y-5">
          <AddonManager onRegistered={() => Promise.all([loadMedia(), loadAddonCollections()]).then(() => undefined)} />
          <SiteImporter onImported={loadMedia} />
        </section>
      )}

      <EpisodePicker
        open={episodePickerOpen}
        title={episodePickerTitle}
        episodes={episodePickerEpisodes}
        backdrop={pendingSeriesPayload?.background}
        onClose={() => setEpisodePickerOpen(false)}
        onSelect={(episode) => {
          if (!pendingSeriesPayload) return;
          setEpisodePickerOpen(false);
          void playAddonItem({
            endpoint: pendingSeriesPayload.endpoint,
            type: pendingSeriesPayload.type,
            id: episode.id,
            title: `${episodePickerTitle} · S${episode.season}E${episode.episode}`,
            poster: pendingSeriesPayload.poster,
            background: pendingSeriesPayload.background,
            canStream: pendingSeriesPayload.canStream,
            resolveMode: "stream"
          });
        }}
      />

      <SourceDrawer
        open={drawerOpen}
        variants={variants}
        activeUrl={sourceUrl}
        onClose={() => setDrawerOpen(false)}
        onSelect={(url) => {
          if (activeMedia) {
            void playMedia(activeMedia, url);
          }
          setDrawerOpen(false);
        }}
      />

      <ScraperOverlay status={overlayStatus} />
    </main>
  );
}
