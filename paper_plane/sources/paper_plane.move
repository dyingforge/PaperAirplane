module paper_plane::paper_plane;

use paper_plane::utils::{to_b36, is_prefix};
use seal::bf_hmac_encryption::{
    EncryptedObject,
    decrypt,
    new_public_key,
    verify_derived_keys,
    parse_encrypted_object
};
use std::string::String;
use sui::random::{Self, Random};
use sui::balance::{Self, Balance};
use sui::bls12381::g1_from_bytes;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::table::{Self, Table};


const EAlreadyPicked: u64 = 0;
const ENoAccess: u64 = 1;
const EInvalidAirplane: u64 = 2;
const EInvalidEncryptedComment: u64 = 3;

const PICK_INTERVAL: u64 = 1000 * 60 * 5; 


public struct SealConfig has key {
    id: UID,
    package_id: address,
    key_servers: vector<address>,
    publickeys: vector<vector<u8>>,
    threshold: u8,
}

public struct Airplane has key, store {
    id: UID,
    name: String,
    owner: address,
    content_blob: String,
    picked_by: address,
    picked_time: u64,
    picked_count: u64,
    comments: vector<EncryptedObject>,
    b36addr: String,
}

public struct Airport has key, store {
    id: UID,
    lasting_picked_time: u64,
    //airplane address -> picked_by address
    airplanes_picked: Table<address, address>,
    //airplane address -> airplane object
    airplanes: vector<Airplane>,
}

/*-----事件------*/
public struct CreatedAirplaneEvent has copy, drop {
    event_id: ID,
    name: String,
    b36addr: String,
}

fun init(ctx: &mut TxContext) {
    let seal_config = SealConfig {
        id: object::new(ctx),
        package_id: @paper_plane,
        key_servers: vector::empty(),
        publickeys: vector::empty(),
        threshold: 0,
    };
    let airport = Airport {
        id: object::new(ctx),
        lasting_picked_time: 0,
        airplanes_picked: table::new(ctx),
        airplanes: vector::empty(),
    };

    transfer::share_object(seal_config);
    transfer::share_object(airport);
}

public fun create_airplane(
    airport: &mut Airport,
    name: String,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let id = object::new(ctx);
    let object_address = object::uid_to_address(&id);
    let b36addr = to_b36(object_address);
    let event_id = id.to_inner();

    let airplane = Airplane {
        id,
        name,
        owner: sender,
        content_blob: content,
        picked_by: sender, 
        picked_time: clock.timestamp_ms(),
        picked_count: 0,
        comments: vector::empty(),
        b36addr: b36addr,
    };

    table::add(&mut airport.airplanes_picked, object_address, sender);
    vector::push_back(&mut airport.airplanes, airplane);

    event::emit(CreatedAirplaneEvent {
        event_id,
        name: name,
        b36addr: b36addr,
    });
}

public fun add_comment(
    airplane: &mut Airplane,
    crypto_comment_data: vector<u8>,
    seal_config: &SealConfig,
    ctx: &mut TxContext,
) {
    assert!(airplane.picked_by == ctx.sender(), ENoAccess);
    
    let crypto_comment = parse_encrypted_object(crypto_comment_data);
    let airplane_id = object::id(airplane).to_bytes();
    
    assert!(*crypto_comment.id() == airplane_id, EInvalidEncryptedComment);
    assert!(*crypto_comment.services() == seal_config.key_servers, EInvalidEncryptedComment);
    assert!(crypto_comment.threshold() == seal_config.threshold, EInvalidEncryptedComment);  
    assert!(*crypto_comment.package_id() == seal_config.package_id, EInvalidEncryptedComment);
    assert!(crypto_comment.aad().borrow() == ctx.sender().to_bytes(), EInvalidEncryptedComment);
    
    vector::push_back(&mut airplane.comments, crypto_comment);
}

public fun pick_plane(
    airport: &mut Airport,
    clock: &Clock,
    random: &Random,
    ctx: &mut TxContext,
) {
    let airplanes_len = vector::length(&airport.airplanes);
    assert!(airplanes_len > 0, EInvalidAirplane);
    
    let current_time = clock.timestamp_ms();
    let mut random_generator = random.new_generator(ctx);
    
    let random_index = random_generator.generate_u64_in_range(0, airplanes_len - 1);
    
    let airplane = vector::borrow_mut(&mut airport.airplanes, random_index);
    let airplane_address = object::uid_to_address(&airplane.id);
    
    assert!(current_time >= airplane.picked_time + PICK_INTERVAL, EAlreadyPicked);
    
    airplane.picked_by = ctx.sender();
    airplane.picked_time = current_time;
    airplane.picked_count = airplane.picked_count + 1;
    
    if (table::contains(&airport.airplanes_picked, airplane_address)) {
        let picked_by_ref = table::borrow_mut(&mut airport.airplanes_picked, airplane_address);
        *picked_by_ref = ctx.sender();
    } else {
        table::add(&mut airport.airplanes_picked, airplane_address, ctx.sender());
    };
}

public fun namespace(airplane: &Airplane): vector<u8> {
    object::id(airplane).to_bytes()
}

public fun approve_internal(
    caller: address,
    airplane: &Airplane,
    id: vector<u8>,
    clock: &Clock,
): bool {
    let namespace = namespace(airplane);
    if (!is_prefix(namespace, id)) {
        return false
    };
    
    let current_time = clock.timestamp_ms();
    let end_time = airplane.picked_time + PICK_INTERVAL;
    
    if (airplane.picked_by == caller) {
        return true
    } else if (current_time >= end_time && airplane.owner == caller) {
        return true
    } else {
        return false
    }
}

entry fun seal_approve(
    id: vector<u8>,
    airplane: &Airplane,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(approve_internal(ctx.sender(), airplane, id, clock), ENoAccess);
}