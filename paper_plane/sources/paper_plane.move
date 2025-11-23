module paper_plane::paper_plane;

use paper_plane::utils::{to_b36, is_prefix};
use std::string::String;
use sui::random::{ Random};
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};


const EAlreadyPicked: u64 = 0;
const ENoAccess: u64 = 1;
const EInvalidAirplane: u64 = 2;
const EInvalidFlyLastingTime: u64 = 3;

const MIN_FLY_LASTING_TIME: u64 = 1000 * 60 * 10;
const PICK_INTERVAL: u64 = 1000 * 60 * 5; 

public struct SetAdmin has key {
    id: UID,
}
public struct Airplane has key, store {
    id: UID,
    name: String,
    owner: address,
    content_blob: String,
    start_time: u64,
    fly_lasting_time: u64,
    picked_by: address,
    picked_time: u64,
    picked_count: u64,
    comments: vector<String>,
    b36addr: String,
}

public struct Airport has key, store {
    id: UID,
    lasting_picked_time: u64,
    //owner address -> airplane address
    airplanes_owned: Table<address, vector<address>>,
    airplanes_picked: Table<address, vector<address>>,
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
    let airport = Airport {
        id: object::new(ctx),
        lasting_picked_time: 0,
        airplanes_owned: table::new(ctx),
        airplanes_picked: table::new(ctx),
        airplanes: vector::empty(),
    };

    let set_admin = SetAdmin {
        id: object::new(ctx),
    };

    transfer::share_object(set_admin);
    transfer::share_object(airport);
}

public fun create_airplane(
    airport: &mut Airport,
    name: String,
    fly_lasting_time: u64,
    content: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(fly_lasting_time >= MIN_FLY_LASTING_TIME, EInvalidFlyLastingTime);
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
        fly_lasting_time,
        start_time: clock.timestamp_ms(),
        picked_by: sender, 
        picked_time: clock.timestamp_ms(),
        picked_count: 0,
        comments: vector::empty(),
        b36addr: b36addr,
    };

    vector::push_back(&mut airport.airplanes, airplane);
    if (table::contains(&airport.airplanes_owned, sender)) {    
        let airplanes_owned_ref = table::borrow_mut(&mut airport.airplanes_owned, sender);
        vector::push_back(&mut *airplanes_owned_ref, object_address);
    } else {
        let mut airplanes_owned_ref = vector::empty();
        vector::push_back(&mut airplanes_owned_ref, object_address);
        table::add(&mut airport.airplanes_owned, sender, airplanes_owned_ref);
    };

    event::emit(CreatedAirplaneEvent {
        event_id,
        name: name,
        b36addr: b36addr,
    });
}

public fun add_comment(
    airplane: &mut Airplane,
    comment: String,
    ctx: &mut TxContext,
) {
    assert!(airplane.picked_by == ctx.sender(), ENoAccess);
    vector::push_back(&mut airplane.comments, comment);
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
    
    let old_picked_by = airplane.picked_by;
    if (old_picked_by == ctx.sender()) {
        return
    };
    airplane.picked_by = ctx.sender();
    airplane.picked_time = current_time;
    airplane.picked_count = airplane.picked_count + 1;

    if (table::contains(&airport.airplanes_picked, ctx.sender())) {

        let picked_by_ref = table::borrow_mut(&mut airport.airplanes_picked, ctx.sender());
        vector::push_back(&mut *picked_by_ref, airplane_address);
    } else {
        let mut airplanes_picked_ref = vector::empty();
        vector::push_back(&mut airplanes_picked_ref, airplane_address);
        table::add(&mut airport.airplanes_picked, ctx.sender(), airplanes_picked_ref);
    };
        if (table::contains(&airport.airplanes_picked, old_picked_by)) {
            let old_list = table::borrow_mut(&mut airport.airplanes_picked, old_picked_by);
            let (found, index) = vector::index_of(old_list, &airplane_address);
            if (found) {
                vector::remove(old_list, index);
            };
        };
}

public fun namespace(airplane: &Airplane): vector<u8> {
    object::id(airplane).to_bytes()
}

public fun approve_internal(
    airplane: &Airplane,
    id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
): bool {
    let namespace = namespace(airplane);
    if (!is_prefix(namespace, id)) {
        return false
    };
    
    let current_time = clock.timestamp_ms();
    let end_time = airplane.start_time + airplane.fly_lasting_time;
    
    if (airplane.picked_by == ctx.sender()) {
        return true
    } else if (current_time >= end_time && airplane.owner == ctx.sender()) {
        return true
    } else {
        return false
    }
}

entry fun seal_approve(
    id: vector<u8>,
    airplane: &Airplane,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(approve_internal(airplane, id, clock, ctx), ENoAccess);
}

//owned airplanes
public fun get_user_airplanes(
    airport: &Airport,
    user: address,
) : vector<address> {
    if (table::contains(&airport.airplanes_owned, user)) {
        let airplanes_ref = table::borrow(&airport.airplanes_owned, user);
        *airplanes_ref
    } else {
        vector::empty()
    }
}

public fun get_picked_airplanes(
    airport: &Airport,
    user: address,
) : vector<address> {
    if (table::contains(&airport.airplanes_picked, user)) {
        let airplanes_ref = table::borrow(&airport.airplanes_picked, user);
        *airplanes_ref
    } else {
        vector::empty()
    }
}

public fun get_airplane_return_time(
    airplane: &Airplane,
    clock: &Clock,
) : u64 {
    let current_time = clock.timestamp_ms();
    let return_time = airplane.start_time + airplane.fly_lasting_time;
    if (current_time >= return_time) {
        return return_time
    } else {
        return 0
    }
}