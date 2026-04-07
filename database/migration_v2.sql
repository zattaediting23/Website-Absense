-- =============================================
-- ABSENSE v2.0 - Massive Upgrade Migration
-- =============================================

-- =============================================
-- ALTER: attendance_records - Geolocation & Photo
-- =============================================
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS clock_in_location_valid BOOLEAN DEFAULT true;

-- =============================================
-- ALTER: schedules - Geofence
-- =============================================
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS geofence_lat DECIMAL(10,8);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS geofence_lng DECIMAL(11,8);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 100;

-- =============================================
-- ALTER: leave_requests - Multi-level Approval
-- =============================================
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_level INTEGER DEFAULT 1;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_chain JSONB DEFAULT '[]';

-- =============================================
-- HOLIDAYS
-- =============================================
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(20) DEFAULT 'national' CHECK (type IN ('national', 'company', 'religious')),
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, date)
);
CREATE INDEX IF NOT EXISTS idx_holidays_org_date ON holidays(organization_id, date);

-- =============================================
-- ANNOUNCEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_pinned BOOLEAN DEFAULT false,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_announcements_org ON announcements(organization_id);

-- =============================================
-- PAYROLL SETTINGS (per organization)
-- =============================================
CREATE TABLE IF NOT EXISTS payroll_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    base_salary DECIMAL(15,2) DEFAULT 0,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    meal_allowance DECIMAL(15,2) DEFAULT 0,
    late_deduction_per_minute DECIMAL(10,2) DEFAULT 0,
    absent_deduction_per_day DECIMAL(15,2) DEFAULT 0,
    overtime_rate_per_hour DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id)
);
CREATE TRIGGER update_payroll_settings_updated_at
    BEFORE UPDATE ON payroll_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PAYROLLS (per user per month)
-- =============================================
CREATE TABLE IF NOT EXISTS payrolls (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    late_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    base_salary DECIMAL(15,2) DEFAULT 0,
    allowances DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    overtime_pay DECIMAL(15,2) DEFAULT 0,
    gross_pay DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) DEFAULT 0,
    details JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid')),
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_month, period_year)
);
CREATE INDEX IF NOT EXISTS idx_payrolls_org ON payrolls(organization_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_user ON payrolls(user_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_period ON payrolls(period_month, period_year);

-- =============================================
-- OVERTIME RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS overtime_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours DECIMAL(4,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_overtime_user ON overtime_records(user_id);

-- =============================================
-- SHIFT SWAP REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
    target_schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
    swap_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'target_approved', 'approved', 'rejected')),
    target_response VARCHAR(20) CHECK (target_response IN ('accepted', 'rejected')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_shift_swap_updated_at
    BEFORE UPDATE ON shift_swap_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEVICE BINDINGS
-- =============================================
CREATE TABLE IF NOT EXISTS device_bindings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_device_user ON device_bindings(user_id);

-- =============================================
-- DEFAULT PAYROLL SETTINGS
-- =============================================
INSERT INTO payroll_settings (organization_id, base_salary, transport_allowance, meal_allowance, late_deduction_per_minute, absent_deduction_per_day, overtime_rate_per_hour)
SELECT id, 5000000, 500000, 300000, 5000, 200000, 25000 FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
