import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

const features = [
  { icon: "🦈", title: "Universal QR Code", desc: "One code for all merchants" },
  { icon: "⚡", title: "Instant Rewards", desc: "Earn & redeem automatically" },
  { icon: "🎁", title: "Exclusive Deals", desc: "Access member-only perks" }
];

export default function Welcome() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const handleGetStarted = () => {
    completeOnboarding();
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1931] via-[#0f2440] to-[#0A1931] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-16 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/30">
            <span className="text-5xl">🦈</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h1 className="text-3xl font-bold text-white">Welcome to SharkBand!</h1>
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-gray-300 text-sm">
            Start earning rewards at 6+ merchants
          </p>
        </motion.div>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 max-w-md mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-400">{feature.desc}</p>
                </div>
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-6 pb-10"
      >
        <Button
          onClick={handleGetStarted}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-orange-500/30"
        >
          Let's Go! 🚀
        </Button>
        <p className="text-xs text-gray-400 text-center mt-4">
          Your universal loyalty wallet awaits
        </p>
      </motion.div>
    </div>
  );
}