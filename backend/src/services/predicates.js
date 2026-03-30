"use strict";

const { PREDICATES, PREDICATE_COUNT } = require("../../../shared/predicateCatalog");

const SNOMED_NEGATIVE = "260385009";
const NEGATIVE_TOKENS = [
  "negative",
  "not detected",
  "non reactive",
  "non-reactive",
  "absent",
];
const POSITIVE_TOKENS = [
  "positive",
  "detected",
  "reactive",
  "present",
  "pos",
];

const PREDICATES_BY_NAME = new Map(
  PREDICATES.map((predicate) => [predicate.predicate, predicate]),
);
const ALLOWED_PREDICATES = new Set(PREDICATES.map((predicate) => predicate.predicate));

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeUnit(value) {
  return String(value || "").trim().toLowerCase();
}

function toFieldFromHexString(hex) {
  return BigInt("0x" + String(hex || "")).toString();
}

function valuesFromCodeSection(section) {
  const values = [];
  const coding = section?.coding;
  if (Array.isArray(coding)) {
    for (const entry of coding) {
      if (entry?.code) values.push(entry.code);
      if (entry?.display) values.push(entry.display);
      if (entry?.system) values.push(entry.system);
    }
  }
  if (section?.text) values.push(section.text);
  return values;
}

function getObservationCodeStrings(observation) {
  return valuesFromCodeSection(observation?.code);
}

function getObservationValueStrings(observation) {
  const values = [];
  values.push(...valuesFromCodeSection(observation?.valueCodeableConcept));
  if (observation?.valueString) values.push(observation.valueString);
  if (observation?.valueBoolean === true) values.push("true");
  if (observation?.valueBoolean === false) values.push("false");
  return values;
}

function getObservationSearchText(observation) {
  return normalizeText(getObservationCodeStrings(observation).join(" "));
}

function matchesKeywords(normalizedHaystack, groups) {
  if (!Array.isArray(groups) || groups.length === 0) return false;
  return groups.some((group) =>
    group.every((token) => normalizedHaystack.includes(normalizeText(token))),
  );
}

function matchesObservation(predicate, observation) {
  const codes = new Set(
    getObservationCodeStrings(observation).map((value) => String(value).trim()),
  );

  if (predicate.codes.some((code) => codes.has(code))) {
    return true;
  }

  const haystack = getObservationSearchText(observation);
  if (!haystack) return false;

  if (
    Array.isArray(predicate.excludes) &&
    predicate.excludes.some((token) => haystack.includes(normalizeText(token)))
  ) {
    return false;
  }

  return matchesKeywords(haystack, predicate.keywords);
}

function readNegativeBit(observation) {
  if (observation?.valueBoolean === false) return 0;
  if (observation?.valueBoolean === true) return 1;

  const rawValues = getObservationValueStrings(observation);
  const codes = rawValues.map((value) => String(value).trim());
  if (codes.includes(SNOMED_NEGATIVE)) return 0;

  const normalized = normalizeText(rawValues.join(" "));
  if (NEGATIVE_TOKENS.some((token) => normalized.includes(normalizeText(token)))) {
    return 0;
  }
  if (POSITIVE_TOKENS.some((token) => normalized.includes(normalizeText(token)))) {
    return 1;
  }

  throw new Error("Observation result must clearly indicate a negative or positive value");
}

function readScaledQuantity(predicate, observation) {
  const quantity = observation?.valueQuantity;
  const value = quantity?.value;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${predicate.label} Observation.valueQuantity.value must be a number`);
  }

  const unit = normalizeUnit(quantity?.code || quantity?.unit || "");
  if (predicate.units.length > 0 && unit && !predicate.units.includes(unit)) {
    throw new Error(
      `${predicate.label} unit is invalid (got '${quantity?.code || quantity?.unit || ""}')`,
    );
  }

  const scaled = Math.round(value * predicate.scale);
  if (!Number.isFinite(scaled) || scaled < 0 || scaled > 1_000_000_000) {
    throw new Error(`${predicate.label} value out of bounds: ${value}`);
  }
  return scaled;
}

function inputValueFromObservation(predicate, observation) {
  if (!matchesObservation(predicate, observation)) {
    throw new Error(
      `No matching ${predicate.label} Observation found (code=${getObservationCodeStrings(observation)[0] || "null"})`,
    );
  }

  if (predicate.type === "coded_negative") {
    return readNegativeBit(observation);
  }

  return readScaledQuantity(predicate, observation);
}

function evaluatePredicate(predicate, value) {
  if (predicate.type === "coded_negative") {
    if (value !== 0 && value !== 1) {
      throw new Error(`${predicate.predicate} expects a boolean status bit`);
    }
    return value === 0 ? 1 : 0;
  }

  if (predicate.comparator === "lt") {
    return value < predicate.threshold ? 1 : 0;
  }

  if (predicate.comparator === "gt") {
    return value > predicate.threshold ? 1 : 0;
  }

  throw new Error(`Unsupported comparator for ${predicate.predicate}`);
}

function selectorsFromPredicates(predicates) {
  const wanted = new Set(predicates || []);
  return PREDICATES.map((predicate) => (wanted.has(predicate.predicate) ? 1 : 0));
}

function findLatestObservation(rows, predicate) {
  for (const row of rows) {
    try {
      const value = inputValueFromObservation(predicate, row.resource);
      return { obs: row.resource, hash: row.resource_hash, value };
    } catch {}
  }
  return null;
}

function buildInputBundleFromObservations(rows, predicates) {
  const reqs = selectorsFromPredicates(predicates);
  const values = new Array(PREDICATE_COUNT).fill(0);
  const fhirHashes = {};

  for (const predicateName of predicates || []) {
    const predicate = PREDICATES_BY_NAME.get(predicateName);
    if (!predicate) {
      throw new Error(`Unsupported predicate: ${predicateName}`);
    }

    const found = findLatestObservation(rows, predicate);
    if (!found) {
      throw new Error(`No ${predicate.label} Observation found for patient`);
    }

    values[predicate.index] = found.value;
    fhirHashes[predicate.predicate] = found.hash || null;
  }

  return { values, reqs, fhirHashes };
}

function buildDecodedFromOutputsReqs(outs, reqs, nonceField) {
  const outputs = {};
  const selectors = {};

  for (const predicate of PREDICATES) {
    outputs[predicate.predicate] = Number(outs[predicate.index] || 0);
    selectors[predicate.predicate] = Number(reqs[predicate.index] || 0);
  }

  return {
    outputs,
    selectors,
    nonceField: String(nonceField),
  };
}

function buildDecodedFromValuesReqs(values, reqs, nonceHex) {
  const outs = PREDICATES.map((predicate, index) =>
    Number(reqs[index] || 0) * evaluatePredicate(predicate, Number(values[index] || 0)),
  );
  return buildDecodedFromOutputsReqs(outs, reqs, toFieldFromHexString(nonceHex));
}

function decodeGrothPublicSignals(publicSignals) {
  const expected = PREDICATE_COUNT * 2 + 1;
  if (!Array.isArray(publicSignals) || publicSignals.length < expected) {
    throw new Error("Unexpected publicSignals returned by Groth prover");
  }

  const outs = publicSignals.slice(0, PREDICATE_COUNT).map(Number);
  const nonceField = String(publicSignals[PREDICATE_COUNT]);
  const reqs = publicSignals
    .slice(PREDICATE_COUNT + 1, PREDICATE_COUNT * 2 + 1)
    .map(Number);

  return buildDecodedFromOutputsReqs(outs, reqs, nonceField);
}

function decodeJournal(journal) {
  const outs = journal?.outs;
  const reqs = journal?.reqs;
  if (!Array.isArray(outs) || outs.length !== PREDICATE_COUNT) {
    throw new Error("Verified journal missing outs array");
  }
  if (!Array.isArray(reqs) || reqs.length !== PREDICATE_COUNT) {
    throw new Error("Verified journal missing reqs array");
  }
  if (journal?.nonce_field === undefined || journal?.nonce_field === null) {
    throw new Error("Verified journal missing nonce_field");
  }

  return buildDecodedFromOutputsReqs(outs, reqs, journal.nonce_field);
}

function buildPredicatesResult(predicates, decoded) {
  const result = {};
  for (const predicate of predicates || []) {
    result[predicate] = decoded?.outputs?.[predicate] === 1;
  }
  return result;
}

function filterDecodedForDoctor(predicates, decodedAll) {
  const filtered = { outputs: {}, nonceField: decodedAll?.nonceField ?? null };

  for (const predicate of predicates || []) {
    if (decodedAll?.outputs && Object.prototype.hasOwnProperty.call(decodedAll.outputs, predicate)) {
      filtered.outputs[predicate] = decodedAll.outputs[predicate];
    }
  }

  return filtered;
}

function decodedShapeEquals(a, b) {
  if (String(a?.nonceField) !== String(b?.nonceField)) return false;

  for (const predicate of PREDICATES) {
    const name = predicate.predicate;
    if (String(a?.outputs?.[name] ?? 0) !== String(b?.outputs?.[name] ?? 0)) {
      return false;
    }
    if (String(a?.selectors?.[name] ?? 0) !== String(b?.selectors?.[name] ?? 0)) {
      return false;
    }
  }

  return true;
}

module.exports = {
  PREDICATES,
  PREDICATE_COUNT,
  ALLOWED_PREDICATES,
  PREDICATES_BY_NAME,
  selectorsFromPredicates,
  buildInputBundleFromObservations,
  buildDecodedFromValuesReqs,
  buildPredicatesResult,
  filterDecodedForDoctor,
  decodeGrothPublicSignals,
  decodeJournal,
  decodedShapeEquals,
  evaluatePredicate,
};
