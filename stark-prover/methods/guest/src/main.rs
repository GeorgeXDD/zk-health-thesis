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
    total_cholesterol_x10: u32,
    ldl_x10: u32,
    fasting_glucose_x10: u32,
    triglycerides_x10: u32,
    hdl_x10: u32,
    systolic_bp_x10: u32,
    diastolic_bp_x10: u32,
    bmi_x10: u32,
    creatinine_x10: u32,
    nonce_field: u128,
    req_hiv: u32, // 0/1
    req_hepb: u32,
    req_hepc: u32,
    req_covid: u32,
    req_preg: u32,
    req_a1c: u32, // 0/1
    req_total_chol: u32,
    req_ldl: u32,
    req_fasting_glucose: u32,
    req_triglycerides: u32,
    req_hdl: u32,
    req_systolic_bp: u32,
    req_diastolic_bp: u32,
    req_bmi: u32,
    req_creatinine: u32,
}

#[derive(Serialize, Deserialize)]
struct Journal {
    out_hiv: u32,     // 0/1
    out_hepb: u32,
    out_hepc: u32,
    out_covid: u32,
    out_preg: u32,
    out_a1c_ok: u32,  // 0/1
    out_total_chol_ok: u32,
    out_ldl_ok: u32,
    out_fasting_glucose_ok: u32,
    out_triglycerides_ok: u32,
    out_hdl_ok: u32,
    out_systolic_bp_ok: u32,
    out_diastolic_bp_ok: u32,
    out_bmi_ok: u32,
    out_creatinine_ok: u32,
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
    req_hdl: u32,
    req_systolic_bp: u32,
    req_diastolic_bp: u32,
    req_bmi: u32,
    req_creatinine: u32,
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

    let total_chol_ok = if inp.total_cholesterol_x10 < 2000 { 1u32 } else { 0u32 };
    let out_total_chol_ok = inp.req_total_chol * total_chol_ok;

    let ldl_ok = if inp.ldl_x10 < 1300 { 1u32 } else { 0u32 };
    let out_ldl_ok = inp.req_ldl * ldl_ok;

    let fasting_glucose_ok = if inp.fasting_glucose_x10 < 1000 { 1u32 } else { 0u32 };
    let out_fasting_glucose_ok = inp.req_fasting_glucose * fasting_glucose_ok;

    let triglycerides_ok = if inp.triglycerides_x10 < 1500 { 1u32 } else { 0u32 };
    let out_triglycerides_ok = inp.req_triglycerides * triglycerides_ok;

    let hdl_ok = if inp.hdl_x10 > 400 { 1u32 } else { 0u32 };
    let out_hdl_ok = inp.req_hdl * hdl_ok;

    let systolic_bp_ok = if inp.systolic_bp_x10 < 1300 { 1u32 } else { 0u32 };
    let out_systolic_bp_ok = inp.req_systolic_bp * systolic_bp_ok;

    let diastolic_bp_ok = if inp.diastolic_bp_x10 < 800 { 1u32 } else { 0u32 };
    let out_diastolic_bp_ok = inp.req_diastolic_bp * diastolic_bp_ok;

    let bmi_ok = if inp.bmi_x10 < 300 { 1u32 } else { 0u32 };
    let out_bmi_ok = inp.req_bmi * bmi_ok;

    let creatinine_ok = if inp.creatinine_x10 < 13 { 1u32 } else { 0u32 };
    let out_creatinine_ok = inp.req_creatinine * creatinine_ok;

    let journal = Journal {
        out_hiv,
        out_hepb,
        out_hepc,
        out_covid,
        out_preg,
        out_a1c_ok,
        out_total_chol_ok,
        out_ldl_ok,
        out_fasting_glucose_ok,
        out_triglycerides_ok,
        out_hdl_ok,
        out_systolic_bp_ok,
        out_diastolic_bp_ok,
        out_bmi_ok,
        out_creatinine_ok,
        nonce_field: inp.nonce_field,
        req_hiv: inp.req_hiv,
        req_hepb: inp.req_hepb,
        req_hepc: inp.req_hepc,
        req_covid: inp.req_covid,
        req_preg: inp.req_preg,
        req_a1c: inp.req_a1c,
        req_total_chol: inp.req_total_chol,
        req_ldl: inp.req_ldl,
        req_fasting_glucose: inp.req_fasting_glucose,
        req_triglycerides: inp.req_triglycerides,
        req_hdl: inp.req_hdl,
        req_systolic_bp: inp.req_systolic_bp,
        req_diastolic_bp: inp.req_diastolic_bp,
        req_bmi: inp.req_bmi,
        req_creatinine: inp.req_creatinine,
    };

    env::commit(&journal);
}