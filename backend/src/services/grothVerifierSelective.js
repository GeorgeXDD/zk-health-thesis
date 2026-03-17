const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

function loadVKey() {
  const vkeyPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "circom-prover",
    "build",
    "clinical_predicates_selective_v1",
    "verification_key.json"
  );

  if (!fs.existsSync(vkeyPath)) {
    throw new Error(`verification_key.json not found at: ${vkeyPath}`);
  }

  return JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
}

async function verifySelectiveGroth16(proof, publicSignals) {
  const vkey = loadVKey();
  const t0 = Date.now();
  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  const t1 = Date.now();
  return { verifiedOk: !!ok, verifyTimeMs: t1 - t0 };
}

module.exports = { verifySelectiveGroth16 };
