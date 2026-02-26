"use client";

import { motion } from "framer-motion";

type Props = {
  title: string;
  backdrop?: string | null;
  onResume: () => void;
};

export function HeroSection({ title, backdrop, onResume }: Props) {
  return (
    <motion.section
      layout
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-steel/70 p-8 shadow-cinema"
      initial={{ opacity: 0.7, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {backdrop ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${backdrop})` }}
          aria-hidden
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" aria-hidden />
      <div className="relative z-10 max-w-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-mist">Continue Watching</p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">{title}</h1>
        <button
          type="button"
          onClick={onResume}
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Resume
        </button>
      </div>
    </motion.section>
  );
}
