import React from "react";
import { motion } from "framer-motion";

export default function MonthSummaryCard({ transactions }) {
  const thisMonth = transactions.filter(tx => {
    const txDate = new Date(tx.created_date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const earnItems = thisMonth.filter(tx => tx.type === "earn");
  const totalPoints = earnItems.reduce((sum, tx) => sum + (tx.points_amount || 0), 0);
  const totalStamps = earnItems.reduce((sum, tx) => sum + (tx.stamps_amount || 0), 0);
  const totalRedeemed = thisMonth.filter(tx => tx.type === "redeem").length;

  const hasSomething = totalPoints > 0 || totalStamps > 0 || totalRedeemed > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A1931] rounded-xl p-4 mb-4"
    >
      <p className="text-white/80 text-sm mb-2">This Month</p>
      {hasSomething ? (
        <div className="flex items-center gap-3 text-white font-semibold flex-wrap">
          {totalStamps > 0 && (
            <span>+{totalStamps} stamp{totalStamps !== 1 ? "s" : ""}</span>
          )}
          {totalStamps > 0 && totalPoints > 0 && (
            <span className="text-white/40">|</span>
          )}
          {totalPoints > 0 && (
            <span>+{totalPoints} pts</span>
          )}
          {totalRedeemed > 0 && (
            <>
              <span className="text-white/40">|</span>
              <span>{totalRedeemed} redeemed</span>
            </>
          )}
        </div>
      ) : (
        <p className="text-white/50 text-sm">No activity this month</p>
      )}
    </motion.div>
  );
}
