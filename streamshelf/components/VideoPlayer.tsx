"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { motion } from "framer-motion";

type Props = {
  src?: string;
  referer?: string;
  origin?: string;
};

export function VideoPlayer({ src, referer, origin }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackRef = useRef<HTMLVideoElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !src) return;
    setUseFallback(false);

    const player = videojs(videoRef.current, {
      controls: true,
      preload: "auto",
      fluid: true,
      html5: {
        vhs: {
          withCredentials: false
        }
      }
    });

    if (src.includes(".m3u8")) {
      player.src({ src, type: "application/x-mpegURL" });
    } else {
      player.src(src);
    }

    // Cinematic Auto-Play & Fullscreen on Mount
    player.ready(() => {
      const playbackPromise = player.play();
      if (playbackPromise !== undefined) {
        playbackPromise
          .then(() => {
            // Automatically launch into cinematic fullscreen once playing begins
            setTimeout(() => {
              const el = player.el();
              if (el && el.isConnected && !player.isFullscreen()) {
                try {
                  player.requestFullscreen();
                } catch (err) {
                  console.warn("Fullscreen auto-play blocked or element disconnected:", err);
                }
              }
            }, 150);
          })
          .catch(() => undefined);
      }
    });

    player.on("error", () => {
      const fallback = fallbackRef.current;
      if (!fallback) return;
      setUseFallback(true);
      fallback.src = src;
      fallback.load();
      void fallback.play().catch(() => undefined);
    });

    (player as unknown as { streamHeaders?: Record<string, string> }).streamHeaders = {
      ...(referer ? { Referer: referer } : {}),
      ...(origin ? { Origin: origin } : {})
    };

    return () => {
      player.dispose();
    };
  }, [src, referer, origin]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl"
    >
      <video ref={videoRef} className={`video-js vjs-big-play-centered ${useFallback ? "hidden" : ""}`} playsInline />
      <video ref={fallbackRef} className={`${useFallback ? "block" : "hidden"} w-full`} controls playsInline />
    </motion.div>
  );
}
