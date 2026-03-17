const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function runBin(binPath, args) {
  return new Promise((resolve, reject) => {
    execFile(
      binPath,
      args,
      { maxBuffer: 50 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr?.toString() || err.message));
        resolve(stdout?.toString() || "");
      },
    );
  });
}

function getHostBinPath() {
  const p = process.env.STARK_HOST_BIN;
  if (!p) throw new Error("STARK_HOST_BIN is not set in backend/.env");
  return path.resolve(process.cwd(), p);
}

function normalizeNonceField(nonceField) {
  if (nonceField === undefined || nonceField === null) {
    throw new Error("nonceField is required for STARK proving");
  }
  const s = String(nonceField).trim();
  if (!s) throw new Error("nonceField is empty");

  if (/^[0-9a-fA-F]+$/.test(s) && !/^0x/i.test(s)) return `0x${s}`;

  return s;
}

async function proveStarkPredicates({
  hivStatusBit,
  hepBStatusBit,
  hepCStatusBit,
  covidStatusBit,
  pregnancyStatusBit,
  hba1cX100,
  totalCholesterolX10,
  ldlX10,
  fastingGlucoseX10,
  triglyceridesX10,
  nonceField,
  reqHiv,
  reqHepB,
  reqHepC,
  reqCovid,
  reqPreg,
  reqA1c,
  reqTotalChol,
  reqLdl,
  reqFastingGlucose,
  reqTriglycerides,
}) {
  const tmpIn = path.join(
    os.tmpdir(),
    `stark_in_${Date.now()}_${Math.random()}.json`,
  );
  const tmpOut = path.join(
    os.tmpdir(),
    `stark_out_${Date.now()}_${Math.random()}.json`,
  );

  const input = {
    hiv_status_bit: Number(hivStatusBit) >>> 0,
    hepb_status_bit: Number(hepBStatusBit) >>> 0,
    hepc_status_bit: Number(hepCStatusBit) >>> 0,
    covid_status_bit: Number(covidStatusBit) >>> 0,
    pregnancy_status_bit: Number(pregnancyStatusBit) >>> 0,
    hba1c_x100: Number(hba1cX100) >>> 0,
    total_cholesterol_x10: Number(totalCholesterolX10) >>> 0,
    ldl_x10: Number(ldlX10) >>> 0,
    fasting_glucose_x10: Number(fastingGlucoseX10) >>> 0,
    triglycerides_x10: Number(triglyceridesX10) >>> 0,
    nonce_field: normalizeNonceField(nonceField),
    req_hiv: Number(reqHiv) >>> 0,
    req_hepb: Number(reqHepB) >>> 0,
    req_hepc: Number(reqHepC) >>> 0,
    req_covid: Number(reqCovid) >>> 0,
    req_preg: Number(reqPreg) >>> 0,
    req_a1c: Number(reqA1c) >>> 0,
    req_total_chol: Number(reqTotalChol) >>> 0,
    req_ldl: Number(reqLdl) >>> 0,
    req_fasting_glucose: Number(reqFastingGlucose) >>> 0,
    req_triglycerides: Number(reqTriglycerides) >>> 0,
  };

  fs.writeFileSync(tmpIn, JSON.stringify(input, null, 2));

  const bin = getHostBinPath();
  if (!fs.existsSync(bin)) {
    throw new Error(
      `STARK host binary not found at: ${bin}. Run: (cd stark-prover && cargo build --release)`,
    );
  }

  await runBin(bin, ["--in", tmpIn, "--out", tmpOut]);

  if (!fs.existsSync(tmpOut)) {
    throw new Error(
      "STARK prover did not produce output file (tmpOut missing)",
    );
  }

  const out = JSON.parse(fs.readFileSync(tmpOut, "utf8"));

  try {
    fs.unlinkSync(tmpIn);
  } catch {}
  try {
    fs.unlinkSync(tmpOut);
  } catch {}

  return out;
}

module.exports = { proveStarkPredicates };
