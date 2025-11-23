import { isValidSuiAddress } from "@mysten/sui/utils";
import { suiClient, networkConfig } from "./index";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

export const getUserProfile = async (address: string): Promise<CategorizedObjects> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  let hasNextPage = true;
  let nextCursor: string | null = null;
  let allObjects: SuiObjectResponse[] = [];

  while (hasNextPage) {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
      },
      cursor: nextCursor,
    });

    allObjects = allObjects.concat(response.data);
    hasNextPage = response.hasNextPage;
    nextCursor = response.nextCursor ?? null;
  }

  return categorizeSuiObjects(allObjects);
};

// 获取用户拥有的飞机列表 (用户创建的)
export const getUserAirplanes = async (address: string): Promise<string[]> => {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_plane::get_user_airplanes`,
        arguments: [
            tx.object(networkConfig.testnet.variables.Airport),
            tx.pure.address(address)
        ]
    });

    const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
    });

    if (result.results && result.results[0].returnValues) {
        const rawBytes = Uint8Array.from(result.results[0].returnValues[0][0]);
        const addresses = bcs.vector(bcs.Address).parse(rawBytes);
        return addresses;
    }
    return [];
};

// 调用 view function 获取已捡到的飞机列表
// 注意：合约使用 ctx.sender()，所以不需要传入 address 参数
export const getPickedAirplanes = async (address: string): Promise<string[]> => {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_plane::get_picked_airplanes`,
        arguments: [
            tx.object(networkConfig.testnet.variables.Airport),
            // 不需要传入 address，合约会从 ctx.sender() 获取
        ]
    });

    const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address, // 这里传入的 sender 会被合约的 ctx.sender() 使用
    });

    if (result.results && result.results[0].returnValues) {
        const rawBytes = Uint8Array.from(result.results[0].returnValues[0][0]);
        const addresses = bcs.vector(bcs.Address).parse(rawBytes);
        return addresses;
    }
    return [];
};

// 获取飞机信息 - 直接从链上获取共享对象
export const getAirplaneInfo = async (airplaneAddr: string): Promise<{ name: string, contentBlob: string, startTime: number, flyLastingTime: number, commentBlobIds: string[] } | null> => {
    try {
        const response = await suiClient.getObject({
            id: airplaneAddr,
            options: { showContent: true }
        });

        if (response.data?.content && 'fields' in response.data.content) {
            const fields = response.data.content.fields as any;
            return {
                name: fields.name || "",
                contentBlob: fields.content_blob || "",
                startTime: Number(fields.start_time || 0),
                flyLastingTime: Number(fields.fly_lasting_time || 0),
                commentBlobIds: fields.comments || [], // comments 现在是 blobId 数组
            };
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch airplane info:", e);
        return null;
    }
};

// 根据交易 Hash 获取被捡到的飞机 ID
// 使用 waitForTransaction 确保交易已被索引
export const getPickedAirplaneByHash = async (digest: string): Promise<string | null> => {
        const tx = await suiClient.waitForTransaction({
            digest,
            options: { showEvents: true },
            timeout: 2000, 
            pollInterval: 1000,
        });

        if (!tx.events || tx.events.length === 0) {
            console.warn("No events found in transaction");
            return null;
        }

        console.log("Transaction events:", tx.events);

        // 查找 PickedAirplaneEvent
        const event = tx.events.find(e => e.type.includes("PickedAirplaneEvent"));

        if (event && event.parsedJson) {
            const airplaneId = (event.parsedJson as any).airplane_id;
            console.log("Found airplane ID from event:", airplaneId);
            return airplaneId;
        }
        
        console.warn("PickedAirplaneEvent not found in transaction events");
        return null;
};
