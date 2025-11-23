import React, { useState, useEffect } from "react";
import { ArrowRight, CornerDownRight, Paperclip, Clock, Lock, RefreshCw, Send, Loader2 } from "lucide-react";
import { DecryptedContent } from "./DecryptedContent";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getPickedAirplanes, getUserAirplanes, getAirplaneInfo } from "@/contracts/query";
import { useSecretStorage } from "@/hooks/useSecretStorage";
import { addComment } from "@/contracts/call";
import { networkConfig } from "@/contracts/index";

// 飞机数据类型
interface PlaneItem {
  address: string;
  name?: string;
  contentBlob?: string;
  status: "RETURNED" | "DRIFTING";
  returnTime?: number;
  commentBlobIds?: string[]; // 评论的 blobId 数组
}

// 解密后的评论类型
interface DecryptedComment {
  text: string;
  timestamp: number;
}

export const HangarList = () => {
  const currentAccount = useCurrentAccount();
  const [pickedPlanes, setPickedPlanes] = useState<PlaneItem[]>([]);
  const [ownedPlanes, setOwnedPlanes] = useState<PlaneItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"picked" | "owned">("picked");

  // 加载数据
  const loadPlanes = async () => {
    if (!currentAccount?.address) return;
    
    setLoading(true);
    try {
      // 获取已捡到的飞机
      const pickedAddresses = await getPickedAirplanes(currentAccount.address);
      const pickedItems: PlaneItem[] = await Promise.all(
        pickedAddresses.map(async (addr) => {
          const info = await getAirplaneInfo(addr);
          if (info) {
            // 判断是否返回：检查当前时间是否超过返回时间
            const currentTime = Date.now();
            const returnTime = info.startTime + info.flyLastingTime;
            const isReturned = currentTime >= returnTime;
            
            return {
              address: addr,
              name: info.name,
              contentBlob: info.contentBlob,
              status: isReturned ? "RETURNED" : "DRIFTING",
              returnTime: isReturned ? undefined : returnTime,
              commentBlobIds: info.commentBlobIds,
            };
          }
          return {
            address: addr,
            status: "DRIFTING" as const,
            name: `Plane ${addr.slice(0, 8)}...`
          };
        })
      );
      setPickedPlanes(pickedItems);

      // 获取用户拥有的飞机
      const ownedAddresses = await getUserAirplanes(currentAccount.address);
      const ownedItems: PlaneItem[] = await Promise.all(
        ownedAddresses.map(async (addr) => {
          const info = await getAirplaneInfo(addr);
          if (info) {
            // 判断是否返回
            const currentTime = Date.now();
            const returnTime = info.startTime + info.flyLastingTime;
            const isReturned = currentTime >= returnTime;
            
            return {
              address: addr,
              name: info.name,
              contentBlob: info.contentBlob,
              status: isReturned ? "RETURNED" : "DRIFTING",
              returnTime: isReturned ? undefined : returnTime,
              commentBlobIds: info.commentBlobIds,
            };
          }
          return {
            address: addr,
            status: "DRIFTING" as const,
            name: `My Plane ${addr.slice(0, 8)}...`
          };
        })
      );
      setOwnedPlanes(ownedItems);
    } catch (e) {
      console.error("Failed to load planes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanes();
  }, [currentAccount?.address]);

  const items = activeTab === "picked" ? pickedPlanes : ownedPlanes;

  return (
    <div className="h-full flex flex-col">
      {/* Tab 切换 */}
      <div className="grid grid-cols-2 border-b-2 border-black divide-x-2 divide-black">
        <button
          onClick={() => setActiveTab("picked")}
          className={`p-4 font-bold text-sm transition-colors ${
            activeTab === "picked" 
              ? "bg-black text-white" 
              : "bg-white hover:bg-gray-50"
          }`}
        >
          PICKED ({pickedPlanes.length})
        </button>
        <button
          onClick={() => setActiveTab("owned")}
          className={`p-4 font-bold text-sm transition-colors ${
            activeTab === "owned" 
              ? "bg-black text-white" 
              : "bg-white hover:bg-gray-50"
          }`}
        >
          OWNED ({ownedPlanes.length})
        </button>
      </div>

      {/* 刷新按钮 */}
      <div className="p-4 border-b border-black flex justify-between items-center">
        <span className="text-xs font-mono opacity-60">
          {activeTab === "picked" ? "Planes you caught" : "Planes you created"}
        </span>
        <button
          onClick={loadPlanes}
          disabled={loading}
          className="p-2 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* 列表内容 */}
      <div className="flex-1 overflow-y-auto divide-y-2 divide-black">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No planes found. {activeTab === "picked" ? "Go hunt some!" : "Create your first plane!"}
          </div>
        ) : (
          items.map((item) => (
            <PlaneRow key={item.address} item={item} isPicked={activeTab === "picked"} />
          ))
        )}
      </div>
    </div>
  );
};

// 单独抽离组件以处理倒计时逻辑和解密
const PlaneRow = ({ item, isPicked }: { item: PlaneItem; isPicked: boolean; onCommentAdded?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [decryptedData, setDecryptedData] = useState<{text: string, imageUrl?: string} | null>(null);
  const [decryptedComments, setDecryptedComments] = useState<DecryptedComment[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDecryptingComments, setIsDecryptingComments] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const currentAccount = useCurrentAccount();
  const { downloadAndDecrypt, encryptAndUpload } = useSecretStorage();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (item.status === "DRIFTING" && item.returnTime) {
      const calculateTime = () => {
        const diff = item.returnTime! - Date.now();
        if (diff <= 0) {
          setTimeLeft("RETURNING...");
        } else {
          const mins = Math.floor((diff / 1000 / 60) % 60);
          const secs = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${mins}m ${secs}s`);
        }
      };
      
      calculateTime();
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [item.status, item.returnTime]);

  const handleDecrypt = async () => {
    if (!item.contentBlob || !currentAccount?.address) return;
    setIsDecrypting(true);
    try {
      const content = await downloadAndDecrypt(item.contentBlob, item.address);
      setDecryptedData({
        text: content.text,
        imageUrl: content.mediaUrl ? `data:${content.mimeType || 'image/png'};base64,${content.mediaUrl}` : undefined
      });
      
      // 如果内容解密成功，且可以查看评论（RETURNED 状态或 PICKED），自动解密评论
      if ((item.status === "RETURNED" || isPicked) && item.commentBlobIds && item.commentBlobIds.length > 0) {
        handleDecryptComments();
      }
    } catch (e) {
      console.error("Decrypt failed:", e);
      alert("Decryption failed");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDecryptComments = async () => {
    if (!item.commentBlobIds || item.commentBlobIds.length === 0 || !currentAccount?.address) return;
    setIsDecryptingComments(true);
    try {
      // 并行解密所有评论，失败时返回 null
      const decryptedResults = await Promise.all(
        item.commentBlobIds.map(async (blobId) => {
          try {
            const content = await downloadAndDecrypt(blobId, item.address);
            return {
              text: content.text,
              timestamp: content.timestamp || Date.now(),
            };
          } catch (e) {
            console.error(`Failed to decrypt comment ${blobId}:`, e);
            return null; // 返回 null 而不是失败消息
          }
        })
      );
      // 过滤掉 null 值，只保留成功解密的评论
      const decrypted = decryptedResults.filter((comment): comment is DecryptedComment => comment !== null);
      setDecryptedComments(decrypted);
    } catch (e) {
      console.error("Failed to decrypt comments:", e);
    } finally {
      setIsDecryptingComments(false);
    }
  };

  // 处理添加评论（仅 PICKED 的飞机）
  const handleAddComment = async () => {
    if (!isPicked || !comment.trim() || !currentAccount?.address) return;
    setIsSubmittingComment(true);
    
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
      const tx = await addComment(airportId, item.address, commentBlobId);
      
      signAndExecute(
        { transaction: tx as any },
        {
          onSuccess: () => {
            alert("Comment added successfully!");
            setComment("");
            // 重新加载数据以获取新的评论
            // 这里可以触发父组件的 reload，或者直接刷新当前飞机的信息
            window.location.reload(); // 简单粗暴的方式，或者可以优化为只刷新当前项
          },
          onError: (err) => {
            console.error(err);
            alert("Failed to add comment.");
          }
        }
      );
    } catch (e) {
      console.error(e);
      alert("Error encrypting comment or preparing transaction");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <details className="group open:bg-gray-50 transition-colors cursor-pointer">
      <summary className="flex items-center justify-between p-6 list-none hover:bg-gray-100 relative overflow-hidden">
        {/* 背景进度条动画 (仅 Drifting) */}
        {item.status === "DRIFTING" && (
           <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
             <div className="h-full bg-black/20 animate-pulse w-1/2"></div>
           </div>
        )}

        <div className="flex items-center gap-4 relative z-10">
          <span className="font-bold font-mono text-xs">
            {item.address.slice(0, 6)}...{item.address.slice(-4)}
          </span>
          <span className="font-sans text-sm flex items-center gap-2">
            {item.status === "RETURNED" || isPicked ? (item.name || "Decrypted") : "En route..."}
            {item.contentBlob && (item.status === "RETURNED" || isPicked) && <Paperclip size={12} className="opacity-50"/>}
          </span>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           {item.status === "DRIFTING" ? (
             <span className="text-xs font-mono flex items-center gap-2 text-gray-500">
               <Clock size={12} />
               {timeLeft || "CALCULATING"}
             </span>
           ) : (
             <span className="text-[10px] font-bold px-2 py-1 border border-black bg-black text-white">
               RETURNED
             </span>
           )}
           <ArrowRight size={16} className="group-open:rotate-90 transition-transform duration-200" />
        </div>
      </summary>
      
      <div className="p-6 pt-0 border-t-2 border-black border-dashed mx-6 mt-2">
        <div className="pt-4 space-y-4">
          {/* PICKED 的飞机：无论状态如何都可以解密（因为用户已经捡到了） */}
          {/* OWNED 的飞机：只有 RETURNED 状态才能解密 */}
          {isPicked || item.status === "RETURNED" ? (
            // === 可以解密的状态 ===
            <>
              {decryptedData ? (
                <>
                  <DecryptedContent 
                    text={decryptedData.text}
                    imageUrl={decryptedData.imageUrl}
                    timestamp={Date.now()}
                  />
                  {item.commentBlobIds && item.commentBlobIds.length > 0 && (
                    <div className="bg-gray-200 p-4 text-xs font-mono border-l-2 border-black mt-4">
                      <div className="flex items-center gap-2 mb-2 font-bold">
                        <CornerDownRight size={12}/> 
                        COMMENT_THREAD ({item.commentBlobIds.length})
                        {isDecryptingComments && <span className="text-xs opacity-60">(Decrypting...)</span>}
                      </div>
                      {decryptedComments.length > 0 ? (
                        <div className="space-y-2">
                          {decryptedComments.map((comment, i) => (
                            <div key={i} className="border-b border-gray-300 pb-2 last:border-0">
                              <p className="font-sans text-sm">{comment.text}</p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {new Date(comment.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : !isDecryptingComments ? (
                        <button
                          onClick={handleDecryptComments}
                          className="text-xs underline hover:no-underline text-blue-600"
                        >
                          Decrypt Comments
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* 评论输入区域（仅 PICKED 的飞机） */}
                  {isPicked && (
                    <div className="border-t-2 border-black border-dashed pt-4 mt-4">
                      <label className="text-[10px] font-bold bg-black text-white px-2 py-1 mb-2 inline-block font-mono">
                        APPEND_LOG (COMMENT)
                      </label>
                      <textarea 
                        className="w-full h-24 border-2 border-black p-3 text-sm font-sans focus:outline-none focus:bg-gray-50 resize-none placeholder:text-gray-400"
                        placeholder="Add your thoughts before throwing it back..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmittingComment}
                      />
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={handleAddComment}
                          disabled={isSubmittingComment || !comment.trim()}
                          className="bg-black text-white border-2 border-black px-4 py-2 text-xs font-bold hover:bg-gray-800 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} />}
                          {isSubmittingComment ? "SEALING..." : "ADD LOG & THROW BACK"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : item.contentBlob ? (
                <button
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="w-full bg-black text-white border-2 border-black px-4 py-2 text-xs font-bold hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDecrypting ? "DECRYPTING..." : "DECRYPT CONTENT"}
                </button>
              ) : (
                <p className="text-sm text-gray-500">Content not available</p>
              )}
            </>
          ) : (
            // === 漂流中状态（仅 OWNED）：显示锁定信息 ===
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400 select-none">
              <Lock size={32} />
              <div className="text-center space-y-1">
                <p className="font-bold text-xs tracking-widest text-black">CONTENT SEALED</p>
                <p className="text-xs font-serif italic">
                  This plane is currently being handled by other nodes.
                  <br/>
                  Wait for it to return to decrypt comments and view the journey log.
                </p>
              </div>
              
              {/* 模糊的伪内容，增加视觉效果 */}
              <div className="w-full max-w-sm mt-4 space-y-2 opacity-30 blur-[2px]">
                <div className="h-4 bg-black w-3/4 mx-auto rounded"></div>
                <div className="h-4 bg-black w-1/2 mx-auto rounded"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
};
