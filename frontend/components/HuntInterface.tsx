import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export const HuntInterface = () => {
  const [found, setFound] = useState(false);

  // 模拟扫描
  useEffect(() => {
    const timer = setTimeout(() => setFound(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!found) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-2 border-black rounded-full border-t-transparent"
        />
        <p className="text-sm font-bold animate-pulse">SCANNING_NETWORK...</p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center bg-yellow-50/50">
      <div className="border-2 border-black p-6 w-full max-w-md bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
          <span className="font-bold flex items-center gap-2"><Lock size={14}/> ENCRYPTED_BLOB</span>
          <span className="text-xs">ID: #8F3A</span>
        </div>
        <p className="font-serif italic text-gray-500 py-8">
          "Content is sealed. Decrypt locally to read and append your thoughts."
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <button className="border-2 border-black px-4 py-2 text-xs font-bold hover:bg-gray-100">IGNORE</button>
          <button className="bg-black text-white border-2 border-black px-4 py-2 text-xs font-bold hover:bg-gray-800">DECRYPT</button>
        </div>
      </div>
    </div>
  );
};

