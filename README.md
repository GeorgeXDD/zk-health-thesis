# zk-health-thesis

Research prototype for privacy-preserving clinical predicate verification with zero-knowledge proofs.

The repository contains:

- an Express backend API;
- a PostgreSQL database for users, patients, FHIR-like observations, requests and proofs;
- a Circom/Groth16 prover;
- a RISC Zero STARK prover;
- a Hybrid STARK-to-Groth16 proof path;
- shared clinical predicate definitions.

## Requirements

Install these before running the project:

- **Node.js 18+** and **npm** for the backend and Groth16 prover scripts.
- **Docker** and **Docker Compose** for PostgreSQL.
- **Rust + rustup** for the RISC Zero STARK and Hybrid prover.
- **Circom 2.x** if you need to rebuild the Circom circuit artifacts.
- **jq** if you want to use the example `curl` commands.

Useful install links:

- Node.js: https://nodejs.org
- Docker: https://www.docker.com
- Rust: https://rustup.rs
- Circom: https://docs.circom.io/getting-started/installation/

## Project Structure

```text
backend/          Express API and middleware proof flow
circom-prover/    Circom circuit, Groth16 proving script, proving artifacts
stark-prover/     RISC Zero STARK and Hybrid prover
shared/           Predicate catalog and diagrams
infra/db/         PostgreSQL Docker Compose and schema
scripts/          Predicate artifact generator
```

## Installation

From the repository root:

```bash
npm install --prefix backend
npm install --prefix circom-prover
```

Start PostgreSQL:

```bash
docker compose -f infra/db/docker-compose.yml up -d
```

Create the schema:

```bash
docker compose -f infra/db/docker-compose.yml exec -T postgres \
  psql -U zk_user -d zk_health < infra/db/sql/001_schema.sql
```

Create `backend/.env`:

```env
DATABASE_URL=postgres://zk_user:zk_pass@localhost:5433/zk_health
JWT_SECRET=change_me_dev_only
PORT=3000
STARK_HOST_BIN=../stark-prover/target/release/host
```

Start the backend:

```bash
cd backend
npm start
```

Check that it works:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/db-health
```

## Groth16 Setup

The Groth16 path uses:

```text
circom-prover/circuits/clinical_predicates_selective_v1.circom
circom-prover/scripts/prove_clinical_predicates_selective_v1.js
```

The prover script expects these compiled artifacts:

```text
circom-prover/build/clinical_predicates_selective_v1/clinical_predicates_selective_v1_js/clinical_predicates_selective_v1.wasm
circom-prover/build/clinical_predicates_selective_v1/circuit_final.zkey
circom-prover/build/clinical_predicates_selective_v1/verification_key.json
```

If those files are already present, no extra Groth16 setup is needed.

If you change the circuit or predicate catalog, you need Circom installed and must rebuild the circuit, witness generator, zkey, and verification key.

## STARK / Hybrid Setup

The STARK and Hybrid paths use RISC Zero:

```text
stark-prover/host/src/main.rs
stark-prover/methods/guest/src/main.rs
```

Build the host binary:

```bash
cd stark-prover
cargo build --release
cd ..
```

The backend finds this binary through:

```env
STARK_HOST_BIN=../stark-prover/target/release/host
```

## Running The Main API Flow

The normal flow is:

1. Register a `DOCTOR`.
2. Register a `PATIENT`.
3. Login both users.
4. Patient uploads FHIR-like `Observation` resources.
5. Doctor creates a proof request with selected predicates.
6. Patient approves the request.
7. Backend generates and verifies the selected proof.
8. Doctor fetches or re-verifies the proof result.

Supported request proof systems:

```text
GROTH16
STARK
HYBRID
```

## Small Example

Create a Groth16 request body like:

```json
{
  "patientId": "PATIENT_UUID",
  "proofSystem": "GROTH16",
  "predicates": ["HIV_NEGATIVE", "HBA1C_LT_6_5", "LDL_LT_130"],
  "expiresAt": "2026-06-29T12:00:00Z"
}
```

When the patient approves it, the response includes:

```json
{
  "ok": true,
  "proofType": "GROTH16",
  "verifiedOk": true,
  "predicatesResult": {
    "HIV_NEGATIVE": true,
    "HBA1C_LT_6_5": true,
    "LDL_LT_130": true
  },
  "timingsMs": {
    "prove": 200,
    "verify": 5,
    "total": 205
  },
  "proofSizeBytes": 720
}
```

The exact private clinical values are used during proving but are not returned to the doctor.

## Predicate Catalog

Clinical predicates are defined in:

```text
shared/predicateCatalog.js
```

Generated predicate artifacts are:

```text
circom-prover/circuits/clinical_predicates_selective_v1.circom
stark-prover/methods/guest/src/predicate_constants.rs
```

Regenerate them with:

```bash
node scripts/generate_predicate_artifacts.js
```

After regenerating, rebuild the Circom artifacts and the STARK binary.
