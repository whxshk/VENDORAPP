import React from "react";
import { merchantService } from "@/api/merchantService";
import { ledgerService } from "@/api/ledgerService";
import { rewardService } from "@/api/rewardService";
import { customerService } from "@/api/customerService";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Phone, Gift, History } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StampProgress from "../components/wallet/StampProgress";
import TransactionItem from "../components/transactions/TransactionItem";
import EmptyState from "../components/shared/EmptyState";
import RewardCard from "../components/merchant/RewardCard";

function entryToTx(entry, merchantName) {
  return {
    id: entry.id || entry.transactionId,
    type: entry.amount > 0 ? "earn" : "redeem",
    merchant_name: merchantName || "SharkBand",
    description: entry.operationType,
    created_date: entry.createdAt,
    points_amount: Math.abs(entry.amount),
  };
}

export default function MerchantDetail() {
  const params = new URLSearchParams(window.location.search);
  const merchantId = params.get("merchantId");
  const { user } = useAuth();

  const { data: merchant } = useQuery({
    queryKey: ["merchant", merchantId],
    queryFn: async () => {
      const res = await merchantService.getById(merchantId);
      return res.data;
    },
    enabled: !!merchantId,
  });

  // Fetch all memberships and find the one for this merchant
  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  // Fetch rewards for this specific merchant (public endpoint — no merchant JWT required)
  // staleTime: 0 + refetchInterval ensures rewards are always up to date
  const { data: rewards = [] } = useQuery({
    queryKey: ["merchant-rewards", merchantId],
    queryFn: async () => {
      const res = await rewardService.listByMerchant(merchantId);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!merchantId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: historyData } = useQuery({
    queryKey: ["ledger-history-detail", user?.customerId],
    queryFn: async () => {
      const res = await ledgerService.getHistory(user.customerId, { page: 1, limit: 20 });
      return res.data;
    },
    enabled: !!user?.customerId,
  });

  // Find the membership entry for this specific merchant
  const membership = memberships.find((m) => m.merchant_id === merchantId);

  // Build the account object from per-merchant membership data
  const account = membership
    ? {
        loyalty_type: membership.loyalty_type || "points",
        points_balance: membership.points_balance || 0,
        stamps_count: membership.stamps_count || 0,
        stamps_required: membership.stamps_required || merchant?.stamps_required || 10,
        total_visits: membership.total_visits || 0,
      }
    : null;

  const transactions = (historyData?.entries || []).map((e) => entryToTx(e, merchant?.name));

  if (!merchant) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      {/* Hero */}
      <div className="relative h-52 bg-gradient-to-br from-[#0A1931] to-[#1a3355]">
        {merchant.cover_image_url && (
          <img
            src={merchant.cover_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <Link to={createPageUrl("Discover")} className="absolute top-6 left-4 z-10">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>

        <div className="absolute bottom-5 left-6 right-6">
          <h1 className="text-2xl font-bold text-white">{merchant.name}</h1>
          <p className="text-sm text-gray-300 mt-1 capitalize">{merchant.category}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 border border-gray-100">
          {account ? (
            <div>
              {account.loyalty_type === "stamps" ? (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Stamp Progress</p>
                  <StampProgress
                    current={account.stamps_count}
                    total={
                      rewards.find((r) => r.rewardType === "stamps")?.stampsCost ||
                      account.stamps_required
                    }
                  />
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#0A1931]">
                    {account.points_balance.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">points</span>
                </div>
              )}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-lg font-semibold text-[#0A1931]">{account.total_visits}</p>
                  <p className="text-xs text-gray-400">Visits</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">
                Scan your SharkCode at this merchant to start earning!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 mt-5 space-y-3">
        {merchant.address && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{merchant.address}</span>
          </div>
        )}
        {merchant.opening_hours && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{merchant.opening_hours}</span>
          </div>
        )}
        {merchant.phone && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{merchant.phone}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <Tabs defaultValue="rewards">
          <TabsList className="w-full bg-gray-100 rounded-xl p-1">
            <TabsTrigger
              value="rewards"
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
            >
              <Gift className="w-3.5 h-3.5 mr-1.5" /> Rewards
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
            >
              <History className="w-3.5 h-3.5 mr-1.5" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="mt-4">
            {rewards.length === 0 ? (
              <EmptyState
                icon={Gift}
                title="No rewards yet"
                description="Rewards will appear here as the merchant adds them"
              />
            ) : (
              <>
                <div className="space-y-3">
                  {rewards
                    .sort((a, b) => (a.pointsCost || a.points_cost || 0) - (b.pointsCost || b.points_cost || 0))
                    .map((reward) => (
                      <RewardCard
                        key={reward.id}
                        reward={reward}
                        account={account}
                        merchant={merchant}
                      />
                    ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 mt-4">
                  <p className="font-medium mb-1">💳 How Redemption Works</p>
                  <p className="text-xs leading-relaxed">
                    Show your SharkCode to the cashier at checkout.{" "}
                    {account?.loyalty_type === "stamps"
                      ? "They'll verify your stamps and apply the reward you choose."
                      : "The system will automatically deduct the required points and apply your selected reward."}
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {transactions.length === 0 ? (
              <EmptyState
                icon={History}
                title="No transactions yet"
                description="Your activity with this merchant will show here"
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 px-4">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
