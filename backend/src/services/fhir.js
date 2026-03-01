const crypto = require("crypto");

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function validateObservation(obs) {
  if (!obs || typeof obs !== "object")
    throw new Error("Observation must be an object");
  if (obs.resourceType !== "Observation")
    throw new Error('resourceType must be "Observation"');

  if (!obs.code || typeof obs.code !== "object")
    throw new Error("Observation.code is required");
  if (!obs.effectiveDateTime && !obs.effectivePeriod)
    throw new Error(
      "Observation.effectiveDateTime or effectivePeriod is required",
    );

  if (
    !obs.valueCodeableConcept &&
    !obs.valueQuantity &&
    !obs.valueString &&
    !obs.valueBoolean
  ) {
    throw new Error(
      "Observation must include a value (valueCodeableConcept/valueQuantity/valueString/valueBoolean)",
    );
  }
}

function hashObservation(obs) {
  const s = JSON.stringify(obs);
  return sha256Hex(s);
}

module.exports = { validateObservation, hashObservation };
