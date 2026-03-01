const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Doctor searches patient by email or cnp (or exact patientId)
router.get('/patients/lookup', requireAuth, requireRole('DOCTOR'), async (req, res) => {
  const { email, cnp, patientId } = req.query;

  if (!email && !cnp && !patientId) {
    return res.status(400).json({ error: 'Provide email or cnp or patientId' });
  }

  let q = `
    SELECT p.id as patient_id, p.first_name, p.last_name, p.cnp, u.email
    FROM patient_profiles p
    JOIN users u ON u.id = p.user_id
    WHERE 1=1
  `;
  const params = [];
  if (email) { params.push(email); q += ` AND u.email = $${params.length}`; }
  if (cnp) { params.push(cnp); q += ` AND p.cnp = $${params.length}`; }
  if (patientId) { params.push(patientId); q += ` AND p.id = $${params.length}`; }

  const r = await pool.query(q, params);
  res.json({ items: r.rows });
});

module.exports = router;
