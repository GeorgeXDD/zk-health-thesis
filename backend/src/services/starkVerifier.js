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

async function verifyStarkReceipt(receiptB64) {
  if (!receiptB64 || typeof receiptB64 !== "string") {
    throw new Error("receiptB64 must be a non-empty base64 string");
  }

  const tmpOut = path.join(
    os.tmpdir(),
    `stark_verify_out_${Date.now()}_${Math.random()}.json`,
  );
  const bin = getHostBinPath();

  if (!fs.existsSync(bin)) {
    throw new Error(`STARK host binary not found at: ${bin}`);
  }

  await runBin(bin, ["--verify-receipt", receiptB64, "--out", tmpOut]);

  if (!fs.existsSync(tmpOut)) {
    throw new Error("STARK verifier did not produce output file");
  }

  const out = JSON.parse(fs.readFileSync(tmpOut, "utf8"));
  try {
    fs.unlinkSync(tmpOut);
  } catch {}
  return out;
}

module.exports = { verifyStarkReceipt };
