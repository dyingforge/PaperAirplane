import React from "react";
import { Send } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

interface NavbarProps {
  // 保持接口兼容，但实际上这些 props 不再需要了
  wallet?: boolean;
  setWallet?: (connected: boolean) => void;
}

export const Navbar = ({ }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm border-b-2 border-black px-6 py-3 z-50 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:rotate-12 transition-transform">
          <Send size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-black tracking-tighter text-xl leading-none font-mono">PAPER_PLANE.EXE</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Decentralized_Messaging</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
         <div className="hidden md:flex items-center gap-2 text-xs font-bold font-mono bg-gray-100 px-3 py-1 border border-black rounded-full">
            <span className="w-2 h-2 bg-green-500 border border-black rounded-full animate-pulse"></span>
            WALRUS_NET_LIVE
         </div>
         
         {/* 使用 dApp Kit 的 ConnectButton */}
         {/* 我们可以通过全局 CSS 或 className 稍微定制它，但默认样式也不错 */}
         <div className="font-mono [&_button]:!font-mono [&_button]:!font-bold [&_button]:!rounded-none [&_button]:!border-2 [&_button]:!border-black [&_button]:!bg-white [&_button]:!text-black [&_button]:!shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:[&_button]:!translate-x-[-2px] hover:[&_button]:!translate-y-[-2px] active:[&_button]:!translate-x-[0px] active:[&_button]:!translate-y-[0px] active:[&_button]:!shadow-none">
            <ConnectButton />
         </div>
      </div>
    </nav>
  );
};
