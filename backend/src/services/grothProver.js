const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function runNodeScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [scriptPath, ...args],
      { maxBuffer: 50 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr?.toString() || err.message));
        }
        resolve(stdout.toString());
      },
    );
  });
}

async function proveSelectivePredicates(input) {
  const tmpIn = path.join(
    os.tmpdir(),
    `circom_in_${Date.now()}_${Math.random()}.json`,
  );
  const tmpOut = path.join(
    os.tmpdir(),
    `circom_out_${Date.now()}_${Math.random()}.json`,
  );

  fs.writeFileSync(tmpIn, JSON.stringify(input, null, 2));

  const script = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "circom-prover",
    "scripts",
    "prove_clinical_predicates_selective_v1.js",
  );

  if (!fs.existsSync(script)) {
    throw new Error(`Prover script not found at: ${script}`);
  }

  await runNodeScript(script, ["--in", tmpIn, "--out", tmpOut]);

  if (!fs.existsSync(tmpOut)) {
    throw new Error("Prover did not produce output file (tmpOut missing)");
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

module.exports = { proveSelectivePredicates };
