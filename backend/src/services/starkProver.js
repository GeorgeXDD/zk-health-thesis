const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { PREDICATE_COUNT } = require("../../../shared/predicateCatalog");

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

async function proveStarkPredicates({ values, nonceField, reqs }) {
  const tmpIn = path.join(
    os.tmpdir(),
    `stark_in_${Date.now()}_${Math.random()}.json`,
  );
  const tmpOut = path.join(
    os.tmpdir(),
    `stark_out_${Date.now()}_${Math.random()}.json`,
  );

  if (!Array.isArray(values) || values.length !== PREDICATE_COUNT) {
    throw new Error(`values must be an array of length ${PREDICATE_COUNT}`);
  }
  if (!Array.isArray(reqs) || reqs.length !== PREDICATE_COUNT) {
    throw new Error(`reqs must be an array of length ${PREDICATE_COUNT}`);
  }

  const input = {
    values: values.map((value) => Number(value) >>> 0),
    nonce_field: normalizeNonceField(nonceField),
    reqs: reqs.map((value) => Number(value) >>> 0),
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
