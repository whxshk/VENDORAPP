import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TermsDialog({ open, onClose, type }) {
  const isTerms = type === "terms";
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isTerms ? "Terms of Service" : "Privacy Policy"}</DialogTitle>
        </DialogHeader>
        {isTerms ? (
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <p><strong>Last updated: January 2025</strong></p>
            <p>Welcome to SharkBand. By using our app, you agree to these terms.</p>
            <h3 className="font-semibold text-gray-800">1. Use of Service</h3>
            <p>SharkBand provides a digital loyalty platform connecting customers with participating merchants. You must be 13 years or older to use this service.</p>
            <h3 className="font-semibold text-gray-800">2. Account Responsibility</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized use.</p>
            <h3 className="font-semibold text-gray-800">3. Points & Rewards</h3>
            <p>Loyalty points and stamps have no cash value and cannot be transferred. Merchants set their own reward conditions. SharkBand is not responsible for changes to merchant reward programs.</p>
            <h3 className="font-semibold text-gray-800">4. Prohibited Conduct</h3>
            <p>You may not attempt to fraudulently earn points, reverse-engineer the platform, or use automated means to interact with the service.</p>
            <h3 className="font-semibold text-gray-800">5. Termination</h3>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
            <h3 className="font-semibold text-gray-800">6. Changes</h3>
            <p>We may update these terms at any time. Continued use of the app constitutes acceptance of the updated terms.</p>
            <h3 className="font-semibold text-gray-800">7. Contact</h3>
            <p>Questions? Email us at support@sharkband.io</p>
          </div>
        ) : (
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <p><strong>Last updated: January 2025</strong></p>
            <p>SharkBand ("we") respects your privacy. This policy describes what data we collect and how we use it.</p>
            <h3 className="font-semibold text-gray-800">1. Data We Collect</h3>
            <p>We collect your name, email address, transaction history with participating merchants, and app usage data.</p>
            <h3 className="font-semibold text-gray-800">2. How We Use Your Data</h3>
            <p>Your data is used to operate the loyalty platform, provide customer support, and send relevant notifications (with your consent).</p>
            <h3 className="font-semibold text-gray-800">3. Data Sharing</h3>
            <p>We share transaction data with the merchant you visited so they can manage your loyalty account. We do not sell your personal data to third parties.</p>
            <h3 className="font-semibold text-gray-800">4. Data Security</h3>
            <p>We use industry-standard encryption (TLS, bcrypt for passwords) to protect your data.</p>
            <h3 className="font-semibold text-gray-800">5. Your Rights</h3>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting support@sharkband.io or using the "Delete Account" option in the app.</p>
            <h3 className="font-semibold text-gray-800">6. Cookies</h3>
            <p>We use local storage to keep you logged in. No third-party tracking cookies are used.</p>
            <h3 className="font-semibold text-gray-800">7. Contact</h3>
            <p>Privacy questions? Email us at privacy@sharkband.io</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const PENDING_OTP_KEY = "pending_otp_auth";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [legalDialog, setLegalDialog] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) newErrors.email = "Enter a valid email address.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await register(email, password, name);
      sessionStorage.setItem(
        PENDING_OTP_KEY,
        JSON.stringify({
          email,
          purpose: "signup",
        }),
      );
      toast.success(response?.message || "Verification code sent.");
      navigate(createPageUrl("OTPVerification"), {
        replace: true,
        state: {
          pendingChallenge: {
            email,
            purpose: "signup",
          },
        },
      });
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
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
              onKeyDown={handleKeyDown}
              className={`h-12 text-base ${errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
              onKeyDown={handleKeyDown}
              className={`h-12 text-base ${errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
              onKeyDown={handleKeyDown}
              className={`h-12 text-base ${errors.password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
              onKeyDown={handleKeyDown}
              className={`h-12 text-base ${errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
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
          By creating an account, you agree to SharkBand's{" "}
          <button
            onClick={() => setLegalDialog("terms")}
            className="underline text-gray-500 hover:text-gray-700"
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            onClick={() => setLegalDialog("privacy")}
            className="underline text-gray-500 hover:text-gray-700"
          >
            Privacy Policy
          </button>
        </motion.p>
      </div>

      <TermsDialog
        open={legalDialog !== null}
        onClose={() => setLegalDialog(null)}
        type={legalDialog}
      />
    </div>
  );
}
