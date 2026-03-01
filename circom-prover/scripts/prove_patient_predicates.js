const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

function nowMs() {
  return Date.now();
}

// BN128 scalar field (same used by snarkjs groth16 on bn128)
const SNARK_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);

function nonceToField(nonce) {
  // allow:
  // - numeric strings ("123")
  // - hex strings ("418c..." or "0x418c...")
  if (typeof nonce === "number") return BigInt(nonce) % SNARK_FIELD;

  if (typeof nonce !== "string")
    throw new Error("nonce must be a string or number");

  const s = nonce.trim().toLowerCase();
  if (s.startsWith("0x")) {
    return BigInt(s) % SNARK_FIELD;
  }
  // if it's hex (contains a-f), treat as hex
  if (/^[0-9a-f]+$/i.test(s) && /[a-f]/i.test(s)) {
    return BigInt("0x" + s) % SNARK_FIELD;
  }
  // otherwise treat as decimal
  if (/^\d+$/.test(s)) {
    return BigInt(s) % SNARK_FIELD;
  }

  throw new Error("nonce must be hex or decimal string");
}

async function main() {
  const args = process.argv.slice(2);
  const inIdx = args.indexOf("--in");
  const outIdx = args.indexOf("--out");

  if (inIdx === -1 || outIdx === -1) {
    console.error(
      "Usage: node scripts/prove_patient_predicates.js --in <input.json> --out <output.json>",
    );
    process.exit(2);
  }

  const inPath = args[inIdx + 1];
  const outPath = args[outIdx + 1];

  const inputRaw = JSON.parse(fs.readFileSync(inPath, "utf8"));

  for (const k of ["age", "hivStatus", "hasAllergyToDrugX", "nonce"]) {
    if (inputRaw[k] === undefined) throw new Error(`Missing input field: ${k}`);
  }

  // Convert nonce into a field element string (decimal) for snarkjs
  const nonceField = nonceToField(inputRaw.nonce).toString();

  const input = {
    age: inputRaw.age,
    hivStatus: inputRaw.hivStatus,
    hasAllergyToDrugX: inputRaw.hasAllergyToDrugX,
    nonce: nonceField,
  };

  const base = path.join(__dirname, "..", "build", "patient_predicates");
  const wasmPath = path.join(
    base,
    "patient_predicates_js",
    "patient_predicates.wasm",
  );
  const zkeyPath = path.join(base, "circuit_final.zkey");
  const vkeyPath = path.join(base, "verification_key.json");

  const t0 = nowMs();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath,
  );
  const t1 = nowMs();

  const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  const t2 = nowMs();

  const proofJson = JSON.stringify({ proof, publicSignals });
  const out = {
    proof,
    publicSignals,
    verifiedOk: !!ok,
    timingsMs: { prove: t1 - t0, verify: t2 - t1, total: t2 - t0 },
    proofSizeBytes: Buffer.byteLength(proofJson, "utf8"),
    nonceField, // include for debugging / backend storage if you want
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
