import React from "react";

export default function StampProgress({ current, total }) {
  const safeTotal = Math.max(1, total || 1);
  const safeCurrent = Math.min(current || 0, safeTotal);
  const percent = Math.min((safeCurrent / safeTotal) * 100, 100);

  return (
    <div className="mt-2">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-orange-500">{safeCurrent}</span>
        <span className="text-lg font-semibold text-gray-300">/</span>
        <span className="text-2xl font-bold text-gray-400">{safeTotal}</span>
        <span className="text-sm text-gray-400 ml-1">stamps</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
