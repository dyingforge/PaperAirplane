import React from "react";
import { motion } from "framer-motion";

interface BrutalistButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const BrutalistButton = ({ children, icon, onClick, disabled }: BrutalistButtonProps) => (
  <motion.button
    whileHover={disabled ? {} : { y: -2, x: -2, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
    whileTap={disabled ? {} : { y: 0, x: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
    onClick={onClick}
    disabled={disabled}
    className={`
      border-2 border-black px-6 py-3 font-bold flex items-center gap-2 
      transition-none
      ${disabled 
        ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none opacity-50' 
        : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px]'
      }
    `}
  >
    {children}
    {icon}
  </motion.button>
);
