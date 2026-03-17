#![no_main]
use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};

risc0_zkvm::guest::entry!(main);

#[derive(Deserialize)]
struct Inputs {
    hiv_status_bit: u32, // 0=neg, 1=pos
    hepb_status_bit: u32,
    hepc_status_bit: u32,
    covid_status_bit: u32,
    pregnancy_status_bit: u32,
    hba1c_x100: u32,     // 580 for 5.80%
    nonce_field: u128,
    req_hiv: u32, // 0/1
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32, // 0/1
}

#[derive(Serialize, Deserialize)]
struct Journal {
    out_hiv: u32,     // 0/1
    out_hepb: u32,
    out_hepc: u32,
    out_covid: u32,
    out_preg: u32,
    out_a1c_ok: u32,  // 0/1
    nonce_field: u128,
    req_hiv: u32,
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32,
}

fn main() {
    let inp: Inputs = env::read();

    let is_hiv_negative = 1u32.saturating_sub(inp.hiv_status_bit); 
    let out_hiv = inp.req_hiv * is_hiv_negative;

    let is_hepb_negative = 1u32.saturating_sub(inp.hepb_status_bit);
    let out_hepb = inp.req_hepb * is_hepb_negative;

    let is_hepc_negative = 1u32.saturating_sub(inp.hepc_status_bit);
    let out_hepc = inp.req_hepc * is_hepc_negative;

    let is_covid_negative = 1u32.saturating_sub(inp.covid_status_bit);
    let out_covid = inp.req_covid * is_covid_negative;

    let is_preg_negative = 1u32.saturating_sub(inp.pregnancy_status_bit);
    let out_preg = inp.req_preg * is_preg_negative;

    let a1c_ok = if inp.hba1c_x100 < 650 { 1u32 } else { 0u32 };
    let out_a1c_ok = inp.req_a1c * a1c_ok;

    let journal = Journal {
        out_hiv,
        out_hepb,
        out_hepc,
        out_covid,
        out_preg,
        out_a1c_ok,
        nonce_field: inp.nonce_field,
        req_hiv: inp.req_hiv,
        req_hepb: inp.req_hepb,
        req_hepc: inp.req_hepc,
        req_covid: inp.req_covid,
        req_preg: inp.req_preg,
        req_a1c: inp.req_a1c,
    };

    env::commit(&journal);
}