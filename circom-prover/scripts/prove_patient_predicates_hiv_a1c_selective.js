const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

function toFieldFromHexString(hex) {
  // interpret hex nonce as BigInt
  // note: if hex is very large, mod curve order is handled by snarkjs witness calc
  return BigInt('0x' + hex).toString();
}

async function main() {
  const args = process.argv.slice(2);
  const inIdx = args.indexOf('--in');
  const outIdx = args.indexOf('--out');
  if (inIdx === -1 || outIdx === -1) {
    console.error('Usage: node scripts/prove_patient_predicates_hiv_a1c_selective.js --in <input.json> --out <output.json>');
    process.exit(2);
  }

  const inPath = args[inIdx + 1];
  const outPath = args[outIdx + 1];

  const input = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  // Required fields
  const required = ['hivStatus', 'hba1cX100', 'nonce', 'reqHiv', 'reqA1c'];
  for (const k of required) {
    if (input[k] === undefined || input[k] === null) {
      throw new Error(`Missing required input: ${k}`);
    }
  }

  // Convert nonce hex -> field element decimal string
  const nonceHex = String(input.nonce);
  const nonceField = toFieldFromHexString(nonceHex);

  const circuitInput = {
    hivStatus: input.hivStatus,
    hba1cX100: input.hba1cX100,
    nonce: nonceField,
    reqHiv: input.reqHiv,
    reqA1c: input.reqA1c,
  };

  const base = path.join(__dirname, '..', 'build', 'patient_predicates_hiv_a1c_selective');
  const wasmPath = path.join(base, 'patient_predicates_hiv_a1c_selective_js', 'patient_predicates_hiv_a1c_selective.wasm');
  const zkeyPath = path.join(base, 'circuit_final.zkey');
  const vkeyPath = path.join(base, 'verification_key.json');

  if (!fs.existsSync(wasmPath)) throw new Error(`WASM not found: ${wasmPath}`);
  if (!fs.existsSync(zkeyPath)) throw new Error(`zkey not found: ${zkeyPath}`);
  if (!fs.existsSync(vkeyPath)) throw new Error(`verification_key.json not found: ${vkeyPath}`);

  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

  const t0 = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
  const t1 = Date.now();

  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  const t2 = Date.now();

  const out = {
    proof,
    publicSignals,
    verifiedOk: !!ok,
    timingsMs: { prove: t1 - t0, verify: t2 - t1, total: t2 - t0 },
    proofSizeBytes: Buffer.byteLength(JSON.stringify(proof), 'utf8'),
    nonceField,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  process.stdout.write(JSON.stringify(out) + '\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
