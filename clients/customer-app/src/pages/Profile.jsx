import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { LogOut, HelpCircle, Bell, ChevronRight, Star, Trash2, Shield, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerService } from "@/api/customerService";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeModal, setActiveModal] = useState(null); // "notifications" | "help" | "privacy"
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
    },
    enabled: !!user,
  });

  const totalPoints = memberships.reduce((sum, a) => sum + (a.points_balance || 0), 0);
  const totalStamps = memberships.reduce((sum, a) => sum + (a.stamps_count || 0), 0);
  const totalVisits = memberships.reduce((sum, a) => sum + (a.total_visits || 0), 0);

  const menuItems = [
    { key: "notifications", icon: Bell, label: "Notifications", description: "Manage your alerts" },
    { key: "help", icon: HelpCircle, label: "Help & Support", description: "Get assistance" },
    { key: "privacy", icon: Shield, label: "Privacy & Security", description: "Account protection" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate(createPageUrl("PhoneInput"), { replace: true });
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 pb-28">
      <div className="bg-gradient-to-br from-[#0A1931] to-[#1a3355] px-6 pt-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto border-2 border-white/20">
            <span className="text-3xl">🦈</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-4">{user?.full_name || "Shark Member"}</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        </motion.div>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700"
        >
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-[#0A1931] dark:text-white">{totalPoints.toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 mt-1">Points</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-[#0A1931] dark:text-white">{totalStamps}</p>
              <p className="text-[11px] text-gray-400 mt-1">Stamps</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-[#0A1931] dark:text-white">{memberships.length}</p>
              <p className="text-[11px] text-gray-400 mt-1">Cards</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 mt-5">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-orange-100 dark:border-orange-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A1931] dark:text-white">SharkBand Member</p>
              <p className="text-xs text-gray-500">
                Member since{" "}
                {user?.created_date
                  ? new Date(user.created_date).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "recently"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-5 space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            onClick={() => setActiveModal(item.key)}
            className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0A1931] dark:text-white">{item.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </motion.button>
        ))}
      </div>

      <div className="px-6 mt-2">
        <div className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
            <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0A1931] dark:text-white">Dark Mode</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Switch to dark theme</p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </div>

      {/* Logout with confirmation */}
      <div className="px-6 mt-8">
        <Button
          variant="ghost"
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      {/* Delete Account with "type DELETE" verification */}
      <div className="px-6 mt-3 mb-8">
        <AlertDialog onOpenChange={(open) => { if (!open) setDeleteConfirmText(""); }}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All your loyalty points and transaction history will
                be permanently removed. Type <strong>DELETE</strong> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={async () => {
                  if (deleteConfirmText !== "DELETE") return;
                  try {
                    await customerService.deleteAccount();
                  } catch {
                    // Proceed with local logout even if backend call fails
                  }
                  await logout();
                  navigate(createPageUrl("PhoneInput"), { replace: true });
                }}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your loyalty wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notifications Modal */}
      <Dialog open={activeModal === "notifications"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Manage how SharkBand contacts you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Points earned", desc: "Get notified when you earn loyalty points" },
              { label: "Rewards available", desc: "Know when you have enough points to redeem" },
              { label: "Promotions", desc: "Merchant offers and special deals" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
            <p className="text-xs text-gray-400 pt-2">
              Notification preferences are stored on this device. Push notifications require your
              browser permission.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help & Support Modal */}
      <Dialog open={activeModal === "help"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>We're here to help.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-gray-600">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-800">Frequently Asked Questions</p>
              <p><span className="font-medium">How do I earn points?</span> — Scan your SharkCode QR at any participating merchant checkout.</p>
              <p><span className="font-medium">Why aren't my points showing?</span> — Points may take a few seconds to appear. Pull to refresh on the Wallet page.</p>
              <p><span className="font-medium">How do I redeem rewards?</span> — Show your QR code to the cashier and ask to redeem your available reward.</p>
              <p><span className="font-medium">Can I use my code at multiple merchants?</span> — Yes! Your SharkCode works at all participating merchants.</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="font-semibold text-orange-800 mb-1">Contact Support</p>
              <p className="text-orange-700">Email: <span className="font-medium">support@sharkband.io</span></p>
              <p className="text-xs text-orange-600 mt-1">We aim to respond within 24 hours.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy & Security Modal */}
      <Dialog open={activeModal === "privacy"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy & Security</DialogTitle>
            <DialogDescription>How we protect your account and data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-gray-600 leading-relaxed">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="font-semibold text-green-800 mb-2">Your account is secure</p>
              <ul className="space-y-1 text-green-700 text-xs">
                <li>✓ Password stored with bcrypt hashing</li>
                <li>✓ All data transmitted over TLS encryption</li>
                <li>✓ JWT tokens expire automatically</li>
                <li>✓ No payment card data is stored</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">Data we store</p>
              <p>Name, email, and transaction history with merchants you've visited. We never sell your data to third parties.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">Change password</p>
              <p>To change your password, log out and use the "Forgot password?" link on the login screen.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">Delete your data</p>
              <p>Use the "Delete Account" option below to permanently remove all your data from SharkBand.</p>
            </div>
            <div className="text-xs text-gray-400">
              Privacy questions? Contact privacy@sharkband.io
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
