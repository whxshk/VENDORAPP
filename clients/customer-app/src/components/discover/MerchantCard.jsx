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

// Glassmorphism pills — reduced opacity for a lighter, more refined look
const categoryPill = {
  cafe:          "bg-amber-400/15 text-amber-100",
  restaurant:    "bg-red-400/15 text-red-100",
  retail:        "bg-blue-400/15 text-blue-100",
  grocery:       "bg-green-400/15 text-green-100",
  fitness:       "bg-purple-400/15 text-purple-100",
  entertainment: "bg-pink-400/15 text-pink-100",
  beauty:        "bg-rose-400/15 text-rose-100",
  other:         "bg-white/15 text-white/70",
};

// Fallback background for the logo circle when no logo is present
const categoryBg = {
  cafe:          "bg-amber-50",
  restaurant:    "bg-red-50",
  retail:        "bg-blue-50",
  grocery:       "bg-green-50",
  fitness:       "bg-purple-50",
  entertainment: "bg-pink-50",
  beauty:        "bg-rose-50",
  other:         "bg-gray-50",
};

export default function MerchantCard({ merchant, index, rewards = [], distance }) {
  const featuredReward = rewards[0];
  const rewardPreview = featuredReward
    ? merchant.loyalty_type === "stamps" && merchant.stamps_required
      ? `${merchant.stamps_required} stamps = ${featuredReward.name}`
      : `${featuredReward.points_cost || 0} pts = ${featuredReward.name}`
    : null;

  // Always show a logo circle — use the image if available, otherwise show
  // the category emoji as a fallback so all cards look consistent.
  const logoCircle = (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-10 w-14 h-14 rounded-full border-2 border-white overflow-hidden flex items-center justify-center ${
        merchant.logo_url ? "bg-white" : (categoryBg[merchant.category] || "bg-gray-50")
      }`}
      style={{
        bottom: -28, // perfectly bisects the dark/white boundary (half of 56px)
        boxShadow: "0 4px 16px rgba(0,0,0,0.20)",
      }}
    >
      {merchant.logo_url ? (
        <img src={merchant.logo_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl leading-none">
          {categoryEmoji[merchant.category] || "🏪"}
        </span>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={createPageUrl("MerchantDetail") + `?merchantId=${merchant.id}`}>
        <div
          className="bg-white overflow-visible group transition-all duration-300"
          style={{ borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
        >
          {/* Cover — 16:9 with logo overlapping bottom edge */}
          <div
            className="relative w-full bg-gradient-to-br from-[#0A1931] to-[#162d50] overflow-visible"
            style={{ aspectRatio: "16/9", borderRadius: "16px 16px 0 0", overflow: "hidden" }}
          >
            {merchant.cover_image_url && (
              <img
                src={merchant.cover_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
            )}

            {/* Gradient scrim — fades to a solid dark at the bottom for the logo to pop */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {/* Category badge — top-left, 20px from edges (8px more breathing room) */}
            <div className="absolute top-5 left-5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide backdrop-blur-md ${
                  categoryPill[merchant.category] || categoryPill.other
                }`}
              >
                {categoryEmoji[merchant.category] || "⭐"}{" "}
                {merchant.category
                  ? merchant.category.charAt(0).toUpperCase() + merchant.category.slice(1)
                  : "Other"}
              </span>
            </div>

            {/* Logo circle — needs overflow:visible on parent, so we portal it out */}
          </div>

          {/* Logo rendered outside the clipped cover so it can overflow */}
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
              <div
                className={`w-14 h-14 rounded-full border-2 border-white overflow-hidden flex items-center justify-center ${
                  merchant.logo_url
                    ? "bg-white"
                    : (categoryBg[merchant.category] || "bg-gray-50")
                }`}
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
              >
                {merchant.logo_url ? (
                  <img src={merchant.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl leading-none">
                    {categoryEmoji[merchant.category] || "🏪"}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="px-4 pt-11 pb-5 text-center">
              <h3
                className="font-semibold text-[#0A1931] leading-snug"
                style={{ fontSize: 18 }}
              >
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
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                  {merchant.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
