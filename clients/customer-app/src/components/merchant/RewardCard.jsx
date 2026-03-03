import React from "react";
import { motion } from "framer-motion";
import { Info, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function StampFraction({ current, total }) {
  const percent = Math.min((current / Math.max(total, 1)) * 100, 100);
  return (
    <div className="mt-2">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-orange-500">{current}</span>
        <span className="text-base font-semibold text-gray-300">/</span>
        <span className="text-xl font-bold text-gray-400">{total}</span>
        <span className="text-xs text-gray-400 ml-1">stamps</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
        <div
          className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function RewardCard({ reward, account, merchant }) {
  // Support both camelCase (new backend) and snake_case (legacy)
  const rewardType = reward.rewardType || (merchant?.loyalty_type === "stamps" ? "stamps" : "points");
  const isStampReward = rewardType === "stamps";
  const pointsCost = reward.pointsCost ?? reward.points_cost ?? 0;
  const stampsCost = reward.stampsCost ?? reward.stamps_cost ?? 0;

  let progress = 0;
  let canRedeem = false;
  let statusText = "";

  if (account) {
    if (isStampReward) {
      const cost = stampsCost || account.stamps_required || 10;
      progress = Math.min(((account.stamps_count || 0) / cost) * 100, 100);
      canRedeem = (account.stamps_count || 0) >= cost;
      statusText = `${account.stamps_count || 0} / ${cost} stamps`;
    } else {
      progress = Math.min(((account.points_balance || 0) / (pointsCost || 1)) * 100, 100);
      canRedeem = (account.points_balance || 0) >= pointsCost;
      statusText = `${account.points_balance || 0} / ${pointsCost} points`;
    }
  }

  const redeemInstructions = isStampReward
    ? `Once you collect ${stampsCost || account?.stamps_required || 10} stamps, show your SharkCode to the cashier and mention this reward. They'll verify your stamps and apply the reward to your order.`
    : `When you have ${pointsCost} points, show your SharkCode at checkout. The cashier will deduct the points and apply "${reward.name}" to your purchase.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 border ${
        canRedeem ? "border-green-200 bg-green-50/30" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[#0A1931] text-sm">{reward.name}</h4>
            {canRedeem && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </div>
          {reward.description && (
            <p className="text-xs text-gray-400 mt-0.5">{reward.description}</p>
          )}
          <p className="text-xs text-orange-500 font-medium mt-1">
            {isStampReward ? `${stampsCost} stamps` : `${pointsCost} pts`}
          </p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0">
                <Info className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
              <p className="text-xs leading-relaxed">{redeemInstructions}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {account && (
        <div>
          {isStampReward ? (
            <StampFraction
              current={account.stamps_count || 0}
              total={stampsCost || account.stamps_required || 10}
            />
          ) : (
            // Points progress bar
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{statusText}</span>
                <span className={`text-xs font-semibold ${canRedeem ? "text-green-600" : "text-gray-400"}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}

      {!account && (
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mt-2">
          Visit this merchant to start earning rewards
        </div>
      )}
    </motion.div>
  );
}
