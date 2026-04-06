import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

const categoryEmoji = {
  cafe: "☕",
  restaurant: "🍽️",
  retail: "🛍️",
  grocery: "🛒",
  fitness: "💪",
  entertainment: "🎬",
  beauty: "💄",
  other: "⭐"
};

const categoryColors = {
  cafe: "bg-amber-50 text-amber-700 border-amber-200",
  restaurant: "bg-red-50 text-red-700 border-red-200",
  retail: "bg-blue-50 text-blue-700 border-blue-200",
  grocery: "bg-green-50 text-green-700 border-green-200",
  fitness: "bg-purple-50 text-purple-700 border-purple-200",
  entertainment: "bg-pink-50 text-pink-700 border-pink-200",
  beauty: "bg-rose-50 text-rose-700 border-rose-200",
  other: "bg-gray-50 text-gray-700 border-gray-200"
};

export default function MerchantCard({ merchant, index, rewards = [], distance }) {
  // Get featured reward preview
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
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={createPageUrl("MerchantDetail") + `?merchantId=${merchant.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-300 group">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-br from-[#0A1931] to-[#162d50] relative overflow-hidden">
            {merchant.cover_image_url && (
              <img src={merchant.cover_image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <Badge className={`${categoryColors[merchant.category] || categoryColors.other} border text-xs`}>
                {categoryEmoji[merchant.category]} {merchant.category}
              </Badge>
            </div>
            {merchant.logo_url && (
              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md">
                <img src={merchant.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-semibold text-[#0A1931] text-[15px]">{merchant.name}</h3>
            
            {/* Reward Preview */}
            {rewardPreview && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1 border border-orange-100">
                <span className="text-[11px]">🎁</span>
                <span className="font-medium truncate">{rewardPreview}</span>
              </div>
            )}
            
            {/* Distance */}
            {distance !== null && distance !== undefined && (
              <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="text-xs font-medium">{distance.toFixed(1)} km away</span>
              </div>
            )}
            
            {!rewardPreview && !distance && merchant.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{merchant.description}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}