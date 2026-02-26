"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { StreamVariant } from "@/lib/types/media";

type Props = {
  open: boolean;
  variants: StreamVariant[];
  activeUrl?: string;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function SourceDrawer({ open, variants, activeUrl, onClose, onSelect }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-ink/95 p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <h2 className="text-lg font-semibold text-white">Choose Source</h2>
            <div className="mt-4 space-y-3">
              {variants.map((variant, idx) => (
                <button
                  key={`${variant.url}-${idx}`}
                  type="button"
                  onClick={() => onSelect(variant.url)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    activeUrl === variant.url
                      ? "border-glow bg-glow/15 text-white"
                      : "border-white/15 bg-chrome/40 text-mist hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{variant.label}</span>
                    <span className="text-xs">
                      {variant.resolution ?? "adaptive"}
                      {variant.bandwidth ? ` • ${Math.round(variant.bandwidth / 1000)} kbps` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
