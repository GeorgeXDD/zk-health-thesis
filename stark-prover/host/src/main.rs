use risc0_zkvm::{default_prover, ExecutorEnv};
use serde::{Deserialize, Serialize};
use std::{env, fs, time::Instant};
use base64::{engine::general_purpose, Engine as _};

use methods::{STARK_PROVER_ELF as METHOD_ELF, STARK_PROVER_ID as METHOD_ID};

#[derive(Deserialize)]
struct InputsJson {
    hiv_status_bit: u32,
    hba1c_x100: u32,
    nonce_field: String,
    req_hiv: u32,
    req_a1c: u32,
}

#[derive(Serialize, Deserialize)]
struct Inputs {
    hiv_status_bit: u32,
    hba1c_x100: u32,
    nonce_field: u128,
    req_hiv: u32,
    req_a1c: u32,
}

#[derive(Serialize, Deserialize)]
struct Journal {
    out_hiv: u32,
    out_a1c_ok: u32,
    nonce_field: u128,
    req_hiv: u32,
    req_a1c: u32,
}

#[derive(Serialize)]
struct Outputs {
    verified_ok: bool,
    prove_time_ms: u128,
    verify_time_ms: u128,
    total_time_ms: u128,
    receipt_size_bytes: usize,
    journal: Journal,
    receipt_b64: String,
}

fn parse_nonce(s: &str) -> u128 {
    let s = s.trim();

    // 0x-prefixed hex
    if let Some(hex) = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")) {
        return u128::from_str_radix(hex, 16).expect("invalid hex nonce_field");
    }

    // bare hex (like "ae9d09ab...")
    let is_hex = !s.is_empty() && s.chars().all(|c| c.is_ascii_hexdigit());
    if is_hex {
        return u128::from_str_radix(s, 16).expect("invalid bare-hex nonce_field");
    }

    // decimal
    s.parse::<u128>().expect("invalid decimal nonce_field")
}

fn main() {
    let args: Vec<String> = env::args().collect();

    let in_path = args
        .iter()
        .position(|a| a == "--in")
        .and_then(|i| args.get(i + 1))
        .expect("missing --in <path>");

    let out_path = args
        .iter()
        .position(|a| a == "--out")
        .and_then(|i| args.get(i + 1))
        .expect("missing --out <path>");

    let start_total = Instant::now();

    let inp_json = fs::read_to_string(in_path).expect("read input json");
    let raw: InputsJson = serde_json::from_str(&inp_json).expect("parse input json");

    let guest_input = Inputs {
        hiv_status_bit: raw.hiv_status_bit,
        hba1c_x100: raw.hba1c_x100,
        nonce_field: parse_nonce(&raw.nonce_field),
        req_hiv: raw.req_hiv,
        req_a1c: raw.req_a1c,
    };

    let exec_env = ExecutorEnv::builder()
        .write(&guest_input)
        .unwrap()
        .build()
        .unwrap();

    let prover = default_prover();

    let start_prove = Instant::now();
    let prove_info = prover.prove(exec_env, METHOD_ELF).expect("prove failed");
    let prove_time_ms = start_prove.elapsed().as_millis();

    let receipt = prove_info.receipt;

    let start_verify = Instant::now();
    let verified_ok = receipt.verify(METHOD_ID).is_ok();
    let verify_time_ms = start_verify.elapsed().as_millis();

    let journal: Journal = receipt.journal.decode().expect("decode journal");

    let receipt_bytes = bincode::serialize(&receipt).unwrap();
    let receipt_size_bytes = receipt_bytes.len();
    let receipt_b64 = general_purpose::STANDARD.encode(&receipt_bytes);

    let out = Outputs {
        verified_ok,
        prove_time_ms,
        verify_time_ms,
        total_time_ms: start_total.elapsed().as_millis(),
        receipt_size_bytes,
        journal,
        receipt_b64,
    };

    fs::write(out_path, serde_json::to_string_pretty(&out).unwrap()).expect("write output json");
}