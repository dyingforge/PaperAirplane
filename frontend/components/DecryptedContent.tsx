import React from "react";
import { Image as ImageIcon } from "lucide-react";

interface DecryptedContentProps {
  text: string;
  imageUrl?: string | null;
  timestamp?: number;
}

export const DecryptedContent: React.FC<DecryptedContentProps> = ({ text, imageUrl, timestamp }) => {
  return (
    <div className="space-y-4 w-full">
      {/* 文本部分 */}
      <div className="font-serif text-lg leading-relaxed text-gray-800">
        &ldquo;{text}&rdquo;
      </div>
      
      {/* 图片部分 */}
      {imageUrl && (
        <div className="relative group border-2 border-black p-2 bg-white rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="absolute -top-3 -left-3 bg-black text-white text-[10px] px-2 py-1 font-mono uppercase z-10">
            Attachment_01
          </div>
          <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt="Decrypted attachment" 
              className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
          <div className="mt-2 flex justify-between items-center text-[10px] text-gray-500 font-mono border-t border-dashed border-gray-300 pt-1">
            <span className="flex items-center gap-1"><ImageIcon size={10}/> IMG_RAW</span>
            <span>{timestamp ? new Date(timestamp).toLocaleDateString() : 'UNKNOWN_DATE'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

