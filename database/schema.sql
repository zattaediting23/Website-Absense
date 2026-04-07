-- =============================================
-- ABSENSE - Multi-Sector Attendance System
-- Database Schema for PostgreSQL
-- =============================================

-- Create database (run separately if needed):
-- CREATE DATABASE absense;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- ORGANIZATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(50) NOT NULL CHECK (sector IN ('education', 'corporate', 'umkm', 'healthcare')),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEPARTMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('superadmin', 'admin', 'member')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SCHEDULES
-- =============================================
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
    tolerance_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER SCHEDULES (Assignment)
-- =============================================
CREATE TABLE IF NOT EXISTS user_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    end_date DATE,
    UNIQUE(user_id, schedule_id, effective_date)
);

-- =============================================
-- ATTENDANCE RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'leave', 'sick', 'permission')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- =============================================
-- LEAVE REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sick', 'leave', 'permission')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SECTOR TERMINOLOGY
-- =============================================
CREATE TABLE IF NOT EXISTS sector_terminology (
    id SERIAL PRIMARY KEY,
    sector VARCHAR(50) NOT NULL,
    generic_term VARCHAR(100) NOT NULL,
    sector_term VARCHAR(100) NOT NULL,
    UNIQUE(sector, generic_term)
);

-- =============================================
-- ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_schedules_org ON schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_terminology_sector ON sector_terminology(sector);

-- =============================================
-- SEED: Sector Terminology
-- =============================================
INSERT INTO sector_terminology (sector, generic_term, sector_term) VALUES
('education', 'organization', 'Sekolah'),
('education', 'member', 'Siswa'),
('education', 'department', 'Kelas'),
('education', 'schedule', 'Jadwal Pelajaran'),
('education', 'attendance', 'Kehadiran'),
('education', 'admin', 'Guru'),
('education', 'leave', 'Izin'),
('education', 'overtime', 'Tambahan'),
('corporate', 'organization', 'Perusahaan'),
('corporate', 'member', 'Karyawan'),
('corporate', 'department', 'Divisi'),
('corporate', 'schedule', 'Shift Kerja'),
('corporate', 'attendance', 'Absensi'),
('corporate', 'admin', 'HRD'),
('corporate', 'leave', 'Cuti'),
('corporate', 'overtime', 'Lembur'),
('umkm', 'organization', 'Usaha'),
('umkm', 'member', 'Pekerja'),
('umkm', 'department', 'Bagian'),
('umkm', 'schedule', 'Jadwal Kerja'),
('umkm', 'attendance', 'Presensi'),
('umkm', 'admin', 'Pemilik'),
('umkm', 'leave', 'Izin'),
('umkm', 'overtime', 'Lembur'),
('healthcare', 'organization', 'Rumah Sakit'),
('healthcare', 'member', 'Tenaga Medis'),
('healthcare', 'department', 'Unit'),
('healthcare', 'schedule', 'Jadwal Jaga'),
('healthcare', 'attendance', 'Kehadiran'),
('healthcare', 'admin', 'Kepala Unit'),
('healthcare', 'leave', 'Cuti'),
('healthcare', 'overtime', 'Lembur')
ON CONFLICT (sector, generic_term) DO NOTHING;
