import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerService } from "@/api/customerService";
import { motion } from "framer-motion";
import { Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import QRCodeDisplay from "../components/qr/QRCodeDisplay";

export default function Home() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [merchantCount, setMerchantCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(30);

  const fetchQrToken = useCallback(async () => {
    try {
      const res = await customerService.getQrToken();
      setQrPayload(res.data.qrPayload);
      if (res.data.refreshIntervalSec) {
        setRefreshIntervalSec(res.data.refreshIntervalSec);
      }
    } catch {
      // Not linked to a customer yet — show placeholder
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await customerService.getMemberships();
      const memberships = Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
      setMerchantCount(memberships.length);
      const pts = memberships.reduce((sum, m) => sum + (m.points_balance || 0), 0);
      setTotalPoints(pts);
    } catch {
      // Endpoint may not exist yet
    }
  }, []);

  useEffect(() => {
    fetchQrToken();
    fetchMemberships();
  }, [fetchQrToken, fetchMemberships]);

  // Refresh QR token on interval
  useEffect(() => {
    const interval = setInterval(fetchQrToken, Math.max(15, Math.floor(refreshIntervalSec / 2)) * 1000);
    return () => clearInterval(interval);
  }, [fetchQrToken, refreshIntervalSec]);

  const sharkCode = qrPayload || "sharkband:loading";

  const handleCopy = () => {
    navigator.clipboard.writeText(sharkCode);
    setCopied(true);
    toast.success("Scan token copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center px-5 pt-16 pb-24">
      {/* Apple Wallet Style Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transform: "rotate(-3deg)" }}
        className="w-[90%] bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-[#0A1931] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦈</span>
            <span className="text-white text-sm font-bold tracking-wide">SHARKBAND</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">{user?.full_name || "Loading..."}</span>
            <button
              onClick={handleCopy}
              className="text-white/80 hover:text-white transition-colors"
            >
              {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-[#FFFFFF] p-5 flex items-center justify-center">
          <QRCodeDisplay data={sharkCode} size={300} color="#0A1931" />
        </div>

        {/* Card Footer */}
        <div className="bg-[#0A1931] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-[11px]">Total Points</p>
              <p className="text-white text-lg font-bold">{totalPoints.toLocaleString()} pts</p>
            </div>
            <div className="w-px h-10 bg-white/30" />
            <div className="text-right">
              <p className="text-white/70 text-[11px]">Active Cards</p>
              <p className="text-white text-lg font-bold">
                {merchantCount} merchant{merchantCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[#F97316] text-sm font-bold text-center">Show this to earn & redeem</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
