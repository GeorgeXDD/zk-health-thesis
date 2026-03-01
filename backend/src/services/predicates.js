const HIV_PREDICATE = "HIV_NEGATIVE";
const HBA1C_PREDICATE = "HBA1C_LT_6_5";

const HIV_LOINC_CODES = new Set(["56888-1"]);
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
  HBA1C_PREDICATE,

  evaluateHivNegative,
  hivStatusBitFromObservation,

  hba1cX100FromObservation,
  evaluateHba1cLt6_5,
};
