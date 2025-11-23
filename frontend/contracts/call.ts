import { Transaction } from "@mysten/sui/transactions";
import { networkConfig } from "@/contracts/index";

// public fun create_airplane(
//     airport: &mut Airport,
//     name: String,
//     content: String,
//     clock: &Clock,
//     ctx: &mut TxContext,
export async function createAirplane(airport: string, name: string, content: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_airplane::create_airplane`,
        arguments: [
            tx.object(airport),
            tx.pure.string(name),
            tx.pure.string(content),
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
        target: `${networkConfig.testnet.variables.Package}::paper_airplane::pick_plane`,
        arguments: [
            tx.object(airport),
            tx.object(clock),
            tx.object(random),
        ],
    });
    return tx;
}

// public fun add_comment(
//     airplane: &mut Airplane,
//     comment: String,
//     ctx: &mut TxContext,
// ) {
export async function addComment(airplane: string, comment: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${networkConfig.testnet.variables.Package}::paper_airplane::add_comment`,
        arguments: [
            tx.object(airplane),
            tx.pure.string(comment),
        ],
    });
    return tx;
}