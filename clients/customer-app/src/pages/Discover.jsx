import React, { useState, useEffect } from "react";
import { merchantService } from "@/api/merchantService";
import { rewardService } from "@/api/rewardService";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Grid3X3, Map, Navigation, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import MerchantCard from "../components/discover/MerchantCard";
import MapView from "../components/discover/MapView";
import EmptyState from "../components/shared/EmptyState";

const categories = [
  { key: "all", label: "All", emoji: "🔥" },
  { key: "cafe", label: "Café", emoji: "☕" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { key: "retail", label: "Retail", emoji: "🛍️" },
  { key: "grocery", label: "Grocery", emoji: "🛒" },
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "entertainment", label: "Fun", emoji: "🎬" },
  { key: "beauty", label: "Beauty", emoji: "💄" },
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function Discover() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("default");
  const [nearMeFilter, setNearMeFilter] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Full merchant list — always loaded for grid/map view
  const { data: merchantsRaw = [], isLoading } = useQuery({
    queryKey: ["merchants"],
    queryFn: async () => {
      const res = await merchantService.list({ is_active: true });
      return Array.isArray(res.data) ? res.data : (res.data?.merchants || []);
    },
  });

  // Nearby query — server-side distance sort, only runs when user has location
  const { data: nearbyRaw = [], isFetching: nearbyFetching } = useQuery({
    queryKey: ["merchants-nearby", userLocation?.[0], userLocation?.[1]],
    queryFn: async () => {
      const res = await merchantService.nearby(userLocation[0], userLocation[1], 25000);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!userLocation,
    staleTime: 60_000,
  });

  const { data: allRewards = [] } = useQuery({
    queryKey: ["all-rewards"],
    queryFn: async () => {
      const res = await rewardService.list({ is_active: true });
      return Array.isArray(res.data) ? res.data : (res.data?.rewards || []);
    },
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  // When "Near Me" is active and location is available, use server-side nearby results;
  // otherwise fall back to the full list with client-side distance annotation.
  const baseList = nearMeFilter && userLocation ? nearbyRaw : merchantsRaw;

  let filtered = baseList.filter((m) => {
    const matchSearch =
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || m.category === category;
    return matchSearch && matchCategory;
  });

  // Attach client-side distance for merchants that have coordinates but came
  // from the full list (not the nearby endpoint, which already has distance_meters)
  if (userLocation) {
    filtered = filtered.map((m) => {
      if (m.distance_meters != null) {
        return { ...m, distance: m.distance_meters / 1000 };
      }
      if (m.latitude && m.longitude) {
        return {
          ...m,
          distance: calculateDistance(userLocation[0], userLocation[1], m.latitude, m.longitude),
        };
      }
      return m;
    });
  }

  if (sortBy === "distance" && userLocation) {
    filtered = [...filtered].sort((a, b) => {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 px-6 pt-8 pb-5 border-b border-gray-100 dark:border-gray-700">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#0A1931] dark:text-white">Discover</h1>
          <p className="text-sm text-gray-400 mt-1">Find SharkBand merchants near you</p>
        </motion.div>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input
            placeholder="Search by name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-200 rounded-xl h-11 text-sm"
          />
        </div>
      </div>

      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "grid" ? "bg-white dark:bg-gray-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "map" ? "bg-white dark:bg-gray-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setNearMeFilter(!nearMeFilter)}
            disabled={!userLocation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              nearMeFilter
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            } ${!userLocation ? "opacity-50" : ""}`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Near Me
          </button>

          {userLocation && (
            <button
              onClick={() => setSortBy(sortBy === "default" ? "distance" : "default")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                sortBy === "distance"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Distance
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                category === cat.key
                  ? "bg-[#0A1931] text-white shadow-md shadow-[#0A1931]/20"
                  : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-28">
        <p className="text-xs text-gray-400 font-medium mb-4">
          {filtered.length} merchant{filtered.length !== 1 ? "s" : ""} found
          {nearMeFilter && userLocation && " near you"}
        </p>

        {isLoading || (nearMeFilter && nearbyFetching && nearbyRaw.length === 0) ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-100" />
                <div className="p-4">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-50 rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Grid3X3}
            title="No merchants found"
            description={
              nearMeFilter && !userLocation
                ? "Enable location to use Near Me"
                : "Try adjusting your search or filters"
            }
          />
        ) : viewMode === "map" ? (
          <MapView merchants={filtered} userLocation={userLocation} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((merchant, i) => (
              <MerchantCard
                key={merchant.id}
                merchant={merchant}
                index={i}
                rewards={allRewards.filter((r) => r.merchant_id === merchant.id)}
                distance={merchant.distance}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
