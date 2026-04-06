import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryEmoji = {
  cafe: "☕",
  restaurant: "🍽️",
  retail: "🛍️",
  grocery: "🛒",
  fitness: "💪",
  entertainment: "🎬",
  beauty: "💄",
  other: "⭐",
};

const categoryPill = {
  cafe:          "bg-amber-500/20 text-amber-100",
  restaurant:    "bg-red-500/20 text-red-100",
  retail:        "bg-blue-500/20 text-blue-100",
  grocery:       "bg-green-500/20 text-green-100",
  fitness:       "bg-purple-500/20 text-purple-100",
  entertainment: "bg-pink-500/20 text-pink-100",
  beauty:        "bg-rose-500/20 text-rose-100",
  other:         "bg-white/20 text-white/80",
};

export default function MerchantCard({ merchant, index, rewards = [], distance }) {
  const featuredReward = rewards[0];
  const rewardPreview = featuredReward
    ? merchant.loyalty_type === "stamps" && merchant.stamps_required
      ? `${merchant.stamps_required} stamps = ${featuredReward.name}`
      : `${featuredReward.points_cost || 0} pts = ${featuredReward.name}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={createPageUrl("MerchantDetail") + `?merchantId=${merchant.id}`}>
        <div
          className="bg-white overflow-hidden group transition-all duration-300"
          style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        >
          {/* Cover — 16:9 aspect ratio */}
          <div
            className="relative w-full bg-gradient-to-br from-[#0A1931] to-[#162d50] overflow-hidden"
            style={{ aspectRatio: "16/9" }}
          >
            {merchant.cover_image_url && (
              <img
                src={merchant.cover_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
            )}

            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Category pill — top-left */}
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm ${
                  categoryPill[merchant.category] || categoryPill.other
                }`}
              >
                {categoryEmoji[merchant.category] || "⭐"}{" "}
                {merchant.category
                  ? merchant.category.charAt(0).toUpperCase() + merchant.category.slice(1)
                  : "Other"}
              </span>
            </div>

            {/* Logo — circular, centred, overlapping cover/info boundary */}
            {merchant.logo_url && (
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-14 h-14 rounded-full bg-white overflow-hidden z-10"
                style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}
              >
                <img src={merchant.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className={`px-4 pb-4 ${merchant.logo_url ? "pt-9" : "pt-4"}`}>
            <h3 className="font-bold text-[#0A1931] text-base text-center leading-snug">
              {merchant.name}
            </h3>

            {/* Reward preview */}
            {rewardPreview && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-2.5 py-1.5 border border-orange-100">
                <span>🎁</span>
                <span className="font-medium truncate">{rewardPreview}</span>
              </div>
            )}

            {/* Distance */}
            {distance != null && (
              <div className="flex items-center justify-center gap-1 mt-2 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="text-xs font-medium">{distance.toFixed(1)} km away</span>
              </div>
            )}

            {!rewardPreview && distance == null && merchant.description && (
              <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 text-center">
                {merchant.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
