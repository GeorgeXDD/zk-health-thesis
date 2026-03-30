#![no_main]
use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};

mod predicate_constants;

risc0_zkvm::guest::entry!(main);

use predicate_constants::{PRED_COUNT, PREDICATE_KINDS, PREDICATE_THRESHOLDS};

#[derive(Deserialize)]
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

fn evaluate_predicate(kind: u8, value: u32, threshold: u32) -> u32 {
    match kind {
        0 => {
            if value == 0 {
                1
            } else if value == 1 {
                0
            } else {
                panic!("coded_negative predicate value must be 0 or 1");
            }
        }
        1 => {
            if value < threshold {
                1
            } else {
                0
            }
        }
        2 => {
            if value > threshold {
                1
            } else {
                0
            }
        }
        _ => panic!("unsupported predicate kind"),
    }
}

fn main() {
    let inp: Inputs = env::read();
    if inp.values.len() != PRED_COUNT {
        panic!("values must have length 100");
    }
    if inp.reqs.len() != PRED_COUNT {
        panic!("reqs must have length 100");
    }

    let mut outs = vec![0u32; PRED_COUNT];

    for i in 0..PRED_COUNT {
        let req = inp.reqs[i];
        if req != 0 && req != 1 {
            panic!("selector must be 0 or 1");
        }

        let ok = evaluate_predicate(PREDICATE_KINDS[i], inp.values[i], PREDICATE_THRESHOLDS[i]);
        outs[i] = req * ok;
    }

    let journal = Journal {
        outs,
        nonce_field: inp.nonce_field,
        reqs: inp.reqs,
    };

    env::commit(&journal);
}
