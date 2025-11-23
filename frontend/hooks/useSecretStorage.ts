import { useState } from 'react';
import { useSignPersonalMessage, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { sealClient } from '@/utils/seal';
import { uploadBlob } from '@/utils/walrus/uploadHTTP';
import { downloadBlob } from '@/utils/walrus/downloadHTTP';
import { suiClient, networkConfig } from '@/contracts';
import { EncryptedObject } from '@mysten/seal';

export interface SecretContent {
    text: string;
    mediaUrl?: string;
    mimeType?: string;
    timestamp: number;
}

export const useSecretStorage = () => {
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const [isProcessing, setIsProcessing] = useState(false);

    // --- 核心功能 1: 加密并上传 ---
    // 采用 DemoDock 模式：Seal 直接加密 -> 存 Walrus -> 链上只存 BlobID
    const encryptAndUpload = async (content: SecretContent, file?: File): Promise<string> => {
        setIsProcessing(true);
        try {
            if (!networkConfig.testnet.variables.Package) throw new Error("Network config missing");

            let finalContent = { ...content };
            
            if (file) {
                const buffer = await file.arrayBuffer(); 
                const base64 = Buffer.from(buffer).toString('base64');
                finalContent.mediaUrl = base64;
                finalContent.mimeType = file.type;
            }

            const payloadString = JSON.stringify(finalContent);
            const payloadBytes = new TextEncoder().encode(payloadString);


            const { encryptedObject } = await sealClient.encrypt({
                threshold: 2,
                packageId: networkConfig.testnet.variables.Package,
                id: networkConfig.testnet.variables.Package,
                data: payloadBytes,
            });

            const blob = new Blob([encryptedObject]);
            const blobId = await uploadBlob(blob);
            
            console.log("Secret uploaded to Walrus. Blob ID:", blobId);
            return blobId;

        } finally {
            setIsProcessing(false);
        }
    };

    // --- 核心功能 2: 下载并解密 ---
    const downloadAndDecrypt = async (
        blobId: string, 
        airplaneId: string // 用于链上鉴权
    ): Promise<SecretContent> => {
        if (!currentAccount) throw new Error("Wallet not connected");
        setIsProcessing(true);
        
        try {
            const encryptedBytes = await downloadBlob(blobId);
            console.log("encryptedBytes", encryptedBytes);
            const tx = new Transaction();
            tx.moveCall({
                target: `${networkConfig.testnet.variables.Package}::paper_plane::seal_approve`,
                arguments: [
                    tx.pure.vector('u8', fromHex(networkConfig.testnet.variables.Package)),
                    tx.object(networkConfig.testnet.variables.Airport),
                    tx.object(airplaneId),
                    tx.object.clock(),
                ],
            });
            const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
             const sessionKey = await (async () => {
                const sk = await import("@mysten/seal").then(m => m.SessionKey.create({
                   address: currentAccount.address,
                   packageId: networkConfig.testnet.variables.Package,
                   ttlMin: 30, 
                   suiClient
                }));
                const msg = sk.getPersonalMessage();
                const { signature } = await signPersonalMessage({ message: msg });
                sk.setPersonalMessageSignature(signature);
                return sk;
            })();
            console.log("sessionKey", sessionKey);
            const decryptedBytes = await sealClient.decrypt({
                data: encryptedBytes,
                sessionKey,
                txBytes
            });

            const decryptedString = new TextDecoder().decode(decryptedBytes);
            return JSON.parse(decryptedString) as SecretContent;

        } finally {
            setIsProcessing(false);
        }
    };

    return {
        encryptAndUpload,
        downloadAndDecrypt,
        isProcessing
    };
};
