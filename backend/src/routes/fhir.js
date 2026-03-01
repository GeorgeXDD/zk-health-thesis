const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateObservation, hashObservation } = require('../services/fhir');

const router = express.Router();

// Patient uploads an Observation (FHIR JSON)
router.post('/patients/me/observations', requireAuth, requireRole('PATIENT'), async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) return res.status(400).json({ error: 'Patient profile not found for this user' });

  const obs = req.body;
  try {
    validateObservation(obs);
    const resourceHash = hashObservation(obs);

    const r = await pool.query(
      `INSERT INTO fhir_resources (patient_id, resource_type, resource, resource_hash)
       VALUES ($1, 'Observation', $2::jsonb, $3)
       RETURNING id, created_at, resource_hash`,
      [patientId, JSON.stringify(obs), resourceHash]
    );

    res.json({ ok: true, fhirResource: r.rows[0] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Patient lists their Observations
router.get('/patients/me/observations', requireAuth, requireRole('PATIENT'), async (req, res) => {
  const patientId = req.user.patientId;
  const r = await pool.query(
    `SELECT id, created_at, resource_hash, resource
     FROM fhir_resources
     WHERE patient_id=$1 AND resource_type='Observation'
     ORDER BY created_at DESC`,
    [patientId]
  );
  res.json({ items: r.rows });
});

module.exports = router;
