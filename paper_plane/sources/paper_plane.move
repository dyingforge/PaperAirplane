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



public struct SealConfig has key {
    id: UID,
    package_id: address,
    key_servers: vector<address>,
    publickeys: vector<vector<u8>>,
    threshold: u8,
}

/*------结构体------*/
public struct Airplane has key {
    id: UID,
    name: String,
    owner: address,
    content_blob: String,
    picked_by: address,
    comments: vector<EncryptedObject>,
    b36addr: String,
}

public struct Airport has key, store {
    id: UID,
    airplanes: vector<address>,
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
        airplanes: vector::empty(),
    };

    transfer::share_object(seal_config);
    transfer::public_share_object(airport);
}

public fun create_airplane(
    airport: &mut Airport,
    name: String,
    content: String,
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
        comments: vector::empty(),
        b36addr: b36addr,
    };

    vector::push_back(&mut airport.airplanes, object_address);

    transfer::share_object(airplane);

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

public fun pick_plane(
    airport: &mut Airport,
    random_number: u64,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let id = object::new(ctx);
    let object_address = vector::pop_back(&mut airport.airplanes);
}

entry fun seal_airplane(
    airplane: &mut Airplane,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let id = object::new(ctx);
    let object_address = object::uid_to_address(&id);
    let b36addr = to_b36(object_address);
}