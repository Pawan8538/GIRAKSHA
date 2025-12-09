-- ==========================================================
-- 1. EXTENSIONS
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================================
-- 2. ROLES TABLE
-- ==========================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES
('field_worker'),
('site_admin'),
('gov_authority'),
('super_admin');

-- ==========================================================
-- 3. USERS TABLE
-- ==========================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 4. GOVERNMENT AUTHORITIES TABLE
-- ==========================================================
CREATE TABLE govt_authorities (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    department VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 5. SLOPES TABLE
-- ==========================================================
CREATE TABLE slopes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    risk_level VARCHAR(50) DEFAULT 'low',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 6. SENSORS TABLE
-- ==========================================================
CREATE TABLE sensors (
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
-- 7. SENSOR READINGS (ALTERNATIVE TO TIMESCALE)
-- ==========================================================
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sensor_id INT REFERENCES sensors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    value NUMERIC,
    status VARCHAR(50) DEFAULT 'ok'
);

-- Optimized BRIN index
CREATE INDEX sensor_readings_brin_idx
ON sensor_readings
USING brin (time) WITH (pages_per_range = 128);

-- Optional partitioning
-- ALTER TABLE sensor_readings PARTITION BY RANGE (time);

-- ==========================================================
-- 8. COMPLAINTS TABLE
-- ==========================================================
CREATE TABLE complaints (
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
CREATE TABLE alerts (
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
-- 10. OFFLINE MESSAGES TABLE
-- ==========================================================
CREATE TABLE offline_messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    delivered BOOLEAN DEFAULT FALSE
);

-- ==========================================================
-- 11. CAMERA SNAPSHOTS TABLE
-- ==========================================================
CREATE TABLE camera_snapshots (
    id SERIAL PRIMARY KEY,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    image_url TEXT,
    detection JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 12. ML PREDICTIONS TABLE
-- ==========================================================
CREATE TABLE ml_predictions (
    id SERIAL PRIMARY KEY,
    slope_id INT REFERENCES slopes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    risk_score NUMERIC,
    prediction JSONB,
    explainability JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 13. TASKS TABLE
-- ==========================================================
CREATE TABLE tasks (
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

-- ==========================================================
-- 14. TASK ATTACHMENTS & UPDATES
-- ==========================================================
CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_updates (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50),
    comment TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 15. COMPLAINT MEDIA & FEEDBACK
-- ==========================================================
CREATE TABLE complaint_media (
    id SERIAL PRIMARY KEY,
    complaint_id INT REFERENCES complaints(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE complaint_feedback (
    id SERIAL PRIMARY KEY,
    complaint_id INT REFERENCES complaints(id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    worker_id INT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) DEFAULT 'feedback',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 16. CONVERSATIONS & MESSAGES
-- ==========================================================
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    gov_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    site_admin_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (gov_user_id, site_admin_id)
);

CREATE TABLE conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    body TEXT,
    attachments JSONB,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 17. NOTIFICATIONS & OFFLINE QUEUE
-- ==========================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_queue (
    id SERIAL PRIMARY KEY,
    notification_id INT REFERENCES notifications(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    sent BOOLEAN DEFAULT FALSE,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- offline_messages table (section 10) is now used as the delivery buffer for
-- websocket reconnects / offline devices.

-- ==========================================================
-- 18. ADVISORIES & ATTACHMENTS
-- ==========================================================
CREATE TABLE advisories (
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

CREATE TABLE advisory_attachments (
    id SERIAL PRIMARY KEY,
    advisory_id INT REFERENCES advisories(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);