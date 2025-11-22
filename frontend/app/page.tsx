"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Archive, 
  Radio
} from "lucide-react";
import { NavButton } from "@/components/NavButton";
import { BrutalistButton } from "@/components/BrutalistButton";
import { HuntInterface } from "@/components/HuntInterface";
import { HangarList } from "@/components/HangarList";
import { Navbar } from "@/components/Navbar";

export default function WireframePaperPlane() {
  // 状态: 'throw' | 'hunt' | 'hangar'
  const [mode, setMode] = useState("throw");
  const [wallet, setWallet] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-mono selection:bg-black selection:text-white flex items-center justify-center p-4 pt-24">
      
      <Navbar wallet={wallet} setWallet={setWallet} />

      {/* 装饰背景线 */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* 主容器 - 类似于一张工程图纸或复古终端 */}
      <div className="w-full max-w-3xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
        
        {/* 2. 导航 Tabs - 极简线条分割 */}
        <nav className="grid grid-cols-3 border-b-2 border-black divide-x-2 divide-black">
          <NavButton 
            label="THROW" 
            icon={<Send size={18} />} 
            active={mode === 'throw'} 
            onClick={() => setMode('throw')} 
          />
          <NavButton 
            label="HUNT" 
            icon={<Radio size={18} />} 
            active={mode === 'hunt'} 
            onClick={() => setMode('hunt')} 
          />
          <NavButton 
            label="HANGAR" 
            icon={<Archive size={18} />} 
            active={mode === 'hangar'} 
            onClick={() => setMode('hangar')} 
          />
        </nav>

        {/* 3. 内容区域 */}
        <div className="h-[500px] relative overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            
            {/* --- THROW MODE --- */}
            {mode === 'throw' && (
              <motion.div 
                key="throw"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col p-8"
              >
                <div className="flex-1 relative">
                  <label className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold border border-black">
                    ENCRYPTED_PAYLOAD
                  </label>
                  <textarea 
                    className="w-full h-full border-2 border-black p-6 resize-none focus:outline-none focus:bg-gray-50 font-sans text-lg leading-relaxed placeholder:text-gray-300"
                    placeholder="Type your message here. It will be sealed and thrown into the decentralized ocean..."
                  />
                </div>
                <div className="h-20 flex items-end justify-between mt-6">
                  <div className="text-xs space-y-1 opacity-60">
                    <p>ENCRYPTION: SEAL_PROTOCOL_V2</p>
                    <p>STORAGE: WALRUS_BLOB</p>
                  </div>
                  <BrutalistButton icon={<Send size={18} />}>
                    LAUNCH PLANE
                  </BrutalistButton>
                </div>
              </motion.div>
            )}

            {/* --- HUNT MODE --- */}
            {mode === 'hunt' && (
              <motion.div 
                key="hunt"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <HuntInterface />
              </motion.div>
            )}

            {/* --- HANGAR MODE --- */}
            {mode === 'hangar' && (
              <motion.div 
                key="hangar"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full overflow-y-auto p-0"
              >
                <HangarList />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* 4. 底部信息条 */}
        <footer className="border-t-2 border-black p-2 bg-gray-100 text-[10px] flex justify-between items-center uppercase">
          <span>System Ready</span>
          <span className="animate-pulse">Waiting for input_</span>
        </footer>

      </div>
    </div>
  );
}
