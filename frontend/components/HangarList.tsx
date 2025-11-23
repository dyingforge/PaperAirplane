import React from "react";
import { ArrowRight, CornerDownRight, Wind, Paperclip } from "lucide-react";
import { DecryptedContent } from "./DecryptedContent";

export const HangarList = () => {
  const items = [
    { 
      id: 1, 
      summary: "Mission Report...", 
      fullContent: "This is the full decrypted mission report. The objective was successfully completed in the delta quadrant.",
      imageUrl: "https://images.unsplash.com/photo-1542466500-dccb2789cbbb?w=800&q=80",
      timestamp: 1715420000000,
      status: "RETURNED", 
      comments: 3 
    },
    { 
      id: 2, 
      summary: "Secret key fragment...", 
      fullContent: "",
      imageUrl: null,
      status: "DRIFTING", 
      comments: 0 
    },
    { 
      id: 3, 
      summary: "Walrus coordinates...", 
      fullContent: "The coordinates for the Walrus blob are: 0x82...1a",
      imageUrl: null,
      timestamp: 1715410000000,
      status: "RETURNED", 
      comments: 1 
    },
  ];

  return (
    <div className="divide-y-2 divide-black">
      {items.map((item) => (
        <details key={item.id} className="group open:bg-gray-50 transition-colors cursor-pointer">
          <summary className="flex items-center justify-between p-6 list-none hover:bg-gray-100">
            <div className="flex items-center gap-4">
              <span className="font-bold">#{item.id.toString().padStart(2, '0')}</span>
              <span className="font-sans text-sm flex items-center gap-2">
                {item.summary}
                {item.imageUrl && <Paperclip size={12} className="opacity-50"/>}
              </span>
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
                  <DecryptedContent 
                    text={item.fullContent}
                    imageUrl={item.imageUrl}
                    timestamp={item.timestamp}
                  />

                  <div className="bg-gray-200 p-4 text-xs font-mono border-l-2 border-black mt-4">
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
                  This plane is still drifting. Wait for it to return to decrypt contents.
                </div>
              )}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
};
