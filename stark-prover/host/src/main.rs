use base64::{engine::general_purpose, Engine as _};
use risc0_zkvm::{default_prover, ExecutorEnv, InnerReceipt, ProverOpts, Receipt};
use serde::{Deserialize, Serialize};
use std::{env, fs, time::Instant};

use methods::{STARK_PROVER_ELF as METHOD_ELF, STARK_PROVER_ID as METHOD_ID};

const PRED_COUNT: usize = 100;

#[derive(Deserialize)]
struct InputsJson {
    values: Vec<u32>,
    nonce_field: String,
    reqs: Vec<u32>,
}

#[derive(Serialize, Deserialize)]
struct Inputs {
    values: Vec<u32>,
    nonce_field: u128,
    reqs: Vec<u32>,
}

#[derive(Serialize, Deserialize)]
struct Journal {
    outs: Vec<u32>,
    nonce_field: u128,
    reqs: Vec<u32>,
}

#[derive(Serialize)]
struct JournalOut {
    outs: Vec<u32>,
    nonce_field: String,
    reqs: Vec<u32>,
}

#[derive(Serialize)]
struct Outputs {
    verified_ok: bool,
    prove_time_ms: u128,
    verify_time_ms: u128,
    total_time_ms: u128,
    receipt_size_bytes: usize,
    journal: JournalOut,
    receipt_b64: String,
}

#[derive(Serialize)]
struct VerifyOutputs {
    verified_ok: bool,
    verify_time_ms: u128,
    receipt_kind: String,
    is_groth16: bool,
    journal: JournalOut,
}

#[derive(Serialize)]
struct WrapOutputs {
    wrapped_ok: bool,
    wrap_time_ms: u128,
    verify_time_ms: u128,
    total_time_ms: u128,
    snark_receipt_size_bytes: usize,
    snark_receipt_b64: String,
    receipt_kind: String,
    is_groth16: bool,
    journal: JournalOut,
}

fn parse_nonce(s: &str) -> u128 {
    let s = s.trim();

    if let Some(hex) = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")) {
        return u128::from_str_radix(hex, 16).expect("invalid hex nonce_field");
    }

    let is_hex = !s.is_empty() && s.chars().all(|c| c.is_ascii_hexdigit());
    if is_hex {
        return u128::from_str_radix(s, 16).expect("invalid bare-hex nonce_field");
    }

    s.parse::<u128>().expect("invalid decimal nonce_field")
}

fn arg_value<'a>(args: &'a [String], flag: &str) -> Option<&'a str> {
    args.iter()
        .position(|a| a == flag)
        .and_then(|i| args.get(i + 1))
        .map(String::as_str)
}

fn decode_receipt_b64(receipt_b64: &str) -> Receipt {
    let receipt_bytes = general_purpose::STANDARD
        .decode(receipt_b64)
        .expect("decode receipt base64");
    bincode::deserialize(&receipt_bytes).expect("deserialize receipt")
}

fn encode_receipt_b64(receipt: &Receipt) -> (String, usize) {
    let receipt_bytes = bincode::serialize(receipt).expect("serialize receipt");
    let receipt_size_bytes = receipt_bytes.len();
    let receipt_b64 = general_purpose::STANDARD.encode(&receipt_bytes);
    (receipt_b64, receipt_size_bytes)
}

fn receipt_kind(receipt: &Receipt) -> String {
    match &receipt.inner {
        InnerReceipt::Composite(_) => "Composite",
        InnerReceipt::Succinct(_) => "Succinct",
        InnerReceipt::Groth16(_) => "Groth16",
        InnerReceipt::Fake(_) => "Fake",
        _ => "Unknown",
    }
    .to_string()
}

fn expect_vec_len_100(input: Vec<u32>, label: &str) -> Vec<u32> {
    if input.len() != PRED_COUNT {
        panic!("{label} must have length {PRED_COUNT}");
    }
    input
}

fn journal_to_out(j: &Journal) -> JournalOut {
    JournalOut {
        outs: j.outs.clone(),
        nonce_field: j.nonce_field.to_string(),
        reqs: j.reqs.clone(),
    }
}

fn handle_prove(in_path: &str, out_path: &str) {
    let start_total = Instant::now();

    let inp_json = fs::read_to_string(in_path).expect("read input json");
    let raw: InputsJson = serde_json::from_str(&inp_json).expect("parse input json");

    let guest_input = Inputs {
        values: expect_vec_len_100(raw.values, "values"),
        nonce_field: parse_nonce(&raw.nonce_field),
        reqs: expect_vec_len_100(raw.reqs, "reqs"),
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
    let (receipt_b64, receipt_size_bytes) = encode_receipt_b64(&receipt);

    let out = Outputs {
        verified_ok,
        prove_time_ms,
        verify_time_ms,
        total_time_ms: start_total.elapsed().as_millis(),
        receipt_size_bytes,
        journal: journal_to_out(&journal),
        receipt_b64,
    };

    fs::write(out_path, serde_json::to_string_pretty(&out).unwrap()).expect("write output json");
}

fn handle_verify(receipt_b64: &str, out_path: &str, require_groth16: bool) {
    let receipt = decode_receipt_b64(receipt_b64);
    let is_groth16 = matches!(&receipt.inner, InnerReceipt::Groth16(_));

    if require_groth16 && !is_groth16 {
        panic!("provided receipt is not Groth16");
    }

    let start_verify = Instant::now();
    let verified_ok = receipt.verify(METHOD_ID).is_ok();
    let verify_time_ms = start_verify.elapsed().as_millis();

    let journal: Journal = receipt.journal.decode().expect("decode journal");

    let out = VerifyOutputs {
        verified_ok,
        verify_time_ms,
        receipt_kind: receipt_kind(&receipt),
        is_groth16,
        journal: journal_to_out(&journal),
    };

    fs::write(out_path, serde_json::to_string_pretty(&out).unwrap()).expect("write output json");
}

fn handle_wrap(receipt_b64: &str, out_path: &str) {
    let start_total = Instant::now();
    let receipt = decode_receipt_b64(receipt_b64);
    let prover = default_prover();

    if !receipt.verify(METHOD_ID).is_ok() {
        panic!("input receipt failed verification");
    }

    let start_wrap = Instant::now();
    let wrapped = prover
        .compress(&ProverOpts::groth16(), &receipt)
        .expect("compress to Groth16 failed");
    let wrap_time_ms = start_wrap.elapsed().as_millis();

    let start_verify = Instant::now();
    let wrapped_ok = wrapped.verify(METHOD_ID).is_ok();
    let verify_time_ms = start_verify.elapsed().as_millis();

    let journal: Journal = wrapped.journal.decode().expect("decode journal");
    let (snark_receipt_b64, snark_receipt_size_bytes) = encode_receipt_b64(&wrapped);
    let is_groth16 = matches!(&wrapped.inner, InnerReceipt::Groth16(_));
    if !is_groth16 {
        panic!("compression did not produce a Groth16 receipt");
    }

    let out = WrapOutputs {
        wrapped_ok,
        wrap_time_ms,
        verify_time_ms,
        total_time_ms: start_total.elapsed().as_millis(),
        snark_receipt_size_bytes,
        snark_receipt_b64,
        receipt_kind: receipt_kind(&wrapped),
        is_groth16,
        journal: journal_to_out(&journal),
    };

    fs::write(out_path, serde_json::to_string_pretty(&out).unwrap()).expect("write output json");
}

fn main() {
    let args: Vec<String> = env::args().collect();

    let out_path = arg_value(&args, "--out").expect("missing --out <path>");

    if let Some(receipt_b64) = arg_value(&args, "--verify-receipt") {
        handle_verify(receipt_b64, out_path, false);
        return;
    }

    if let Some(receipt_b64) = arg_value(&args, "--verify-groth16-receipt") {
        handle_verify(receipt_b64, out_path, true);
        return;
    }

    if let Some(receipt_b64) = arg_value(&args, "--wrap-receipt") {
        handle_wrap(receipt_b64, out_path);
        return;
    }

    let in_path = arg_value(&args, "--in").expect("missing --in <path>");
    handle_prove(in_path, out_path);
}
