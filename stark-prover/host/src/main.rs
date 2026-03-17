use risc0_zkvm::{default_prover, ExecutorEnv, InnerReceipt, ProverOpts, Receipt};
use serde::{Deserialize, Serialize};
use std::{env, fs, time::Instant};
use base64::{engine::general_purpose, Engine as _};

use methods::{STARK_PROVER_ELF as METHOD_ELF, STARK_PROVER_ID as METHOD_ID};

#[derive(Deserialize)]
struct InputsJson {
    hiv_status_bit: u32,
    hepb_status_bit: u32,
    hepc_status_bit: u32,
    covid_status_bit: u32,
    pregnancy_status_bit: u32,
    hba1c_x100: u32,
    total_cholesterol_x10: u32,
    ldl_x10: u32,
    fasting_glucose_x10: u32,
    triglycerides_x10: u32,
    nonce_field: String,
    req_hiv: u32,
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32,
    req_total_chol: u32,
    req_ldl: u32,
    req_fasting_glucose: u32,
    req_triglycerides: u32,
}

#[derive(Serialize, Deserialize)]
struct Inputs {
    hiv_status_bit: u32,
    hepb_status_bit: u32,
    hepc_status_bit: u32,
    covid_status_bit: u32,
    pregnancy_status_bit: u32,
    hba1c_x100: u32,
    total_cholesterol_x10: u32,
    ldl_x10: u32,
    fasting_glucose_x10: u32,
    triglycerides_x10: u32,
    nonce_field: u128,
    req_hiv: u32,
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32,
    req_total_chol: u32,
    req_ldl: u32,
    req_fasting_glucose: u32,
    req_triglycerides: u32,
}

#[derive(Serialize, Deserialize)]
struct Journal {
    out_hiv: u32,
    out_hepb: u32,
    out_hepc: u32,
    out_covid: u32,
    out_preg: u32,
    out_a1c_ok: u32,
    out_total_chol_ok: u32,
    out_ldl_ok: u32,
    out_fasting_glucose_ok: u32,
    out_triglycerides_ok: u32,
    nonce_field: u128,
    req_hiv: u32,
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32,
    req_total_chol: u32,
    req_ldl: u32,
    req_fasting_glucose: u32,
    req_triglycerides: u32,
}

#[derive(Serialize)]
struct JournalOut {
    out_hiv: u32,
    out_hepb: u32,
    out_hepc: u32,
    out_covid: u32,
    out_preg: u32,
    out_a1c_ok: u32,
    out_total_chol_ok: u32,
    out_ldl_ok: u32,
    out_fasting_glucose_ok: u32,
    out_triglycerides_ok: u32,
    nonce_field: String,
    req_hiv: u32,
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32,
    req_total_chol: u32,
    req_ldl: u32,
    req_fasting_glucose: u32,
    req_triglycerides: u32,
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

fn journal_to_out(j: &Journal) -> JournalOut {
    JournalOut {
        out_hiv: j.out_hiv,
        out_hepb: j.out_hepb,
        out_hepc: j.out_hepc,
        out_covid: j.out_covid,
        out_preg: j.out_preg,
        out_a1c_ok: j.out_a1c_ok,
        out_total_chol_ok: j.out_total_chol_ok,
        out_ldl_ok: j.out_ldl_ok,
        out_fasting_glucose_ok: j.out_fasting_glucose_ok,
        out_triglycerides_ok: j.out_triglycerides_ok,
        nonce_field: j.nonce_field.to_string(),
        req_hiv: j.req_hiv,
        req_hepb: j.req_hepb,
        req_hepc: j.req_hepc,
        req_covid: j.req_covid,
        req_preg: j.req_preg,
        req_a1c: j.req_a1c,
        req_total_chol: j.req_total_chol,
        req_ldl: j.req_ldl,
        req_fasting_glucose: j.req_fasting_glucose,
        req_triglycerides: j.req_triglycerides,
    }
}

fn handle_prove(in_path: &str, out_path: &str) {
    let start_total = Instant::now();

    let inp_json = fs::read_to_string(in_path).expect("read input json");
    let raw: InputsJson = serde_json::from_str(&inp_json).expect("parse input json");

    let guest_input = Inputs {
        hiv_status_bit: raw.hiv_status_bit,
        hepb_status_bit: raw.hepb_status_bit,
        hepc_status_bit: raw.hepc_status_bit,
        covid_status_bit: raw.covid_status_bit,
        pregnancy_status_bit: raw.pregnancy_status_bit,
        hba1c_x100: raw.hba1c_x100,
        total_cholesterol_x10: raw.total_cholesterol_x10,
        ldl_x10: raw.ldl_x10,
        fasting_glucose_x10: raw.fasting_glucose_x10,
        triglycerides_x10: raw.triglycerides_x10,
        nonce_field: parse_nonce(&raw.nonce_field),
        req_hiv: raw.req_hiv,
        req_hepb: raw.req_hepb,
        req_hepc: raw.req_hepc,
        req_covid: raw.req_covid,
        req_preg: raw.req_preg,
        req_a1c: raw.req_a1c,
        req_total_chol: raw.req_total_chol,
        req_ldl: raw.req_ldl,
        req_fasting_glucose: raw.req_fasting_glucose,
        req_triglycerides: raw.req_triglycerides,
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

    // Ensure the input STARK receipt is valid before wrapping it.
    let input_verified_ok = receipt.verify(METHOD_ID).is_ok();
    if !input_verified_ok {
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
