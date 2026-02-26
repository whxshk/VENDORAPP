"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Episode = {
  id: string;
  title: string;
  season: number;
  episode: number;
  released?: string;
};

type Props = {
  open: boolean;
  title: string;
  episodes: Episode[];
  backdrop?: string | null;
  onClose: () => void;
  onSelect: (episode: Episode) => void;
};

function formatRelease(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function EpisodePicker({ open, title, episodes, backdrop, onClose, onSelect }: Props) {
  const seasons = useMemo(() => Array.from(new Set(episodes.map((episode) => episode.season))).sort((a, b) => a - b), [episodes]);
  const [seasonFilter, setSeasonFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (open) setSeasonFilter("all");
  }, [open, title]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const rows = seasonFilter === "all" ? episodes : episodes.filter((episode) => episode.season === seasonFilter);
    return rows.sort((a, b) => (a.season - b.season) || (a.episode - b.episode));
  }, [episodes, seasonFilter]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[88vh] w-full max-w-[1400px] overflow-hidden rounded-t-3xl border border-white/10 bg-ink/95 shadow-2xl"
            initial={{ y: 72, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <div className="relative h-full">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
                {backdrop ? <img src={backdrop} alt={title} className="h-full w-full object-cover opacity-45" /> : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-ink" />
              </div>

              <div className="relative z-10 flex h-full flex-col p-5 md:p-8">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-mist">Episodes</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-white/25 bg-black/35 px-3 py-1.5 text-sm text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSeasonFilter("all")}
                    className={`rounded-full px-4 py-1.5 text-sm ${seasonFilter === "all" ? "bg-white text-black" : "bg-white/10 text-white"}`}
                  >
                    All Seasons
                  </button>
                  {seasons.map((season) => (
                    <button
                      key={season}
                      type="button"
                      onClick={() => setSeasonFilter(season)}
                      className={`rounded-full px-4 py-1.5 text-sm ${seasonFilter === season ? "bg-white text-black" : "bg-white/10 text-white"}`}
                    >
                      Season {season}
                    </button>
                  ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-2 pb-8">
                    {filtered.map((episode) => (
                      <motion.button
                        key={episode.id}
                        type="button"
                        onClick={() => onSelect(episode)}
                        whileHover={{ y: -1 }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left transition hover:border-white/30 hover:bg-white/[0.1]"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/35 text-sm font-semibold text-white/85">
                          E{episode.episode}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            S{episode.season}E{episode.episode} · {episode.title}
                          </p>
                          {episode.released ? <p className="mt-1 text-xs text-mist">{formatRelease(episode.released)}</p> : null}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
