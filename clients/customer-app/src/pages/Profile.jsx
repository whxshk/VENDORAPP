import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { LogOut, HelpCircle, Bell, ChevronRight, Star, Trash2, Shield, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
    },
    enabled: !!user,
  });

  const totalPoints = memberships.reduce((sum, a) => sum + (a.points_balance || 0), 0);
  const totalVisits = memberships.reduce((sum, a) => sum + (a.total_visits || 0), 0);

  const menuItems = [
    { icon: Bell, label: "Notifications", description: "Manage your alerts" },
    { icon: HelpCircle, label: "Help & Support", description: "Get assistance" },
    { icon: Shield, label: "Privacy & Security", description: "Account protection" },
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
              <p className="text-[11px] text-gray-400 mt-1">Total Points</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-[#0A1931]">{memberships.length}</p>
              <p className="text-[11px] text-gray-400 mt-1">Cards</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-[#0A1931]">{totalVisits}</p>
              <p className="text-[11px] text-gray-400 mt-1">Visits</p>
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

      <div className="px-6 mt-8">
        <Button
          variant="ghost"
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      <div className="px-6 mt-3 mb-8">
        <AlertDialog>
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
                be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
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
    </div>
  );
}
