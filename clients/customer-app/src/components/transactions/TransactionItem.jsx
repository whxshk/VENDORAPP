import React from "react";
import { ArrowUpRight, Gift } from "lucide-react";
import { format } from "date-fns";

export default function TransactionItem({ transaction }) {
  const isEarn = transaction.type === "earn";

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isEarn ? "bg-green-50" : "bg-orange-50"
      }`}>
        {isEarn ? (
          <ArrowUpRight className="w-5 h-5 text-green-600" />
        ) : (
          <Gift className="w-5 h-5 text-orange-600" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-[#0A1931] truncate">
          {transaction.merchant_name}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {transaction.description || (isEarn ? "Points earned" : "Reward redeemed")}
        </p>
        {!isEarn && (
          <p className="text-xs text-gray-400">redeemed</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {format(new Date(transaction.created_date), "MMM d, h:mm a")}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-base font-bold ${
          isEarn ? "text-green-600" : "text-orange-600"
        }`}>
          {isEarn ? "+" : "-"}
          {transaction.points_amount ? `${transaction.points_amount} pts` : 
           transaction.stamps_amount ? `${transaction.stamps_amount} stamp${transaction.stamps_amount !== 1 ? 's' : ''}` : 
           "—"}
        </p>
      </div>
    </div>
  );
}