import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerService } from "@/api/customerService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet as WalletIcon, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import WalletCard from "../components/wallet/WalletCard";
import EmptyState from "../components/shared/EmptyState";

export default function Wallet() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const queryClient = useQueryClient();

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["memberships", user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
    },
    enabled: !!user,
  });

  const filteredAccounts = memberships.filter((a) => {
    const matchSearch =
      !search || a.merchant_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.merchant_category === filter;
    return matchSearch && matchFilter;
  });

  const categories = [
    "all",
    ...new Set(memberships.map((a) => a.merchant_category).filter(Boolean)),
  ];

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
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
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

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-6 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#0A1931] dark:text-white">Wallet</h1>
          <p className="text-sm text-gray-400 mt-1">Your loyalty cards in one place</p>
        </motion.div>

      </div>

      {/* Search & Filter */}
      <div className="px-6 pt-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) setFilter("all");
            }}
            className="pl-10 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-200 rounded-xl h-11 text-sm"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setFilter(cat); setSearch(""); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === cat
                    ? "bg-[#0A1931] text-white"
                    : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards List */}
      <div className="px-6 pb-28 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-50 rounded w-20 mt-2" />
                  <div className="h-6 bg-gray-50 rounded w-16 mt-2" />
                </div>
              </div>
            </div>
          ))
        ) : filteredAccounts.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="No loyalty cards yet"
            description="Visit a SharkBand merchant and scan your QR code to start collecting points!"
          />
        ) : (
          filteredAccounts.map((account, i) => (
            <WalletCard key={account.id || i} account={account} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
