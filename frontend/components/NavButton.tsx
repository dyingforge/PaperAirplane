import React from "react";

interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export const NavButton = ({ label, icon, active, onClick }: NavButtonProps) => (
  <button 
    onClick={onClick}
    className={`
      h-14 flex items-center justify-center gap-3 text-sm font-bold transition-all
      hover:bg-black hover:text-white
      ${active ? 'bg-black text-white' : 'bg-white text-black'}
    `}
  >
    {icon}
    {label}
  </button>
);

