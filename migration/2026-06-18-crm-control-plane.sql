-- Control-plane database schema (crm_control)
-- Run separately when provisioning database-per-tenant routing.
-- Does NOT modify the main CRM tenant database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS platform_admins (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(120) NOT NULL,
    email         CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(150) NOT NULL,
    slug           VARCHAR(160) UNIQUE NOT NULL,
    legal_name     VARCHAR(200),
    contact_email  CITEXT NOT NULL,
    contact_phone  VARCHAR(20),
    db_name        VARCHAR(63) UNIQUE NOT NULL,
    db_host        VARCHAR(255) NOT NULL,
    db_port        INTEGER NOT NULL DEFAULT 5432,
    db_user        VARCHAR(63) NOT NULL,
    db_secret_ref  VARCHAR(255) NOT NULL,
    region         VARCHAR(40),
    status         VARCHAR(20) NOT NULL DEFAULT 'provisioning'
                   CHECK (status IN ('provisioning','active','suspended','terminated')),
    plan           VARCHAR(40),
    provisioned_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_subscriptions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan               VARCHAR(40) NOT NULL,
    seats              INTEGER NOT NULL DEFAULT 1,
    status             VARCHAR(20) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','past_due','canceled')),
    current_period_end TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
