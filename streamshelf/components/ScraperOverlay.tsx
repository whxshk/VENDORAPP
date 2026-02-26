"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  status: "idle" | "bypass" | "extract" | "ready";
};

const labelMap: Record<Props["status"], string> = {
  idle: "",
  bypass: "Bypassing Security...",
  extract: "Extracting Video...",
  ready: "Ready to Stream"
};

export function ScraperOverlay({ status }: Props) {
  const isVisible = status !== "idle";

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-black/70 px-4 py-2 text-sm text-white shadow-cinema backdrop-blur"
        >
          {labelMap[status]}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
