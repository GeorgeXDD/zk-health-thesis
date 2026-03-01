const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, role, firstName, lastName, cnp } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "email, password, role are required" });
  }
  if (!["PATIENT", "DOCTOR"].includes(role)) {
    return res.status(400).json({ error: "role must be PATIENT or DOCTOR" });
  }
  if (role === "PATIENT" && (!firstName || !lastName)) {
    return res
      .status(400)
      .json({ error: "firstName and lastName required for PATIENT" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userInsert = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role`,
      [email, passwordHash, role],
    );

    const user = userInsert.rows[0];
    let patientProfile = null;

    if (role === "PATIENT") {
      const prof = await client.query(
        `INSERT INTO patient_profiles (user_id, first_name, last_name, cnp)
         VALUES ($1, $2, $3, $4)
         RETURNING id, first_name, last_name, cnp`,
        [user.id, firstName, lastName, cnp || null],
      );
      patientProfile = prof.rows[0];
    }

    await client.query("COMMIT");
    res.json({ user, patientProfile });
  } catch (e) {
    await client.query("ROLLBACK");
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ error: "Email or CNP already exists" });
    }
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  const u = await pool.query(
    `SELECT id, email, password_hash, role FROM users WHERE email=$1`,
    [email],
  );
  if (u.rowCount === 0)
    return res.status(401).json({ error: "Invalid credentials" });

  const user = u.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // if patient, get patient_id
  let patientId = null;
  if (user.role === "PATIENT") {
    const p = await pool.query(
      `SELECT id FROM patient_profiles WHERE user_id=$1`,
      [user.id],
    );
    patientId = p.rowCount ? p.rows[0].id : null;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, patientId },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );

  res.json({ token, role: user.role, patientId });
});

module.exports = router;
