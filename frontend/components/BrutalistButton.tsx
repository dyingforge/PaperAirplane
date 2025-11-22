import React from "react";
import { motion } from "framer-motion";

interface BrutalistButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const BrutalistButton = ({ children, icon, onClick }: BrutalistButtonProps) => (
  <motion.button
    whileHover={{ y: -2, x: -2, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
    whileTap={{ y: 0, x: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
    onClick={onClick}
    className="bg-white border-2 border-black px-6 py-3 font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] transition-none"
  >
    {children}
    {icon}
  </motion.button>
);

