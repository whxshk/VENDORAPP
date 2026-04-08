import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StampProgress from "./StampProgress";

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

export default function WalletCard({ account, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={createPageUrl("MerchantDetail") + `?merchantId=${account.merchant_id}&accountId=${account.id}`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group" style={{ border: '0.75px solid #000000' }}>
          <div className="flex items-center gap-4">
            {/* Logo / Avatar */}
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              {account.merchant_logo_url ? (
                <img src={account.merchant_logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0A1931] to-[#1a3355] flex items-center justify-center">
                  <span className="text-2xl">{categoryEmoji[account.merchant_category] || "⭐"}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#0A1931] dark:text-white text-[15px] truncate">{account.merchant_name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{account.merchant_category?.replace(/_/g, " ")}</p>
              
              {account.loyalty_type === "stamps" ? (
                <>
                  <StampProgress
                    current={account.stamps_count || 0}
                    total={account.stamps_required || 10}
                  />
                  {account.points_balance > 0 && (
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-[#0A1931] dark:text-white">{account.points_balance.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 font-medium">pts</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#0A1931]">{(account.points_balance || 0).toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-medium">pts</span>
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}