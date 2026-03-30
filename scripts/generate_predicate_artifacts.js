"use strict";

const fs = require("fs");
const path = require("path");
const { PREDICATES, PREDICATE_COUNT } = require("../shared/predicateCatalog");

const ROOT = path.resolve(__dirname, "..");

function writeFile(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.writeFileSync(target, content);
  process.stdout.write(`wrote ${relativePath}\n`);
}

function renderCircuit() {
  const predicateBlocks = PREDICATES.map((predicate) => {
    const idx = predicate.index;
    if (predicate.type === "coded_negative") {
      return `    // ${predicate.predicate}
    values[${idx}] * (values[${idx}] - 1) === 0;
    signal isOk${idx};
    isOk${idx} <== 1 - values[${idx}];
    outs[${idx}] <== reqs[${idx}] * isOk${idx};
    reqs[${idx}] * (outs[${idx}] - isOk${idx}) === 0;`;
    }

    if (predicate.comparator === "lt") {
      return `    // ${predicate.predicate}
    component bits${idx} = Num2Bits(32);
    bits${idx}.in <== values[${idx}];
    component cmp${idx} = LessThan(32);
    cmp${idx}.in[0] <== values[${idx}];
    cmp${idx}.in[1] <== ${predicate.threshold};
    signal isOk${idx};
    isOk${idx} <== cmp${idx}.out;
    outs[${idx}] <== reqs[${idx}] * isOk${idx};
    reqs[${idx}] * (outs[${idx}] - isOk${idx}) === 0;`;
    }

    return `    // ${predicate.predicate}
    component bits${idx} = Num2Bits(32);
    bits${idx}.in <== values[${idx}];
    component cmp${idx} = LessThan(32);
    cmp${idx}.in[0] <== ${predicate.threshold};
    cmp${idx}.in[1] <== values[${idx}];
    signal isOk${idx};
    isOk${idx} <== cmp${idx}.out;
    outs[${idx}] <== reqs[${idx}] * isOk${idx};
    reqs[${idx}] * (outs[${idx}] - isOk${idx}) === 0;`;
  }).join("\n\n");

  return `pragma circom 2.1.7;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template ClinicalPredicatesSelectiveV1() {
    signal input values[${PREDICATE_COUNT}];
    signal input nonce;
    signal input reqs[${PREDICATE_COUNT}];

    signal output outs[${PREDICATE_COUNT}];

    for (var i = 0; i < ${PREDICATE_COUNT}; i++) {
        reqs[i] * (reqs[i] - 1) === 0;
    }

${predicateBlocks}

    signal dummy;
    dummy <== nonce * 1;
}

component main { public [nonce, reqs] } = ClinicalPredicatesSelectiveV1();
`;
}

function renderGuestConstants() {
  const kinds = PREDICATES.map((predicate) => {
    if (predicate.type === "coded_negative") return 0;
    if (predicate.comparator === "lt") return 1;
    return 2;
  }).join(", ");

  const thresholds = PREDICATES.map((predicate) =>
    predicate.threshold == null ? 0 : predicate.threshold,
  ).join(", ");

  return `pub const PRED_COUNT: usize = ${PREDICATE_COUNT};
pub const PREDICATE_KINDS: [u8; PRED_COUNT] = [${kinds}];
pub const PREDICATE_THRESHOLDS: [u32; PRED_COUNT] = [${thresholds}];
`;
}

function main() {
  writeFile(
    "circom-prover/circuits/clinical_predicates_selective_v1.circom",
    renderCircuit(),
  );
  writeFile(
    "stark-prover/methods/guest/src/predicate_constants.rs",
    renderGuestConstants(),
  );
}

main();
