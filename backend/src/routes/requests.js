const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const {
  HIV_PREDICATE,
  HBA1C_PREDICATE,
  hivStatusBitFromObservation,
  hba1cX100FromObservation,
} = require("../services/predicates");

const {
  proveSelectivePredicates,
} = require("../services/grothProverSelective");
const {
  verifySelectiveGroth16,
} = require("../services/grothVerifierSelective");

const { proveStarkPredicates } = require("../services/starkProver");
const { verifyStarkReceipt } = require("../services/starkVerifier");
const {
  wrapStarkReceiptToGroth16,
} = require("../services/hybridWrapperProver");
const {
  verifyHybridWrappedReceipt,
} = require("../services/hybridWrapperVerifier");
const { verifyHybridArtifacts } = require("../services/hybridVerifier");

const router = express.Router();

function randomNonceHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

const ALLOWED_PREDICATES = new Set([HIV_PREDICATE, HBA1C_PREDICATE]);
const ALLOWED_PROOF_SYSTEMS = new Set(["GROTH16", "STARK", "HYBRID", "FHIR"]);

function normalizeProofSystem(s) {
  const v = (s || "GROTH16").toString().trim().toUpperCase();
  if (!ALLOWED_PROOF_SYSTEMS.has(v)) {
    throw new Error(
      `Unsupported proofSystem '${s}'. Allowed: ${[...ALLOWED_PROOF_SYSTEMS].join(", ")}`,
    );
  }
  return v;
}

function predicateSelectorsFrom(predicates) {
  const reqHiv = predicates.includes(HIV_PREDICATE) ? 1 : 0;
  const reqA1c = predicates.includes(HBA1C_PREDICATE) ? 1 : 0;
  return { reqHiv, reqA1c };
}

function filterDecodedForDoctor(predicates, decodedAll) {
  const filtered = {};

  if (Array.isArray(predicates)) {
    if (predicates.includes(HIV_PREDICATE)) filtered.outHiv = decodedAll.outHiv;
    if (predicates.includes(HBA1C_PREDICATE))
      filtered.outA1cOk = decodedAll.outA1cOk;
  }

  if (decodedAll.nonceField !== undefined && decodedAll.nonceField !== null) {
    filtered.nonceField = decodedAll.nonceField;
  }

  return filtered;
}

function decodeFromHybridJournal(journal) {
  const j = journal || {};
  const required = [
    "out_hiv",
    "out_a1c_ok",
    "nonce_field",
    "req_hiv",
    "req_a1c",
  ];
  for (const key of required) {
    if (j[key] === undefined || j[key] === null) {
      throw new Error(`Verified hybrid journal missing field: ${key}`);
    }
  }
  return {
    outHiv: Number(j.out_hiv),
    outA1cOk: Number(j.out_a1c_ok),
    nonceField: String(j.nonce_field),
    reqHiv: Number(j.req_hiv),
    reqA1c: Number(j.req_a1c),
  };
}

function decodedShapeEquals(a, b) {
  return (
    String(a?.outHiv) === String(b?.outHiv) &&
    String(a?.outA1cOk) === String(b?.outA1cOk) &&
    String(a?.nonceField) === String(b?.nonceField) &&
    String(a?.reqHiv) === String(b?.reqHiv) &&
    String(a?.reqA1c) === String(b?.reqA1c)
  );
}

router.post(
  "/requests",
  requireAuth,
  requireRole("DOCTOR"),
  async (req, res) => {
    const doctorUserId = req.user.userId;
    const { patientId, predicates, expiresAt, proofSystem } = req.body;

    if (
      !patientId ||
      !predicates ||
      !Array.isArray(predicates) ||
      predicates.length === 0 ||
      !expiresAt
    ) {
      return res
        .status(400)
        .json({ error: "patientId, predicates[], expiresAt are required" });
    }

    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.getTime()))
      return res.status(400).json({ error: "expiresAt must be a valid date" });
    if (exp.getTime() <= Date.now())
      return res.status(400).json({ error: "expiresAt must be in the future" });

    if (predicates.some((p) => !ALLOWED_PREDICATES.has(p))) {
      return res.status(400).json({
        error: `Unsupported predicate(s). Allowed: ${[...ALLOWED_PREDICATES].join(", ")}`,
      });
    }

    let ps;
    try {
      ps = normalizeProofSystem(proofSystem);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    let nonce = null;
    for (let i = 0; i < 5; i++) {
      const candidate = randomNonceHex(16);
      const exists = await pool.query(
        `SELECT 1 FROM proof_requests WHERE nonce=$1`,
        [candidate],
      );
      if (exists.rowCount === 0) {
        nonce = candidate;
        break;
      }
    }
    if (!nonce)
      return res.status(500).json({ error: "Failed to generate unique nonce" });

    try {
      const r = await pool.query(
        `INSERT INTO proof_requests (patient_id, doctor_user_id, predicates, nonce, status, expires_at, proof_system)
       VALUES ($1, $2, $3::jsonb, $4, 'PENDING', $5, $6)
       RETURNING id, patient_id, doctor_user_id, predicates, nonce, status, expires_at, created_at, proof_system`,
        [
          patientId,
          doctorUserId,
          JSON.stringify(predicates),
          nonce,
          exp.toISOString(),
          ps,
        ],
      );

      res.json({ ok: true, request: r.rows[0] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
);

// Patient lists incoming requests
router.get(
  "/patients/me/requests",
  requireAuth,
  requireRole("PATIENT"),
  async (req, res) => {
    const patientId = req.user.patientId;

    const r = await pool.query(
      `SELECT id, doctor_user_id, predicates, nonce, status, expires_at, created_at, proof_system
     FROM proof_requests
     WHERE patient_id=$1
     ORDER BY created_at DESC`,
      [patientId],
    );

    res.json({ items: r.rows });
  },
);

// Doctor lists their requests
router.get(
  "/doctors/me/requests",
  requireAuth,
  requireRole("DOCTOR"),
  async (req, res) => {
    const doctorUserId = req.user.userId;

    const r = await pool.query(
      `SELECT id, patient_id, predicates, nonce, status, expires_at, created_at, proof_system
     FROM proof_requests
     WHERE doctor_user_id=$1
     ORDER BY created_at DESC`,
      [doctorUserId],
    );

    res.json({ items: r.rows });
  },
);

// Patient approves a request -> generates selective proof using request.proof_system
router.post(
  "/patients/me/requests/:id/approve",
  requireAuth,
  requireRole("PATIENT"),
  async (req, res) => {
    const patientId = req.user.patientId;
    const requestId = req.params.id;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const rq = await client.query(
        `SELECT id, patient_id, doctor_user_id, predicates, nonce, status, expires_at, proof_system
       FROM proof_requests
       WHERE id=$1
       FOR UPDATE`,
        [requestId],
      );

      if (rq.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Request not found" });
      }

      const request = rq.rows[0];

      if (request.patient_id !== patientId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Not your request" });
      }

      if (request.status !== "PENDING") {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Request status must be PENDING (got ${request.status})`,
        });
      }

      if (new Date(request.expires_at).getTime() <= Date.now()) {
        await client.query(
          `UPDATE proof_requests SET status='EXPIRED', updated_at=now() WHERE id=$1`,
          [requestId],
        );
        await client.query("COMMIT");
        return res.status(400).json({ error: "Request expired" });
      }

      const predicates = request.predicates;
      if (!Array.isArray(predicates) || predicates.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No predicates requested" });
      }

      if (predicates.some((p) => !ALLOWED_PREDICATES.has(p))) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Unsupported predicate(s). Allowed: ${[...ALLOWED_PREDICATES].join(", ")}`,
        });
      }

      const { reqHiv, reqA1c } = predicateSelectorsFrom(predicates);
      if (reqHiv === 0 && reqA1c === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "No supported predicates requested" });
      }

      // Load observations (latest-first)
      const allObs = await client.query(
        `SELECT resource_hash, resource
       FROM fhir_resources
       WHERE patient_id=$1 AND resource_type='Observation'
       ORDER BY created_at DESC`,
        [patientId],
      );

      if (allObs.rowCount === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "No Observation found for patient" });
      }

      let hivObs = null;
      let hivHash = null;
      let a1cObs = null;
      let a1cHash = null;

      if (reqHiv) {
        for (const row of allObs.rows) {
          try {
            hivStatusBitFromObservation(row.resource);
            hivObs = row.resource;
            hivHash = row.resource_hash;
            break;
          } catch {}
        }
        if (!hivObs) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: "No HIV Observation found for patient" });
        }
      }

      if (reqA1c) {
        for (const row of allObs.rows) {
          try {
            hba1cX100FromObservation(row.resource);
            a1cObs = row.resource;
            a1cHash = row.resource_hash;
            break;
          } catch {}
        }
        if (!a1cObs) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: "No HbA1c Observation found for patient" });
        }
      }

      const hivStatus = reqHiv ? hivStatusBitFromObservation(hivObs) : 0;
      const hba1cX100 = reqA1c ? hba1cX100FromObservation(a1cObs) : 0;

      const proofSystem = normalizeProofSystem(
        request.proof_system || "GROTH16",
      );
      const now = new Date().toISOString();

      let proofTypeToStore = null;
      let proofToStore = null;
      let publicSignalsToStore = null;
      let verifiedOk = false;
      let proofSizeBytes = null;
      let proverTimeMs = null;
      let verifyTimeMs = null;

      let decoded = null;
      let predicatesResult = {};

      if (proofSystem === "GROTH16") {
        const proverOut = await proveSelectivePredicates({
          hivStatus,
          hba1cX100,
          nonce: request.nonce,
          reqHiv,
          reqA1c,
        });

        // publicSignals layout: [outHiv, outA1cOk, nonceField, reqHiv, reqA1c]
        const publicSignals = proverOut.publicSignals || [];
        if (!Array.isArray(publicSignals) || publicSignals.length < 5) {
          throw new Error("Unexpected publicSignals returned by Groth prover");
        }

        const outHiv = Number(publicSignals[0]);
        const outA1cOk = Number(publicSignals[1]);

        decoded = {
          outHiv,
          outA1cOk,
          nonceField: String(publicSignals[2]),
          reqHiv: Number(publicSignals[3]),
          reqA1c: Number(publicSignals[4]),
        };

        predicatesResult = {};
        if (reqHiv) predicatesResult.isHIVNegative = outHiv === 1;
        if (reqA1c) predicatesResult.isHba1cLt6_5 = outA1cOk === 1;

        proofTypeToStore = "GROTH16";
        proofToStore = proverOut.proof;
        publicSignalsToStore = {
          publicSignals,
          nonceField: proverOut.nonceField,
          decoded,
          fhirHashes: { hiv: hivHash || null, hba1c: a1cHash || null },
        };

        verifiedOk = !!proverOut.verifiedOk;
        proofSizeBytes = proverOut.proofSizeBytes ?? null;
        proverTimeMs = proverOut.timingsMs?.prove ?? null;
        verifyTimeMs = proverOut.timingsMs?.verify ?? null;
      } else if (proofSystem === "STARK") {
        const starkOut = await proveStarkPredicates({
          hivStatusBit: hivStatus,
          hba1cX100: hba1cX100,
          nonceField: request.nonce,
          reqHiv,
          reqA1c,
        });

        const j = starkOut.journal || {};

        const nonceFieldDec = BigInt("0x" + request.nonce).toString();

        decoded = {
          outHiv: Number(j.out_hiv ?? 0),
          outA1cOk: Number(j.out_a1c_ok ?? 0),
          nonceField: nonceFieldDec,
          reqHiv: Number(j.req_hiv ?? reqHiv),
          reqA1c: Number(j.req_a1c ?? reqA1c),
        };

        predicatesResult = {};
        if (reqHiv) predicatesResult.isHIVNegative = decoded.outHiv === 1;
        if (reqA1c) predicatesResult.isHba1cLt6_5 = decoded.outA1cOk === 1;

        proofTypeToStore = "STARK";

        proofToStore = { receipt_b64: starkOut.receipt_b64 };

        publicSignalsToStore = {
          journal: j,
          decoded,
          fhirHashes: { hiv: hivHash || null, hba1c: a1cHash || null },
        };

        verifiedOk = !!starkOut.verified_ok;
        proofSizeBytes = starkOut.receipt_size_bytes ?? null;
        proverTimeMs = starkOut.prove_time_ms ?? null;
        verifyTimeMs = starkOut.verify_time_ms ?? null;
      } else if (proofSystem === "HYBRID") {
        const starkOut = await proveStarkPredicates({
          hivStatusBit: hivStatus,
          hba1cX100: hba1cX100,
          nonceField: request.nonce,
          reqHiv,
          reqA1c,
        });

        if (
          !starkOut?.receipt_b64 ||
          typeof starkOut.receipt_b64 !== "string"
        ) {
          throw new Error("Hybrid path: STARK output missing receipt_b64");
        }

        const wrapOut = await wrapStarkReceiptToGroth16(starkOut.receipt_b64);
        if (
          !wrapOut?.snarkReceiptB64 ||
          typeof wrapOut.snarkReceiptB64 !== "string"
        ) {
          throw new Error("Hybrid path: wrapper output missing snark receipt");
        }
        if (!wrapOut.wrappedOk) {
          throw new Error("Hybrid path: STARK-to-SNARK wrapping failed");
        }

        // Prefer journal committed in wrapped receipt (fast verification path).
        const j = wrapOut.journal || starkOut.journal || {};
        decoded = decodeFromHybridJournal(j);

        predicatesResult = {};
        if (reqHiv) predicatesResult.isHIVNegative = decoded.outHiv === 1;
        if (reqA1c) predicatesResult.isHba1cLt6_5 = decoded.outA1cOk === 1;

        proofTypeToStore = "HYBRID";
        proofToStore = {
          stark_receipt_b64: starkOut.receipt_b64,
          snark_receipt_b64: wrapOut.snarkReceiptB64,
        };

        publicSignalsToStore = {
          journal: j,
          decoded,
          fhirHashes: { hiv: hivHash || null, hba1c: a1cHash || null },
          hybrid: {
            mode: "HYBRID",
            wrapperReceiptKind: wrapOut.receiptKind ?? null,
            wrapperIsGroth16: wrapOut.isGroth16 ?? null,
          },
        };

        verifiedOk = !!starkOut.verified_ok && !!wrapOut.wrappedOk;
        proofSizeBytes = wrapOut.snarkReceiptSizeBytes ?? null;
        proverTimeMs =
          (starkOut.prove_time_ms ?? 0) + (wrapOut.wrapTimeMs ?? 0);
        verifyTimeMs =
          (starkOut.verify_time_ms ?? 0) + (wrapOut.verifyTimeMs ?? 0);
      } else if (proofSystem === "FHIR") {
        // baseline: compute predicates directly from FHIR-derived values
        const nonceFieldDec = BigInt("0x" + request.nonce).toString();

        // define outputs in the same shape as other schemes
        // outHiv: 1 means HIV_NEGATIVE is true
        // outA1cOk: 1 means HbA1c < 6.5 is true
        const outHiv = reqHiv ? (hivStatus === 0 ? 1 : 0) : 0;
        const outA1cOk = reqA1c ? (hba1cX100 < 650 ? 1 : 0) : 0;

        decoded = {
          outHiv,
          outA1cOk,
          nonceField: nonceFieldDec,
          reqHiv,
          reqA1c,
        };

        predicatesResult = {};
        if (reqHiv) predicatesResult.isHIVNegative = outHiv === 1;
        if (reqA1c) predicatesResult.isHba1cLt6_5 = outA1cOk === 1;

        proofTypeToStore = "FHIR";

        // No cryptographic proof artifact for baseline
        proofToStore = null;

        publicSignalsToStore = {
          decoded,
          fhirHashes: { hiv: hivHash || null, hba1c: a1cHash || null },
          baseline: { kind: "FHIR_ONLY" },
        };

        verifiedOk = true;
        proofSizeBytes = 0;
        proverTimeMs = 0;
        verifyTimeMs = 0;
      } else {
        throw new Error(`Unsupported proof_system on request: ${proofSystem}`);
      }

      // Upsert proof record
      await client.query(
        `INSERT INTO proofs
       (request_id, proof_type, proof, public_signals, predicates_result, verified_ok, verified_at,
        proof_size_bytes, prover_time_ms, verify_time_ms)
       VALUES
       ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10)
       ON CONFLICT (request_id) DO UPDATE SET
         proof_type = EXCLUDED.proof_type,
         proof = EXCLUDED.proof,
         public_signals = EXCLUDED.public_signals,
         predicates_result = EXCLUDED.predicates_result,
         verified_ok = EXCLUDED.verified_ok,
         verified_at = EXCLUDED.verified_at,
         proof_size_bytes = EXCLUDED.proof_size_bytes,
         prover_time_ms = EXCLUDED.prover_time_ms,
         verify_time_ms = EXCLUDED.verify_time_ms`,
        [
          requestId,
          proofTypeToStore,
          JSON.stringify(proofToStore),
          JSON.stringify(publicSignalsToStore),
          JSON.stringify(predicatesResult),
          verifiedOk,
          now,
          proofSizeBytes,
          proverTimeMs,
          verifyTimeMs,
        ],
      );

      await client.query(
        `UPDATE proof_requests SET status='FULFILLED', updated_at=now() WHERE id=$1`,
        [requestId],
      );

      await client.query("COMMIT");

      // Response stays minimal
      return res.json({
        ok: true,
        requestId,
        nonce: request.nonce,
        proofType: proofTypeToStore,
        verifiedOk,
        predicatesResult,
        timingsMs: {
          prove: proverTimeMs,
          verify: verifyTimeMs,
          total:
            proverTimeMs != null && verifyTimeMs != null
              ? proverTimeMs + verifyTimeMs
              : null,
        },
        proofSizeBytes,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  },
);

// Doctor fetches a request + result (must be the creator)
// Returns MINIMUM disclosure: only requested predicate outputs + nonceField.
router.get(
  "/requests/:id",
  requireAuth,
  requireRole("DOCTOR"),
  async (req, res) => {
    const requestId = req.params.id;
    const doctorUserId = req.user.userId;

    const rq = await pool.query(
      `SELECT id, patient_id, doctor_user_id, predicates, nonce, status, expires_at, created_at, proof_system
     FROM proof_requests
     WHERE id=$1`,
      [requestId],
    );

    if (rq.rowCount === 0)
      return res.status(404).json({ error: "Request not found" });

    const request = rq.rows[0];
    if (request.doctor_user_id !== doctorUserId)
      return res.status(403).json({ error: "Not your request" });

    const pr = await pool.query(
      `SELECT proof_type, public_signals, predicates_result, verified_ok, verified_at,
            proof_size_bytes, prover_time_ms, verify_time_ms
     FROM proofs
     WHERE request_id=$1`,
      [requestId],
    );

    if (pr.rowCount === 0) return res.json({ request, proof: null });

    const proofRow = pr.rows[0];
    const psContainer = proofRow.public_signals || {};
    const decodedAll = psContainer.decoded || {};
    const predicates = request.predicates || [];

    const filteredDecoded = filterDecodedForDoctor(predicates, decodedAll);

    const proof = {
      proof_type: proofRow.proof_type,
      decoded: filteredDecoded,
      predicates_result: proofRow.predicates_result,
      verified_ok: proofRow.verified_ok,
      verified_at: proofRow.verified_at,
      proof_size_bytes: proofRow.proof_size_bytes,
      prover_time_ms: proofRow.prover_time_ms,
      verify_time_ms: proofRow.verify_time_ms,
    };

    return res.json({ request, proof });
  },
);

// Doctor re-verifies stored proof for a request (independent verification)
router.post(
  "/requests/:id/verify",
  requireAuth,
  requireRole("DOCTOR"),
  async (req, res) => {
    const requestId = req.params.id;
    const doctorUserId = req.user.userId;

    const rq = await pool.query(
      `SELECT id, doctor_user_id, status, predicates
     FROM proof_requests
     WHERE id=$1`,
      [requestId],
    );

    if (rq.rowCount === 0)
      return res.status(404).json({ error: "Request not found" });

    const request = rq.rows[0];
    if (request.doctor_user_id !== doctorUserId)
      return res.status(403).json({ error: "Not your request" });

    const pr = await pool.query(
      `SELECT proof_type, proof, public_signals
     FROM proofs
     WHERE request_id=$1`,
      [requestId],
    );

    if (pr.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "No proof stored for this request yet" });
    }

    const row = pr.rows[0];
    const psContainer = row.public_signals || {};
    const decodedAll = psContainer.decoded || {};
    const predicates = request.predicates || [];

    let verifiedOk = false;
    let verifyTimeMs = null;
    let decodedFromVerifiedReceipt = null;
    let decodedSource = null;

    if (row.proof_type === "GROTH16") {
      const publicSignals = psContainer?.publicSignals;
      const proof = row.proof;

      if (!proof || typeof proof !== "object") {
        return res
          .status(400)
          .json({ error: "Stored proof is missing or invalid" });
      }
      if (!Array.isArray(publicSignals)) {
        return res
          .status(400)
          .json({ error: "Stored publicSignals is missing or invalid" });
      }

      const v = await verifySelectiveGroth16(proof, publicSignals);
      verifiedOk = !!v.verifiedOk;
      verifyTimeMs = v.verifyTimeMs ?? null;
    } else if (row.proof_type === "STARK") {
      const receiptB64 = row.proof?.receipt_b64;

      if (!receiptB64 || typeof receiptB64 !== "string") {
        return res
          .status(400)
          .json({ error: "Stored STARK receipt_b64 missing or invalid" });
      }

      const v = await verifyStarkReceipt(receiptB64);
      verifiedOk = !!v.verifiedOk;
      verifyTimeMs = v.verifyTimeMs ?? null;
    } else if (row.proof_type === "HYBRID") {
      const snarkReceiptB64 = row.proof?.snark_receipt_b64;

      if (!snarkReceiptB64 || typeof snarkReceiptB64 !== "string") {
        return res.status(400).json({
          error: "Stored HYBRID snark_receipt_b64 missing or invalid",
        });
      }

      const mode = psContainer?.hybrid?.mode;
      if (mode !== "HYBRID") {
        return res.status(400).json({
          error: `Stored HYBRID metadata mode invalid: expected HYBRID, got ${mode ?? "null"}`,
        });
      }

      // Fast-path verification: verify only wrapped Groth16 receipt.
      const v = await verifyHybridWrappedReceipt(snarkReceiptB64);
      verifiedOk = !!v.verifiedOk;
      verifyTimeMs = v.verifyTimeMs ?? null;

      if (verifiedOk) {
        if (!v.journal || typeof v.journal !== "object") {
          return res
            .status(500)
            .json({ error: "Verified wrapped receipt is missing journal" });
        }

        decodedFromVerifiedReceipt = decodeFromHybridJournal(v.journal);
        decodedSource = "verified_receipt_journal";

        if (
          decodedAll &&
          Object.keys(decodedAll).length > 0 &&
          !decodedShapeEquals(decodedAll, decodedFromVerifiedReceipt)
        ) {
          return res.status(409).json({
            error:
              "Stored decoded fields mismatch verified wrapped-receipt journal",
          });
        }
      } else {
        decodedSource = "stored_unverified";
      }
    } else if (row.proof_type === "FHIR") {
      // Baseline verify = recompute from current FHIR resources and compare to stored decoded
      const storedDecoded = psContainer.decoded || {};
      const storedPredicates = psContainer?.decoded ? request.predicates : [];

      // Re-load observations similarly to approve, but now we need patient_id
      const rq2 = await pool.query(
        `SELECT patient_id, nonce, predicates FROM proof_requests WHERE id=$1`,
        [requestId],
      );
      const patientId = rq2.rows[0].patient_id;
      const nonce = rq2.rows[0].nonce;
      const predicates = rq2.rows[0].predicates || [];

      const { reqHiv, reqA1c } = predicateSelectorsFrom(predicates);

      const allObs = await pool.query(
        `SELECT resource_hash, resource
     FROM fhir_resources
     WHERE patient_id=$1 AND resource_type='Observation'
     ORDER BY created_at DESC`,
        [patientId],
      );

      // Find the latest matching obs for each
      let hivObs = null;
      let a1cObs = null;

      if (reqHiv) {
        for (const row2 of allObs.rows) {
          try {
            hivStatusBitFromObservation(row2.resource);
            hivObs = row2.resource;
            break;
          } catch {}
        }
        if (!hivObs)
          return res
            .status(400)
            .json({ error: "No HIV Observation found for patient" });
      }

      if (reqA1c) {
        for (const row2 of allObs.rows) {
          try {
            hba1cX100FromObservation(row2.resource);
            a1cObs = row2.resource;
            break;
          } catch {}
        }
        if (!a1cObs)
          return res
            .status(400)
            .json({ error: "No HbA1c Observation found for patient" });
      }

      const hivStatus = reqHiv ? hivStatusBitFromObservation(hivObs) : 0;
      const hba1cX100 = reqA1c ? hba1cX100FromObservation(a1cObs) : 0;

      const nonceFieldDec = BigInt("0x" + nonce).toString();

      const recomputedDecoded = {
        outHiv: reqHiv ? (hivStatus === 0 ? 1 : 0) : 0,
        outA1cOk: reqA1c ? (hba1cX100 < 650 ? 1 : 0) : 0,
        nonceField: nonceFieldDec,
        reqHiv,
        reqA1c,
      };

      // Verify = stored decoded equals recomputed decoded
      verifiedOk = decodedShapeEquals(storedDecoded, recomputedDecoded);
      verifyTimeMs = 0; // or measure it with Date.now() like baseline compute, if you want
    } else {
      return res.status(400).json({
        error: `Unsupported proof_type for re-verify: ${row.proof_type}`,
      });
    }

    const verifiedAt = new Date().toISOString();
    await pool.query(
      `UPDATE proofs
     SET verified_ok=$1, verified_at=$2, verify_time_ms=$3
     WHERE request_id=$4`,
      [verifiedOk, verifiedAt, verifyTimeMs, requestId],
    );

    const decodedForDoctor = decodedFromVerifiedReceipt || decodedAll;
    const filteredDecoded = filterDecodedForDoctor(
      predicates,
      decodedForDoctor,
    );

    const payload = {
      ok: true,
      requestId,
      proofType: row.proof_type,
      verifiedOk,
      verifyTimeMs,
      verifiedAt,
      status: request.status,
      decoded: filteredDecoded,
    };
    if (row.proof_type === "HYBRID") payload.decodedSource = decodedSource;

    return res.json(payload);
  },
);

// Optional audit endpoint for HYBRID proofs:
// verifies SNARK fast-path + underlying STARK receipt.
router.post(
  "/requests/:id/verify-deep",
  requireAuth,
  requireRole("DOCTOR"),
  async (req, res) => {
    const requestId = req.params.id;
    const doctorUserId = req.user.userId;

    const rq = await pool.query(
      `SELECT id, doctor_user_id, status
     FROM proof_requests
     WHERE id=$1`,
      [requestId],
    );

    if (rq.rowCount === 0)
      return res.status(404).json({ error: "Request not found" });

    const request = rq.rows[0];
    if (request.doctor_user_id !== doctorUserId)
      return res.status(403).json({ error: "Not your request" });

    const pr = await pool.query(
      `SELECT proof_type, proof, public_signals
     FROM proofs
     WHERE request_id=$1`,
      [requestId],
    );

    if (pr.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "No proof stored for this request yet" });
    }

    const row = pr.rows[0];
    if (row.proof_type !== "HYBRID") {
      return res.status(400).json({
        error: `Deep verify is only available for HYBRID proofs (got ${row.proof_type})`,
      });
    }

    const mode = row.public_signals?.hybrid?.mode;
    if (mode !== "HYBRID") {
      return res.status(400).json({
        error: `Stored HYBRID metadata mode invalid: expected HYBRID, got ${mode ?? "null"}`,
      });
    }

    const starkReceiptB64 = row.proof?.stark_receipt_b64;
    const snarkReceiptB64 = row.proof?.snark_receipt_b64;

    if (!snarkReceiptB64 || typeof snarkReceiptB64 !== "string") {
      return res.status(400).json({
        error: "Stored HYBRID snark_receipt_b64 missing or invalid",
      });
    }
    if (!starkReceiptB64 || typeof starkReceiptB64 !== "string") {
      return res.status(400).json({
        error: "Stored HYBRID stark_receipt_b64 missing or invalid",
      });
    }

    const v = await verifyHybridArtifacts({
      starkReceiptB64,
      snarkReceiptB64,
    });

    const verifiedAt = new Date().toISOString();
    await pool.query(
      `UPDATE proofs
     SET verified_ok=$1, verified_at=$2, verify_time_ms=$3
     WHERE request_id=$4`,
      [!!v.verifiedOk, verifiedAt, v.fast?.verifyTimeMs ?? null, requestId],
    );

    return res.json({
      ok: true,
      requestId,
      proofType: row.proof_type,
      verifiedOk: !!v.verifiedOk,
      verifiedAt,
      status: request.status,
      journalsMatch: v.journalsMatch,
      fast: v.fast,
      deep: v.deep,
    });
  },
);

module.exports = router;
