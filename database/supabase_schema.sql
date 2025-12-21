-- ==========================================================
-- COMPLETE GEOGUARD DATABASE SCHEMA FOR SUPABASE
-- Run this in Supabase SQL Editor
-- ==========================================================

-- ==========================================================
-- 1. EXTENSIONS
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================================
-- 2. ROLES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES
('field_worker'),
('site_admin'),
('gov_authority'),
('super_admin')
ON CONFLICT (name) DO NOTHING;

-- ==========================================================
-- 3. USERS TABLE (WITH APPROVAL COLUMNS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    slope_id INT,
    is_approved BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 4. GOVERNMENT AUTHORITIES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS govt_authorities (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    department VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 5. SLOPES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS slopes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    risk_level VARCHAR(50) DEFAULT 'low',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key for users.slope_id
ALTER TABLE users ADD CONSTRAINT fk_users_slope 
    FOREIGN KEY (slope_id) REFERENCES slopes(id) ON DELETE SET NULL;

-- ==========================================================
-- 6. SENSORS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(255),
    sensor_type VARCHAR(100),
    unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 7. SENSOR READINGS
-- ==========================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sensor_id INT REFERENCES sensors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    value NUMERIC,
    status VARCHAR(50) DEFAULT 'ok'
);

CREATE INDEX IF NOT EXISTS sensor_readings_brin_idx
ON sensor_readings USING brin (time) WITH (pages_per_range = 128);

-- ==========================================================
-- 8. COMPLAINTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    slope_id INT REFERENCES slopes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    description TEXT,
    media_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 9. ALERTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    alert_type VARCHAR(255),
    message TEXT,
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ==========================================================
-- 10. REMAINING TABLES
-- ==========================================================
CREATE TABLE IF NOT EXISTS offline_messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    delivered BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS camera_snapshots (
    id SERIAL PRIMARY KEY,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    image_url TEXT,
    detection JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_predictions (
    id SERIAL PRIMARY KEY,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    risk_score NUMERIC,
    prediction JSONB,
    explainability JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    slope_id INT REFERENCES slopes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_updates (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50),
    comment TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_media (
    id SERIAL PRIMARY KEY,
    complaint_id INT REFERENCES complaints(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_feedback (
    id SERIAL PRIMARY KEY,
    complaint_id INT REFERENCES complaints(id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    worker_id INT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) DEFAULT 'feedback',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    gov_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    site_admin_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (gov_user_id, site_admin_id)
);

CREATE TABLE IF NOT EXISTS conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    body TEXT,
    attachments JSONB,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    notification_id INT REFERENCES notifications(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    sent BOOLEAN DEFAULT FALSE,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS advisories (
    id SERIAL PRIMARY KEY,
    author_id INT REFERENCES users(id) ON DELETE SET NULL,
    target_site_admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    slope_id INT REFERENCES slopes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS advisory_attachments (
    id SERIAL PRIMARY KEY,
    advisory_id INT REFERENCES advisories(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worker_invites (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE,
    invited_by INT REFERENCES users(id) ON DELETE SET NULL,
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- CREATE INITIAL SUPER ADMIN
-- Password: admin123 (CHANGE THIS AFTER FIRST LOGIN!)
-- ==========================================================
INSERT INTO users (role_id, name, phone, password_hash, is_approved, approval_status)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    'Super Admin',
    '9999999999',
    '$2b$10$rKZN8vQZ5fYxH0qJ5fYxH0qJ5fYxH0qJ5fYxH0qJ5fYxH0qJ5fYxH0',
    TRUE,
    'approved'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
);

-- Note: You'll need to hash a proper password. Use the ensure_super_admin.js script after running this.
