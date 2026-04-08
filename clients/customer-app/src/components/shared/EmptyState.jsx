import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-gray-300" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#0A1931] dark:text-white">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-2 max-w-xs">{description}</p>}
    </motion.div>
  );
}