-- =========================================================================
-- TCRE GLUCOMETER SYSTEM DATABASE SCHEMA (POSTGRESQL)
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    sex VARCHAR(20) NOT NULL,
    first_measurement_date TIMESTAMP WITH TIME ZONE,
    latest_measurement_date TIMESTAMP WITH TIME ZONE,
    latest_glucose INT DEFAULT 0,
    sugar_yes_count INT DEFAULT 0,
    sugar_no_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup on Patient ID
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);

-- 2. Measurements Table
CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_uuid UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    glucose INT NOT NULL,
    source VARCHAR(30) CHECK (source IN ('manual', 'csv_upload', 'system')) NOT NULL,
    medication VARCHAR(255),
    intervention VARCHAR(255),
    consumed_sugar_last_6_hours VARCHAR(10) CHECK (consumed_sugar_last_6_hours IN ('YES', 'NO')) DEFAULT 'NO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique index to prevent duplicate ingestion of measurements
-- Match criteria: Patient, Date, and Glucose
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_dedup 
ON measurements(patient_uuid, date, glucose);

-- Indexes for performance queries (timeseries ordering)
CREATE INDEX IF NOT EXISTS idx_measurements_patient_date ON measurements(patient_uuid, date DESC);

-- 3. Import Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS import_logs (
    id SERIAL PRIMARY KEY,
    import_date DATE NOT NULL,
    import_time TIME NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    measurements_imported INT NOT NULL,
    duplicates_ignored INT NOT NULL,
    import_duration VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
