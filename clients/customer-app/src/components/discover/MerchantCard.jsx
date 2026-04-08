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

export default function MerchantCard({ merchant, index, rewards = [], distance }) {
  const featuredReward = rewards[0];
  const rewardPreview = featuredReward
    ? merchant.loyalty_type === "stamps" && merchant.stamps_required
      ? `${merchant.stamps_required} stamps = ${featuredReward.name}`
      : `${featuredReward.points_cost || 0} pts = ${featuredReward.name}`
    : null;

  const label = merchant.category
    ? merchant.category.charAt(0).toUpperCase() + merchant.category.slice(1)
    : "Other";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link to={createPageUrl("MerchantDetail") + `?merchantId=${merchant.id}`}>
        {/*
          Card shell — 3px solid black border + 24px radius.
          overflow:hidden clips the cover image to rounded top corners.
          The logo circle (absolutely placed inside the 3px equator band)
          overflows its own parent but stays within the card bounds,
          so it is NOT clipped here.
        */}
        <div
          className="group bg-white dark:bg-gray-800"
          style={{
            border: "0.75px solid #000000",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {/* ── DARK TOP (cover image) ────────────────────────────────── */}
          <div
            style={{
              aspectRatio: "16/9",
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(135deg, #0A1931 0%, #1a3355 100%)",
            }}
          >
            {merchant.cover_image_url && (
              <img
                src={merchant.cover_image_url}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.75,
                  transition: "transform 0.5s",
                }}
                className="group-hover:scale-105"
              />
            )}

            {/* Scrim — makes tag readable */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)",
              }}
            />

            {/*
              Category tag — solid navy pill, 14px from edges.
              14px aligns naturally with a 24px corner radius.
            */}
            <div style={{ position: "absolute", top: 14, left: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(10, 25, 49, 0.85)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                {categoryEmoji[merchant.category] || "⭐"} {label}
              </span>
            </div>
          </div>

          {/*
            ── EQUATOR BAND ─────────────────────────────────────────────
            3px solid black — this IS the horizontal divider.
            The logo circle is absolutely positioned at the exact centre
            of this band; its white background visually "interrupts" the
            line, recreating the Poké Ball plug-in effect.
          */}
          <div style={{ height: 3, background: "#000", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "0.75px solid #000000",
                background: "#fff",
                overflow: "hidden",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 26, lineHeight: 1 }}>
                  {categoryEmoji[merchant.category] || "🏪"}
                </span>
              )}
            </div>
          </div>

          {/* ── WHITE BOTTOM (info) ───────────────────────────────────── */}
          <div
            className="bg-white dark:bg-gray-800"
            style={{
              paddingTop: 44,   // 32px to clear half the logo + 12px breathing room
              paddingBottom: 20,
              paddingLeft: 16,
              paddingRight: 16,
              textAlign: "center",
            }}
          >
            <h3
              className="dark:text-white"
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: "#0A1931",
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {merchant.name}
            </h3>

            {/* Reward preview */}
            {rewardPreview && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#c2410c",
                  background: "#fff7ed",
                  borderRadius: 8,
                  padding: "5px 10px",
                  border: "1px solid #fed7aa",
                }}
              >
                <span>🎁</span>
                <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {rewardPreview}
                </span>
              </div>
            )}

            {/* Distance */}
            {distance != null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  marginTop: 8,
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                <MapPin style={{ width: 11, height: 11 }} />
                {distance.toFixed(1)} km away
              </div>
            )}

            {!rewardPreview && distance == null && merchant.description && (
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 6,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {merchant.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
