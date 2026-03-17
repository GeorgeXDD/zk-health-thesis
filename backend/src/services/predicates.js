const HIV_PREDICATE = "HIV_NEGATIVE";
const HEPB_PREDICATE = "HEPB_NEGATIVE";
const HEPC_PREDICATE = "HEPC_NEGATIVE";
const COVID_PREDICATE = "COVID_NEGATIVE";
const PREGNANCY_PREDICATE = "PREGNANCY_NEGATIVE";
const HBA1C_PREDICATE = "HBA1C_LT_6_5";

const HIV_LOINC_CODES = new Set(["56888-1"]);
const HEPB_LOINC_CODES = new Set(["5196-1"]);
const HEPC_LOINC_CODES = new Set(["13955-0"]);
const COVID_LOINC_CODES = new Set(["94500-6"]);
const PREGNANCY_LOINC_CODES = new Set(["2106-3"]);
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

module.exports = {
  HIV_PREDICATE,
  HEPB_PREDICATE,
  HEPC_PREDICATE,
  COVID_PREDICATE,
  PREGNANCY_PREDICATE,
  HBA1C_PREDICATE,

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
};
