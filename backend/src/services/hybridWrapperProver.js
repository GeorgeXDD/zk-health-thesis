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

async function wrapStarkReceiptToGroth16(receiptB64) {
  if (!receiptB64 || typeof receiptB64 !== "string") {
    throw new Error("receiptB64 must be a non-empty base64 string");
  }

  const tmpOut = path.join(
    os.tmpdir(),
    `hybrid_wrap_out_${Date.now()}_${Math.random()}.json`,
  );
  const bin = getHostBinPath();

  if (!fs.existsSync(bin)) {
    throw new Error(`STARK host binary not found at: ${bin}`);
  }

  await runBin(bin, ["--wrap-receipt", receiptB64, "--out", tmpOut]);

  if (!fs.existsSync(tmpOut)) {
    throw new Error("Hybrid wrapper did not produce output file");
  }

  const out = JSON.parse(fs.readFileSync(tmpOut, "utf8"));
  try {
    fs.unlinkSync(tmpOut);
  } catch {}

  return {
    wrappedOk: out.wrappedOk ?? out.wrapped_ok ?? false,
    wrapTimeMs: out.wrapTimeMs ?? out.wrap_time_ms ?? null,
    verifyTimeMs: out.verifyTimeMs ?? out.verify_time_ms ?? null,
    totalTimeMs: out.totalTimeMs ?? out.total_time_ms ?? null,
    snarkReceiptSizeBytes:
      out.snarkReceiptSizeBytes ?? out.snark_receipt_size_bytes ?? null,
    snarkReceiptB64: out.snarkReceiptB64 ?? out.snark_receipt_b64 ?? null,
    receiptKind: out.receiptKind ?? out.receipt_kind ?? null,
    isGroth16: out.isGroth16 ?? out.is_groth16 ?? null,
    journal: out.journal ?? null,
    raw: out,
  };
}

module.exports = { wrapStarkReceiptToGroth16 };
