import { Transaction } from "@mysten/sui/transactions";
import { networkConfig } from "@/contracts/index";

// airport: &mut Airport,
// name: String,
// fly_lasting_time: u64,
// content: String,
// clock: &Clock,
// ctx: &mut TxContext,
export async function createAirplane(airport: string, name: string, content: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_plane::create_airplane`,
        arguments: [
            tx.object(airport),
            tx.pure.string(name),
            tx.pure.u64("3000000"),
            tx.pure.string(content),
            tx.object.clock(),
        ],
    });
    return tx;
}

// public fun pick_plane(
//     airport: &mut Airport,
//     clock: &Clock,
//     random: &Random,
//     ctx: &mut TxContext,
export async function pickPlane(airport: string, clock: string, random: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_plane::pick_plane`,
        arguments: [
            tx.object(airport),
            tx.object(clock),
            tx.object(random),
        ],
    });
    return tx;
}

// public fun add_comment(
//     airport: &mut Airport,
//     airplane: &mut Airplane,
//     comment: String, // 现在是 blobId
//     ctx: &mut TxContext,
// )
export async function addComment(airport: string, airplaneAddress: string, commentBlobId: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_plane::add_comment`,
        arguments: [
            tx.object(airport),
            tx.object(airplaneAddress), // 共享对象
            tx.pure.string(commentBlobId), // 传递 blobId 而不是明文
        ],
    });
    return tx;
}
