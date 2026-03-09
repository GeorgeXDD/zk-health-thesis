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

async function verifyHybridWrappedReceipt(snarkReceiptB64) {
  if (!snarkReceiptB64 || typeof snarkReceiptB64 !== "string") {
    throw new Error("snarkReceiptB64 must be a non-empty base64 string");
  }

  const tmpOut = path.join(
    os.tmpdir(),
    `hybrid_verify_out_${Date.now()}_${Math.random()}.json`,
  );
  const bin = getHostBinPath();

  if (!fs.existsSync(bin)) {
    throw new Error(`STARK host binary not found at: ${bin}`);
  }

  await runBin(bin, [
    "--verify-groth16-receipt",
    snarkReceiptB64,
    "--out",
    tmpOut,
  ]);

  if (!fs.existsSync(tmpOut)) {
    throw new Error("Hybrid wrapped verifier did not produce output file");
  }

  const out = JSON.parse(fs.readFileSync(tmpOut, "utf8"));
  try {
    fs.unlinkSync(tmpOut);
  } catch {}

  return {
    verifiedOk: out.verifiedOk ?? out.verified_ok ?? false,
    verifyTimeMs: out.verifyTimeMs ?? out.verify_time_ms ?? null,
    receiptKind: out.receiptKind ?? out.receipt_kind ?? null,
    isGroth16: out.isGroth16 ?? out.is_groth16 ?? null,
    journal: out.journal ?? null,
    raw: out,
  };
}

module.exports = { verifyHybridWrappedReceipt };
