import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ledgerService } from "@/api/ledgerService";
import { customerService } from "@/api/customerService";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, ArrowUpDown, Loader2 } from "lucide-react";
import TransactionItem from "../components/transactions/TransactionItem";
import EmptyState from "../components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import MonthSummaryCard from "../components/activity/MonthSummaryCard";
import InsightsCard from "../components/activity/InsightsCard";

function entryToTx(entry, merchantMap) {
  // Prefer the name returned directly from the API; fall back to the
  // memberships map (keyed by tenantId) so older entries without merchantName
  // still resolve correctly.
  const resolvedName =
    entry.merchantName ||
    (entry.tenantId && merchantMap.get(entry.tenantId)) ||
    "Deleted Merchant";

  const isStamp = entry.stampIssued === true;
  const absAmount = Math.abs(entry.amount);

  return {
    id: entry.id || entry.transactionId,
    type: entry.amount > 0 ? "earn" : "redeem",
    merchant_name: resolvedName,
    description: entry.operationType,
    created_date: entry.createdAt,
    // Set the correct amount field so TransactionItem renders "pts" vs "stamp(s)"
    points_amount: isStamp ? undefined : absAmount,
    stamps_amount: isStamp ? absAmount : undefined,
  };
}

export default function Activity() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const queryClient = useQueryClient();

  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
    },
    enabled: !!user,
  });

  // Build a merchantId → merchantName lookup from the memberships list
  const merchantMap = new Map(
    memberships.map((m) => [m.merchant_id, m.merchant_name])
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["ledger-history", user?.customerId],
    queryFn: async ({ pageParam = 1 }) => {
      const limit = 20;
      const res = await ledgerService.getHistory(user.customerId, { page: pageParam, limit });
      const { entries = [], pagination = {} } = res.data;
      return {
        transactions: entries.map((e) => entryToTx(e, merchantMap)),
        nextPage: pagination.page < pagination.totalPages ? pagination.page + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.customerId,
  });

  const allTransactions = data?.pages.flatMap((p) => p.transactions) || [];

  let filtered =
    filter === "all" ? allTransactions : allTransactions.filter((t) => t.type === filter);

  if (sortBy === "merchant") {
    filtered = [...filtered].sort((a, b) =>
      (a.merchant_name || "").localeCompare(b.merchant_name || "")
    );
  }

  const groupByTimePeriod = (transactions) => {
    const now = new Date();
    const groups = {
      thisWeek: [],
      lastWeek: [],
      earlierThisMonth: [],
      lastMonth: [],
      older: [],
    };
    transactions.forEach((tx) => {
      const txDate = new Date(tx.created_date);
      const daysDiff = Math.floor((now - txDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) groups.thisWeek.push(tx);
      else if (daysDiff <= 14) groups.lastWeek.push(tx);
      else if (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      )
        groups.earlierThisMonth.push(tx);
      else if (
        txDate.getMonth() === now.getMonth() - 1 ||
        (now.getMonth() === 0 &&
          txDate.getMonth() === 11 &&
          txDate.getFullYear() === now.getFullYear() - 1)
      )
        groups.lastMonth.push(tx);
      else groups.older.push(tx);
    });
    return groups;
  };

  const grouped = sortBy === "date" ? groupByTimePeriod(filtered) : null;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) setPullStart(e.touches[0].clientY);
  };
  const handleTouchMove = (e) => {
    if (pullStart && window.scrollY === 0) {
      const distance = e.touches[0].clientY - pullStart;
      if (distance > 0) setPullDistance(Math.min(distance, 100));
    }
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isPullRefreshing) {
      setIsPullRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["ledger-history"] });
      setTimeout(() => {
        setIsPullRefreshing(false);
        setPullDistance(0);
        setPullStart(0);
      }, 1000);
    } else {
      setPullDistance(0);
      setPullStart(0);
    }
  };

  const renderGroup = (label, items) => {
    if (!items.length) return null;
    const earnItems = items.filter((t) => t.type === "earn");
    const earnedPts = earnItems.reduce((s, t) => s + (t.points_amount || 0), 0);
    const earnedStamps = earnItems.reduce((s, t) => s + (t.stamps_amount || 0), 0);
    const redeemed = items.filter((t) => t.type === "redeem").length;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[#0A1931] dark:text-white">{label}</h3>
          <div className="flex items-center gap-2 text-sm flex-wrap justify-end">
            {earnedStamps > 0 && (
              <span className="text-green-600 font-semibold">+{earnedStamps} stamp{earnedStamps !== 1 ? "s" : ""}</span>
            )}
            {earnedPts > 0 && (
              <span className="text-green-600 font-semibold">+{earnedPts} pts</span>
            )}
            {redeemed > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-orange-600 font-semibold">{redeemed} redeemed</span>
              </>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {items.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-full bg-gray-50 dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center z-50 transition-opacity"
          style={{
            transform: `translateY(${Math.min(pullDistance - 60, 40)}px)`,
            opacity: pullDistance / 100,
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
            <Loader2
              className={`w-5 h-5 text-[#0A1931] ${isPullRefreshing ? "animate-spin" : ""}`}
            />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 px-6 pt-8 pb-5 border-b border-gray-100 dark:border-gray-700">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#0A1931] dark:text-white">Activity</h1>
          <p className="text-sm text-gray-400 mt-1">Your transaction history</p>
        </motion.div>

        <div className="space-y-3 mt-5">
          <div className="flex gap-2">
            {[
              { key: "all", label: "All" },
              { key: "earn", label: "Earned" },
              { key: "redeem", label: "Redeemed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-[#0A1931] text-white shadow-md shadow-[#0A1931]/20"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setSortBy(sortBy === "date" ? "merchant" : "date")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300 transition-all"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === "date" ? "By Date" : "By Merchant"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-28 pt-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 mb-2 animate-pulse flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100" />
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-50 rounded w-20" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No transactions yet"
            description="Your points and stamps activity will appear here"
          />
        ) : (
          <>
            <MonthSummaryCard transactions={filtered} />
            <InsightsCard transactions={allTransactions} />

            {sortBy === "date" ? (
              <>
                {renderGroup("This Week", grouped.thisWeek)}
                {renderGroup("Last Week", grouped.lastWeek)}
                {renderGroup("Earlier This Month", grouped.earlierThisMonth)}
                {renderGroup("Last Month", grouped.lastMonth)}
                {renderGroup("Older", grouped.older)}
              </>
            ) : (
              <div className="space-y-2">
                {filtered.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            )}

            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="rounded-xl"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
