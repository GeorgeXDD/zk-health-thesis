require("dotenv").config();
const express = require("express");
const { pool } = require("./db");

const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/db-health", async (req, res) => {
  try {
    const r = await pool.query("SELECT current_user, current_database()");
    res.json({
      db: true,
      ...r.rows[0],
      database_url_set: !!process.env.DATABASE_URL,
    });
  } catch (e) {
    res.status(500).json({
      db: false,
      error: e.message,
      database_url_set: !!process.env.DATABASE_URL,
    });
  }
});

const fhirRoutes = require("./routes/fhir");
app.use("/", fhirRoutes);

const patientsRoutes = require("./routes/patients");
const requestsRoutes = require("./routes/requests");

app.use("/", patientsRoutes);
app.use("/", requestsRoutes);

app.use("/auth", authRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
