const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");
const { PREDICATE_COUNT } = require("../../shared/predicateCatalog");

function toFieldFromHexString(hex) {
  return BigInt("0x" + hex).toString();
}

async function main() {
  const args = process.argv.slice(2);
  const inIdx = args.indexOf("--in");
  const outIdx = args.indexOf("--out");
  if (inIdx === -1 || outIdx === -1) {
    console.error(
      "Usage: node scripts/prove_clinical_predicates_selective_v1.js --in <input.json> --out <output.json>",
    );
    process.exit(2);
  }

  const inPath = args[inIdx + 1];
  const outPath = args[outIdx + 1];

  const input = JSON.parse(fs.readFileSync(inPath, "utf8"));

  for (const key of ["values", "reqs", "nonce"]) {
    if (input[key] === undefined || input[key] === null) {
      throw new Error(`Missing required input: ${key}`);
    }
  }

  if (!Array.isArray(input.values) || input.values.length !== PREDICATE_COUNT) {
    throw new Error(
      `values must be an array of length ${PREDICATE_COUNT} (got ${Array.isArray(input.values) ? input.values.length : "non-array"})`,
    );
  }

  if (!Array.isArray(input.reqs) || input.reqs.length !== PREDICATE_COUNT) {
    throw new Error(
      `reqs must be an array of length ${PREDICATE_COUNT} (got ${Array.isArray(input.reqs) ? input.reqs.length : "non-array"})`,
    );
  }

  for (let i = 0; i < PREDICATE_COUNT; i += 1) {
    const req = Number(input.reqs[i]);
    if (req !== 0 && req !== 1) {
      throw new Error(`reqs[${i}] must be 0 or 1`);
    }
  }

  const nonceHex = String(input.nonce);
  const nonceField = toFieldFromHexString(nonceHex);

  const circuitInput = {
    values: input.values,
    nonce: nonceField,
    reqs: input.reqs,
  };

  const base = path.join(
    __dirname,
    "..",
    "build",
    "clinical_predicates_selective_v1",
  );
  const wasmPath = path.join(
    base,
    "clinical_predicates_selective_v1_js",
    "clinical_predicates_selective_v1.wasm",
  );
  const zkeyPath = path.join(base, "circuit_final.zkey");
  const vkeyPath = path.join(base, "verification_key.json");

  if (!fs.existsSync(wasmPath)) throw new Error(`WASM not found: ${wasmPath}`);
  if (!fs.existsSync(zkeyPath)) throw new Error(`zkey not found: ${zkeyPath}`);
  if (!fs.existsSync(vkeyPath))
    throw new Error(`verification_key.json not found: ${vkeyPath}`);

  const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

  const t0 = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmPath,
    zkeyPath,
  );
  const t1 = Date.now();

  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  const t2 = Date.now();

  const out = {
    proof,
    publicSignals,
    verifiedOk: !!ok,
    timingsMs: { prove: t1 - t0, verify: t2 - t1, total: t2 - t0 },
    proofSizeBytes: Buffer.byteLength(JSON.stringify(proof), "utf8"),
    nonceField,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  process.stdout.write(JSON.stringify(out) + "\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
