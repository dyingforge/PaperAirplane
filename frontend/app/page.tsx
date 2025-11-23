"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Archive, 
  Radio,
  Paperclip,
  X
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

  // Throw mode states
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

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
                className="h-full flex flex-col p-6 gap-4"
              >
                {/* 文本输入区域 */}
                <div className="flex-1 relative border-2 border-black group focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-shadow">
                  <label className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold border border-black group-focus-within:bg-black group-focus-within:text-white transition-colors">
                    TEXT_PAYLOAD
                  </label>
                  <textarea 
                    className="w-full h-full p-6 resize-none focus:outline-none font-sans text-lg leading-relaxed placeholder:text-gray-300 bg-transparent"
                    placeholder="Type your message here. It will be sealed and thrown into the decentralized ocean..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* 图片上传区域 */}
                <div className="h-32 relative border-2 border-black border-dashed hover:bg-gray-50 transition-colors flex items-center justify-center overflow-hidden shrink-0">
                  <label className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold border border-black z-10">
                    ATTACHMENT (OPTIONAL)
                  </label>
                  
                  {previewUrl ? (
                    <div className="relative w-full h-full group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100" 
                      />
                      <button 
                        onClick={clearFile}
                        className="absolute top-2 right-2 bg-white border border-black p-1 hover:bg-black hover:text-white transition-colors shadow-sm"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-2 right-2 bg-black text-white text-[10px] px-2 py-1 font-mono">
                        {(file!.size / 1024).toFixed(1)}KB
                      </div>
                    </div>
                  ) : (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      />
                      <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none">
                        <Paperclip size={24} strokeWidth={1.5} />
                        <span className="text-xs font-mono uppercase tracking-widest">Drop Image or Click</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 底部操作栏 */}
                <div className="h-14 flex items-center justify-between mt-2 shrink-0">
                  <div className="text-xs space-y-1 opacity-60 font-mono">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      ENCRYPTION: SEAL_V2
                    </p>
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
