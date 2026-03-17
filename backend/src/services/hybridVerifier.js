const { verifyStarkReceipt } = require("./starkVerifier");
const { verifyHybridWrappedReceipt } = require("./hybridWrapperVerifier");

function normalizeJournalShape(journal) {
  const j = journal || {};
  const required = [
    "out_hiv",
    "out_hepb",
    "out_hepc",
    "out_covid",
    "out_preg",
    "out_a1c_ok",
    "out_total_chol_ok",
    "out_ldl_ok",
    "out_fasting_glucose_ok",
    "out_triglycerides_ok",
    "out_hdl_ok",
    "out_systolic_bp_ok",
    "out_diastolic_bp_ok",
    "out_bmi_ok",
    "out_creatinine_ok",
    "nonce_field",
    "req_hiv",
    "req_hepb",
    "req_hepc",
    "req_covid",
    "req_preg",
    "req_a1c",
    "req_total_chol",
    "req_ldl",
    "req_fasting_glucose",
    "req_triglycerides",
    "req_hdl",
    "req_systolic_bp",
    "req_diastolic_bp",
    "req_bmi",
    "req_creatinine",
  ];
  for (const key of required) {
    if (j[key] === undefined || j[key] === null) {
      throw new Error(`Hybrid journal missing field: ${key}`);
    }
  }
  return {
    out_hiv: Number(j.out_hiv),
    out_hepb: Number(j.out_hepb),
    out_hepc: Number(j.out_hepc),
    out_covid: Number(j.out_covid),
    out_preg: Number(j.out_preg),
    out_a1c_ok: Number(j.out_a1c_ok),
    out_total_chol_ok: Number(j.out_total_chol_ok),
    out_ldl_ok: Number(j.out_ldl_ok),
    out_fasting_glucose_ok: Number(j.out_fasting_glucose_ok),
    out_triglycerides_ok: Number(j.out_triglycerides_ok),
    out_hdl_ok: Number(j.out_hdl_ok),
    out_systolic_bp_ok: Number(j.out_systolic_bp_ok),
    out_diastolic_bp_ok: Number(j.out_diastolic_bp_ok),
    out_bmi_ok: Number(j.out_bmi_ok),
    out_creatinine_ok: Number(j.out_creatinine_ok),
    nonce_field: String(j.nonce_field),
    req_hiv: Number(j.req_hiv),
    req_hepb: Number(j.req_hepb),
    req_hepc: Number(j.req_hepc),
    req_covid: Number(j.req_covid),
    req_preg: Number(j.req_preg),
    req_a1c: Number(j.req_a1c),
    req_total_chol: Number(j.req_total_chol),
    req_ldl: Number(j.req_ldl),
    req_fasting_glucose: Number(j.req_fasting_glucose),
    req_triglycerides: Number(j.req_triglycerides),
    req_hdl: Number(j.req_hdl),
    req_systolic_bp: Number(j.req_systolic_bp),
    req_diastolic_bp: Number(j.req_diastolic_bp),
    req_bmi: Number(j.req_bmi),
    req_creatinine: Number(j.req_creatinine),
  };
}

function journalsEqual(a, b) {
  const ja = normalizeJournalShape(a);
  const jb = normalizeJournalShape(b);
  return (
    ja.out_hiv === jb.out_hiv &&
    ja.out_hepb === jb.out_hepb &&
    ja.out_hepc === jb.out_hepc &&
    ja.out_covid === jb.out_covid &&
    ja.out_preg === jb.out_preg &&
    ja.out_a1c_ok === jb.out_a1c_ok &&
    ja.out_total_chol_ok === jb.out_total_chol_ok &&
    ja.out_ldl_ok === jb.out_ldl_ok &&
    ja.out_fasting_glucose_ok === jb.out_fasting_glucose_ok &&
    ja.out_triglycerides_ok === jb.out_triglycerides_ok &&
    ja.out_hdl_ok === jb.out_hdl_ok &&
    ja.out_systolic_bp_ok === jb.out_systolic_bp_ok &&
    ja.out_diastolic_bp_ok === jb.out_diastolic_bp_ok &&
    ja.out_bmi_ok === jb.out_bmi_ok &&
    ja.out_creatinine_ok === jb.out_creatinine_ok &&
    ja.nonce_field === jb.nonce_field &&
    ja.req_hiv === jb.req_hiv &&
    ja.req_hepb === jb.req_hepb &&
    ja.req_hepc === jb.req_hepc &&
    ja.req_covid === jb.req_covid &&
    ja.req_preg === jb.req_preg &&
    ja.req_a1c === jb.req_a1c &&
    ja.req_total_chol === jb.req_total_chol &&
    ja.req_ldl === jb.req_ldl &&
    ja.req_fasting_glucose === jb.req_fasting_glucose &&
    ja.req_triglycerides === jb.req_triglycerides &&
    ja.req_hdl === jb.req_hdl &&
    ja.req_systolic_bp === jb.req_systolic_bp &&
    ja.req_diastolic_bp === jb.req_diastolic_bp &&
    ja.req_bmi === jb.req_bmi &&
    ja.req_creatinine === jb.req_creatinine
  );
}

async function verifyHybridArtifacts({ starkReceiptB64, snarkReceiptB64 }) {
  if (!snarkReceiptB64) {
    throw new Error("snarkReceiptB64 is required");
  }

  const fast = await verifyHybridWrappedReceipt(snarkReceiptB64);

  let deep = null;
  let journalsMatch = null;
  if (starkReceiptB64) {
    deep = await verifyStarkReceipt(starkReceiptB64);
    if (fast.verifiedOk && deep.verifiedOk) {
      try {
        journalsMatch = journalsEqual(fast.journal, deep.journal);
      } catch {
        journalsMatch = false;
      }
    }
  }

  const verifiedOk =
    !!fast.verifiedOk &&
    (deep ? !!deep.verifiedOk : true) &&
    (journalsMatch === null ? true : journalsMatch);

  return {
    verifiedOk,
    fast,
    deep,
    journalsMatch,
  };
}

module.exports = { verifyHybridArtifacts };
