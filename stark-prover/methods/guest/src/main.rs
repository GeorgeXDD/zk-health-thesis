#![no_main]
use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};

risc0_zkvm::guest::entry!(main);

#[derive(Deserialize)]
struct Inputs {
    hiv_status_bit: u32, // 0=neg, 1=pos
    hba1c_x100: u32,     // 580 for 5.80%
    nonce_field: u128,
    req_hiv: u32, // 0/1
    req_a1c: u32, // 0/1
}

#[derive(Serialize, Deserialize)]
struct Journal {
    out_hiv: u32,     // 0/1
    out_a1c_ok: u32,  // 0/1
    nonce_field: u128,
    req_hiv: u32,
    req_a1c: u32,
}

fn main() {
    let inp: Inputs = env::read();

    let is_hiv_negative = 1u32.saturating_sub(inp.hiv_status_bit); 
    let out_hiv = inp.req_hiv * is_hiv_negative;

    let a1c_ok = if inp.hba1c_x100 < 650 { 1u32 } else { 0u32 };
    let out_a1c_ok = inp.req_a1c * a1c_ok;

    let journal = Journal {
        out_hiv,
        out_a1c_ok,
        nonce_field: inp.nonce_field,
        req_hiv: inp.req_hiv,
        req_a1c: inp.req_a1c,
    };

    env::commit(&journal);
}