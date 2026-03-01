require("dotenv").config();
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Ensure backend/.env exists and dotenv is loaded.",
  );
}

const pool = new Pool({ connectionString: url });

module.exports = { pool };
