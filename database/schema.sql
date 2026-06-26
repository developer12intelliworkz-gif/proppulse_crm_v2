
-- PostgreSQL Schema for Real Estate CRM System
-- Drop existing tables if they exist (be careful in production)
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'visited', 'converted', 'dropped');
CREATE TYPE contact_type AS ENUM ('buyer', 'seller', 'investor', 'agent');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent');
CREATE TYPE project_type AS ENUM ('residential', 'commercial');
CREATE TYPE property_status AS ENUM ('available', 'sold', 'reserved');
CREATE TYPE followup_type AS ENUM ('call', 'email', 'meeting', 'site_visit');
CREATE TYPE followup_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE followup_status AS ENUM ('pending', 'completed', 'cancelled', 'rescheduled');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'agent',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    type project_type NOT NULL DEFAULT 'residential',
    start_date DATE,
    end_date DATE,
    total_units INTEGER DEFAULT 0,
    sold_units INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    flat_no VARCHAR(50),
    floor INTEGER,
    area_sqft DECIMAL(10,2),
    price DECIMAL(15,2),
    status property_status DEFAULT 'available',
    description TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts/Leads table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    source VARCHAR(100),
    status lead_status DEFAULT 'new',
    type contact_type DEFAULT 'buyer',
    assigned_agent_id UUID REFERENCES users(id),
    interested_project_id UUID REFERENCES projects(id),
    interested_property_id UUID REFERENCES properties(id),
    lead_score INTEGER DEFAULT 50,
    budget DECIMAL(15,2),
    requirements TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-ups table
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type followup_type DEFAULT 'call',
    priority followup_priority DEFAULT 'medium',
    status followup_status DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    completed_date TIMESTAMP WITH TIME ZONE,
    assigned_user_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead activities/history table
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles mapping (for future extensibility)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create indexes for better performance
CREATE INDEX idx_contacts_assigned_agent ON contacts(assigned_agent_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_properties_project_id ON properties(project_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_follow_ups_contact_id ON follow_ups(contact_id);
CREATE INDEX idx_follow_ups_assigned_user ON follow_ups(assigned_user_id);
CREATE INDEX idx_follow_ups_scheduled_date ON follow_ups(scheduled_date);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);
CREATE INDEX idx_lead_activities_contact_id ON lead_activities(contact_id);
CREATE INDEX idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
-- Note: This password is hashed using bcrypt with 10 rounds
INSERT INTO users (email, password, name, role) VALUES 
('admin@demo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin'),
('manager@demo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manager User', 'manager'),
('agent@demo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Agent User', 'agent');

-- Insert sample projects
INSERT INTO projects (name, description, location, type, total_units) VALUES 
('Green Valley Heights', 'Luxury residential apartments with modern amenities', 'Downtown', 'residential', 100),
('Business Plaza', 'Commercial complex with office spaces', 'Business District', 'commercial', 50),
('Sunset Villas', 'Premium villa project with garden spaces', 'Suburbs', 'residential', 25);

-- Insert sample properties
INSERT INTO properties (project_id, flat_no, floor, area_sqft, price, bedrooms, bathrooms) 
SELECT 
    p.id,
    'A-' || generate_series(1, 10),
    ((generate_series(1, 10) - 1) / 2) + 1,
    1200 + (generate_series(1, 10) * 50),
    800000 + (generate_series(1, 10) * 50000),
    2 + (generate_series(1, 10) % 3),
    1 + (generate_series(1, 10) % 2)
FROM projects p
WHERE p.name = 'Green Valley Heights';

-- Add comments for documentation
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE projects IS 'Real estate projects containing multiple properties';
COMMENT ON TABLE properties IS 'Individual properties within projects';
COMMENT ON TABLE contacts IS 'Leads and customer contacts';
COMMENT ON TABLE follow_ups IS 'Follow-up tasks and reminders';
COMMENT ON TABLE lead_activities IS 'Activity history for leads';
