const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

function nowMs() { return Date.now(); }

const SNARK_FIELD = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

function nonceToField(nonce) {
  if (typeof nonce === 'number') return BigInt(nonce) % SNARK_FIELD;
  if (typeof nonce !== 'string') throw new Error('nonce must be a string or number');

  const s = nonce.trim().toLowerCase();
  if (s.startsWith('0x')) return (BigInt(s) % SNARK_FIELD);
  if (/^[0-9a-f]+$/i.test(s) && /[a-f]/i.test(s)) return (BigInt('0x' + s) % SNARK_FIELD);
  if (/^\d+$/.test(s)) return (BigInt(s) % SNARK_FIELD);

  throw new Error('nonce must be hex or decimal string');
}

async function main() {
  const args = process.argv.slice(2);
  const inIdx = args.indexOf('--in');
  const outIdx = args.indexOf('--out');

  if (inIdx === -1 || outIdx === -1) {
    console.error('Usage: node scripts/prove_patient_predicates_selective.js --in <input.json> --out <output.json>');
    process.exit(2);
  }

  const inPath = args[inIdx + 1];
  const outPath = args[outIdx + 1];

  const inputRaw = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  for (const k of ['age','hivStatus','hasAllergyToDrugX','nonce','reqAdult','reqHiv','reqAllergy']) {
    if (inputRaw[k] === undefined) throw new Error(`Missing input field: ${k}`);
  }

  const nonceField = nonceToField(inputRaw.nonce).toString();

  const input = {
    age: inputRaw.age,
    hivStatus: inputRaw.hivStatus,
    hasAllergyToDrugX: inputRaw.hasAllergyToDrugX,
    nonce: nonceField,
    reqAdult: inputRaw.reqAdult,
    reqHiv: inputRaw.reqHiv,
    reqAllergy: inputRaw.reqAllergy
  };

  const base = path.join(__dirname, '..', 'build', 'patient_predicates_selective');
  const wasmPath = path.join(base, 'patient_predicates_selective_js', 'patient_predicates_selective.wasm');
  const zkeyPath = path.join(base, 'circuit_final.zkey');
  const vkeyPath = path.join(base, 'verification_key.json');

  const t0 = nowMs();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
  const t1 = nowMs();

  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  const t2 = nowMs();

  if (!Array.isArray(publicSignals) || publicSignals.length !== 7) {
    throw new Error(`Unexpected publicSignals length=${publicSignals?.length}. Expected 7.`);
  }

  const out = {
    proof,
    publicSignals,
    verifiedOk: !!ok,
    timingsMs: { prove: t1 - t0, verify: t2 - t1, total: t2 - t0 },
    proofSizeBytes: Buffer.byteLength(JSON.stringify({ proof, publicSignals }), 'utf8'),
    nonceField
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');

  // IMPORTANT: snarkjs/wasm can keep handles open; force exit so callers don't hang.
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
