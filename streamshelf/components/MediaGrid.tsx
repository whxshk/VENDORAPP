"use client";

import { motion } from "framer-motion";

type MediaCard = {
  id: string;
  title: string;
  poster?: string | null;
  type: string;
};

type Row = {
  title: string;
  items: MediaCard[];
};

type Props = {
  rows: Row[];
  isLoading?: boolean;
  onSelect: (id: string) => void;
};

function ShimmerRow({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="shimmer h-44 animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function MediaGrid({ rows, isLoading = false, onSelect }: Props) {
  return (
    <section className="space-y-8">
      {rows.map((row, rowIndex) => (
        <motion.div key={row.title} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: rowIndex * 0.05 }}>
          {isLoading ? (
            <ShimmerRow title={row.title} />
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">{row.title}</h3>
              {row.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-sm text-mist">
                  No titles yet. Use `Resolve` above or add a library source in Addon Manager.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                  {row.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="group overflow-hidden rounded-xl border border-white/10 bg-chrome/40 text-left transition hover:border-white/30"
                    >
                      <div className="relative aspect-[2/3] w-full bg-ink/70">
                      {item.poster ? (
                          <>
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                event.currentTarget.nextElementSibling?.classList.remove("hidden");
                                event.currentTarget.nextElementSibling?.classList.add("flex");
                              }}
                            />
                            <div className="pointer-events-none absolute inset-0 hidden items-center justify-center text-xs uppercase tracking-[0.14em] text-mist">
                              no poster
                            </div>
                          </>
                      ) : (
                        <div className="shimmer h-full w-full animate-shimmer" />
                      )}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-mist">{item.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </section>
  );
}
