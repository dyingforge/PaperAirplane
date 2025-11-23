// public struct Airplane has key, store {
//     id: UID,
//     name: String,
//     owner: address,
//     content_blob: String,
//     picked_by: address,
//     picked_time: u64,
//     picked_count: u64,
//     comments: vector<String>,
//     b36addr: String,
// }

// public struct Airport has key, store {
//     id: UID,
//     lasting_picked_time: u64,
//     //airplane address -> picked_by address
//     airplanes_picked: Table<address, address>,
//     //airplane address -> airplane object
//     airplanes: vector<Airplane>,
// }

export interface Airplane {
    id: string;
    name: string;
    owner: string;
    content_blob: string;
    picked_by: string;
    picked_time: number;
    picked_count: number;
    comments: string[];
    b36addr: string;
}

export interface Airport {
    id: string;
    lasting_picked_time: number;
    airplanes_picked: Record<string, string>;
    airplanes: Airplane[];
}