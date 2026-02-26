"use client";

import { useState } from "react";

type Props = {
  onSubmit: (url: string) => Promise<void>;
};

export function UniversalInput({ onSubmit }: Props) {
  const [url, setUrl] = useState("");

  return (
    <form
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-chrome/50 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!url.trim()) return;
        await onSubmit(url.trim());
      }}
    >
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="Paste any URL to resolve streams..."
        className="w-full bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-mist"
      />
      <button type="submit" className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black">
        Resolve
      </button>
    </form>
  );
}
