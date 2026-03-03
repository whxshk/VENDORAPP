import React from "react";
import { motion } from "framer-motion";
import { Gift, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RewardsSummary({ accounts, rewards }) {
  // Calculate available rewards (can redeem now)
  const availableRewards = accounts.filter(acc => {
    if (acc.loyalty_type === "stamps") {
      return acc.stamps_count >= acc.stamps_required;
    } else {
      const merchantRewards = rewards.filter(r => r.merchant_id === acc.merchant_id);
      return merchantRewards.some(r => acc.points_balance >= (r.points_cost || 0));
    }
  });

  // Calculate close to unlocking (within 80% progress)
  const closeToUnlocking = accounts.filter(acc => {
    if (acc.loyalty_type === "stamps") {
      const progress = (acc.stamps_count || 0) / (acc.stamps_required || 1);
      return progress >= 0.8 && progress < 1;
    } else {
      const merchantRewards = rewards.filter(r => r.merchant_id === acc.merchant_id);
      return merchantRewards.some(r => {
        const progress = (acc.points_balance || 0) / (r.points_cost || 1);
        return progress >= 0.8 && progress < 1;
      });
    }
  });

  if (availableRewards.length === 0 && closeToUnlocking.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="px-6 mt-5"
    >
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-[#0A1931]">Your Rewards</h3>
          </div>
        </div>

        {availableRewards.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">✅ Ready to Redeem</p>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                {availableRewards.length}
              </span>
            </div>
            <div className="space-y-2">
              {availableRewards.slice(0, 2).map(acc => (
                <Link
                  key={acc.id}
                  to={createPageUrl("MerchantDetail") + `?accountId=${acc.id}`}
                  className="flex items-center gap-2 bg-white rounded-lg p-2 border border-green-200 hover:border-green-300 transition-all"
                >
                  {acc.merchant_logo_url ? (
                    <img src={acc.merchant_logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">
                      {acc.merchant_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0A1931] truncate">{acc.merchant_name}</p>
                    <p className="text-[10px] text-gray-500">
                      {acc.loyalty_type === "stamps" 
                        ? `${acc.stamps_count}/${acc.stamps_required} stamps`
                        : `${acc.points_balance} points`}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {closeToUnlocking.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">⚡ Almost There</p>
              <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                {closeToUnlocking.length}
              </span>
            </div>
            <div className="space-y-2">
              {closeToUnlocking.slice(0, 2).map(acc => {
                const progress = acc.loyalty_type === "stamps"
                  ? ((acc.stamps_count || 0) / (acc.stamps_required || 1)) * 100
                  : 80; // Simplified for points
                
                return (
                  <Link
                    key={acc.id}
                    to={createPageUrl("MerchantDetail") + `?accountId=${acc.id}`}
                    className="flex items-center gap-2 bg-white rounded-lg p-2 border border-orange-200 hover:border-orange-300 transition-all"
                  >
                    {acc.merchant_logo_url ? (
                      <img src={acc.merchant_logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">
                        {acc.merchant_name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0A1931] truncate">{acc.merchant_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}