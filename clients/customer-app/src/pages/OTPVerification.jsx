import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const PENDING_OTP_KEY = "pending_otp_auth";

function getStoredChallenge() {
  try {
    const raw = sessionStorage.getItem(PENDING_OTP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, completeOnboarding } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingChallenge = useMemo(() => {
    return location.state?.pendingChallenge || getStoredChallenge();
  }, [location.state]);

  useEffect(() => {
    if (!pendingChallenge?.email || !pendingChallenge?.purpose) {
      navigate(createPageUrl("PhoneInput"), { replace: true });
    }
  }, [navigate, pendingChallenge]);

  const handleVerify = async () => {
    if (!pendingChallenge?.email || !pendingChallenge?.purpose || code.length !== 6) {
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(
        pendingChallenge.email,
        code,
        pendingChallenge.purpose,
        pendingChallenge.tenantId,
      );
      sessionStorage.removeItem(PENDING_OTP_KEY);
      completeOnboarding();
      toast.success(
        pendingChallenge.purpose === "signup"
          ? "Account verified. Welcome to SharkBand."
          : "Login verified. Welcome back.",
      );
      navigate(createPageUrl("Home"), { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "Verification failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
            <ShieldCheck className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Check your email
          </h1>
          <p className="text-gray-300 text-center text-sm">
            Enter the 6-digit code sent to {pendingChallenge?.email || "your email"}.
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
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-600 mb-4">
              The code expires in 10 minutes. If it does not arrive, go back and request a new code.
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={loading}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || loading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-base font-semibold"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                Verify Code
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <button
            onClick={() => navigate(createPageUrl("PhoneInput"), { replace: true })}
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>
        </motion.div>
      </div>
    </div>
  );
}
