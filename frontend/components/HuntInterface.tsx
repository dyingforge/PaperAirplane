import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Loader2, Radar, Hand, Send } from "lucide-react";
import { DecryptedContent } from "./DecryptedContent";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { pickPlane, addComment } from "@/contracts/call";
import { networkConfig } from "@/contracts/index";
import { getAirplaneInfo, getPickedAirplaneByHash } from "@/contracts/query";
import { useSecretStorage } from "@/hooks/useSecretStorage";

type HuntStatus = "SCANNING" | "DETECTED" | "CAPTURED" | "DECRYPTED";

export const HuntInterface = () => {
  const [status, setStatus] = useState<HuntStatus>("SCANNING");
  const [loading, setLoading] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{text: string, imageUrl?: string} | null>(null);
  const [comment, setComment] = useState("");
  const [currentAirplane, setCurrentAirplane] = useState<{id: string, blobId: string} | null>(null);

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { downloadAndDecrypt, encryptAndUpload } = useSecretStorage();

  // 1. 模拟扫描过程 -> 发现信号
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "SCANNING") {
      // 模拟随机扫描时间 2-5秒
      const delay = Math.floor(Math.random() * 3000) + 2000;
      timer = setTimeout(() => setStatus("DETECTED"), delay);
    }
    return () => clearTimeout(timer);
  }, [status]);

  // 2. 处理捕捉 (Pick Plane)
  const handleCatch = async () => {
    if (!currentAccount) {
      alert("Connect wallet first");
      return;
    }
    setLoading(true);

    try {
      const airportId = networkConfig.testnet.variables.Airport;
      // 为了演示，这里简化参数 (clock, random 需要是对象 ID 0x6, 0x8)
      const tx = await pickPlane(airportId, "0x6", "0x8");

      signAndExecute(
        { transaction: tx as any },
        {
          onSuccess: async (result) => {
            console.log("Pick success, Digest:", result.digest);
            
            try {
                // 使用 waitForTransaction 等待交易完成并获取事件
                const airplaneId = await getPickedAirplaneByHash(result.digest);
                
                if (airplaneId) {
                    console.log("Caught Airplane ID:", airplaneId);
                    
                    // 获取 Blob ID - 注意：airplaneId 是 ID，但 getAirplaneInfo 需要 address
                    // 在 Sui 中，ID 和 address 通常是相同的格式，可以直接使用
                    const info = await getAirplaneInfo(airplaneId);
                    if (info && info.contentBlob) {
                        setCurrentAirplane({ id: airplaneId, blobId: info.contentBlob });
                        setStatus("CAPTURED");
                    } else {
                        console.warn("Failed to fetch airplane info");
                        alert("Caught plane but failed to fetch details.");
                        setStatus("SCANNING");
                    }
                } else {
                    console.warn("No PickedAirplaneEvent found in transaction");
                    alert("Picked successfully but could not verify ID. Check Hangar.");
                    setStatus("SCANNING");
                }
            } catch (e) {
                console.error("Failed to fetch info:", e);
                alert("Caught plane but failed to fetch details.");
                setStatus("SCANNING");
            }
            setLoading(false);
          },
          onError: (err) => {
            console.error("Pick failed:", err);
            setLoading(false);
            // 如果是因为冷却时间或没有飞机
            alert("Failed to catch plane. Maybe try again later?");
            setStatus("SCANNING");
          }
        }
      );
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // 3. 处理解密 (Decrypt)
  const handleDecrypt = async () => {
    if (!currentAirplane) return;
    setLoading(true);
    
    try {
        const content = await downloadAndDecrypt(currentAirplane.blobId, currentAirplane.id);
        setDecryptedData({
            text: content.text,
            imageUrl: content.mediaUrl ? `data:${content.mimeType || 'image/png'};base64,${content.mediaUrl}` : undefined
        });
        setStatus("DECRYPTED");
    } catch (e) {
        console.error("Decrypt failed:", e);
        alert("Decryption failed. You might not have access yet.");
    } finally {
        setLoading(false);
    }
  };

  // 4. 处理评论并扔回
  const handleThrowBack = async () => {
    if (!currentAirplane || !comment.trim()) return;
    setLoading(true);
    
    try {
        // 1. 先加密评论并上传到 Walrus
        const commentContent = {
            text: comment,
            timestamp: Date.now()
        };
        const commentBlobId = await encryptAndUpload(commentContent);
        console.log("Comment encrypted and uploaded. Blob ID:", commentBlobId);
        
        // 2. 使用 blobId 调用合约
        const airportId = networkConfig.testnet.variables.Airport;
        const tx = await addComment(airportId, currentAirplane.id, commentBlobId);
        signAndExecute(
            { transaction: tx as any },
            {
                onSuccess: () => {
                    alert("Comment added! Plane released.");
                    setComment("");
                    setDecryptedData(null);
                    setCurrentAirplane(null);
                    setStatus("SCANNING");
                },
                onError: (err) => {
                    console.error(err);
                    alert("Failed to add comment.");
                }
            }
        )
    } catch (e) {
        console.error(e);
        alert("Error encrypting comment or preparing transaction");
    } finally {
        setLoading(false);
    }
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
            <p>EST_SIZE: <span className="font-bold">--</span></p>
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
          <span className="text-xs font-mono">
            ID: {currentAirplane ? `#${currentAirplane.id.slice(0,6)}...` : 'UNKNOWN'}
          </span>
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
