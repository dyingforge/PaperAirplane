import React from "react";
import { ArrowRight, CornerDownRight, Wind } from "lucide-react";

export const HangarList = () => {
  const items = [
    { id: 1, content: "Hello World...", status: "RETURNED", comments: 3 },
    { id: 2, content: "Secret key is...", status: "DRIFTING", comments: 0 },
    { id: 3, content: "Walrus test...", status: "DRIFTING", comments: 1 },
  ];

  return (
    <div className="divide-y-2 divide-black">
      {items.map((item) => (
        <details key={item.id} className="group open:bg-gray-50 transition-colors cursor-pointer">
          <summary className="flex items-center justify-between p-6 list-none hover:bg-gray-100">
            <div className="flex items-center gap-4">
              <span className="font-bold">#{item.id.toString().padStart(2, '0')}</span>
              <span className="font-sans text-sm">{item.content}</span>
            </div>
            <div className="flex items-center gap-4">
               <span className={`text-[10px] font-bold px-2 py-1 border border-black ${
                 item.status === 'RETURNED' ? 'bg-black text-white' : 'bg-white'
               }`}>
                 {item.status}
               </span>
               <ArrowRight size={16} className="group-open:rotate-90 transition-transform duration-200" />
            </div>
          </summary>
          
          <div className="p-6 pt-0 border-t-2 border-black border-dashed mx-6 mt-2">
            <div className="pt-4 space-y-4">
              {item.status === 'RETURNED' ? (
                <>
                  <p className="text-sm font-sans">
                    "This is the full decrypted content of the paper plane. It has traveled across 3 nodes."
                  </p>
                  <div className="bg-gray-200 p-4 text-xs font-mono border-l-2 border-black">
                    <div className="flex items-center gap-2 mb-2 font-bold"><CornerDownRight size={12}/> COMMENT_THREAD</div>
                    <div className="space-y-2">
                      <p>[Node_A]: Keep building!</p>
                      <p>[Node_B]: WAGMI.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Wind size={14} />
                  This plane is still drifting. Wait for it to return to decrypt comments.
                </div>
              )}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
};

