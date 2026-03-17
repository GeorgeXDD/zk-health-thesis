const HIV_PREDICATE = "HIV_NEGATIVE";
const HEPB_PREDICATE = "HEPB_NEGATIVE";
const HEPC_PREDICATE = "HEPC_NEGATIVE";
const COVID_PREDICATE = "COVID_NEGATIVE";
const PREGNANCY_PREDICATE = "PREGNANCY_NEGATIVE";
const HBA1C_PREDICATE = "HBA1C_LT_6_5";
const TOTAL_CHOLESTEROL_PREDICATE = "TOTAL_CHOLESTEROL_LT_200";
const LDL_PREDICATE = "LDL_LT_130";
const FASTING_GLUCOSE_PREDICATE = "FASTING_GLUCOSE_LT_100";
const TRIGLYCERIDES_PREDICATE = "TRIGLYCERIDES_LT_150";
const HDL_PREDICATE = "HDL_GT_40";
const SYSTOLIC_BP_PREDICATE = "SYSTOLIC_BP_LT_130";
const DIASTOLIC_BP_PREDICATE = "DIASTOLIC_BP_LT_80";
const BMI_PREDICATE = "BMI_LT_30";
const CREATININE_PREDICATE = "CREATININE_LT_1_3";

const HIV_LOINC_CODES = new Set(["56888-1"]);
const HEPB_LOINC_CODES = new Set(["5196-1"]);
const HEPC_LOINC_CODES = new Set(["13955-0"]);
const COVID_LOINC_CODES = new Set(["94500-6"]);
const PREGNANCY_LOINC_CODES = new Set(["2106-3"]);
const TOTAL_CHOLESTEROL_LOINC_CODES = new Set(["2093-3"]);
const LDL_LOINC_CODES = new Set(["13457-7"]);
const FASTING_GLUCOSE_LOINC_CODES = new Set(["1558-6"]);
const TRIGLYCERIDES_LOINC_CODES = new Set(["2571-8"]);
const HDL_LOINC_CODES = new Set(["2085-9"]);
const SYSTOLIC_BP_LOINC_CODES = new Set(["8480-6"]);
const DIASTOLIC_BP_LOINC_CODES = new Set(["8462-4"]);
const BMI_LOINC_CODES = new Set(["39156-5"]);
const CREATININE_LOINC_CODES = new Set(["2160-0"]);
const SNOMED_NEGATIVE = "260385009";

function getObservationCode(obs) {
  const coding = obs?.code?.coding;
  if (Array.isArray(coding) && coding.length > 0)
    return coding[0]?.code || null;
  return null;
}

function getObservationValueCode(obs) {
  const coding = obs?.valueCodeableConcept?.coding;
  if (Array.isArray(coding) && coding.length > 0)
    return coding[0]?.code || null;
  return null;
}

function evaluateHivNegative(observation) {
  const loinc = getObservationCode(observation);
  if (!loinc || !HIV_LOINC_CODES.has(loinc)) {
    throw new Error(
      `No matching HIV Observation found (code=${loinc || "null"})`,
    );
  }
  const valueCode = getObservationValueCode(observation);
  return valueCode === SNOMED_NEGATIVE;
}

function hivStatusBitFromObservation(observation) {
  const isNeg = evaluateHivNegative(observation);
  return isNeg ? 0 : 1;
}

function evaluateHepBNegative(observation) {
  const loinc = getObservationCode(observation);
  if (!loinc || !HEPB_LOINC_CODES.has(loinc)) {
    throw new Error(
      `No matching Hepatitis B Observation found (code=${loinc || "null"})`,
    );
  }
  const valueCode = getObservationValueCode(observation);
  return valueCode === SNOMED_NEGATIVE;
}

function hepBStatusBitFromObservation(observation) {
  const isNeg = evaluateHepBNegative(observation);
  return isNeg ? 0 : 1;
}

function evaluateHepCNegative(observation) {
  const loinc = getObservationCode(observation);
  if (!loinc || !HEPC_LOINC_CODES.has(loinc)) {
    throw new Error(
      `No matching Hepatitis C Observation found (code=${loinc || "null"})`,
    );
  }
  const valueCode = getObservationValueCode(observation);
  return valueCode === SNOMED_NEGATIVE;
}

function hepCStatusBitFromObservation(observation) {
  const isNeg = evaluateHepCNegative(observation);
  return isNeg ? 0 : 1;
}

function evaluateCovidNegative(observation) {
  const loinc = getObservationCode(observation);
  if (!loinc || !COVID_LOINC_CODES.has(loinc)) {
    throw new Error(
      `No matching COVID-19 Observation found (code=${loinc || "null"})`,
    );
  }
  const valueCode = getObservationValueCode(observation);
  return valueCode === SNOMED_NEGATIVE;
}

function covidStatusBitFromObservation(observation) {
  const isNeg = evaluateCovidNegative(observation);
  return isNeg ? 0 : 1;
}

function evaluatePregnancyNegative(observation) {
  const loinc = getObservationCode(observation);
  if (!loinc || !PREGNANCY_LOINC_CODES.has(loinc)) {
    throw new Error(
      `No matching Pregnancy Observation found (code=${loinc || "null"})`,
    );
  }
  const valueCode = getObservationValueCode(observation);
  return valueCode === SNOMED_NEGATIVE;
}

function pregnancyStatusBitFromObservation(observation) {
  const isNeg = evaluatePregnancyNegative(observation);
  return isNeg ? 0 : 1;
}

const HBA1C_LOINC_CODES = new Set(["4548-4"]);

function hba1cX100FromObservation(observation) {
  const loinc = getObservationCode(observation);
  if (!loinc || !HBA1C_LOINC_CODES.has(loinc)) {
    throw new Error(
      `No matching HbA1c Observation found (code=${loinc || "null"})`,
    );
  }

  const vq = observation?.valueQuantity;
  const value = vq?.value;

  if (value === undefined || value === null || typeof value !== "number") {
    throw new Error("HbA1c Observation.valueQuantity.value must be a number");
  }

  const unit = (vq?.code || vq?.unit || "").toString().trim();
  if (unit && unit !== "%") {
    throw new Error(`HbA1c unit must be '%' (got '${unit}')`);
  }

  const x100 = Math.round(value * 100);

  if (x100 < 0 || x100 > 2500) {
    throw new Error(`HbA1c value out of bounds: ${value}`);
  }

  return x100;
}

function evaluateHba1cLt6_5(observation) {
  const x100 = hba1cX100FromObservation(observation);
  return x100 < 650;
}

function mgDlX10FromObservation(observation, allowedLoincCodes, label) {
  const loinc = getObservationCode(observation);
  if (!loinc || !allowedLoincCodes.has(loinc)) {
    throw new Error(
      `No matching ${label} Observation found (code=${loinc || "null"})`,
    );
  }

  const vq = observation?.valueQuantity;
  const value = vq?.value;

  if (value === undefined || value === null || typeof value !== "number") {
    throw new Error(
      `${label} Observation.valueQuantity.value must be a number`,
    );
  }

  const unit = (vq?.code || vq?.unit || "").toString().trim().toLowerCase();
  if (unit && unit !== "mg/dl") {
    throw new Error(
      `${label} unit must be 'mg/dL' (got '${vq?.code || vq?.unit || ""}')`,
    );
  }

  const x10 = Math.round(value * 10);
  if (x10 < 0 || x10 > 10000) {
    throw new Error(`${label} value out of bounds: ${value}`);
  }

  return x10;
}

function totalCholesterolX10FromObservation(observation) {
  return mgDlX10FromObservation(
    observation,
    TOTAL_CHOLESTEROL_LOINC_CODES,
    "Total cholesterol",
  );
}

function ldlX10FromObservation(observation) {
  return mgDlX10FromObservation(observation, LDL_LOINC_CODES, "LDL");
}

function fastingGlucoseX10FromObservation(observation) {
  return mgDlX10FromObservation(
    observation,
    FASTING_GLUCOSE_LOINC_CODES,
    "Fasting glucose",
  );
}

function triglyceridesX10FromObservation(observation) {
  return mgDlX10FromObservation(
    observation,
    TRIGLYCERIDES_LOINC_CODES,
    "Triglycerides",
  );
}

function evaluateTotalCholesterolLt200(observation) {
  return totalCholesterolX10FromObservation(observation) < 2000;
}

function evaluateLdlLt130(observation) {
  return ldlX10FromObservation(observation) < 1300;
}

function evaluateFastingGlucoseLt100(observation) {
  return fastingGlucoseX10FromObservation(observation) < 1000;
}

function evaluateTriglyceridesLt150(observation) {
  return triglyceridesX10FromObservation(observation) < 1500;
}

function x10FromObservation(observation, allowedLoincCodes, label, validUnits) {
  const loinc = getObservationCode(observation);
  if (!loinc || !allowedLoincCodes.has(loinc)) {
    throw new Error(
      `No matching ${label} Observation found (code=${loinc || "null"})`,
    );
  }

  const vq = observation?.valueQuantity;
  const value = vq?.value;
  if (value === undefined || value === null || typeof value !== "number") {
    throw new Error(
      `${label} Observation.valueQuantity.value must be a number`,
    );
  }

  const unitRaw = (vq?.code || vq?.unit || "").toString().trim();
  const unit = unitRaw.toLowerCase();
  if (unit && validUnits.size > 0 && !validUnits.has(unit)) {
    throw new Error(`${label} unit is invalid (got '${unitRaw}')`);
  }

  const x10 = Math.round(value * 10);
  if (x10 < 0 || x10 > 10000) {
    throw new Error(`${label} value out of bounds: ${value}`);
  }

  return x10;
}

function hdlX10FromObservation(observation) {
  return x10FromObservation(
    observation,
    HDL_LOINC_CODES,
    "HDL",
    new Set(["mg/dl"]),
  );
}

function systolicBpX10FromObservation(observation) {
  return x10FromObservation(
    observation,
    SYSTOLIC_BP_LOINC_CODES,
    "Systolic blood pressure",
    new Set(["mm[hg]", "mmhg"]),
  );
}

function diastolicBpX10FromObservation(observation) {
  return x10FromObservation(
    observation,
    DIASTOLIC_BP_LOINC_CODES,
    "Diastolic blood pressure",
    new Set(["mm[hg]", "mmhg"]),
  );
}

function bmiX10FromObservation(observation) {
  return x10FromObservation(
    observation,
    BMI_LOINC_CODES,
    "BMI",
    new Set(["kg/m2", "kg/m^2"]),
  );
}

function creatinineX10FromObservation(observation) {
  return x10FromObservation(
    observation,
    CREATININE_LOINC_CODES,
    "Creatinine",
    new Set(["mg/dl"]),
  );
}

function evaluateHdlGt40(observation) {
  return hdlX10FromObservation(observation) > 400;
}

function evaluateSystolicBpLt130(observation) {
  return systolicBpX10FromObservation(observation) < 1300;
}

function evaluateDiastolicBpLt80(observation) {
  return diastolicBpX10FromObservation(observation) < 800;
}

function evaluateBmiLt30(observation) {
  return bmiX10FromObservation(observation) < 300;
}

function evaluateCreatinineLt1_3(observation) {
  return creatinineX10FromObservation(observation) < 13;
}

module.exports = {
  HIV_PREDICATE,
  HEPB_PREDICATE,
  HEPC_PREDICATE,
  COVID_PREDICATE,
  PREGNANCY_PREDICATE,
  HBA1C_PREDICATE,
  TOTAL_CHOLESTEROL_PREDICATE,
  LDL_PREDICATE,
  FASTING_GLUCOSE_PREDICATE,
  TRIGLYCERIDES_PREDICATE,
  HDL_PREDICATE,
  SYSTOLIC_BP_PREDICATE,
  DIASTOLIC_BP_PREDICATE,
  BMI_PREDICATE,
  CREATININE_PREDICATE,

  evaluateHivNegative,
  hivStatusBitFromObservation,
  evaluateHepBNegative,
  hepBStatusBitFromObservation,
  evaluateHepCNegative,
  hepCStatusBitFromObservation,
  evaluateCovidNegative,
  covidStatusBitFromObservation,
  evaluatePregnancyNegative,
  pregnancyStatusBitFromObservation,

  hba1cX100FromObservation,
  evaluateHba1cLt6_5,
  totalCholesterolX10FromObservation,
  ldlX10FromObservation,
  fastingGlucoseX10FromObservation,
  triglyceridesX10FromObservation,
  evaluateTotalCholesterolLt200,
  evaluateLdlLt130,
  evaluateFastingGlucoseLt100,
  evaluateTriglyceridesLt150,
  hdlX10FromObservation,
  systolicBpX10FromObservation,
  diastolicBpX10FromObservation,
  bmiX10FromObservation,
  creatinineX10FromObservation,
  evaluateHdlGt40,
  evaluateSystolicBpLt130,
  evaluateDiastolicBpLt80,
  evaluateBmiLt30,
  evaluateCreatinineLt1_3,
};
