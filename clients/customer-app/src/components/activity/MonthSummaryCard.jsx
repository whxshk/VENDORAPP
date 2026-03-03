import React from "react";
import { motion } from "framer-motion";

export default function MonthSummaryCard({ transactions }) {
  const thisMonth = transactions.filter(tx => {
    const txDate = new Date(tx.created_date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const totalSaved = thisMonth
    .filter(tx => tx.type === "earn")
    .reduce((sum, tx) => sum + (tx.monetary_amount || 0), 0);

  const totalPoints = thisMonth
    .filter(tx => tx.type === "earn")
    .reduce((sum, tx) => sum + (tx.points_amount || 0), 0);

  const totalRedeemed = thisMonth.filter(tx => tx.type === "redeem").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A1931] rounded-xl p-4 mb-4"
    >
      <p className="text-white/80 text-sm mb-2">This Month</p>
      <div className="flex items-center gap-3 text-white font-semibold">
        <span className="text-orange-500">{totalSaved.toFixed(0)} QAR</span>
        <span className="text-white/40">|</span>
        <span>+{totalPoints} pts</span>
        <span className="text-white/40">|</span>
        <span>{totalRedeemed} redeemed</span>
      </div>
    </motion.div>
  );
}