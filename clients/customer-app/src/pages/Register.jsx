import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const { register, completeOnboarding } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      completeOnboarding();
      toast.success("Account created! Welcome to SharkBand.");
      navigate(createPageUrl("Home"), { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 409) {
        toast.error("An account with this email already exists. Please sign in.");
      } else {
        const msg =
          error?.response?.data?.error?.originalMessage ||
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Registration failed. Please try again.";
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-[#0A1931] to-[#0f2440]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Create your account
          </h1>
          <p className="text-gray-300 text-center text-sm">
            Join SharkBand and start earning loyalty rewards
          </p>
        </motion.div>
      </div>

      <div className="flex-1 px-6 pt-8 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 text-base"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 text-base"
            />
          </div>

          <Button
            onClick={handleRegister}
            disabled={!name || !email || !password || !confirmPassword || loading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-base font-semibold"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <button
            onClick={() => navigate(createPageUrl("PhoneInput"))}
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Already have an account? Sign in
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-gray-400 text-center mt-8"
        >
          By creating an account, you agree to SharkBand's Terms of Service and Privacy Policy
        </motion.p>
      </div>
    </div>
  );
}
