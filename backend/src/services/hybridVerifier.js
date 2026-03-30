"use strict";

const { PREDICATE_COUNT } = require("../../../shared/predicateCatalog");
const { verifyStarkReceipt } = require("./starkVerifier");
const { verifyHybridWrappedReceipt } = require("./hybridWrapperVerifier");

function normalizeJournalShape(journal) {
  const outs = journal?.outs;
  const reqs = journal?.reqs;
  const nonceField = journal?.nonce_field;

  if (!Array.isArray(outs) || outs.length !== PREDICATE_COUNT) {
    throw new Error("Hybrid journal missing outs array");
  }
  if (!Array.isArray(reqs) || reqs.length !== PREDICATE_COUNT) {
    throw new Error("Hybrid journal missing reqs array");
  }
  if (nonceField === undefined || nonceField === null) {
    throw new Error("Hybrid journal missing nonce_field");
  }

  return {
    outs: outs.map(Number),
    reqs: reqs.map(Number),
    nonce_field: String(nonceField),
  };
}

function journalsEqual(a, b) {
  const ja = normalizeJournalShape(a);
  const jb = normalizeJournalShape(b);

  if (ja.nonce_field !== jb.nonce_field) return false;

  for (let i = 0; i < PREDICATE_COUNT; i += 1) {
    if (ja.outs[i] !== jb.outs[i]) return false;
    if (ja.reqs[i] !== jb.reqs[i]) return false;
  }

  return true;
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
