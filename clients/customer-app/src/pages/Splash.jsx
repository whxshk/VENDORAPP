import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-navigate to phone input after 2.5 seconds
    const timer = setTimeout(() => {
      navigate(createPageUrl("PhoneInput"));
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1931] via-[#0f2440] to-[#0A1931] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="w-32 h-32 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/20">
          <span className="text-7xl">🦈</span>
        </div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-white mb-4"
        >
          SharkBand
        </motion.h1>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mb-2"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <p className="text-lg text-gray-300 font-light">
            One QR. One Platform. Every Loyalty.
          </p>
          <Sparkles className="w-4 h-4 text-orange-400" />
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <div className="flex justify-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-2 h-2 bg-orange-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-2 h-2 bg-orange-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-2 h-2 bg-orange-400 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}