module paper_plane::paper_plane;

use paper_plane::utils::to_b36;
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

const PICK_INTERVAL: u64 = 1000 * 60 * 60 * 1; 


public struct SealConfig has key {
    id: UID,
    package_id: address,
    key_servers: vector<address>,
    publickeys: vector<vector<u8>>,
    threshold: u8,
}

/*------结构体------*/
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
        airplanes: vector::empty(),
    };

    transfer::share_object(seal_config);
    transfer::public_share_object(airport);
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
        picked_by:ctx.sender(),
        picked_time: clock.timestamp_ms(),
        picked_count: 0,
        comments: vector::empty(),
        b36addr: b36addr,
    };

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
) {
    let crypto_comment = parse_encrypted_object(crypto_comment_data);
    vector::push_back(&mut airplane.comments, crypto_comment);
}

// 随机选一个飞机
public fun pick_plane(
    airport: &mut Airport,
    random: &Random,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    
    let mut random_generator = random.new_generator(ctx);
    let random_number = random_generator.generate_u64_in_range(0, vector::length(&airport.airplanes) - 1);
    let airplane = vector::borrow_mut(&mut airport.airplanes, random_number);
    airplane.picked_by = ctx.sender();
    airplane.picked_count = airplane.picked_count + 1;
}

//捡起人可以拿，或者到时间，自动返回owner
entry fun seal_airplane(
    airport: &mut Airport,
    ctx: &mut TxContext,
) {
    let (is_picked, index) = vector::index_of(&airport.airplanes, &ctx.sender());

}