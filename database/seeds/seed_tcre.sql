-- =========================================================================
-- TCRE GLUCOMETER SYSTEM SEED DATA (POSTGRESQL)
-- =========================================================================

-- Clear existing data
TRUNCATE TABLE measurements CASCADE;
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE import_logs CASCADE;

-- Insert initial patient Evelyn Harper
INSERT INTO patients (id, patient_id, name, age, sex, first_measurement_date, latest_measurement_date, latest_glucose, sugar_yes_count, sugar_no_count)
VALUES (
    'a3b854a2-11c5-4d69-b541-b0e6e8ad1e32',
    'P-88291',
    'Evelyn Harper',
    54,
    'Female',
    '2026-06-30T08:00:00.000Z',
    '2026-07-02T20:00:00.000Z',
    115,
    3,
    6
);

-- Insert initial measurements for Evelyn Harper
INSERT INTO measurements (patient_uuid, date, glucose, source, consumed_sugar_last_6_hours)
VALUES 
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-06-30T08:00:00.000Z', 95, 'system', 'NO'),
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-06-30T13:00:00.000Z', 130, 'system', 'YES'),
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-06-30T20:00:00.000Z', 110, 'system', 'NO'),
    
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-07-01T08:00:00.000Z', 98, 'system', 'NO'),
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-07-01T13:00:00.000Z', 135, 'system', 'YES'),
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-07-01T20:00:00.000Z', 112, 'system', 'NO'),
    
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-07-02T08:00:00.000Z', 101, 'system', 'NO'),
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-07-02T13:00:00.000Z', 140, 'system', 'YES'),
    ('a3b854a2-11c5-4d69-b541-b0e6e8ad1e32', '2026-07-02T20:00:00.000Z', 115, 'system', 'NO');

-- Insert initial import logs
INSERT INTO import_logs (import_date, import_time, device_name, measurements_imported, duplicates_ignored, import_duration)
VALUES 
    ('2026-07-30', '12:00:00', 'TCRE Mega 2560', 9, 0, '1.2s');
