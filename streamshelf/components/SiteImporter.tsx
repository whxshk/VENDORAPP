"use client";

import { useState } from "react";

type Props = {
  onImported: () => Promise<void>;
};

export function SiteImporter({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-steel/40 p-4 md:p-5">
      <h2 className="text-lg font-semibold text-white">Website Importer</h2>
      <p className="text-xs text-mist">Import playable links from a website you own or have rights to crawl.</p>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-lg border border-white/15 bg-chrome/40 px-3 py-2 text-sm text-white outline-none"
        />
        <button
          type="button"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          onClick={async () => {
            if (!url.trim()) return;
            try {
              setLoading(true);
              setMessage("Importing...");
              const response = await fetch("/api/import/site", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ url: url.trim(), maxPages: 25 })
              });

              const data = (await response.json()) as {
                imported?: number;
                scannedPages?: number;
                candidatesFound?: number;
                error?: string;
              };

              if (!response.ok) {
                setMessage(data.error ?? "Import failed");
                return;
              }

              setMessage(`Imported ${data.imported ?? 0} links from ${data.scannedPages ?? 0} pages.`);
              await onImported();
            } catch {
              setMessage("Import failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "..." : "Import"}
        </button>
      </div>
      {message ? <p className="text-xs text-mist">{message}</p> : null}
    </section>
  );
}
