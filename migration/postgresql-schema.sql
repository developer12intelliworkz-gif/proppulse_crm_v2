
-- PostgreSQL Schema for CRM Migration from Supabase
-- Run this script on your PostgreSQL database

-- Create ENUM types first
CREATE TYPE lead_status AS ENUM ('Active', 'Inactive', 'Converted', 'Cold');
CREATE TYPE contact_type AS ENUM ('buyer', 'seller', 'investor', 'agent');

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    status TEXT DEFAULT 'lead',
    type TEXT DEFAULT 'buyer',
    properties INTEGER DEFAULT 0,
    lead_score INTEGER DEFAULT 50,
    referral_source TEXT,
    campaign_source TEXT,
    last_contact TEXT,
    lead_source TEXT DEFAULT 'Website Form',
    lead_source_details TEXT,
    current_scenario TEXT,
    budget TEXT,
    timeline TEXT,
    requirements TEXT,
    assigned_agent TEXT,
    notes TEXT,
    communication_preference TEXT DEFAULT 'Email',
    social_media TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    type TEXT DEFAULT 'house',
    price NUMERIC,
    beds INTEGER,
    baths NUMERIC,
    sqft INTEGER,
    description TEXT,
    status TEXT DEFAULT 'available',
    listing_date TEXT,
    agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    contact TEXT NOT NULL,
    property TEXT,
    type TEXT DEFAULT 'call',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TEXT NOT NULL,
    due_time TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legacy contact table (if you need to maintain compatibility)
CREATE TABLE IF NOT EXISTS contact (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    name TEXT,
    email TEXT,
    phone TEXT,
    location VARCHAR(255),
    type contact_type NOT NULL,
    status lead_status DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    "UUID" BIGSERIAL PRIMARY KEY,
    role VARCHAR(255) NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_role table
CREATE TABLE IF NOT EXISTS app_role (
    id BIGSERIAL PRIMARY KEY,
    app_role VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Main contacts table for CRM system';
COMMENT ON TABLE properties IS 'Real estate properties table';
COMMENT ON TABLE follow_ups IS 'Follow-up tasks and reminders';
