import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Loader2, Radar, Hand, Send } from "lucide-react";
import { DecryptedContent } from "./DecryptedContent";

type HuntStatus = "SCANNING" | "DETECTED" | "CAPTURED" | "DECRYPTED";

export const HuntInterface = () => {
  const [status, setStatus] = useState<HuntStatus>("SCANNING");
  const [loading, setLoading] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{text: string, imageUrl?: string} | null>(null);
  const [comment, setComment] = useState("");

  // 1. 模拟扫描过程 -> 发现信号
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "SCANNING") {
      timer = setTimeout(() => setStatus("DETECTED"), 2500);
    }
    return () => clearTimeout(timer);
  }, [status]);

  // 2. 处理捕捉 (Pick Plane)
  const handleCatch = () => {
    setLoading(true);
    // TODO: 这里未来调用合约 pick_plane()
    setTimeout(() => {
      setLoading(false);
      setStatus("CAPTURED");
    }, 1500);
  };

  // 3. 处理解密 (Decrypt)
  const handleDecrypt = () => {
    setLoading(true);
    // TODO: 这里未来调用 Seal 解密
    setTimeout(() => {
      setDecryptedData({
        text: "I found this secret message in the depths of the ocean. It's beautiful here.",
        imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80"
      });
      setLoading(false);
      setStatus("DECRYPTED");
    }, 1500);
  };

  // 4. 处理评论并扔回
  const handleThrowBack = () => {
    setLoading(true);
    // TODO: 调用 add_comment 合约
    console.log("Adding comment:", comment);
    
    setTimeout(() => {
      setLoading(false);
      setComment("");
      setDecryptedData(null);
      setStatus("SCANNING"); // 重置流程
    }, 1500);
  };

  // --- 渲染不同状态 ---

  // 状态 A: 扫描中
  if (status === "SCANNING") {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} 
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 border-2 border-black rounded-full"
          />
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-black rounded-full border-t-transparent border-l-transparent"
          />
          <Radar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={24}/>
        </div>
        <p className="text-sm font-bold animate-pulse font-mono">SCANNING_NETWORK...</p>
      </div>
    );
  }

  // 状态 B: 发现信号 (等待捕捉)
  if (status === "DETECTED") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-green-50/30">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6"
        >
          <div className="flex flex-col items-center gap-2 text-green-700">
            <Radar size={48} className="animate-pulse" />
            <h3 className="font-bold text-lg">SIGNAL DETECTED</h3>
          </div>
          
          <div className="text-xs font-mono text-left bg-gray-100 p-4 border border-black space-y-2">
            <p>PROXIMITY: <span className="font-bold">NEAR</span></p>
            <p>TYPE: <span className="font-bold">UNKNOWN_PAYLOAD</span></p>
            <p>EST_SIZE: <span className="font-bold">24KB</span></p>
          </div>

          <button 
            onClick={handleCatch}
            disabled={loading}
            className="w-full bg-black text-white py-4 font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 size={18} className="animate-spin"/> : <Hand size={18} className="group-hover:-translate-y-1 transition-transform"/>}
            {loading ? "CATCHING..." : "CATCH PAPER PLANE"}
          </button>
        </motion.div>
      </div>
    );
  }

  // 状态 C & D: 已捕捉 (显示加密内容 或 解密内容)
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center bg-yellow-50/50">
      <motion.div 
        layout
        className="border-2 border-black p-6 w-full max-w-md bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all max-h-full overflow-y-auto"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
          <span className="font-bold flex items-center gap-2">
            {status === "DECRYPTED" ? <Unlock size={14} className="text-green-600"/> : <Lock size={14}/>} 
            {status === "DECRYPTED" ? "DECRYPTED_PAYLOAD" : "ENCRYPTED_BLOB"}
          </span>
          <span className="text-xs font-mono">ID: #8F3A</span>
        </div>

        {/* Content Area */}
        {status === "DECRYPTED" && decryptedData ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-left space-y-6"
          >
            <DecryptedContent 
              text={decryptedData.text}
              imageUrl={decryptedData.imageUrl}
              timestamp={Date.now()}
            />

            {/* 评论输入区域 */}
            <div className="border-t-2 border-black border-dashed pt-4">
              <label className="text-[10px] font-bold bg-black text-white px-2 py-1 mb-2 inline-block font-mono">
                APPEND_LOG (COMMENT)
              </label>
              <textarea 
                className="w-full h-24 border-2 border-black p-3 text-sm font-sans focus:outline-none focus:bg-gray-50 resize-none placeholder:text-gray-400"
                placeholder="Add your thoughts before throwing it back..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
               <button 
                 onClick={handleThrowBack}
                 disabled={loading || !comment.trim()}
                 className="bg-black text-white border-2 border-black px-4 py-3 text-xs font-bold hover:bg-gray-800 w-full active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {loading ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} />}
                 {loading ? "SEALING..." : "ADD LOG & THROW BACK"}
               </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="py-8 space-y-4">
              <div className="w-16 h-16 bg-gray-100 border-2 border-black mx-auto flex items-center justify-center">
                <Lock size={24} className="opacity-20"/>
              </div>
              <p className="font-serif italic text-gray-500">
                &quot;You have caught a paper plane. The content is sealed.&quot;
              </p>
            </div>
            
            <div className="flex gap-3 justify-center pt-4">
              <button 
                className="border-2 border-black px-4 py-2 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors flex-1"
                onClick={() => setStatus("SCANNING")} // 丢弃，重新扫描
              >
                DISCARD
              </button>
              <button 
                onClick={handleDecrypt}
                disabled={loading}
                className="bg-black text-white border-2 border-black px-4 py-2 text-xs font-bold hover:bg-gray-800 flex-1 flex justify-center items-center gap-2"
              >
                {loading && <Loader2 size={12} className="animate-spin"/>}
                {loading ? "DECRYPTING..." : "DECRYPT CONTENT"}
              </button>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
};
