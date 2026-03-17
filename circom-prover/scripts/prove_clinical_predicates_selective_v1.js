const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

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

  const required = [
    "hivStatus",
    "hepBStatus",
    "hepCStatus",
    "covidStatus",
    "pregnancyStatus",
    "hba1cX100",
    "totalCholesterolX10",
    "ldlX10",
    "fastingGlucoseX10",
    "triglyceridesX10",
    "hdlX10",
    "systolicBpX10",
    "diastolicBpX10",
    "bmiX10",
    "creatinineX10",
    "nonce",
    "reqHiv",
    "reqHepB",
    "reqHepC",
    "reqCovid",
    "reqPreg",
    "reqA1c",
    "reqTotalChol",
    "reqLdl",
    "reqFastingGlucose",
    "reqTriglycerides",
    "reqHdl",
    "reqSystolicBp",
    "reqDiastolicBp",
    "reqBmi",
    "reqCreatinine",
  ];

  for (const k of required) {
    if (input[k] === undefined || input[k] === null) {
      throw new Error(`Missing required input: ${k}`);
    }
  }

  const nonceHex = String(input.nonce);
  const nonceField = toFieldFromHexString(nonceHex);

  const circuitInput = {
    hivStatus: input.hivStatus,
    hepBStatus: input.hepBStatus,
    hepCStatus: input.hepCStatus,
    covidStatus: input.covidStatus,
    pregnancyStatus: input.pregnancyStatus,
    hba1cX100: input.hba1cX100,
    totalCholesterolX10: input.totalCholesterolX10,
    ldlX10: input.ldlX10,
    fastingGlucoseX10: input.fastingGlucoseX10,
    triglyceridesX10: input.triglyceridesX10,
    hdlX10: input.hdlX10,
    systolicBpX10: input.systolicBpX10,
    diastolicBpX10: input.diastolicBpX10,
    bmiX10: input.bmiX10,
    creatinineX10: input.creatinineX10,
    nonce: nonceField,
    reqHiv: input.reqHiv,
    reqHepB: input.reqHepB,
    reqHepC: input.reqHepC,
    reqCovid: input.reqCovid,
    reqPreg: input.reqPreg,
    reqA1c: input.reqA1c,
    reqTotalChol: input.reqTotalChol,
    reqLdl: input.reqLdl,
    reqFastingGlucose: input.reqFastingGlucose,
    reqTriglycerides: input.reqTriglycerides,
    reqHdl: input.reqHdl,
    reqSystolicBp: input.reqSystolicBp,
    reqDiastolicBp: input.reqDiastolicBp,
    reqBmi: input.reqBmi,
    reqCreatinine: input.reqCreatinine,
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
