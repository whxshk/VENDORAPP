"use client";

import { useState } from "react";

type LocalResult = {
  id: string;
  title: string;
  type: string;
};

type AddonResult = {
  id?: string;
  name?: string;
  type?: string;
  addon?: string;
};

type Props = {
  onPlayLocal: (mediaId: string) => void;
};

export function SearchPanel({ onPlayLocal }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<LocalResult[]>([]);
  const [addon, setAddon] = useState<AddonResult[]>([]);
  const [message, setMessage] = useState("");

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-steel/40 p-4 md:p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Search</h2>
        <p className="mt-1 text-xs text-mist">Find local media and addon metadata in one place.</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!query.trim()) return;
          setLoading(true);
          setMessage("");

          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
            const data = (await response.json()) as {
              local?: LocalResult[];
              addon?: AddonResult[];
            };
            setLocal(data.local ?? []);
            setAddon(data.addon ?? []);
            if ((data.local ?? []).length === 0 && (data.addon ?? []).length === 0) {
              setMessage("No results found.");
            }
          } catch {
            setMessage("Search failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles..."
          className="w-full rounded-lg border border-white/15 bg-chrome/40 px-3 py-2 text-sm text-white outline-none"
        />
        <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
          {loading ? "..." : "Search"}
        </button>
      </form>

      {message ? <p className="text-xs text-mist">{message}</p> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-sm font-medium text-white">Local Results</p>
          <div className="space-y-2">
            {local.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPlayLocal(item.id)}
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
              >
                {item.title} <span className="text-xs text-mist">({item.type})</span>
              </button>
            ))}
            {local.length === 0 ? <p className="text-xs text-mist">No local matches.</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-sm font-medium text-white">Addon Catalog Results</p>
          <div className="space-y-2">
            {addon.map((item, index) => (
              <div key={`${item.id ?? item.name ?? "meta"}-${index}`} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-sm text-white">{item.name ?? item.id ?? "Unnamed item"}</p>
                <p className="text-xs text-mist">
                  {item.type ?? "unknown"}
                  {item.addon ? ` • ${item.addon}` : ""}
                </p>
              </div>
            ))}
            {addon.length === 0 ? <p className="text-xs text-mist">No addon matches.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
