"use client";

import { useEffect, useState } from "react";

type AddonItem = {
  id: string;
  name: string;
  endpoint: string;
  manifestId: string;
  catalogs: Array<{ id: string; type: string; name?: string }>;
};

type Props = {
  onRegistered?: () => void;
};

const verifiedLegalPresets = [
  {
    name: "Cinemeta (Official Metadata)",
    manifestUrl: "https://v3-cinemeta.strem.io/manifest.json"
  },
  {
    name: "OpenSubtitles (Official)",
    manifestUrl: "https://opensubtitles-v3.strem.io/manifest.json"
  },
  {
    name: "WatchHub (Official)",
    manifestUrl: "https://watchhub.strem.io/manifest.json"
  },
  {
    name: "YouTube (Official)",
    manifestUrl: "https://youtube-addon.strem.io/manifest.json"
  }
] as const;

function normalizeManifestInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("stremio://")) {
    return trimmed.replace(/^stremio:\/\//, "");
  }
  return trimmed;
}

export function AddonManager({ onRegistered }: Props) {
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [manifestUrl, setManifestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAddons(): Promise<void> {
    const response = await fetch("/api/addon/register");
    const data = (await response.json()) as { addons?: AddonItem[] };
    setAddons(data.addons ?? []);
  }

  async function registerByManifestUrl(url: string): Promise<boolean> {
    const normalized = normalizeManifestInput(url);
    if (!normalized) {
      setMessage("Paste a manifest URL first.");
      return false;
    }

    const response = await fetch("/api/addon/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manifestUrl: normalized })
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Failed to register addon");
      return false;
    }

    return true;
  }

  async function installVerifiedLegalPack(): Promise<void> {
    try {
      setLoading(true);
      setMessage("Installing verified legal addons...");
      let successCount = 0;

      for (const preset of verifiedLegalPresets) {
        const ok = await registerByManifestUrl(preset.manifestUrl);
        if (ok) successCount += 1;
      }

      await fetch("/api/media/bootstrap", { method: "POST" });
      await loadAddons();
      await onRegistered?.();
      if (successCount === 0) {
        setMessage("Could not install verified legal addons. Demo library was still loaded.");
      } else {
        setMessage(`Installed ${successCount}/${verifiedLegalPresets.length} verified legal addons. Demo library loaded.`);
      }
    } catch {
      setMessage("Verified legal addon installation failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAddons();
  }, []);

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-steel/40 p-4 md:p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Addon Manager</h2>
        <p className="mt-1 text-xs text-mist">One-click setup first, then add more addons by manifest URL.</p>
      </div>

      <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/5 p-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">Verified legal addons</p>
        <p className="mt-1 text-xs text-mist">Includes official metadata, subtitles, provider discovery, and YouTube catalogs.</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => void installVerifiedLegalPack()}
          className="mt-3 w-full rounded-lg border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Installing..." : "Install Verified Legal Addons"}
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-mist">Add any addon manually</p>
        <p className="mt-1 text-xs text-mist">Paste a Stremio manifest URL (or `stremio://...` link), then click Add.</p>
        <div className="mt-3 flex gap-2">
          <input
            value={manifestUrl}
            onChange={(event) => setManifestUrl(event.target.value)}
            placeholder="https://.../manifest.json or stremio://.../manifest.json"
            className="w-full rounded-lg border border-white/15 bg-chrome/40 px-3 py-2 text-sm text-white outline-none"
          />
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                setMessage("");
                const ok = await registerByManifestUrl(manifestUrl);
                if (!ok) return;
                setManifestUrl("");
                await loadAddons();
                await onRegistered?.();
                setMessage("Addon added.");
              } finally {
                setLoading(false);
              }
            }}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>

      {message ? <p className="text-xs text-mist">{message}</p> : null}

      <div className="space-y-2">
        {addons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/20 bg-black/10 px-3 py-4 text-sm text-mist">
            No addons registered yet.
          </p>
        ) : (
          addons.map((addon) => (
            <div key={addon.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-sm font-medium text-white">{addon.name}</p>
              <p className="text-xs text-mist">{addon.endpoint}</p>
              <p className="mt-1 text-xs text-mist">
                Catalogs: {addon.catalogs.length > 0 ? addon.catalogs.map((catalog) => `${catalog.type}:${catalog.id}`).join(", ") : "none"}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
