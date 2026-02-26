"use client";

type AddonCollectionItem = {
  id: string;
  name: string;
  poster?: string | null;
  background?: string | null;
  type: string;
};

type AddonCollection = {
  key: string;
  title: string;
  addonName: string;
  addonEndpoint: string;
  catalogId: string;
  catalogType: string;
  canStream?: boolean;
  items: AddonCollectionItem[];
};

type Props = {
  collections: AddonCollection[];
  onPlayItem: (payload: {
    endpoint: string;
    type: string;
    id: string;
    title: string;
    poster?: string | null;
    background?: string | null;
    canStream?: boolean;
  }) => void;
};

export function AddonCollections({ collections, onPlayItem }: Props) {
  if (collections.length === 0) return null;

  return (
    <section className="space-y-7">
      {collections.map((collection) => (
        <div key={collection.key} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-white">{collection.title}</h3>
            {collection.canStream === false ? (
              <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                metadata only
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {collection.items.map((item) => (
              <button
                key={`${collection.key}:${item.id}`}
                type="button"
                onClick={() =>
                  onPlayItem({
                    endpoint: collection.addonEndpoint,
                    type: item.type,
                    id: item.id,
                    title: item.name,
                    poster: item.poster,
                    background: item.background,
                    canStream: collection.canStream
                  })
                }
                className="group overflow-hidden rounded-xl border border-white/10 bg-chrome/40 text-left transition hover:border-white/30"
              >
                <div className="relative aspect-[2/3] w-full bg-ink/70">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="shimmer h-full w-full animate-shimmer" />
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-mist">{item.type}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
