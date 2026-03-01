-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PATIENT PROFILES
CREATE TABLE IF NOT EXISTS patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cnp TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FHIR RESOURCES (JSONB store)
CREATE TABLE IF NOT EXISTS fhir_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- e.g. 'Observation'
  resource JSONB NOT NULL,
  resource_hash TEXT,          -- sha256 of canonical JSON (recommended)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROOF REQUESTS
CREATE TABLE IF NOT EXISTS proof_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  predicates JSONB NOT NULL,  -- e.g. ["HIV_NEGATIVE"]
  nonce TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'FULFILLED')),
  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROOFS
CREATE TABLE IF NOT EXISTS proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES proof_requests(id) ON DELETE CASCADE,

  proof_type TEXT NOT NULL CHECK (proof_type IN ('NONE', 'GROTH16', 'STARK', 'HYBRID')),
  proof JSONB,               -- for snarkjs proof JSON; for receipts you can store base64 too
  public_signals JSONB,
  predicates_result JSONB,

  verified_ok BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,

  proof_size_bytes INTEGER,
  prover_time_ms INTEGER,
  verify_time_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_fhir_resources_patient_id ON fhir_resources(patient_id);
CREATE INDEX IF NOT EXISTS idx_proof_requests_patient_status ON proof_requests(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_proof_requests_doctor ON proof_requests(doctor_user_id);