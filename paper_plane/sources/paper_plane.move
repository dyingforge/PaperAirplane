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
const EInvalidTime: u64 = 4;

const MIN_FLY_LASTING_TIME: u64 = 1000 * 60 * 10;
// const PICK_INTERVAL: u64 = 1000 * 60 * 5; 

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
    comments: vector<String>,
    b36addr: String,
}

public struct Airport has key, store {
    id: UID,
    lasting_picked_time: u64,
    //owner address -> airplane address
    airplanes_last_picked_time: Table<address, u64>,
    airplanes_picked_amount: Table<address, u64>,
    airplanes_owned: Table<address, vector<address>>,
    airplanes_picked: Table<address, vector<address>>,
    //airplane address -> airplane object
    airplanes_last_picked_person: Table<address, address>,   
    airplanes: vector<address>, 
}

/*-----事件------*/
public struct CreatedAirplaneEvent has copy, drop {
    event_id: ID,
    name: String,
    b36addr: String,
}

public struct PickedAirplaneEvent has copy, drop {
    airplane_id: ID,
    picker: address,
}

public struct AddedCommentEvent has copy, drop {
    airplane_id: ID,
    commenter: address,
}

fun init(ctx: &mut TxContext) {
    let airport = Airport {
        id: object::new(ctx),
        lasting_picked_time: 0,
        airplanes_last_picked_time: table::new(ctx),
        airplanes_picked_amount: table::new(ctx),
        airplanes_owned: table::new(ctx),
        airplanes_picked: table::new(ctx),
        airplanes_last_picked_person: table::new(ctx),
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
        comments: vector::empty(),
        b36addr: b36addr,
    };

    // 将飞机设为共享对象
    transfer::share_object(airplane);

    // 初始化 Table 数据
    let current_time = clock.timestamp_ms();
    table::add(&mut airport.airplanes_last_picked_person, object_address, sender);
    table::add(&mut airport.airplanes_last_picked_time, object_address, current_time);
    table::add(&mut airport.airplanes_picked_amount, object_address, 0);

    // 添加到 airplanes vector 用于随机选择
    vector::push_back(&mut airport.airplanes, object_address);

    // 添加到用户拥有的列表
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
    airport: &mut Airport,
    airplane: &mut Airplane,
    comment: String,
    ctx: &mut TxContext,
) {
    // 检查权限：只有当前捡到该飞机的人可以评论
    let airplane_address = object::uid_to_address(&airplane.id);
    let current_picker = *table::borrow(&airport.airplanes_last_picked_person, airplane_address);
    assert!(current_picker == ctx.sender(), ENoAccess);
    
    // 获取共享对象并添加评论
    vector::push_back(&mut airplane.comments, comment);
    
    event::emit(AddedCommentEvent {
        airplane_id: object::id(airplane),
        commenter: ctx.sender(),
    });
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
    let mut random_index = random_generator.generate_u64_in_range(0, airplanes_len - 1);
    let start_index = random_index;
    
    let mut airplane_address = *vector::borrow(&airport.airplanes, random_index);
    let mut last_picker = *table::borrow(&airport.airplanes_last_picked_person, airplane_address);
    
    let mut attempts = 0;
    while(last_picker == ctx.sender() && attempts < airplanes_len) {
        random_index = random_index + 1;
        if (random_index >= airplanes_len) {
            random_index = 0;
        };
        if (random_index == start_index) {
            return
        };
        airplane_address = *vector::borrow(&airport.airplanes, random_index);
        last_picker = *table::borrow(&airport.airplanes_last_picked_person, airplane_address);
        attempts = attempts + 1;
    };
    
    if (last_picker == ctx.sender()) {
        return
    };
    
    let old_picker = last_picker;
    // 更新 Table 值（key 在 create_airplane 时已创建，不能使用 table::add）
    let last_picked_person_ref = table::borrow_mut(&mut airport.airplanes_last_picked_person, airplane_address);
    *last_picked_person_ref = ctx.sender();
    
    let last_picked_time_ref = table::borrow_mut(&mut airport.airplanes_last_picked_time, airplane_address);
    *last_picked_time_ref = current_time;
    
    let picked_amount_ref = table::borrow_mut(&mut airport.airplanes_picked_amount, airplane_address);
    *picked_amount_ref = *picked_amount_ref + 1;
    
    if (table::contains(&airport.airplanes_picked, ctx.sender())) {
        let airplanes_picked_ref = table::borrow_mut(&mut airport.airplanes_picked, ctx.sender());
        vector::push_back(&mut *airplanes_picked_ref, airplane_address);
    } else {
        let mut airplanes_picked_ref = vector::empty();
        vector::push_back(&mut airplanes_picked_ref, airplane_address);
        table::add(&mut airport.airplanes_picked, ctx.sender(), airplanes_picked_ref);
    };
    
    if (table::contains(&airport.airplanes_picked, old_picker)) {
        let old_list = table::borrow_mut(&mut airport.airplanes_picked, old_picker);
        let (found, index) = vector::index_of(old_list, &airplane_address);
        if (found) {
            vector::remove(old_list, index);
        };
    };

    // 获取飞机 ID 用于事件
    let airplane_id = object::id_from_address(airplane_address);
    
    event::emit(PickedAirplaneEvent {
        airplane_id: airplane_id,
        picker: ctx.sender(),
    });
}

public fun namespace(airplane: &Airplane): vector<u8> {
    object::id(airplane).to_bytes()
}

public fun approve_internal(
    airport: &Airport,
    airplane: &Airplane,
    clock: &Clock,
    ctx: &mut TxContext,
): bool {
    let current_time = clock.timestamp_ms();
    let end_time = airplane.start_time + airplane.fly_lasting_time;
    
    // 从 Table 获取当前捡取者
    let current_picker = *table::borrow(&airport.airplanes_last_picked_person, object::uid_to_address(&airplane.id));
    
    if (current_picker == ctx.sender()) {
        return true
    } else if (current_time >= end_time && airplane.owner == ctx.sender()) {
        return true
    } else {
        return false
    }
}

entry fun seal_approve(
    id:vector<u8>,
    airport: &Airport,
    airplane: &Airplane,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(approve_internal(airport, airplane, clock, ctx), ENoAccess);
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
    ctx: &mut TxContext,
) : vector<address> {
    if (table::contains(&airport.airplanes_picked, ctx.sender())) {
        let airplanes_ref = table::borrow(&airport.airplanes_picked, ctx.sender());
        *airplanes_ref
    } else {
        vector::empty()
    }
}

public fun get_airplane_return_time(
    clock: &Clock,
    airplane: &Airplane,
) : u64 {
    let current_time = clock.timestamp_ms();
    let return_time = airplane.start_time + airplane.fly_lasting_time;
    if (current_time >= return_time) {
        return return_time
    } else {
        return 0
    }
}
