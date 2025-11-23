import { SealClient, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import {suiClient, networkConfig} from "@/contracts/index";

const SERVER_OBJECT_IDS = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", 
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
    "0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2"
];

export const sealClient = new SealClient({
    suiClient,
    serverConfigs: SERVER_OBJECT_IDS.map((id) => ({
        objectId: id,
        weight: 1,
    })),
    verifyKeyServers: false,
});

let cachedSessionKey: SessionKey | null = null;
let sessionKeyExpiry: number = 0;
let sessionKeyOwner: string = '';

async function getOrCreateSessionKey(
    currentAddress: string, 
    signMessage: (args: { message: Uint8Array }) => Promise<{ signature: string }>
): Promise<SessionKey> {
    const now = Date.now();
    
    if (cachedSessionKey && 
        now < sessionKeyExpiry - 60000 && 
        sessionKeyOwner === currentAddress
    ) {
        return cachedSessionKey;
    }

    // Create new
    const ttlMin = 30; // Cache for 30 mins
    const sessionKey = await SessionKey.create({
        address: currentAddress,
        packageId: networkConfig.testnet.variables.Package || "",
        ttlMin, 
        suiClient,
    });

    // Sign
    const message = sessionKey.getPersonalMessage();
    const { signature } = await signMessage({ message });
    sessionKey.setPersonalMessageSignature(signature);

    // Update cache
    cachedSessionKey = sessionKey;
    sessionKeyExpiry = now + (ttlMin * 60 * 1000);
    sessionKeyOwner = currentAddress;

    return sessionKey;
}


export async function encryptAirplaneContent(fileOrData: File) {
    if (!networkConfig.testnet.variables.Package) throw new Error("Package ID not configured");

    let data: Uint8Array;

    const buffer = await fileOrData.arrayBuffer();
    data = new Uint8Array(buffer);
    
    const { encryptedObject, key } = await sealClient.encrypt({
        threshold: 2, 
        packageId: networkConfig.testnet.variables.Package,
        id: networkConfig.testnet.variables.Package, 
        data,
    });

    return {
        encryptedBytes: encryptedObject,
        backupKey: key 
    };
}

export async function decryptAirplaneContent(
    encryptedData: Uint8Array,
    airplaneId: string,
    currentAddress: string,
    signMessage: (args: { message: Uint8Array }) => Promise<{ signature: string }>
): Promise<Uint8Array> { 
    if (!networkConfig.testnet.variables.Package) throw new Error("Package ID not configured");

    const sessionKey = await getOrCreateSessionKey(currentAddress, signMessage);

    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_airplane::seal_approve`,
        arguments: [
            tx.pure.vector('u8', fromHex(networkConfig.testnet.variables.Package)),
            tx.object(airplaneId),
            tx.object.clock(),
        ],
    });

    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

    const decryptedBytes = await sealClient.decrypt({
        data: encryptedData,
        sessionKey,
        txBytes,
    });

    return decryptedBytes; 
}
