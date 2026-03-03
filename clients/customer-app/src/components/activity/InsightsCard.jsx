import React from "react";
import { motion } from "framer-motion";

export default function InsightsCard({ transactions }) {
  const thisMonth = transactions.filter(tx => {
    const txDate = new Date(tx.created_date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  // Most visited merchant
  const merchantCounts = {};
  thisMonth.forEach(tx => {
    if (tx.merchant_name) {
      merchantCounts[tx.merchant_name] = (merchantCounts[tx.merchant_name] || 0) + 1;
    }
  });
  const mostVisited = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0];

  // Favorite category
  const categoryCounts = {};
  thisMonth.forEach(tx => {
    if (tx.merchant_category) {
      categoryCounts[tx.merchant_category] = (categoryCounts[tx.merchant_category] || 0) + 1;
    }
  });
  const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  const categoryPercentage = favoriteCategory 
    ? Math.round((favoriteCategory[1] / thisMonth.length) * 100)
    : 0;

  if (!mostVisited && !favoriteCategory) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl p-4 border border-gray-200 mb-4"
    >
      <h3 className="text-base font-bold text-[#0A1931] mb-3">📊 Your SharkBand Insights</h3>
      
      <div className="space-y-2">
        {mostVisited && (
          <div className="text-sm text-gray-700">
            <p>🏆 <span className="font-medium">Most visited:</span> {mostVisited[0]}</p>
            <p className="text-xs text-gray-500 ml-5">({mostVisited[1]} visit{mostVisited[1] !== 1 ? 's' : ''} this month)</p>
          </div>
        )}
        
        {favoriteCategory && (
          <div className="text-sm text-gray-700">
            <p>☕ <span className="font-medium">Favorite category:</span> {favoriteCategory[0]}</p>
            <p className="text-xs text-gray-500 ml-5">({categoryPercentage}% of your activity)</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}