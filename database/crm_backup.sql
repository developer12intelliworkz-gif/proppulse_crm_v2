--
-- PostgreSQL database dump
--

\restrict DfOZDQmGDUV4mIKBg8ixNmOSbkXSU230aTw5nAlQr2uu5aUe4umAuOfbOVhqPYl

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgagent; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA pgagent;


ALTER SCHEMA pgagent OWNER TO postgres;

--
-- Name: SCHEMA pgagent; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA pgagent IS 'pgAgent system tables';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: contact_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contact_type AS ENUM (
    'buyer',
    'seller',
    'investor',
    'agent'
);


ALTER TYPE public.contact_type OWNER TO postgres;

--
-- Name: followup_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.followup_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.followup_priority OWNER TO postgres;

--
-- Name: followup_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.followup_status AS ENUM (
    'pending',
    'completed',
    'cancelled',
    'rescheduled'
);


ALTER TYPE public.followup_status OWNER TO postgres;

--
-- Name: followup_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.followup_type AS ENUM (
    'call',
    'email',
    'meeting',
    'site_visit'
);


ALTER TYPE public.followup_type OWNER TO postgres;

--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'visited',
    'converted',
    'dropped'
);


ALTER TYPE public.lead_status OWNER TO postgres;

--
-- Name: project_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.project_type AS ENUM (
    'residential',
    'commercial'
);


ALTER TYPE public.project_type OWNER TO postgres;

--
-- Name: property_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_status AS ENUM (
    'available',
    'sold',
    'reserved'
);


ALTER TYPE public.property_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'manager',
    'agent',
    'user(sales)'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: insert_project(character varying, text, character varying, public.project_type, date, date, integer, uuid); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.insert_project(IN _name character varying, IN _description text, IN _location character varying, IN _type public.project_type, IN _start_date date, IN _end_date date, IN _total_units integer, IN _created_by uuid)
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO projects (
    name, description, location, type,
    start_date, end_date, total_units,
    sold_units, is_active, created_by, created_at, updated_at
  ) VALUES (
    _name, _description, _location, _type,
    _start_date, _end_date, _total_units,
    0, TRUE, _created_by, NOW(), NOW()
  );
END;
$$;


ALTER PROCEDURE public.insert_project(IN _name character varying, IN _description text, IN _location character varying, IN _type public.project_type, IN _start_date date, IN _end_date date, IN _total_units integer, IN _created_by uuid) OWNER TO postgres;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: amenity_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenity_master (
    id integer NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.amenity_master OWNER TO postgres;

--
-- Name: amenity_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenity_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amenity_master_id_seq OWNER TO postgres;

--
-- Name: amenity_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenity_master_id_seq OWNED BY public.amenity_master.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255),
    description text,
    logo_url character varying(512),
    website_url character varying(512),
    time_zone character varying(50),
    currency character varying(50),
    custom_reporting_email character varying(255),
    disclaimer text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: company_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    zip character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_addresses OWNER TO postgres;

--
-- Name: company_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_contacts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    salutation character varying(50),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    contact_type character varying(50),
    phone character varying(20),
    email character varying(255) NOT NULL,
    enable_notification_email boolean DEFAULT false,
    enable_notification_sms boolean DEFAULT false,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_contacts OWNER TO postgres;

--
-- Name: company_dlt_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_dlt_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    dlt_entity_id character varying(100),
    telemarketer_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_dlt_details OWNER TO postgres;

--
-- Name: company_email_footers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_email_footers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    footer_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_email_footers OWNER TO postgres;

--
-- Name: company_marketing_domains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_marketing_domains (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    domain character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_marketing_domains OWNER TO postgres;

--
-- Name: company_social_urls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_social_urls (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    facebook_url character varying(512),
    twitter_url character varying(512),
    google_plus_url character varying(512),
    linkedin_url character varying(512),
    youtube_url character varying(512),
    instagram_url character varying(512),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_social_urls OWNER TO postgres;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(20),
    source character varying(100),
    status public.lead_status DEFAULT 'new'::public.lead_status,
    type public.contact_type DEFAULT 'buyer'::public.contact_type,
    assigned_agent_id uuid,
    interested_project_id uuid,
    interested_property_id uuid,
    lead_score integer DEFAULT 50,
    budget numeric(15,2),
    requirements text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: TABLE contacts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contacts IS 'Leads and customer contacts';


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    folder_id integer,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folders (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    parent_id integer,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.folders OWNER TO postgres;

--
-- Name: folders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.folders_id_seq OWNER TO postgres;

--
-- Name: folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.folders_id_seq OWNED BY public.folders.id;


--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follow_ups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    title character varying(255) NOT NULL,
    description text,
    type public.followup_type DEFAULT 'call'::public.followup_type,
    priority public.followup_priority DEFAULT 'medium'::public.followup_priority,
    status public.followup_status DEFAULT 'pending'::public.followup_status,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone,
    completed_date timestamp with time zone,
    assigned_user_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.follow_ups OWNER TO postgres;

--
-- Name: TABLE follow_ups; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.follow_ups IS 'Follow-up tasks and reminders';


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_activities (
    id integer NOT NULL,
    lead_id integer,
    type character varying(50) NOT NULL,
    description text,
    date date,
    "time" time without time zone,
    agent character varying(100),
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.lead_activities OWNER TO postgres;

--
-- Name: lead_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_activities_id_seq OWNER TO postgres;

--
-- Name: lead_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_activities_id_seq OWNED BY public.lead_activities.id;


--
-- Name: lead_assignment_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_assignment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id integer NOT NULL,
    old_assigned_to uuid,
    new_assigned_to uuid,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    unassigned_at timestamp with time zone,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lead_assignment_history OWNER TO postgres;

--
-- Name: lead_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_documents (
    id integer NOT NULL,
    lead_id integer,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    document_pdf character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.lead_documents OWNER TO postgres;

--
-- Name: lead_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_documents_id_seq OWNER TO postgres;

--
-- Name: lead_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_documents_id_seq OWNED BY public.lead_documents.id;


--
-- Name: lead_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    logo_image character varying(255),
    logo_name character varying(255),
    is_assignable boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.lead_types OWNER TO postgres;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    phone character varying(20),
    lead_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    status character varying(50) DEFAULT 'new'::character varying,
    address text,
    property_type character varying(100),
    budget numeric(15,2),
    message text,
    is_active boolean DEFAULT true,
    deleted_at timestamp without time zone,
    interested_project_id integer,
    lead_source character varying(100) DEFAULT 'manual'::character varying,
    external_id text,
    assigned_to uuid,
    interest_level character varying(50) DEFAULT NULL::character varying
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: message_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_reads (
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_reads OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    text text DEFAULT ''::text,
    image_url text DEFAULT ''::text,
    video_url text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id uuid,
    type character varying(50),
    message text,
    entity_id integer,
    entity_type character varying(50),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: otp_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_records (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(4) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.otp_records OWNER TO postgres;

--
-- Name: otp_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_records_id_seq OWNER TO postgres;

--
-- Name: otp_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_records_id_seq OWNED BY public.otp_records.id;


--
-- Name: project_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_amenities (
    id integer NOT NULL,
    project_id integer NOT NULL,
    amenity_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_amenities OWNER TO postgres;

--
-- Name: project_amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_amenities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_amenities_id_seq OWNER TO postgres;

--
-- Name: project_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_amenities_id_seq OWNED BY public.project_amenities.id;


--
-- Name: project_brochure_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_brochure_files (
    id integer NOT NULL,
    brochure_id integer NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.project_brochure_files OWNER TO postgres;

--
-- Name: project_brochure_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_brochure_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_brochure_files_id_seq OWNER TO postgres;

--
-- Name: project_brochure_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_brochure_files_id_seq OWNED BY public.project_brochure_files.id;


--
-- Name: project_brochures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_brochures (
    id integer NOT NULL,
    project_id integer,
    name character varying(255) NOT NULL,
    active boolean DEFAULT true,
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_brochures OWNER TO postgres;

--
-- Name: project_brochures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_brochures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_brochures_id_seq OWNER TO postgres;

--
-- Name: project_brochures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_brochures_id_seq OWNED BY public.project_brochures.id;


--
-- Name: project_floors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_floors (
    id integer NOT NULL,
    project_id integer NOT NULL,
    tower_id integer NOT NULL,
    floor_number character varying(20) NOT NULL,
    floor_type character varying(30) DEFAULT 'residential'::character varying,
    total_units integer,
    floor_area_sqft numeric(10,2),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT project_floors_floor_type_check CHECK (((floor_type)::text = ANY (ARRAY[('residential'::character varying)::text, ('commercial'::character varying)::text, ('parking'::character varying)::text, ('podium'::character varying)::text, ('terrace'::character varying)::text, ('basement'::character varying)::text])))
);


ALTER TABLE public.project_floors OWNER TO postgres;

--
-- Name: project_floors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_floors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_floors_id_seq OWNER TO postgres;

--
-- Name: project_floors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_floors_id_seq OWNED BY public.project_floors.id;


--
-- Name: project_hierarchy_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_hierarchy_nodes (
    id integer NOT NULL,
    project_id integer NOT NULL,
    parent_id integer,
    type_code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.project_hierarchy_nodes OWNER TO postgres;

--
-- Name: project_hierarchy_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_hierarchy_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_hierarchy_nodes_id_seq OWNER TO postgres;

--
-- Name: project_hierarchy_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_hierarchy_nodes_id_seq OWNED BY public.project_hierarchy_nodes.id;


--
-- Name: project_price_quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_price_quotes (
    id integer NOT NULL,
    project_id integer,
    active boolean DEFAULT true,
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_price_quotes OWNER TO postgres;

--
-- Name: project_price_quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_price_quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_price_quotes_id_seq OWNER TO postgres;

--
-- Name: project_price_quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_price_quotes_id_seq OWNED BY public.project_price_quotes.id;


--
-- Name: project_specifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_specifications (
    id integer NOT NULL,
    project_id integer,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_specifications OWNER TO postgres;

--
-- Name: project_specifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_specifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_specifications_id_seq OWNER TO postgres;

--
-- Name: project_specifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_specifications_id_seq OWNED BY public.project_specifications.id;


--
-- Name: project_towers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_towers (
    id integer NOT NULL,
    project_id integer NOT NULL,
    tower_name character varying(100) NOT NULL,
    total_floors integer NOT NULL,
    total_units integer,
    tower_type character varying(20) DEFAULT 'residential'::character varying,
    lift_count integer,
    parking_type character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT project_towers_total_floors_check CHECK ((total_floors > 0)),
    CONSTRAINT project_towers_tower_type_check CHECK (((tower_type)::text = ANY (ARRAY[('residential'::character varying)::text, ('commercial'::character varying)::text, ('mixed'::character varying)::text])))
);


ALTER TABLE public.project_towers OWNER TO postgres;

--
-- Name: project_towers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_towers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_towers_id_seq OWNER TO postgres;

--
-- Name: project_towers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_towers_id_seq OWNED BY public.project_towers.id;


--
-- Name: project_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_units (
    id integer NOT NULL,
    project_id integer NOT NULL,
    tower_id integer NOT NULL,
    floor_id integer NOT NULL,
    unit_type_id integer NOT NULL,
    unit_number character varying(50) NOT NULL,
    facing character varying(50),
    is_corner boolean DEFAULT false,
    plc_applicable boolean DEFAULT false,
    floor_rise_applicable boolean DEFAULT true,
    status character varying(20) DEFAULT 'available'::character varying,
    remarks text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    hierarchy_node_id integer NOT NULL,
    carpet_area_sqft numeric(12,2),
    super_builtup_area_sqft numeric(12,2),
    lead_id integer,
    price numeric(14,2),
    amenities jsonb DEFAULT '[]'::jsonb NOT NULL,
    carpet_area_unit text DEFAULT 'sqft'::text,
    super_builtup_area_unit text DEFAULT 'sqft'::text,
    base_rate numeric,
    total_price numeric,
    has_parking boolean DEFAULT false,
    parking_count integer,
    CONSTRAINT chk_hierarchy_node_not_null_when_active CHECK (((deleted_at IS NOT NULL) OR (hierarchy_node_id IS NOT NULL))),
    CONSTRAINT project_units_status_check CHECK (((status)::text = ANY (ARRAY[('available'::character varying)::text, ('blocked'::character varying)::text, ('booked'::character varying)::text, ('sold'::character varying)::text])))
);


ALTER TABLE public.project_units OWNER TO postgres;

--
-- Name: project_units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_units_id_seq OWNER TO postgres;

--
-- Name: project_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_units_id_seq OWNED BY public.project_units.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255),
    description text,
    rera_project_id character varying(50),
    sales character varying(100),
    notify_to_emails text[] DEFAULT '{}'::text[],
    launched_on date,
    expected_completion date,
    possession date,
    is_active boolean DEFAULT true,
    inventory boolean DEFAULT false,
    search_address character varying(255),
    address character varying(255),
    street character varying(255),
    country character varying(100),
    state character varying(100),
    city character varying(100),
    zip character varying(20),
    locality character varying(255),
    latitude character varying(50),
    longitude character varying(50),
    enable_vr boolean DEFAULT false,
    amenities jsonb,
    india_property_code character varying(50),
    magicbricks_code character varying(50),
    status character varying(20) DEFAULT 'draft'::character varying,
    created_by character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    completed_steps integer[] DEFAULT '{}'::integer[],
    vr_upload character varying(255),
    brochure_uploads text[] DEFAULT '{}'::text[],
    office_address text DEFAULT ''::text,
    project_type character varying(20),
    project_structure character varying(50),
    inventory_subcategory text,
    project_logo text,
    gallery_images jsonb DEFAULT '[]'::jsonb NOT NULL,
    gallery_videos jsonb DEFAULT '[]'::jsonb NOT NULL,
    marketing_brochures text[] DEFAULT '{}'::text[],
    rera_documents text[] DEFAULT '{}'::text[],
    portal_selection text,
    portal_reference_key text,
    portal_sync_status text,
    CONSTRAINT projects_project_type_check CHECK (((project_type)::text = ANY (ARRAY[('RESIDENTIAL'::character varying)::text, ('COMMERCIAL'::character varying)::text, ('INDUSTRIAL'::character varying)::text, ('MIXED_USE'::character varying)::text, ('LAND'::character varying)::text])))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects_backup (
    name character varying(255) NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    state character varying(100),
    city character varying(100),
    zip character varying(20),
    locality character varying(100),
    latitude numeric(10,6),
    longitude numeric(11,6),
    rera_project_id character varying(50),
    sales text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location character varying(255),
    type public.project_type,
    start_date date,
    end_date date,
    total_units integer DEFAULT 0,
    sold_units integer DEFAULT 0,
    is_active boolean DEFAULT true
);


ALTER TABLE public.projects_backup OWNER TO postgres;

--
-- Name: TABLE projects_backup; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.projects_backup IS 'Real estate projects containing multiple properties';


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: projects_ordered; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.projects_ordered AS
 SELECT id,
    name,
    description,
    state,
    city,
    zip,
    locality,
    latitude,
    longitude,
    rera_project_id,
    sales,
    location,
    type,
    start_date,
    end_date,
    total_units,
    sold_units,
    is_active,
    created_by,
    created_at,
    updated_at
   FROM public.projects_backup;


ALTER VIEW public.projects_ordered OWNER TO postgres;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    flat_no character varying(50),
    floor integer,
    area_sqft numeric(10,2),
    price numeric(15,2),
    status public.property_status DEFAULT 'available'::public.property_status,
    description text,
    bedrooms integer,
    bathrooms integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: TABLE properties; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.properties IS 'Individual properties within projects';


--
-- Name: quotation_number_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_number_sequences (
    year integer NOT NULL,
    last_number integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quotation_number_sequences OWNER TO postgres;

--
-- Name: quotation_particulars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_particulars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    label character varying(255) NOT NULL,
    calculation_type character varying(50) NOT NULL,
    value numeric(10,4) NOT NULL,
    applies_to character varying(50) DEFAULT 'unit'::character varying,
    include_in_subtotal boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    is_optional boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.quotation_particulars OWNER TO postgres;

--
-- Name: quotation_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id integer NOT NULL,
    template_name character varying(255) NOT NULL,
    version integer DEFAULT 1,
    is_active boolean DEFAULT true,
    has_terrace_units boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.quotation_templates OWNER TO postgres;

--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    project_id integer NOT NULL,
    unit_id integer NOT NULL,
    lead_id integer,
    quotation_number character varying(100),
    client_name character varying(255),
    quotation_date date DEFAULT CURRENT_DATE,
    base_price numeric(15,2) DEFAULT 0 NOT NULL,
    carpet_area numeric(10,2),
    super_builtup_area numeric(10,2),
    terrace_area numeric(10,2),
    unit_rate numeric(10,2),
    terrace_rate numeric(10,2),
    total_amount numeric(15,2) DEFAULT 0 NOT NULL,
    particulars_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: roles_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_name character varying(100) NOT NULL,
    permissions jsonb NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.roles_permissions OWNER TO postgres;

--
-- Name: task_activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_activity_log (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id text,
    user_name text,
    action text NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_activity_log OWNER TO postgres;

--
-- Name: task_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_activity_log_id_seq OWNER TO postgres;

--
-- Name: task_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_activity_log_id_seq OWNED BY public.task_activity_log.id;


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_comments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id text NOT NULL,
    user_name text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_comments OWNER TO postgres;

--
-- Name: task_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_comments_id_seq OWNER TO postgres;

--
-- Name: task_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_comments_id_seq OWNED BY public.task_comments.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    due_on timestamp with time zone,
    assignees uuid[] NOT NULL,
    remark text,
    priority character varying(10) DEFAULT 'medium'::character varying,
    document character varying(255),
    created_by uuid NOT NULL,
    project_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    lead_id integer,
    status character varying(32) DEFAULT 'open'::character varying,
    due_time time without time zone,
    reminder_at timestamp with time zone,
    association_type character varying(20) DEFAULT 'standalone'::character varying,
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text])))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: unit_pricing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_pricing (
    id integer NOT NULL,
    project_id integer NOT NULL,
    unit_id integer NOT NULL,
    base_rate_per_sqft numeric(12,2) NOT NULL,
    total_base_amount numeric(15,2),
    floor_rise_per_floor numeric(12,2),
    plc_amount numeric(12,2) DEFAULT 0,
    amenities_charges numeric(12,2) DEFAULT 0,
    parking_charges numeric(12,2) DEFAULT 0,
    gst_percentage numeric(5,2) DEFAULT 5,
    other_charges numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    effective_from date NOT NULL,
    effective_to date,
    remarks text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT unit_pricing_base_rate_per_sqft_check CHECK ((base_rate_per_sqft >= (0)::numeric))
);


ALTER TABLE public.unit_pricing OWNER TO postgres;

--
-- Name: unit_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_pricing_id_seq OWNER TO postgres;

--
-- Name: unit_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_pricing_id_seq OWNED BY public.unit_pricing.id;


--
-- Name: unit_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_types (
    id integer NOT NULL,
    project_id integer NOT NULL,
    unit_name character varying(100) NOT NULL,
    configuration character varying(100),
    carpet_area_sqft numeric(10,2) NOT NULL,
    builtup_area_sqft numeric(10,2),
    super_builtup_area_sqft numeric(10,2),
    balcony_area_sqft numeric(10,2),
    bedroom_count integer,
    bathroom_count integer,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    label text,
    is_active boolean DEFAULT true,
    CONSTRAINT unit_types_carpet_area_sqft_check CHECK ((carpet_area_sqft > (0)::numeric))
);


ALTER TABLE public.unit_types OWNER TO postgres;

--
-- Name: unit_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_types_id_seq OWNER TO postgres;

--
-- Name: unit_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_types_id_seq OWNED BY public.unit_types.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role character varying(50) NOT NULL,
    assigned_by character varying(100),
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    user_id uuid
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    deleted_at timestamp with time zone,
    photo character varying(255),
    roles_permissions_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'System users with role-based access';


--
-- Name: amenity_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_master ALTER COLUMN id SET DEFAULT nextval('public.amenity_master_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: folders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders ALTER COLUMN id SET DEFAULT nextval('public.folders_id_seq'::regclass);


--
-- Name: lead_activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities ALTER COLUMN id SET DEFAULT nextval('public.lead_activities_id_seq'::regclass);


--
-- Name: lead_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_documents ALTER COLUMN id SET DEFAULT nextval('public.lead_documents_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: otp_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_records ALTER COLUMN id SET DEFAULT nextval('public.otp_records_id_seq'::regclass);


--
-- Name: project_amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_amenities ALTER COLUMN id SET DEFAULT nextval('public.project_amenities_id_seq'::regclass);


--
-- Name: project_brochure_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_brochure_files ALTER COLUMN id SET DEFAULT nextval('public.project_brochure_files_id_seq'::regclass);


--
-- Name: project_brochures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_brochures ALTER COLUMN id SET DEFAULT nextval('public.project_brochures_id_seq'::regclass);


--
-- Name: project_floors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_floors ALTER COLUMN id SET DEFAULT nextval('public.project_floors_id_seq'::regclass);


--
-- Name: project_hierarchy_nodes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_hierarchy_nodes ALTER COLUMN id SET DEFAULT nextval('public.project_hierarchy_nodes_id_seq'::regclass);


--
-- Name: project_price_quotes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_price_quotes ALTER COLUMN id SET DEFAULT nextval('public.project_price_quotes_id_seq'::regclass);


--
-- Name: project_specifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_specifications ALTER COLUMN id SET DEFAULT nextval('public.project_specifications_id_seq'::regclass);


--
-- Name: project_towers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_towers ALTER COLUMN id SET DEFAULT nextval('public.project_towers_id_seq'::regclass);


--
-- Name: project_units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units ALTER COLUMN id SET DEFAULT nextval('public.project_units_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: task_activity_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_activity_log ALTER COLUMN id SET DEFAULT nextval('public.task_activity_log_id_seq'::regclass);


--
-- Name: task_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments ALTER COLUMN id SET DEFAULT nextval('public.task_comments_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: unit_pricing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_pricing ALTER COLUMN id SET DEFAULT nextval('public.unit_pricing_id_seq'::regclass);


--
-- Name: unit_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types ALTER COLUMN id SET DEFAULT nextval('public.unit_types_id_seq'::regclass);


--
-- Data for Name: amenity_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.amenity_master (id, name, is_active, created_at) FROM stdin;
2	Garden	t	2026-06-11 14:54:39.428241+05:30
1	Balcony	f	2026-06-11 14:54:33.175719+05:30
4	Gym	t	2026-06-15 10:41:58.357204+05:30
5	Tempel	t	2026-06-15 11:01:09.73181+05:30
6	club house	t	2026-06-15 11:06:16.775927+05:30
8	Terrace	t	2026-06-15 16:25:09.340562+05:30
3	Park	t	2026-06-11 14:54:44.242585+05:30
12	123	t	2026-06-15 19:21:27.972989+05:30
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, description, logo_url, website_url, time_zone, currency, custom_reporting_email, disclaimer, created_by, created_at, updated_at, deleted_at) FROM stdin;
75460a9e-5d6a-4f14-b1cf-505f338f18de	Intelliworkz Business Solutions Private Limited	A Digital and Technology Services Company offering expertise in Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions & Mobile Applications. We provide customized solutions to help clients cut operational costs and focus on core business activities.	https://intelliworkz.tech/logo.png	https://intelliworkz.tech	Asia/Kolkata	INR	reports@intelliworkz.tech	All information is subject to change without notice. Intelliworkz Business Solutions Pvt. Ltd. All Rights Reserved.	8882667a-81c9-4b0d-b82b-7b6ce0e9af08	2025-08-22 11:29:22.761425	2025-08-22 11:29:22.761425	\N
60c06a65-d9cb-4df7-89fc-4a77004a353d	Intelliworkz Business Solutions Pvt.	A Digital and Technology Services Company offering expertise in Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions & Mobile Applications. We provide customized solutions to help clients cut operational costs and focus on core business activities.	/api/uploads/1781842758677.png	https://intelliworkz.tech	Asia/Kolkata	INR	reports@intelliworkz.tech	All information is subject to change without notice. Intelliworkz Business Solutions Pvt. Ltd. All Rights Reserved.	8882667a-81c9-4b0d-b82b-7b6ce0e9af08	2025-08-22 11:28:51.498434	2026-06-19 09:49:20.45663	\N
\.


--
-- Data for Name: company_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_addresses (id, company_id, address_line1, address_line2, city, state, country, zip, created_at) FROM stdin;
8eeae65d-c078-4186-a1bb-7c1ab39a0828	75460a9e-5d6a-4f14-b1cf-505f338f18de	B 912/A, World Trade Tower	Behind Skoda Showroom, Makarba	Ahmedabad	Gujarat	India	380051	2025-08-22 11:29:22.761425
5ad493fb-a454-420c-8a2d-302155d5c975	60c06a65-d9cb-4df7-89fc-4a77004a353d	B 912/A, World Trade Tower	Behind Skoda Showroom, Makarba	Ahmedabad	Gujarat	India	380051	2025-09-20 17:36:18.854691
\.


--
-- Data for Name: company_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_contacts (id, company_id, salutation, first_name, last_name, contact_type, phone, email, enable_notification_email, enable_notification_sms, is_primary, created_at) FROM stdin;
d8059f21-57ea-4222-97e1-b7a9ef2fc57d	60c06a65-d9cb-4df7-89fc-4a77004a353d	Mr.	Sudhir	Patel	Director	+91-760-001-3134	sudhir.patel@intelliworkz.tech	t	f	t	2025-08-22 11:28:51.498434
04c3bb3a-797b-47d3-8466-1e024c206bbb	75460a9e-5d6a-4f14-b1cf-505f338f18de	Mr.	Sudhir	Patel	Director	+91-760-001-3134	sudhir.patel@intelliworkz.tech	t	f	t	2025-08-22 11:29:22.761425
\.


--
-- Data for Name: company_dlt_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_dlt_details (id, company_id, dlt_entity_id, telemarketer_id, created_at) FROM stdin;
58384790-6729-4699-8cce-893e9dfc7c42	60c06a65-d9cb-4df7-89fc-4a77004a353d	DLT987654	TM123456	2025-08-22 11:28:51.498434
67e600c7-80b7-480a-b2db-023b3389d883	75460a9e-5d6a-4f14-b1cf-505f338f18de	DLT987654	TM123456	2025-08-22 11:29:22.761425
\.


--
-- Data for Name: company_email_footers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_email_footers (id, company_id, footer_text, created_at) FROM stdin;
234841f0-2d6a-483d-a999-e020da39f798	60c06a65-d9cb-4df7-89fc-4a77004a353d	Intelliworkz Business Solutions Pvt. Ltd. | B 912/A, World Trade Tower, Behind Skoda Showroom, Makarba, Ahmedabad, Gujarat 380051, India | Toll Free: 1800 8907 123 | Email: hello@intelliworkz.tech	2025-08-22 11:28:51.498434
b529c656-8591-481c-8cd9-11cdece8a2f9	75460a9e-5d6a-4f14-b1cf-505f338f18de	Intelliworkz Business Solutions Pvt. Ltd. | B 912/A, World Trade Tower, Behind Skoda Showroom, Makarba, Ahmedabad, Gujarat 380051, India | Toll Free: 1800 8907 123 | Email: hello@intelliworkz.tech	2025-08-22 11:29:22.761425
\.


--
-- Data for Name: company_marketing_domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_marketing_domains (id, company_id, domain, created_at) FROM stdin;
342010fa-2758-4447-8aea-b5a8dd86f7cd	60c06a65-d9cb-4df7-89fc-4a77004a353d	intelliworkz.tech	2025-08-22 11:28:51.498434
b18e96a7-e309-4fc5-bf60-db1bc952630d	75460a9e-5d6a-4f14-b1cf-505f338f18de	intelliworkz.tech	2025-08-22 11:29:22.761425
\.


--
-- Data for Name: company_social_urls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_social_urls (id, company_id, facebook_url, twitter_url, google_plus_url, linkedin_url, youtube_url, instagram_url, created_at) FROM stdin;
93e55781-176b-4ee5-a588-cd3fa05435ed	75460a9e-5d6a-4f14-b1cf-505f338f18de	https://facebook.com/intelliworkz	https://twitter.com/intelliworkz	\N	https://linkedin.com/company/intelliworkz-business-solutions-pvt-ltd	\N	https://instagram.com/intelliworkz	2025-08-22 11:29:22.761425
0441b25e-0771-447a-a7dc-8a3672ff0d67	60c06a65-d9cb-4df7-89fc-4a77004a353d	https://facebook.com/intelliworkz	https://twitter.com/intelliworkz		https://linkedin.com/company/intelliworkz-business-solutions-pvt-ltd		https://instagram.com/intelliworkz	2025-09-20 17:36:20.433289
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, name, email, phone, source, status, type, assigned_agent_id, interested_project_id, interested_property_id, lead_score, budget, requirements, notes, created_at, updated_at) FROM stdin;
9167d08e-6366-4d29-942c-47fac80076df	Lead 1	lead1@example.com	+1234567001	Referral	contacted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	550000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
a4a67423-4075-43f2-97e5-b45ba74ddda2	Lead 2	lead2@example.com	+1234567002	Social Media	qualified	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	600000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
0d8ed02d-e7bc-422d-9a5e-c965abd098fd	Lead 3	lead3@example.com	+1234567003	Cold Call	visited	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	650000.00	Looking for a 2 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
1d019edd-77d6-422a-8735-7d32d6c07a29	Lead 4	lead4@example.com	+1234567004	Website Form	converted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	700000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
8692ecf6-b159-4c6d-b68f-63767517f1f0	Lead 5	lead5@example.com	+1234567005	Referral	new	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	750000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
699a0d04-1f5e-4564-a2d9-02d0b453aa6a	Lead 6	lead6@example.com	+1234567006	Social Media	contacted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	800000.00	Looking for a 2 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
d54e8bbc-4a0a-4794-8620-a188a1208c66	Lead 7	lead7@example.com	+1234567007	Cold Call	qualified	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	850000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
7f2810cd-f201-4567-98a6-087fc6f0eee9	Lead 8	lead8@example.com	+1234567008	Website Form	visited	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	900000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
c63d1d8d-c4ea-4495-8eb6-c3c6251bacce	Lead 9	lead9@example.com	+1234567009	Referral	converted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	950000.00	Looking for a 2 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
790bf021-a94c-4edf-ab70-30bb3932ac7e	Lead 10	lead10@example.com	+1234567010	Social Media	new	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1000000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
d8f1f987-715a-4aa1-9f6c-d56caea3e76c	Lead 11	lead11@example.com	+1234567011	Cold Call	contacted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1050000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
75db3d93-2711-44f7-a3f7-e3f726ec658b	Lead 12	lead12@example.com	+1234567012	Website Form	qualified	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1100000.00	Looking for a 2 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
92aceeea-9ad8-47fc-9930-695a56fe25ea	Lead 13	lead13@example.com	+1234567013	Referral	visited	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1150000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
de3532e9-972f-4b6b-af52-a07304c5c7fe	Lead 14	lead14@example.com	+1234567014	Social Media	converted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1200000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
df282108-35c6-4d5d-a3ff-399d8f2fe2e1	Lead 15	lead15@example.com	+1234567015	Cold Call	new	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1250000.00	Looking for a 2 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
a0cdbc8d-d063-4b89-95bd-d7c2d23ed90e	Lead 16	lead16@example.com	+1234567016	Website Form	contacted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1300000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
d3404301-8c43-4160-85e7-92b189976d6f	Lead 17	lead17@example.com	+1234567017	Referral	qualified	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1350000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
bb23e640-764b-4d35-a59f-2086f7c8040c	Lead 18	lead18@example.com	+1234567018	Social Media	visited	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1400000.00	Looking for a 2 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
e420aaca-44a8-4e9c-944d-501ff3fe741c	Lead 19	lead19@example.com	+1234567019	Cold Call	converted	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1450000.00	Looking for a 3 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
62d4297f-1478-424a-8c49-d84f62352e62	Lead 20	lead20@example.com	+1234567020	Website Form	new	buyer	e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	\N	\N	50	1500000.00	Looking for a 4 bedroom apartment	\N	2025-06-07 16:06:26.337808+05:30	2025-06-07 16:06:26.337808+05:30
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, sender_id, receiver_id, created_at, updated_at) FROM stdin;
9169a5df-ecfe-4013-95d0-2c52c762fcf5	1c46541d-18ed-40fa-ad80-6c900111e816	047cbd62-bd78-4e42-be1c-72395edaf057	2025-12-17 14:30:58.617934+05:30	2025-12-17 16:23:35.07977+05:30
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, name, path, folder_id, user_id, created_at, updated_at) FROM stdin;
1	download.png	download-1763102726723.png	1	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:15:26.864512+05:30	2025-11-14 12:15:26.864512+05:30
2	arvind_rajput.jpeg	arvind_rajput-1763102793318.jpeg	1	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:16:33.321816+05:30	2025-11-14 12:16:33.321816+05:30
4	arvind_rajput.jpeg	arvind_rajput-1763105158513.jpeg	19	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:55:58.519224+05:30	2025-11-14 12:55:58.519224+05:30
5	678828341-Account-Statement.pdf	678828341-Account-Statement-1763109977375.pdf	1	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 14:16:17.552774+05:30	2025-11-14 14:16:17.552774+05:30
6	download.png	download-1763119767506.png	21	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 16:59:27.530733+05:30	2025-11-14 16:59:27.530733+05:30
7	steps-for-golden-harbour.pdf	steps-for-golden-harbour-1763119834292.pdf	22	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 17:00:34.302056+05:30	2025-11-14 17:00:34.302056+05:30
8	dummy_leads (2) (1).xlsx	dummy_leads (2) (1)-1763119908709.xlsx	22	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 17:01:49.929165+05:30	2025-11-14 17:01:49.929165+05:30
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.folders (id, name, parent_id, user_id, created_at, updated_at) FROM stdin;
1	Aryan	\N	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:04:59.714142+05:30	2025-11-14 12:04:59.714142+05:30
2	Arvind Rajput	\N	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:24:56.383776+05:30	2025-11-14 12:24:56.383776+05:30
3	Inzy	\N	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.402068+05:30	2025-11-14 12:24:56.402068+05:30
4	Darshan Valand	3	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.408339+05:30	2025-11-14 12:24:56.408339+05:30
5	Govind Appa	3	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.412368+05:30	2025-11-14 12:24:56.412368+05:30
6	Hiral	3	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.416214+05:30	2025-11-14 12:24:56.416214+05:30
7	Anil Singh	3	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.418913+05:30	2025-11-14 12:24:56.418913+05:30
8	Chirag Gohil	3	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.421527+05:30	2025-11-14 12:24:56.421527+05:30
9	Sunil Sharma	3	955fb036-8a5f-494a-ba3f-20c7622318db	2025-11-14 12:24:56.423519+05:30	2025-11-14 12:24:56.423519+05:30
10	Aryan IW	\N	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.425494+05:30	2025-11-14 12:24:56.425494+05:30
11	Nikhil Jain	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.428185+05:30	2025-11-14 12:24:56.428185+05:30
12	Simran Kaur	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.430078+05:30	2025-11-14 12:24:56.430078+05:30
13	Harsh Bhai	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.431993+05:30	2025-11-14 12:24:56.431993+05:30
14	Priya Singh	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.433842+05:30	2025-11-14 12:24:56.433842+05:30
15	Divya Menon	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.436451+05:30	2025-11-14 12:24:56.436451+05:30
16	Karan Mehta	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.438282+05:30	2025-11-14 12:24:56.438282+05:30
17	Mohit Suri	10	047cbd62-bd78-4e42-be1c-72395edaf057	2025-11-14 12:24:56.440126+05:30	2025-11-14 12:24:56.440126+05:30
19	yatharth	\N	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:51:34.426753+05:30	2025-11-14 12:51:34.426753+05:30
20	test	19	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 12:51:52.246068+05:30	2025-11-14 12:51:52.246068+05:30
21	Yamini	\N	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 16:58:52.551272+05:30	2025-11-14 16:58:52.551272+05:30
22	Yamini 2	21	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-14 16:59:04.370112+05:30	2025-11-14 16:59:04.370112+05:30
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.follow_ups (id, contact_id, title, description, type, priority, status, scheduled_date, scheduled_time, completed_date, assigned_user_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_activities (id, lead_id, type, description, date, "time", agent, details, created_at, deleted_at, updated_at) FROM stdin;
28	432	note	ok11234	2025-09-19	14:32:00	Arvind Rajput	{}	2025-09-19 14:32:14.155649	\N	\N
29	432	note	ok2	2025-09-20	14:30:00	Arvind Rajput	{}	2025-09-20 14:30:38.767167	\N	\N
30	432	note	ok2	2025-09-20	14:31:00	Arvind Rajput	{}	2025-09-20 14:31:37.532446	\N	\N
8	17	note	Hello	2025-09-17	16:48:00	Arvind Rajput	{}	2025-09-17 16:48:48.007328	\N	\N
9	134	note	HEllo	2025-09-17	16:50:00	Arvind Rajput	{}	2025-09-17 16:50:11.765323	\N	\N
10	134	note	Hello2	2025-09-17	16:50:00	Arvind Rajput	{}	2025-09-17 16:50:20.766215	\N	\N
13	134	followup	sms follow-up: Hello - Hello5	2025-09-18	21:53:00	Arvind Rajput	{"time": "21:53", "agenda": "Hello5", "status": "completed", "subject": "Hello", "completed": true, "scheduleOn": "2025-09-18T21:53", "completedAt": "2026-06-03T06:25:24Z", "followupDate": "", "followupType": "sms", "leadsTimezone": "asiakolkata"}	2025-09-17 16:55:32.104535	\N	2026-06-03 11:55:24.147593+05:30
14	134	sitevisit	initial site visit for Ziaaaaaa with partner1: Hello	2025-09-17	11:25:00	Arvind Rajput	{"teams": "b048f034-eace-484e-bae7-9a91b223975f", "agenda": "Hello", "endsOn": "2025-09-17T11:40", "project": "1", "scheduleOn": "2025-09-17T11:25", "leadsTimezone": "asiakolkata", "siteVisitType": "initial", "channelPartner": "partner1", "scheduleFollowup": "2025-09-17T11:55", "siteVisitConfirmation": "true"}	2025-09-17 17:01:45.967057	\N	\N
32	431	note	Ok1	2025-09-20	15:16:00	Arvind Rajput	{}	2025-09-20 15:16:59.250216	\N	\N
15	432	note	Hello1	2025-09-18	12:04:00	Arvind Rajput	{}	2025-09-18 12:03:56.747384	2025-09-18 12:04:11.940376+05:30	2025-09-18 12:04:06.417025+05:30
16	432	note	Hello1234	2025-09-18	12:05:00	Arvind Rajput	{}	2025-09-18 12:05:53.70853	\N	\N
17	432	note	Hello65432	2025-09-18	12:09:00	Arvind Rajput	{}	2025-09-18 12:09:04.246455	2025-09-18 12:09:45.410173+05:30	\N
18	432	note	Hello65432	2025-09-18	12:09:00	Arvind Rajput	{}	2025-09-18 12:09:54.125628	\N	\N
33	431	note	Ok2	2025-09-20	15:17:00	Arvind Rajput	{}	2025-09-20 15:17:05.081437	\N	\N
20	432	note	Hello Intelliworkzs	2025-09-18	16:57:00	Arvind Rajput	{}	2025-09-18 16:57:04.275014	2025-09-18 16:57:22.741587+05:30	2025-09-18 16:57:13.537244+05:30
24	432	note	ok1	2025-09-19	14:11:00	Arvind Rajput	{}	2025-09-19 14:11:05.048971	\N	\N
43	431	followup	email follow-up: qwertyuiop - asdfghjkl	2025-09-22	15:21:00	Arvind Rajput	{"agenda": "asdfghjkl", "status": "completed", "subject": "qwertyuiop", "completed": true, "scheduleOn": "2025-09-22T15:21", "completedAt": "2026-06-03T06:25:35Z", "followupType": "email", "leadsTimezone": "asiakolkata"}	2025-09-20 15:19:28.703439	\N	2026-06-03 11:55:35.918078+05:30
23	432	note	Hello9876543	2025-09-19	14:05:00	Arvind Rajput	{}	2025-09-19 14:05:58.964359	2025-09-19 14:15:17.825803+05:30	\N
26	432	note	1234567890987654erfdc v	2025-09-19	14:11:00	Arvind Rajput	{}	2025-09-19 14:11:59.362747	2025-09-19 14:15:19.645258+05:30	\N
25	432	note	12345678	2025-09-19	14:11:00	Arvind Rajput	{}	2025-09-19 14:11:27.480829	2025-09-19 14:15:21.411799+05:30	\N
22	432	note	Hello12345678	2025-09-19	14:00:00	Arvind Rajput	{}	2025-09-19 14:00:50.214026	2025-09-19 14:15:23.044827+05:30	\N
34	431	note	Ok3	2025-09-20	15:17:00	Arvind Rajput	{}	2025-09-20 15:17:09.732302	\N	\N
35	431	note	Ok4	2025-09-20	15:17:00	Arvind Rajput	{}	2025-09-20 15:17:15.795367	\N	\N
36	431	note	Ok5	2025-09-20	15:17:00	Arvind Rajput	{}	2025-09-20 15:17:21.238754	\N	\N
37	431	note	Ok6	2025-09-20	15:17:00	Arvind Rajput	{}	2025-09-20 15:17:48.651001	\N	\N
38	431	note	Ok7	2025-09-20	15:17:00	Arvind Rajput	{}	2025-09-20 15:17:57.08435	\N	\N
39	431	note	Ok8	2025-09-20	15:18:00	Arvind Rajput	{}	2025-09-20 15:18:06.696423	\N	\N
40	431	note	Ok9	2025-09-20	15:18:00	Arvind Rajput	{}	2025-09-20 15:18:37.621561	\N	\N
41	431	note	Ok10	2025-09-20	15:18:00	Arvind Rajput	{}	2025-09-20 15:18:46.062922	\N	\N
45	431	sitevisit	initial site visit for Ziaaaaaa with partner1: esrdftyghuijko	2025-09-21	19:24:00	Arvind Rajput	{"teams": "d166f449-18d1-44cf-ad34-a95be7f1cc25", "agenda": "esrdftyghuijko", "endsOn": "2025-09-24T15:25", "project": "1", "scheduleOn": "2025-09-21T19:24", "leadsTimezone": "asiakolkata", "siteVisitType": "initial", "channelPartner": "partner1", "scheduleFollowup": "2025-09-20T10:20", "siteVisitConfirmation": "true"}	2025-09-20 15:20:55.593821	\N	\N
31	432	note	Need to update	2025-09-20	17:14:00	Arvind Rajput	{}	2025-09-20 14:31:49.839359	\N	2025-09-20 17:14:26.571127+05:30
46	437	note	HEllo	2025-11-11	14:18:00	Arvind Rajput	{}	2025-11-11 14:18:02.335377	\N	\N
47	437	note	Hello #@#	2025-11-11	14:18:00	Arvind Rajput	{}	2025-11-11 14:18:25.235825	\N	\N
48	489	note	Han mujhe gharr chaiye	2025-12-04	16:17:00	Arvind Rajput	{}	2025-12-04 16:17:37.589961	\N	\N
49	489	note	Na bhai mujhe flat chaiye	2025-12-04	16:17:00	Arvind Rajput	{}	2025-12-04 16:17:51.806996	\N	\N
50	489	note	hoill	2025-12-05	16:35:00	Aryan IW	{}	2025-12-05 16:35:20.027598	\N	\N
51	489	note	hELLO TODAY I DISCCUSED ABOUT crm	2025-12-12	14:10:00	Arvind Rajput	{}	2025-12-12 14:10:21.593941	\N	\N
52	489	followup	call follow-up: Hello RaBoy - Helkloooo	2026-01-06	19:16:00	Arvind Rajput	{"agenda": "Helkloooo", "subject": "Hello RaBoy", "scheduleOn": "2026-01-06T19:16", "followupType": "call", "leadsTimezone": "asiakolkata"}	2025-12-31 16:13:58.300376	\N	\N
53	495	followup	call follow-up: 2er6234 - qwtryiuwdety	2025-12-31	20:35:00	Arvind Rajput	{"agenda": "qwtryiuwdety", "subject": "2er6234", "scheduleOn": "2025-12-31T20:35", "followupType": "call", "leadsTimezone": "asiakolkata"}	2025-12-31 16:32:44.309792	\N	\N
54	437	followup	call follow-up: Hello Please call him on 7th - Hello Please call him on 7th	2026-01-07	14:52:00	Arvind Rajput	{"agenda": "Hello Please call him on 7th", "subject": "Hello Please call him on 7th", "scheduleOn": "2026-01-07T14:52", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-01-01 10:50:07.201688	\N	\N
19	432	followup	call follow-up: Hello2 - asdf	2025-09-18	13:43:00	Arvind Rajput	{"agenda": "asdf", "status": "completed", "subject": "Hello2", "completed": true, "scheduleOn": "2025-09-18T13:43", "completedAt": "2026-06-03T06:25:28Z", "followupType": "call", "leadsTimezone": "asiakolkata"}	2025-09-18 12:42:47.659666	\N	2026-06-03 11:55:28.426769+05:30
21	432	followup	email follow-up: Kal baat karunga  - asdfsadfgyuihyfrdeej	2025-09-19	18:03:00	Arvind Rajput	{"agenda": "asdfsadfgyuihyfrdeej", "status": "completed", "subject": "Kal baat karunga ", "completed": true, "scheduleOn": "2025-09-19T18:03", "completedAt": "2026-06-03T06:25:31Z", "followupType": "email", "leadsTimezone": "asiakolkata"}	2025-09-18 17:01:47.762617	\N	2026-06-03 11:55:31.518265+05:30
27	432	followup	sms follow-up: awesrdftyghukldfgn - asdgthjkl	2025-09-20	14:15:00	Arvind Rajput	{"agenda": "asdgthjkl", "status": "completed", "subject": "awesrdftyghukldfgn", "completed": true, "scheduleOn": "2025-09-20T14:15", "completedAt": "2026-06-03T06:25:33Z", "followupType": "sms", "leadsTimezone": "asiakolkata"}	2025-09-19 14:12:49.712541	\N	2026-06-03 11:55:33.519567+05:30
44	431	followup	email follow-up: qwertyuiop - asdfghjkl	2025-09-22	16:21:00	Arvind Rajput	{"agenda": "asdfghjkl", "status": "completed", "subject": "qwertyuiop", "completed": true, "scheduleOn": "2025-09-22T16:21", "completedAt": "2026-06-03T07:12:18Z", "followupType": "email", "leadsTimezone": "asiakolkata"}	2025-09-20 15:20:21.927178	\N	2026-06-03 12:42:18.374935+05:30
55	1349	note	<p>Hello Aryan please Update this list:</p><ol><li>Apple</li><li>Mango</li><li>Banana</li></ol><p><strong><em>Mango is the King of Fruit</em></strong></p>	2026-05-29	14:24:00	Arvind Rajput	{}	2026-05-29 14:24:32.675368	\N	\N
56	1349	note	<p>Hello 2 </p>	2026-05-29	14:25:00	Arvind Rajput	{}	2026-05-29 14:25:45.148099	\N	\N
57	1345	note	<p>hello\t\t</p>	2026-05-29	15:09:00	Arvind Rajput	{}	2026-05-29 15:09:27.520551	\N	\N
12	134	followup	call follow-up: Hello2 - Hello3	2025-09-17	16:53:00	Arvind Rajput	{"time": "16:53", "agenda": "Hello3", "status": "completed", "subject": "Hello2", "completed": true, "scheduleOn": "2025-09-17T16:53", "completedAt": "2026-06-03T06:25:08Z", "followupDate": "2025-09-18", "followupType": "call", "leadsTimezone": "asiakolkata"}	2025-09-17 16:53:36.074832	\N	2026-06-03 11:55:08.549371+05:30
11	134	followup	wa follow-up: Hello - asdfgh	2025-09-17	23:50:00	Arvind Rajput	{"time": "23:50", "agenda": "asdfgh", "status": "completed", "subject": "Hello", "completed": true, "scheduleOn": "2025-09-17T23:50", "completedAt": "2026-06-03T06:25:21Z", "followupDate": "2025-09-18", "followupType": "wa", "leadsTimezone": "asiakolkata"}	2025-09-17 16:51:52.83203	\N	2026-06-03 11:55:21.985474+05:30
42	431	followup	email follow-up: ahu - asdfgh	2025-09-21	18:18:00	Arvind Rajput	{"agenda": "asdfgh", "status": "completed", "subject": "ahu", "completed": true, "scheduleOn": "2025-09-21T18:18", "completedAt": "2026-06-03T06:25:34Z", "followupType": "email", "leadsTimezone": "asiakolkata"}	2025-09-20 15:19:03.408095	\N	2026-06-03 11:55:34.710096+05:30
59	2157	followup	call follow-up: Test - Test	2026-06-03	13:08:00	Arvind Rajput	{"agenda": "Test", "subject": "Test", "scheduleOn": "2026-06-03T13:08", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-06-03 12:08:38.127268	\N	\N
60	431	followup	call follow-up: Follow-up logged	2026-06-03	10:00:00	Inzy	{"agenda": "Follow-up from management page", "outcome": null, "subject": "Follow-up logged", "priority": "high", "scheduleOn": "2026-06-03T10:00", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-06-03 12:09:49.931854	\N	\N
61	2157	followup	call follow-up: Test - Test	2026-06-04	13:08:00	Arvind Rajput	{"agenda": "Test", "status": "scheduled", "subject": "Test", "scheduleOn": "2026-06-04T13:08", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-06-03 13:42:14.704417	\N	\N
58	1819	followup	call follow-up: swqwd - wefwqe	2026-06-11	12:57:00	Arvind Rajput	{"agenda": "wefwqe", "status": "completed", "subject": "swqwd", "completed": true, "scheduleOn": "2026-06-11T12:57", "completedAt": "2026-06-10T08:33:23Z", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-06-02 10:55:21.775	\N	2026-06-10 14:03:23.132321+05:30
62	5256	note	<p>wefdwew</p>	2026-06-25	16:02:00	Manthan Panchal	{}	2026-06-25 16:02:09.645702	2026-06-25 16:02:14.432448+05:30	\N
63	5256	followup	call follow-up: Follow-up	2026-06-25	11:02:00	Manthan Panchal	{"agenda": "", "status": "scheduled", "subject": "Follow-up", "scheduleOn": "2026-06-25T11:02", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-06-25 16:02:18.871349	\N	\N
64	5698	note	<p>asdasdas</p>	2026-06-26	16:56:00	Arvind Rajput	{}	2026-06-26 16:56:17.930229	\N	\N
65	5698	followup	call follow-up: Follow-up	2026-06-26	11:56:00	Arvind Rajput	{"agenda": "", "status": "scheduled", "subject": "Follow-up", "scheduleOn": "2026-06-26T11:56", "followupType": "call", "leadsTimezone": "asiakolkata"}	2026-06-26 16:56:24.869084	\N	\N
66	5698	sitevisit	initial site visit for Manthan with selectpartner:	2026-06-26	11:26:00	Arvind Rajput	{"teams": "selectteam", "agenda": "", "endsOn": "2026-06-26T11:41", "status": "scheduled", "project": "79", "scheduleOn": "2026-06-26T11:26", "leadsTimezone": "asiakolkata", "siteVisitType": "initial", "channelPartner": "selectpartner", "scheduleFollowup": "2026-06-26T11:56", "siteVisitConfirmation": "true"}	2026-06-26 16:56:37.24094	\N	\N
\.


--
-- Data for Name: lead_assignment_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_assignment_history (id, lead_id, old_assigned_to, new_assigned_to, assigned_by, assigned_at, unassigned_at, reason, created_at) FROM stdin;
\.


--
-- Data for Name: lead_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_documents (id, lead_id, name, type, document_pdf, created_at, deleted_at, updated_at) FROM stdin;
2	17	leads_data (1).pdf	pdf	\N	2025-09-17 16:47:48.977844	\N	\N
3	134	image (4).png	png	\N	2025-09-17 17:02:58.699803	\N	\N
4	134	waterMarkLogo.png	png	\N	2025-09-17 17:03:10.90339	\N	\N
6	432	leads_data (5).pdf	pdf	\N	2025-09-18 14:02:58.639301	\N	\N
5	432	IW logo.png	png	\N	2025-09-18 12:04:43.019489	2025-09-18 14:16:29.257598+05:30	\N
7	432	leads_data (4).pdf	pdf	\N	2025-09-18 14:17:02.141302	\N	\N
8	432	IW logo.png	png	IW logo.png	2025-09-19 12:03:23.369179	2025-09-19 14:13:15.521001+05:30	\N
9	432	IW logo.png	png	IW logo.png	2025-09-19 14:32:37.204801	\N	\N
10	432	image (2).png	png	image (2).png	2025-09-19 14:32:50.412481	\N	\N
11	432	image.png	png	image.png	2025-09-19 14:33:19.187359	\N	\N
12	432	intelliworkz-logo.jpg	jpeg	intelliworkz-logo.jpg	2025-09-19 14:33:26.404303	\N	\N
14	431	leads_data (5).pdf	pdf	leads_data (5).pdf	2025-09-20 15:19:53.290527	\N	\N
15	431	leads_data (4).pdf	pdf	leads_data (4).pdf	2025-09-20 15:19:59.270495	\N	\N
13	431	IW logo.png	png	IW logo.png	2025-09-20 15:19:42.343305	2025-09-20 15:49:09.529664+05:30	\N
16	432	Free_Test_Data_2.15MB_PDF.pdf	pdf	Free_Test_Data_2.15MB_PDF.pdf	2025-09-22 16:29:30.459782	2025-09-22 16:29:57.284694+05:30	\N
17	432	Free_Test_Data_2.15MB_PDF.pdf	pdf	Free_Test_Data_2.15MB_PDF.pdf	2025-09-22 16:30:02.639134	\N	\N
19	437	steps-for-golden-harbour.pdf	pdf	steps-for-golden-harbour.pdf	2025-11-14 14:28:41.053542	2025-11-15 12:30:18.257815+05:30	\N
18	437	download.png	png	download.png	2025-11-14 14:28:31.394163	2025-11-15 12:30:20.553713+05:30	\N
20	437	waterMarkLogo (1).png	png	waterMarkLogo (1)-1763190025185.png	2025-11-15 12:30:25.192489	\N	\N
21	437	DSC00003 - Copy.JPG	jpg	DSC00003 - Copy-1763190334142.JPG	2025-11-15 12:35:34.147104	\N	\N
22	437	leads_data (8).pdf	pdf	leads_data (8)-1763190543098.pdf	2025-11-15 12:39:03.180171	\N	\N
23	437	image.png	png	image-1763207754549.png	2025-11-15 17:25:54.614746	2025-11-17 11:24:31.629976+05:30	\N
24	489	leetcode.png	png	leetcode-1764845345452.png	2025-12-04 16:19:05.586541	\N	\N
25	3653	screencapture-app-sell-do-client-project-towers-6940f4eea3d85527e0eded5b-details-2026-06-08-18_22_52.png	png	screencapture-app-sell-do-client-project-towers-6940f4eea3d85527e0eded5b-details-2026-06-08-18_22_52-1782296312304.png	2026-06-24 15:48:32.557854	\N	\N
\.


--
-- Data for Name: lead_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_types (id, name, created_at, deleted_at, logo_image, logo_name, is_assignable, sort_order) FROM stdin;
87cc670c-f8fe-437f-97d4-3de3a84e2ff2	meta	2025-08-29 10:11:08.472433+05:30	2025-08-29 15:13:20.323429+05:30	\N	\N	t	0
41de4601-02f3-4ae1-be00-4d80474aadb1	meta	2025-08-29 15:30:49.569232+05:30	2025-08-30 09:33:34.900906+05:30	\N	\N	t	0
7bd301bf-85f5-4232-8d66-1ea8577125cb	meta	2025-08-30 09:49:24.05072+05:30	2025-08-30 10:06:46.170715+05:30	\N	Meta	t	0
6be06d4e-99e6-4b62-a616-9a3080b58d56	aryan	2025-08-30 10:06:38.426901+05:30	2025-08-30 10:06:54.232511+05:30	housing-1756528598345-824849481.png	Aryan	t	0
c6c825ea-993b-42cc-9fbf-60bd22ec7d68	working	2025-08-30 13:55:30.11474+05:30	2025-08-30 13:55:46.646784+05:30	housing-1756542330096-103053811.png	Working	t	0
80eadeac-75f6-4530-8ad6-4f7e3905ebce	Aryan	2025-09-10 12:57:06.698047+05:30	2025-09-10 12:57:11.529627+05:30	\N	Aryan	t	0
fd0ddc00-e546-4c94-9dd0-df75b8090b09	Aryan	2025-09-10 14:02:32.8706+05:30	2025-09-10 14:02:36.109318+05:30	\N	Aryan	t	0
d2232f52-718a-49ff-b3af-cda87f83859b	Aryan	2025-09-10 14:08:26.301718+05:30	2025-09-10 14:08:43.606094+05:30	arvind_rajput-1757493506210-219490796.jpeg	Arya	t	0
e278b0d8-2560-4dcd-abf1-ff0d2a200fd0	99acers	2025-09-10 14:45:49.962454+05:30	2025-09-10 14:57:53.091648+05:30	ratanTata-1757495749844-775114388.jpg	99 Acers Tata	t	0
f2030a4f-4fb1-4fab-9f1f-afb8654ba664	99ace	2025-09-17 17:08:43.107199+05:30	2025-09-17 17:08:52.815256+05:30	image (3)-1758109122984-462621506.png	99ace	t	0
65b1f0e3-ae67-4160-8a6c-55d1474fddf2	realitymart	2025-08-29 17:33:25.524861+05:30	\N	mr-1756469005387-528359519.svg	\N	t	0
28c62dfc-cc72-46cc-8fa4-dd293045aefe	magicbricks	2025-08-29 15:13:07.706679+05:30	\N	mb-1756463845034-514311720.jpeg	\N	t	1
307ac147-f7ba-4048-8646-bf288d281a43	meta	2025-08-30 10:07:10.517029+05:30	\N	meta-1756528630513-862646661.jpeg	\N	t	2
9f1feb78-5f92-437e-beb8-18577007567c	website	2025-12-15 16:22:07.423133+05:30	\N	\N	\N	t	3
ea22560e-0e03-494a-ae8a-046c760dfc0a	own_crm	2025-08-29 10:16:25.08709+05:30	\N	web-1756463808501-992020141.png	\N	t	4
74b1dcf1-d9a5-4bb3-adb7-a2aa06ec5aaf	housing	2026-01-01 14:58:01.864117+05:30	\N	\N	\N	t	6
1f39bb9e-74d9-4ce5-897c-041108aa7235	99acres	2026-01-01 14:57:52.949138+05:30	\N	\N	\N	t	5
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, name, email, phone, lead_type, created_at, updated_at, status, address, property_type, budget, message, is_active, deleted_at, interested_project_id, lead_source, external_id, assigned_to, interest_level) FROM stdin;
78	Vimlesh Vishwakarma	vimleshvishwakarma573@gmail.com	+918707575910	meta	2025-08-13 13:45:47	\N	new	Mumbai	\N	\N	\N	t	\N	\N	manual	l:740952148858628	\N	\N
79	Satish Balaram Thakur	satish9220220004@gmail.com	+919220220004	meta	2025-08-13 15:13:24	\N	new	Thane	\N	\N	\N	t	\N	\N	manual	l:1062335859295105	\N	\N
80	Jeet Thakar	jeet123@gmail.com	+919871234567	meta	2025-08-13 15:13:24	\N	new	Andheri	\N	\N	\N	t	\N	\N	manual	l:12345678900987	\N	\N
81	Aryan	ayan@gmail.com	+919876543211	meta	2025-08-25 15:13:24	\N	new	Juhu	\N	\N	\N	t	\N	\N	manual	l:12345678900988	\N	\N
82	Rahul Pandey	rahul@gmail.com	+919876543212	meta	2025-08-26 15:14:24	\N	new	Borivali	\N	\N	\N	t	\N	\N	manual	l:12345678900990	\N	\N
83	yash	yash@gmail.com	+919876543213	meta	2025-08-26 15:15:24	\N	new	Ahemdabad	\N	\N	\N	t	\N	\N	manual	l:12345678900991	\N	\N
84	IW	iw@gmail.com	+919876543215	meta	2025-08-26 15:15:24	\N	new	Dubai	\N	\N	\N	t	\N	\N	manual	l:12345678900997	\N	\N
85	Omi	omi@gmail.com	+919876543216	meta	2025-08-26 15:15:24	\N	new	Austria	\N	\N	\N	t	\N	\N	manual	l:12345678900996	\N	\N
86	Riya Sharma	riya0@example.com	+91 9319918440	own_crm	2025-09-16 15:05:16.832244	\N	New	184 Hyderabad	Duplex	6307022.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
87	Ananya Rao	ananya1@example.com	+91 9757914352	own_crm	2025-09-16 15:05:16.852924	\N	New	113 Bangalore	Penthouse	4288006.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
88	Aryan Pandey	aryan2@example.com	+91 9111724743	own_crm	2025-09-16 15:05:16.85546	\N	New	191 Kolkata	Villa	10318630.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
89	Aryan Pandey	aryan3@example.com	+91 9400851460	own_crm	2025-09-16 15:05:16.857771	\N	New	139 Lucknow	Villa	6225006.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
90	Nikhil Jain	nikhil4@example.com	+91 9269258950	own_crm	2025-09-16 15:05:16.8608	\N	New	31 Hyderabad	Penthouse	9078010.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
91	Nikhil Jain	nikhil5@example.com	+91 9306446864	own_crm	2025-09-16 15:05:16.863948	\N	New	152 Kanpur	Penthouse	11385695.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
92	Nikhil Jain	nikhil6@example.com	+91 9708373467	own_crm	2025-09-16 15:05:16.867463	\N	New	76 Noida	Penthouse	8885076.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
93	Pooja Nair	pooja7@example.com	+91 9894141839	own_crm	2025-09-16 15:05:16.869809	\N	New	103 Hyderabad	Villa	5324716.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
94	Amit Joshi	amit8@example.com	+91 9126002715	own_crm	2025-09-16 15:05:16.871974	\N	New	97 Noida	Apartment	8359996.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
95	Rohit Kapoor	rohit9@example.com	+91 9907966484	own_crm	2025-09-16 15:05:16.875135	\N	New	56 Delhi	Villa	8202788.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
96	Aditya Verma	aditya10@example.com	+91 9985964874	own_crm	2025-09-16 15:05:16.879242	\N	New	3 Delhi	Villa	4465913.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
97	Tanya Arora	tanya11@example.com	+91 9941072864	own_crm	2025-09-16 15:05:16.883275	\N	New	65 Bangalore	Penthouse	9774332.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
98	Rohit Kapoor	rohit12@example.com	+91 9534624269	own_crm	2025-09-16 15:05:16.885921	\N	New	121 Kanpur	Penthouse	8117380.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
99	Saurabh Tiwari	saurabh13@example.com	+91 9333646075	own_crm	2025-09-16 15:05:16.888816	\N	New	32 Mumbai	Duplex	4777477.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
100	Mohit Suri	mohit14@example.com	+91 9239125130	own_crm	2025-09-16 15:05:16.891276	\N	New	72 Kolkata	Villa	11721308.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
101	Mohit Suri	mohit15@example.com	+91 9749387666	own_crm	2025-09-16 15:05:16.893979	\N	New	157 Noida	Duplex	4504157.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
102	Isha Bansal	isha16@example.com	+91 9943232500	own_crm	2025-09-16 15:05:16.896786	\N	New	166 Kolkata	Apartment	10879796.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
103	Ananya Rao	ananya17@example.com	+91 9670546674	own_crm	2025-09-16 15:05:16.899897	\N	New	187 Chennai	Villa	8052966.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
104	Saurabh Tiwari	saurabh18@example.com	+91 9814350713	own_crm	2025-09-16 15:05:16.902149	\N	New	165 Hyderabad	Apartment	5178097.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
105	Vikram Desai	vikram19@example.com	+91 9184862132	own_crm	2025-09-16 15:05:16.904364	\N	New	165 Delhi	Penthouse	4655838.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
106	Simran Kaur	simran20@example.com	+91 9620785888	own_crm	2025-09-16 15:05:16.906365	\N	New	177 Lucknow	Apartment	11445707.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
107	Divya Menon	divya21@example.com	+91 9012211833	own_crm	2025-09-16 15:05:16.908596	\N	New	122 Mumbai	Penthouse	5441608.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
108	Simran Kaur	simran22@example.com	+91 9519384501	own_crm	2025-09-16 15:05:16.911142	\N	New	91 Kolkata	Duplex	4445211.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
109	Tanya Arora	tanya23@example.com	+91 9587186936	own_crm	2025-09-16 15:05:16.91453	\N	New	149 Delhi	Villa	8892151.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
110	Saurabh Tiwari	saurabh24@example.com	+91 9234940593	own_crm	2025-09-16 15:05:16.917372	\N	New	79 Bangalore	Apartment	7820218.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
111	Mohit Suri	mohit25@example.com	+91 9696968588	own_crm	2025-09-16 15:05:16.91965	\N	New	117 Chennai	Apartment	8606180.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
112	Pooja Nair	pooja26@example.com	+91 9187269809	own_crm	2025-09-16 15:05:16.921984	\N	New	85 Mumbai	Apartment	6764436.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
113	Karan Mehta	karan27@example.com	+91 9633882489	own_crm	2025-09-16 15:05:16.923981	\N	New	87 Bangalore	Villa	11578795.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
114	Tanya Arora	tanya28@example.com	+91 9575220231	own_crm	2025-09-16 15:05:16.925964	\N	New	185 Delhi	Villa	10071527.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
115	Sanya Malhotra	sanya29@example.com	+91 9114401785	own_crm	2025-09-16 15:05:16.928596	\N	New	82 Delhi	Duplex	10159457.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
116	Aditya Verma	aditya30@example.com	+91 9699811775	own_crm	2025-09-16 15:05:16.931888	\N	New	91 Bangalore	Apartment	8530020.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
117	Vikram Desai	vikram31@example.com	+91 9199300213	own_crm	2025-09-16 15:05:16.935418	\N	New	81 Noida	Villa	11215063.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
118	Saurabh Tiwari	saurabh32@example.com	+91 9034900762	own_crm	2025-09-16 15:05:16.938246	\N	New	194 Lucknow	Apartment	11900533.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
119	Priya Singh	priya33@example.com	+91 9089813285	own_crm	2025-09-16 15:05:16.940565	\N	New	45 Kanpur	Duplex	9601084.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
120	Mohit Suri	mohit34@example.com	+91 9377379186	own_crm	2025-09-16 15:05:16.94292	\N	New	196 Lucknow	Penthouse	6961792.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
121	Neha Gupta	neha35@example.com	+91 9993035751	own_crm	2025-09-16 15:05:16.944994	\N	New	139 Noida	Villa	11530182.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
122	Pooja Nair	pooja36@example.com	+91 9438017239	own_crm	2025-09-16 15:05:16.948122	\N	New	93 Delhi	Duplex	9616656.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
123	Saurabh Tiwari	saurabh37@example.com	+91 9517114544	own_crm	2025-09-16 15:05:16.950824	\N	New	176 Lucknow	Penthouse	10954718.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
124	Vikram Desai	vikram38@example.com	+91 9126619779	own_crm	2025-09-16 15:05:16.952965	\N	New	48 Chennai	Villa	4340007.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
3898	\N	46113.00011574074	\N	website	2026-06-16 14:55:01.446	\N	new	\N	\N	\N	\N	t	\N	\N	manual	\N	\N	\N
125	Amit Joshi	amit39@example.com	+91 9500201130	own_crm	2025-09-16 15:05:16.955643	\N	New	1 Lucknow	Villa	5591554.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
126	Divya Menon	divya40@example.com	+91 9715156898	own_crm	2025-09-16 15:05:16.959261	\N	New	177 Delhi	Villa	10398638.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
127	Aryan Pandey	aryan41@example.com	+91 9898440159	own_crm	2025-09-16 15:05:16.962363	\N	New	8 Lucknow	Apartment	10329978.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
128	Tanya Arora	tanya42@example.com	+91 9822994181	own_crm	2025-09-16 15:05:16.965142	\N	New	131 Delhi	Apartment	6227131.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
129	Aryan Pandey	aryan43@example.com	+91 9306933667	own_crm	2025-09-16 15:05:16.968323	\N	New	130 Bangalore	Duplex	9849205.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
130	Pooja Nair	pooja44@example.com	+91 9975331031	own_crm	2025-09-16 15:05:16.971149	\N	New	147 Mumbai	Penthouse	9426224.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
131	Karan Mehta	karan45@example.com	+91 9480488811	own_crm	2025-09-16 15:05:16.974811	\N	New	160 Noida	Duplex	10361836.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
132	Rohit Kapoor	rohit46@example.com	+91 9859905842	own_crm	2025-09-16 15:05:16.980223	\N	New	107 Kolkata	Duplex	6462057.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
133	Aditya Verma	aditya47@example.com	+91 9240044103	own_crm	2025-09-16 15:05:16.984698	\N	New	116 Delhi	Apartment	9121954.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
135	Sanya Malhotra	sanya49@example.com	+91 9468612064	own_crm	2025-09-16 15:05:16.991402	\N	New	153 Kolkata	Apartment	9645525.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
17	Aryan	aryan@gmail.com	9054454394	meta	2025-09-12 10:20:20.709223	2025-09-17 16:43:54.386836	contacted	Ahmedabad, Gujarat, 380001, India	\N	\N	\N	t	\N	1	manual	\N	\N	\N
134	Nikhil Jain	nikhil48@example.com	9979045131	own_crm	2025-09-16 15:05:16.988296	2025-09-17 17:04:34.890171	contacted	44 Lucknow	Villa	8980910.00	Looking for 2BHK furnished	t	\N	1	manual	\N	\N	\N
136	Neha Gupta	neha0@example.com	+91 9781169709	own_crm	2025-09-17 17:09:55.346147	\N	New	111 Delhi	Penthouse	4038596.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
137	Nikhil Jain	nikhil1@example.com	+91 9702568008	own_crm	2025-09-17 17:09:55.350898	\N	New	189 Noida	Penthouse	11824463.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
138	Rahul Khanna	rahul2@example.com	+91 9931228228	own_crm	2025-09-17 17:09:55.353294	\N	New	139 Delhi	Villa	5812658.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
139	Rahul Khanna	rahul3@example.com	+91 9436767703	own_crm	2025-09-17 17:09:55.356047	\N	New	110 Delhi	Penthouse	8628301.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
140	Isha Bansal	isha4@example.com	+91 9020956628	own_crm	2025-09-17 17:09:55.358507	\N	New	64 Mumbai	Villa	5758021.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
141	Aryan Pandey	aryan5@example.com	+91 9574665789	own_crm	2025-09-17 17:09:55.360785	\N	New	137 Kanpur	Duplex	4384458.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
142	Aryan Pandey	aryan6@example.com	+91 9744587344	own_crm	2025-09-17 17:09:55.364161	\N	New	143 Kanpur	Villa	6893613.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
143	Isha Bansal	isha7@example.com	+91 9835432848	own_crm	2025-09-17 17:09:55.366647	\N	New	105 Pune	Duplex	7180037.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
144	Ananya Rao	ananya9@example.com	+91 9052400283	own_crm	2025-09-17 17:09:55.370468	\N	New	62 Chennai	Duplex	11225503.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
145	Nikhil Jain	nikhil10@example.com	+91 9756080788	own_crm	2025-09-17 17:09:55.37248	\N	New	28 Kanpur	Duplex	9276097.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
146	Ananya Rao	ananya11@example.com	+91 9103479323	own_crm	2025-09-17 17:09:55.374224	\N	New	134 Pune	Duplex	11947517.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
147	Rahul Khanna	rahul13@example.com	+91 9638343338	own_crm	2025-09-17 17:09:55.376463	\N	New	190 Kolkata	Apartment	7837102.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
148	Amit Joshi	amit14@example.com	+91 9931003606	own_crm	2025-09-17 17:09:55.377635	\N	New	133 Pune	Duplex	9835197.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
149	Isha Bansal	isha15@example.com	+91 9679652767	own_crm	2025-09-17 17:09:55.379397	\N	New	48 Lucknow	Villa	11843325.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
150	Riya Sharma	riya16@example.com	+91 9675275718	own_crm	2025-09-17 17:09:55.380895	\N	New	155 Bangalore	Apartment	7873821.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
151	Aditya Verma	aditya17@example.com	+91 9247613770	own_crm	2025-09-17 17:09:55.383086	\N	New	46 Chennai	Penthouse	10320830.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
152	Pooja Nair	pooja18@example.com	+91 9724905594	own_crm	2025-09-17 17:09:55.387039	\N	New	20 Bangalore	Villa	9198200.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
153	Isha Bansal	isha19@example.com	+91 9607960108	own_crm	2025-09-17 17:09:55.389817	\N	New	104 Kanpur	Apartment	6895376.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
154	Ananya Rao	ananya20@example.com	+91 9518262550	own_crm	2025-09-17 17:09:55.39258	\N	New	113 Lucknow	Villa	5241240.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
155	Saurabh Tiwari	saurabh21@example.com	+91 9119222786	own_crm	2025-09-17 17:09:55.395363	\N	New	52 Kanpur	Apartment	5981840.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
156	Sanya Malhotra	sanya22@example.com	+91 9232790549	own_crm	2025-09-17 17:09:55.397995	\N	New	87 Delhi	Apartment	10818724.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
157	Divya Menon	divya23@example.com	+91 9101945671	own_crm	2025-09-17 17:09:55.400718	\N	New	152 Chennai	Penthouse	11434277.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
158	Rohit Kapoor	rohit24@example.com	+91 9755622180	own_crm	2025-09-17 17:09:55.403102	\N	New	159 Hyderabad	Apartment	5314583.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
159	Simran Kaur	simran25@example.com	+91 9998864871	own_crm	2025-09-17 17:09:55.404802	\N	New	127 Hyderabad	Penthouse	10051154.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
160	Simran Kaur	simran26@example.com	+91 9645269399	own_crm	2025-09-17 17:09:55.406972	\N	New	22 Delhi	Apartment	9594886.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
161	Sanya Malhotra	sanya27@example.com	+91 9884707374	own_crm	2025-09-17 17:09:55.410295	\N	New	31 Bangalore	Duplex	11713163.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
162	Pooja Nair	pooja28@example.com	+91 9117693916	own_crm	2025-09-17 17:09:55.412626	\N	New	187 Pune	Duplex	7994378.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
163	Pooja Nair	pooja29@example.com	+91 9051299056	own_crm	2025-09-17 17:09:55.414585	\N	New	175 Lucknow	Penthouse	5469715.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
164	Neha Gupta	neha30@example.com	+91 9914018687	own_crm	2025-09-17 17:09:55.416322	\N	New	143 Pune	Penthouse	5062441.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
165	Aryan Pandey	aryan31@example.com	+91 9015677146	own_crm	2025-09-17 17:09:55.417787	\N	New	15 Hyderabad	Villa	6964226.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
166	Divya Menon	divya32@example.com	+91 9654670272	own_crm	2025-09-17 17:09:55.419309	\N	New	156 Lucknow	Penthouse	6570388.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
167	Aditya Verma	aditya33@example.com	+91 9799882821	own_crm	2025-09-17 17:09:55.420784	\N	New	135 Noida	Apartment	6443658.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
168	Pooja Nair	pooja35@example.com	+91 9908469814	own_crm	2025-09-17 17:09:55.423676	\N	New	93 Lucknow	Villa	6022370.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
169	Nikhil Jain	nikhil36@example.com	+91 9180017304	own_crm	2025-09-17 17:09:55.425081	\N	New	198 Pune	Apartment	11934892.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
170	Aryan Pandey	aryan37@example.com	+91 9990790396	own_crm	2025-09-17 17:09:55.426491	\N	New	156 Lucknow	Duplex	4222308.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
171	Riya Sharma	riya38@example.com	+91 9088750957	own_crm	2025-09-17 17:09:55.43008	\N	New	20 Kolkata	Apartment	5342750.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
172	Aryan Pandey	aryan39@example.com	+91 9757014401	own_crm	2025-09-17 17:09:55.431629	\N	New	196 Delhi	Penthouse	9134807.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
173	Karan Mehta	karan40@example.com	+91 9677414117	own_crm	2025-09-17 17:09:55.433931	\N	New	51 Kolkata	Duplex	11529656.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
174	Pooja Nair	pooja41@example.com	+91 9854395629	own_crm	2025-09-17 17:09:55.435361	\N	New	41 Noida	Apartment	11082215.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
175	Simran Kaur	simran42@example.com	+91 9293250960	own_crm	2025-09-17 17:09:55.436777	\N	New	195 Lucknow	Penthouse	7181404.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
176	Vikram Desai	vikram43@example.com	+91 9950005678	own_crm	2025-09-17 17:09:55.43825	\N	New	139 Bangalore	Villa	5426782.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
177	Sanya Malhotra	sanya44@example.com	+91 9746136217	own_crm	2025-09-17 17:09:55.439639	\N	New	56 Hyderabad	Duplex	7085535.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
178	Riya Sharma	riya45@example.com	+91 9695325618	own_crm	2025-09-17 17:09:55.441119	\N	New	110 Kolkata	Penthouse	8743497.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
179	Pooja Nair	pooja46@example.com	+91 9051627741	own_crm	2025-09-17 17:09:55.442577	\N	New	168 Mumbai	Penthouse	8207458.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
180	Divya Menon	divya47@example.com	+91 9077454631	own_crm	2025-09-17 17:09:55.443623	\N	New	102 Bangalore	Villa	7654837.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
181	Pooja Nair	pooja48@example.com	+91 9002612186	own_crm	2025-09-17 17:09:55.444849	\N	New	81 Lucknow	Penthouse	4103888.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
182	Isha Bansal	isha49@example.com	+91 9597325146	own_crm	2025-09-17 17:09:55.44666	\N	New	182 Kanpur	Penthouse	8207944.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
183	Neha Gupta	neha50@example.com	+91 9476869957	own_crm	2025-09-17 17:09:55.448152	\N	New	17 Hyderabad	Apartment	9920248.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
184	Rahul Khanna	rahul51@example.com	+91 9701421327	own_crm	2025-09-17 17:09:55.449464	\N	New	99 Bangalore	Apartment	6839689.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
185	Priya Singh	priya52@example.com	+91 9778924579	own_crm	2025-09-17 17:09:55.450786	\N	New	117 Pune	Penthouse	7760220.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
186	Rahul Khanna	rahul53@example.com	+91 9684957987	own_crm	2025-09-17 17:09:55.452501	\N	New	196 Lucknow	Apartment	9682317.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
187	Tanya Arora	tanya54@example.com	+91 9153349265	own_crm	2025-09-17 17:09:55.454304	\N	New	160 Hyderabad	Penthouse	4699646.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
188	Aditya Verma	aditya55@example.com	+91 9515938735	own_crm	2025-09-17 17:09:55.455941	\N	New	38 Delhi	Penthouse	5468681.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
189	Isha Bansal	isha56@example.com	+91 9548032253	own_crm	2025-09-17 17:09:55.457693	\N	New	103 Kolkata	Penthouse	9109533.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
190	Karan Mehta	karan57@example.com	+91 9807175950	own_crm	2025-09-17 17:09:55.459832	\N	New	191 Mumbai	Villa	10436117.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
191	Isha Bansal	isha58@example.com	+91 9298363041	own_crm	2025-09-17 17:09:55.462492	\N	New	179 Chennai	Apartment	4809493.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
192	Isha Bansal	isha59@example.com	+91 9468945693	own_crm	2025-09-17 17:09:55.464889	\N	New	124 Bangalore	Duplex	8002222.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
193	Nikhil Jain	nikhil60@example.com	+91 9621453285	own_crm	2025-09-17 17:09:55.467156	\N	New	86 Lucknow	Penthouse	7856201.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
194	Aryan Pandey	aryan61@example.com	+91 9310443415	own_crm	2025-09-17 17:09:55.469479	\N	New	2 Kanpur	Duplex	11765580.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
195	Nikhil Jain	nikhil62@example.com	+91 9472091902	own_crm	2025-09-17 17:09:55.471884	\N	New	159 Mumbai	Apartment	9346130.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
196	Aryan Pandey	aryan63@example.com	+91 9309676312	own_crm	2025-09-17 17:09:55.474365	\N	New	106 Bangalore	Duplex	7845484.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
197	Amit Joshi	amit64@example.com	+91 9010843819	own_crm	2025-09-17 17:09:55.477225	\N	New	110 Hyderabad	Villa	5773045.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
198	Neha Gupta	neha65@example.com	+91 9053151776	own_crm	2025-09-17 17:09:55.47937	\N	New	157 Mumbai	Villa	4784888.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
199	Nikhil Jain	nikhil66@example.com	+91 9672523653	own_crm	2025-09-17 17:09:55.481391	\N	New	115 Delhi	Villa	11326086.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
200	Nikhil Jain	nikhil67@example.com	+91 9843628329	own_crm	2025-09-17 17:09:55.483312	\N	New	28 Hyderabad	Villa	6383040.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
201	Tanya Arora	tanya68@example.com	+91 9186040883	own_crm	2025-09-17 17:09:55.485022	\N	New	137 Chennai	Apartment	9680573.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
202	Saurabh Tiwari	saurabh69@example.com	+91 9384023023	own_crm	2025-09-17 17:09:55.487013	\N	New	84 Kolkata	Penthouse	9022425.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
203	Vikram Desai	vikram70@example.com	+91 9421687166	own_crm	2025-09-17 17:09:55.489044	\N	New	152 Hyderabad	Penthouse	11774792.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
204	Riya Sharma	riya71@example.com	+91 9433043078	own_crm	2025-09-17 17:09:55.49103	\N	New	61 Hyderabad	Villa	4126809.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
205	Aditya Verma	aditya72@example.com	+91 9964245095	own_crm	2025-09-17 17:09:55.493282	\N	New	114 Lucknow	Duplex	10464490.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
206	Isha Bansal	isha73@example.com	+91 9557777877	own_crm	2025-09-17 17:09:55.495802	\N	New	67 Kolkata	Duplex	5873133.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
207	Divya Menon	divya74@example.com	+91 9848374615	own_crm	2025-09-17 17:09:55.499362	\N	New	29 Pune	Villa	8312981.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
208	Sanya Malhotra	sanya75@example.com	+91 9345452625	own_crm	2025-09-17 17:09:55.502591	\N	New	153 Hyderabad	Villa	5073544.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
209	Mohit Suri	mohit76@example.com	+91 9570411764	own_crm	2025-09-17 17:09:55.508413	\N	New	97 Kanpur	Apartment	4449670.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
210	Divya Menon	divya77@example.com	+91 9083837516	own_crm	2025-09-17 17:09:55.510637	\N	New	78 Mumbai	Villa	11866337.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
211	Ananya Rao	ananya78@example.com	+91 9216162045	own_crm	2025-09-17 17:09:55.513556	\N	New	186 Mumbai	Penthouse	4799761.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
212	Neha Gupta	neha79@example.com	+91 9618667693	own_crm	2025-09-17 17:09:55.515469	\N	New	25 Pune	Villa	6762209.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
213	Mohit Suri	mohit80@example.com	+91 9246179250	own_crm	2025-09-17 17:09:55.517078	\N	New	62 Pune	Penthouse	5856633.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
214	Mohit Suri	mohit81@example.com	+91 9801385709	own_crm	2025-09-17 17:09:55.519022	\N	New	139 Chennai	Duplex	9169424.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
215	Aryan Pandey	aryan82@example.com	+91 9194799530	own_crm	2025-09-17 17:09:55.521078	\N	New	188 Delhi	Penthouse	11490413.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
216	Sanya Malhotra	sanya83@example.com	+91 9041459197	own_crm	2025-09-17 17:09:55.522784	\N	New	80 Lucknow	Apartment	11488161.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
217	Aryan Pandey	aryan84@example.com	+91 9526852641	own_crm	2025-09-17 17:09:55.525134	\N	New	176 Lucknow	Villa	10227497.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
218	Isha Bansal	isha85@example.com	+91 9899048925	own_crm	2025-09-17 17:09:55.527041	\N	New	190 Mumbai	Villa	5795342.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
219	Isha Bansal	isha86@example.com	+91 9328912046	own_crm	2025-09-17 17:09:55.529104	\N	New	76 Mumbai	Apartment	9807255.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
220	Karan Mehta	karan87@example.com	+91 9402755618	own_crm	2025-09-17 17:09:55.531484	\N	New	24 Kanpur	Penthouse	9665008.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
221	Amit Joshi	amit88@example.com	+91 9102532818	own_crm	2025-09-17 17:09:55.533426	\N	New	160 Chennai	Duplex	10902197.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
222	Neha Gupta	neha89@example.com	+91 9824552985	own_crm	2025-09-17 17:09:55.535799	\N	New	65 Hyderabad	Duplex	11582099.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
223	Neha Gupta	neha90@example.com	+91 9409377687	own_crm	2025-09-17 17:09:55.537637	\N	New	24 Kanpur	Penthouse	7996837.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
224	Aditya Verma	aditya91@example.com	+91 9652006535	own_crm	2025-09-17 17:09:55.539703	\N	New	179 Kolkata	Penthouse	11473122.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
225	Aditya Verma	aditya92@example.com	+91 9761711627	own_crm	2025-09-17 17:09:55.542121	\N	New	38 Hyderabad	Duplex	8387091.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
226	Divya Menon	divya93@example.com	+91 9847004377	own_crm	2025-09-17 17:09:55.544482	\N	New	107 Mumbai	Apartment	5250647.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
227	Mohit Suri	mohit94@example.com	+91 9139788508	own_crm	2025-09-17 17:09:55.547013	\N	New	144 Pune	Duplex	7727498.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
228	Karan Mehta	karan95@example.com	+91 9876478054	own_crm	2025-09-17 17:09:55.549403	\N	New	176 Bangalore	Penthouse	8200233.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
229	Vikram Desai	vikram96@example.com	+91 9009403143	own_crm	2025-09-17 17:09:55.551561	\N	New	29 Chennai	Duplex	4380119.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
230	Karan Mehta	karan97@example.com	+91 9546835697	own_crm	2025-09-17 17:09:55.553679	\N	New	34 Chennai	Penthouse	8137488.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
231	Nikhil Jain	nikhil98@example.com	+91 9583337565	own_crm	2025-09-17 17:09:55.55561	\N	New	135 Lucknow	Villa	5633707.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
232	Karan Mehta	karan99@example.com	+91 9955819254	own_crm	2025-09-17 17:09:55.557233	\N	New	190 Hyderabad	Apartment	11785448.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
233	Simran Kaur	simran100@example.com	+91 9555821122	own_crm	2025-09-17 17:09:55.55886	\N	New	88 Delhi	Villa	5430695.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
234	Aryan Pandey	aryan101@example.com	+91 9433100005	own_crm	2025-09-17 17:09:55.560881	\N	New	71 Hyderabad	Villa	6748462.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
235	Saurabh Tiwari	saurabh102@example.com	+91 9243542277	own_crm	2025-09-17 17:09:55.56274	\N	New	197 Delhi	Villa	6534549.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
236	Vikram Desai	vikram103@example.com	+91 9985345501	own_crm	2025-09-17 17:09:55.564059	\N	New	124 Mumbai	Apartment	7386215.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
237	Saurabh Tiwari	saurabh104@example.com	+91 9143981148	own_crm	2025-09-17 17:09:55.5653	\N	New	105 Pune	Penthouse	11755936.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
238	Nikhil Jain	nikhil105@example.com	+91 9954464593	own_crm	2025-09-17 17:09:55.566394	\N	New	66 Lucknow	Villa	10425446.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
239	Isha Bansal	isha106@example.com	+91 9977497248	own_crm	2025-09-17 17:09:55.5675	\N	New	13 Noida	Villa	11200936.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
240	Rohit Kapoor	rohit107@example.com	+91 9740579629	own_crm	2025-09-17 17:09:55.568571	\N	New	59 Kolkata	Apartment	4305320.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
241	Pooja Nair	pooja108@example.com	+91 9928142390	own_crm	2025-09-17 17:09:55.569657	\N	New	98 Kolkata	Villa	8061714.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
242	Vikram Desai	vikram109@example.com	+91 9301084679	own_crm	2025-09-17 17:09:55.57105	\N	New	12 Kanpur	Duplex	7091663.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
243	Aditya Verma	aditya110@example.com	+91 9721085342	own_crm	2025-09-17 17:09:55.57422	\N	New	43 Hyderabad	Penthouse	11006156.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
244	Neha Gupta	neha111@example.com	+91 9628014541	own_crm	2025-09-17 17:09:55.579016	\N	New	191 Noida	Duplex	5008416.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
245	Nikhil Jain	nikhil112@example.com	+91 9017626454	own_crm	2025-09-17 17:09:55.581538	\N	New	12 Hyderabad	Penthouse	8863363.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
246	Priya Singh	priya113@example.com	+91 9738143410	own_crm	2025-09-17 17:09:55.58443	\N	New	48 Bangalore	Apartment	5512748.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
247	Rohit Kapoor	rohit114@example.com	+91 9553090056	own_crm	2025-09-17 17:09:55.586902	\N	New	192 Delhi	Penthouse	4884788.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
248	Vikram Desai	vikram115@example.com	+91 9616267431	own_crm	2025-09-17 17:09:55.588913	\N	New	104 Delhi	Duplex	10372459.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
249	Sanya Malhotra	sanya116@example.com	+91 9576411686	own_crm	2025-09-17 17:09:55.590748	\N	New	172 Chennai	Villa	6194997.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
250	Tanya Arora	tanya117@example.com	+91 9665619941	own_crm	2025-09-17 17:09:55.592369	\N	New	85 Delhi	Apartment	5020916.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
251	Priya Singh	priya118@example.com	+91 9906787440	own_crm	2025-09-17 17:09:55.593964	\N	New	170 Hyderabad	Penthouse	4383883.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
252	Ananya Rao	ananya119@example.com	+91 9613090649	own_crm	2025-09-17 17:09:55.595978	\N	New	57 Noida	Villa	7036690.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
253	Vikram Desai	vikram120@example.com	+91 9487993888	own_crm	2025-09-17 17:09:55.597744	\N	New	146 Lucknow	Duplex	5858243.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
254	Tanya Arora	tanya121@example.com	+91 9588428651	own_crm	2025-09-17 17:09:55.59969	\N	New	179 Bangalore	Villa	7646061.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
255	Aryan Pandey	aryan122@example.com	+91 9457380060	own_crm	2025-09-17 17:09:55.601679	\N	New	166 Noida	Duplex	6874577.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
256	Nikhil Jain	nikhil123@example.com	+91 9044905849	own_crm	2025-09-17 17:09:55.603321	\N	New	144 Bangalore	Villa	8046564.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
257	Mohit Suri	mohit124@example.com	+91 9790038225	own_crm	2025-09-17 17:09:55.605511	\N	New	16 Chennai	Duplex	7520574.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
258	Riya Sharma	riya125@example.com	+91 9121973661	own_crm	2025-09-17 17:09:55.607255	\N	New	88 Pune	Duplex	10443015.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
259	Neha Gupta	neha126@example.com	+91 9930514819	own_crm	2025-09-17 17:09:55.609772	\N	New	46 Mumbai	Villa	4920986.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
260	Aryan Pandey	aryan127@example.com	+91 9079562205	own_crm	2025-09-17 17:09:55.610951	\N	New	1 Delhi	Penthouse	5808484.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
261	Amit Joshi	amit128@example.com	+91 9405207810	own_crm	2025-09-17 17:09:55.612568	\N	New	85 Mumbai	Villa	10931978.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
262	Simran Kaur	simran129@example.com	+91 9906437224	own_crm	2025-09-17 17:09:55.615056	\N	New	84 Kanpur	Villa	4061321.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
263	Divya Menon	divya130@example.com	+91 9004310111	own_crm	2025-09-17 17:09:55.616618	\N	New	163 Noida	Penthouse	4369850.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
264	Priya Singh	priya131@example.com	+91 9210591601	own_crm	2025-09-17 17:09:55.617947	\N	New	162 Kanpur	Apartment	6790062.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
265	Simran Kaur	simran132@example.com	+91 9131330957	own_crm	2025-09-17 17:09:55.619391	\N	New	79 Chennai	Penthouse	5926117.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
266	Neha Gupta	neha133@example.com	+91 9472925132	own_crm	2025-09-17 17:09:55.620702	\N	New	83 Bangalore	Duplex	5726756.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
267	Sanya Malhotra	sanya134@example.com	+91 9121125802	own_crm	2025-09-17 17:09:55.62253	\N	New	184 Kolkata	Apartment	9346809.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
268	Nikhil Jain	nikhil135@example.com	+91 9500304775	own_crm	2025-09-17 17:09:55.624066	\N	New	1 Mumbai	Duplex	6623220.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
269	Sanya Malhotra	sanya136@example.com	+91 9604838055	own_crm	2025-09-17 17:09:55.625543	\N	New	168 Noida	Penthouse	9823608.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
270	Pooja Nair	pooja137@example.com	+91 9926388763	own_crm	2025-09-17 17:09:55.627177	\N	New	162 Bangalore	Duplex	6864193.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
271	Karan Mehta	karan138@example.com	+91 9435996520	own_crm	2025-09-17 17:09:55.629213	\N	New	136 Lucknow	Apartment	11281967.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
272	Saurabh Tiwari	saurabh139@example.com	+91 9378638252	own_crm	2025-09-17 17:09:55.631082	\N	New	127 Chennai	Penthouse	5459175.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
273	Ananya Rao	ananya140@example.com	+91 9124594860	own_crm	2025-09-17 17:09:55.632789	\N	New	65 Bangalore	Apartment	11872849.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
274	Simran Kaur	simran141@example.com	+91 9879911884	own_crm	2025-09-17 17:09:55.63467	\N	New	77 Delhi	Duplex	6224622.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
275	Aditya Verma	aditya142@example.com	+91 9515877381	own_crm	2025-09-17 17:09:55.636314	\N	New	123 Delhi	Duplex	10586970.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
276	Saurabh Tiwari	saurabh143@example.com	+91 9837463805	own_crm	2025-09-17 17:09:55.637922	\N	New	63 Pune	Villa	8461560.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
277	Riya Sharma	riya144@example.com	+91 9660657513	own_crm	2025-09-17 17:09:55.639948	\N	New	161 Hyderabad	Villa	8223138.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
278	Priya Singh	priya145@example.com	+91 9208836789	own_crm	2025-09-17 17:09:55.642436	\N	New	121 Bangalore	Penthouse	9170429.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
279	Neha Gupta	neha146@example.com	+91 9404643093	own_crm	2025-09-17 17:09:55.646226	\N	New	135 Pune	Penthouse	11534326.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
280	Nikhil Jain	nikhil147@example.com	+91 9089246621	own_crm	2025-09-17 17:09:55.649168	\N	New	163 Bangalore	Penthouse	7402074.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
281	Aryan Pandey	aryan148@example.com	+91 9840759331	own_crm	2025-09-17 17:09:55.652813	\N	New	8 Chennai	Duplex	9348313.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
282	Rahul Khanna	rahul149@example.com	+91 9442030523	own_crm	2025-09-17 17:09:55.655042	\N	New	50 Lucknow	Duplex	4103469.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
283	Neha Gupta	neha150@example.com	+91 9526974329	own_crm	2025-09-17 17:09:55.65704	\N	New	34 Pune	Duplex	4734054.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
284	Divya Menon	divya151@example.com	+91 9261069113	own_crm	2025-09-17 17:09:55.658765	\N	New	51 Bangalore	Duplex	9204079.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
285	Riya Sharma	riya152@example.com	+91 9669833569	own_crm	2025-09-17 17:09:55.660476	\N	New	155 Chennai	Villa	5500249.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
286	Aryan Pandey	aryan153@example.com	+91 9778034119	own_crm	2025-09-17 17:09:55.662336	\N	New	8 Lucknow	Villa	9362556.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
287	Sanya Malhotra	sanya154@example.com	+91 9885446327	own_crm	2025-09-17 17:09:55.664516	\N	New	117 Mumbai	Penthouse	4756670.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
288	Amit Joshi	amit155@example.com	+91 9516418829	own_crm	2025-09-17 17:09:55.666704	\N	New	43 Kanpur	Penthouse	7660401.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
289	Sanya Malhotra	sanya156@example.com	+91 9335712961	own_crm	2025-09-17 17:09:55.668727	\N	New	147 Pune	Duplex	8363963.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
290	Simran Kaur	simran157@example.com	+91 9905393101	own_crm	2025-09-17 17:09:55.670564	\N	New	6 Chennai	Apartment	9793384.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
291	Aditya Verma	aditya158@example.com	+91 9375664924	own_crm	2025-09-17 17:09:55.673177	\N	New	58 Bangalore	Penthouse	7326029.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
292	Sanya Malhotra	sanya159@example.com	+91 9504540237	own_crm	2025-09-17 17:09:55.676051	\N	New	134 Chennai	Apartment	10404530.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
293	Vikram Desai	vikram160@example.com	+91 9423990168	own_crm	2025-09-17 17:09:55.679034	\N	New	144 Hyderabad	Apartment	11812801.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
294	Amit Joshi	amit161@example.com	+91 9256245269	own_crm	2025-09-17 17:09:55.683071	\N	New	184 Lucknow	Penthouse	5675389.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
295	Ananya Rao	ananya162@example.com	+91 9408902033	own_crm	2025-09-17 17:09:55.685734	\N	New	98 Mumbai	Apartment	4935126.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
296	Aditya Verma	aditya163@example.com	+91 9424908780	own_crm	2025-09-17 17:09:55.687449	\N	New	102 Lucknow	Duplex	9570268.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
297	Simran Kaur	simran164@example.com	+91 9132595426	own_crm	2025-09-17 17:09:55.689175	\N	New	15 Mumbai	Apartment	7124986.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
298	Vikram Desai	vikram165@example.com	+91 9069811946	own_crm	2025-09-17 17:09:55.690843	\N	New	89 Bangalore	Apartment	9632030.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
299	Nikhil Jain	nikhil166@example.com	+91 9036339750	own_crm	2025-09-17 17:09:55.693565	\N	New	123 Chennai	Apartment	5593687.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
300	Ananya Rao	ananya167@example.com	+91 9746303896	own_crm	2025-09-17 17:09:55.695781	\N	New	31 Delhi	Penthouse	7979506.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
301	Tanya Arora	tanya168@example.com	+91 9959985486	own_crm	2025-09-17 17:09:55.698783	\N	New	75 Kolkata	Apartment	5910949.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
302	Nikhil Jain	nikhil169@example.com	+91 9839504377	own_crm	2025-09-17 17:09:55.701292	\N	New	169 Kolkata	Penthouse	8219716.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
303	Rohit Kapoor	rohit170@example.com	+91 9719921369	own_crm	2025-09-17 17:09:55.703806	\N	New	1 Noida	Duplex	8941867.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
304	Saurabh Tiwari	saurabh171@example.com	+91 9004163835	own_crm	2025-09-17 17:09:55.705788	\N	New	38 Chennai	Apartment	5334920.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
305	Pooja Nair	pooja172@example.com	+91 9382868843	own_crm	2025-09-17 17:09:55.708248	\N	New	143 Pune	Penthouse	10992220.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
306	Tanya Arora	tanya173@example.com	+91 9415418497	own_crm	2025-09-17 17:09:55.710788	\N	New	73 Kolkata	Villa	10895915.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
307	Saurabh Tiwari	saurabh174@example.com	+91 9985535804	own_crm	2025-09-17 17:09:55.713723	\N	New	170 Lucknow	Penthouse	6171353.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
308	Amit Joshi	amit175@example.com	+91 9561268384	own_crm	2025-09-17 17:09:55.717357	\N	New	197 Noida	Villa	9364873.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
309	Karan Mehta	karan176@example.com	+91 9888426990	own_crm	2025-09-17 17:09:55.720789	\N	New	114 Hyderabad	Apartment	8774455.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
310	Neha Gupta	neha177@example.com	+91 9755827510	own_crm	2025-09-17 17:09:55.723816	\N	New	121 Noida	Duplex	8159889.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
311	Priya Singh	priya178@example.com	+91 9228777532	own_crm	2025-09-17 17:09:55.727169	\N	New	165 Kanpur	Penthouse	11881678.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
312	Karan Mehta	karan179@example.com	+91 9982683927	own_crm	2025-09-17 17:09:55.731341	\N	New	133 Mumbai	Villa	7756380.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
313	Rahul Khanna	rahul180@example.com	+91 9359428652	own_crm	2025-09-17 17:09:55.734267	\N	New	176 Chennai	Duplex	6594339.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
314	Nikhil Jain	nikhil181@example.com	+91 9533703637	own_crm	2025-09-17 17:09:55.737486	\N	New	81 Delhi	Duplex	4258636.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
315	Aditya Verma	aditya182@example.com	+91 9736602918	own_crm	2025-09-17 17:09:55.741071	\N	New	141 Lucknow	Duplex	8385334.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
316	Aryan Pandey	aryan183@example.com	+91 9497058122	own_crm	2025-09-17 17:09:55.743866	\N	New	60 Kolkata	Duplex	11643929.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
317	Aditya Verma	aditya184@example.com	+91 9970810714	own_crm	2025-09-17 17:09:55.74707	\N	New	54 Mumbai	Penthouse	10932597.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
318	Nikhil Jain	nikhil185@example.com	+91 9927999685	own_crm	2025-09-17 17:09:55.749695	\N	New	43 Hyderabad	Penthouse	10558951.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
319	Amit Joshi	amit186@example.com	+91 9683371687	own_crm	2025-09-17 17:09:55.752192	\N	New	103 Noida	Apartment	4135553.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
320	Rohit Kapoor	rohit187@example.com	+91 9608802298	own_crm	2025-09-17 17:09:55.755024	\N	New	56 Bangalore	Apartment	5233111.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
321	Nikhil Jain	nikhil188@example.com	+91 9713140028	own_crm	2025-09-17 17:09:55.758903	\N	New	33 Pune	Penthouse	10361081.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
322	Amit Joshi	amit189@example.com	+91 9894163333	own_crm	2025-09-17 17:09:55.763916	\N	New	132 Kanpur	Duplex	4552128.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
323	Ananya Rao	ananya190@example.com	+91 9157964629	own_crm	2025-09-17 17:09:55.76752	\N	New	181 Delhi	Villa	6130101.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
324	Divya Menon	divya191@example.com	+91 9205230396	own_crm	2025-09-17 17:09:55.770413	\N	New	184 Mumbai	Duplex	10433463.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
325	Divya Menon	divya192@example.com	+91 9183265939	own_crm	2025-09-17 17:09:55.774019	\N	New	175 Bangalore	Apartment	9120070.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
326	Aryan Pandey	aryan193@example.com	+91 9652712349	own_crm	2025-09-17 17:09:55.776592	\N	New	78 Kanpur	Villa	4247039.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
327	Rahul Khanna	rahul194@example.com	+91 9436728176	own_crm	2025-09-17 17:09:55.780107	\N	New	113 Mumbai	Apartment	7092517.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
328	Simran Kaur	simran195@example.com	+91 9424176271	own_crm	2025-09-17 17:09:55.783147	\N	New	31 Pune	Penthouse	7490363.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
329	Simran Kaur	simran196@example.com	+91 9021941010	own_crm	2025-09-17 17:09:55.785428	\N	New	196 Kanpur	Apartment	6807603.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
330	Neha Gupta	neha197@example.com	+91 9519811040	own_crm	2025-09-17 17:09:55.78859	\N	New	136 Bangalore	Duplex	7175710.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
331	Sanya Malhotra	sanya198@example.com	+91 9314911563	own_crm	2025-09-17 17:09:55.791508	\N	New	195 Hyderabad	Villa	10034059.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
332	Mohit Suri	mohit199@example.com	+91 9841345910	own_crm	2025-09-17 17:09:55.793779	\N	New	47 Kanpur	Duplex	11241514.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
333	Ananya Rao	ananya200@example.com	+91 9918778960	own_crm	2025-09-17 17:09:55.796737	\N	New	42 Pune	Villa	8605766.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
334	Tanya Arora	tanya201@example.com	+91 9003679087	own_crm	2025-09-17 17:09:55.799021	\N	New	49 Mumbai	Penthouse	9562744.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
335	Simran Kaur	simran202@example.com	+91 9276655271	own_crm	2025-09-17 17:09:55.801035	\N	New	97 Lucknow	Duplex	5826941.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
336	Simran Kaur	simran203@example.com	+91 9047119988	own_crm	2025-09-17 17:09:55.803355	\N	New	48 Chennai	Villa	8855017.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
337	Pooja Nair	pooja204@example.com	+91 9644448413	own_crm	2025-09-17 17:09:55.80525	\N	New	32 Pune	Apartment	8340056.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
338	Simran Kaur	simran205@example.com	+91 9187808991	own_crm	2025-09-17 17:09:55.807346	\N	New	8 Lucknow	Apartment	7862240.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
339	Isha Bansal	isha206@example.com	+91 9364194307	own_crm	2025-09-17 17:09:55.809979	\N	New	72 Bangalore	Penthouse	10563674.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
340	Neha Gupta	neha207@example.com	+91 9689104326	own_crm	2025-09-17 17:09:55.81254	\N	New	133 Pune	Apartment	10505004.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
341	Tanya Arora	tanya208@example.com	+91 9558933544	own_crm	2025-09-17 17:09:55.814465	\N	New	148 Delhi	Penthouse	10977561.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
342	Nikhil Jain	nikhil209@example.com	+91 9267358790	own_crm	2025-09-17 17:09:55.816141	\N	New	12 Pune	Apartment	5368918.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
343	Divya Menon	divya210@example.com	+91 9261274054	own_crm	2025-09-17 17:09:55.817791	\N	New	12 Chennai	Duplex	10473203.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
344	Simran Kaur	simran211@example.com	+91 9042804574	own_crm	2025-09-17 17:09:55.819707	\N	New	87 Mumbai	Apartment	10576221.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
345	Riya Sharma	riya212@example.com	+91 9182547598	own_crm	2025-09-17 17:09:55.822066	\N	New	175 Kanpur	Penthouse	7254169.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
346	Divya Menon	divya213@example.com	+91 9225353928	own_crm	2025-09-17 17:09:55.824731	\N	New	18 Pune	Duplex	5093794.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
347	Priya Singh	priya214@example.com	+91 9902484831	own_crm	2025-09-17 17:09:55.827467	\N	New	141 Kanpur	Apartment	9428519.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
348	Riya Sharma	riya215@example.com	+91 9532028498	own_crm	2025-09-17 17:09:55.831155	\N	New	21 Chennai	Villa	11916452.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
349	Riya Sharma	riya216@example.com	+91 9885711289	own_crm	2025-09-17 17:09:55.833378	\N	New	182 Kanpur	Penthouse	10192829.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
350	Aryan Pandey	aryan217@example.com	+91 9967583487	own_crm	2025-09-17 17:09:55.835775	\N	New	98 Delhi	Villa	9342298.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
351	Aryan Pandey	aryan218@example.com	+91 9403274704	own_crm	2025-09-17 17:09:55.837827	\N	New	69 Delhi	Apartment	9178214.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
352	Rahul Khanna	rahul219@example.com	+91 9856152247	own_crm	2025-09-17 17:09:55.840079	\N	New	89 Mumbai	Villa	9406647.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
353	Vikram Desai	vikram220@example.com	+91 9631255395	own_crm	2025-09-17 17:09:55.842971	\N	New	71 Delhi	Villa	10329888.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
354	Sanya Malhotra	sanya221@example.com	+91 9459131074	own_crm	2025-09-17 17:09:55.845082	\N	New	141 Lucknow	Penthouse	10970801.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
355	Ananya Rao	ananya222@example.com	+91 9678967268	own_crm	2025-09-17 17:09:55.84742	\N	New	57 Chennai	Villa	8341280.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
356	Mohit Suri	mohit223@example.com	+91 9118450714	own_crm	2025-09-17 17:09:55.849166	\N	New	33 Kolkata	Apartment	7631957.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
357	Vikram Desai	vikram224@example.com	+91 9781844721	own_crm	2025-09-17 17:09:55.851075	\N	New	180 Noida	Penthouse	9760909.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
358	Priya Singh	priya225@example.com	+91 9767744001	own_crm	2025-09-17 17:09:55.853063	\N	New	149 Pune	Duplex	11608601.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
359	Nikhil Jain	nikhil226@example.com	+91 9297927160	own_crm	2025-09-17 17:09:55.854847	\N	New	107 Mumbai	Apartment	10162387.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
360	Rahul Khanna	rahul227@example.com	+91 9975336440	own_crm	2025-09-17 17:09:55.856501	\N	New	172 Mumbai	Apartment	11383478.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
361	Aryan Pandey	aryan228@example.com	+91 9508825808	own_crm	2025-09-17 17:09:55.858303	\N	New	24 Hyderabad	Villa	11780202.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
362	Aditya Verma	aditya229@example.com	+91 9812822229	own_crm	2025-09-17 17:09:55.860315	\N	New	157 Lucknow	Apartment	9164933.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
363	Tanya Arora	tanya230@example.com	+91 9293796314	own_crm	2025-09-17 17:09:55.862111	\N	New	52 Kanpur	Penthouse	7561240.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
364	Neha Gupta	neha231@example.com	+91 9913662037	own_crm	2025-09-17 17:09:55.863993	\N	New	64 Noida	Duplex	7212569.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
365	Nikhil Jain	nikhil232@example.com	+91 9752600658	own_crm	2025-09-17 17:09:55.865719	\N	New	165 Noida	Apartment	11186782.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
366	Riya Sharma	riya233@example.com	+91 9937359496	own_crm	2025-09-17 17:09:55.867639	\N	New	140 Bangalore	Penthouse	9856982.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
367	Saurabh Tiwari	saurabh234@example.com	+91 9559815605	own_crm	2025-09-17 17:09:55.869302	\N	New	76 Mumbai	Villa	8126879.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
368	Saurabh Tiwari	saurabh235@example.com	+91 9829521026	own_crm	2025-09-17 17:09:55.870947	\N	New	28 Bangalore	Duplex	5833436.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
369	Simran Kaur	simran236@example.com	+91 9486397532	own_crm	2025-09-17 17:09:55.872565	\N	New	32 Noida	Duplex	7143011.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
370	Tanya Arora	tanya237@example.com	+91 9876164319	own_crm	2025-09-17 17:09:55.874217	\N	New	133 Delhi	Villa	10421949.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
371	Mohit Suri	mohit238@example.com	+91 9112496968	own_crm	2025-09-17 17:09:55.876162	\N	New	54 Kolkata	Villa	11750224.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
372	Priya Singh	priya239@example.com	+91 9534778787	own_crm	2025-09-17 17:09:55.878383	\N	New	96 Hyderabad	Apartment	10901419.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
373	Neha Gupta	neha240@example.com	+91 9190696039	own_crm	2025-09-17 17:09:55.880303	\N	New	199 Hyderabad	Apartment	9387353.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
398	Simran Kaur	simran265@example.com	+91 9483703938	own_crm	2025-09-17 17:09:55.937345	2025-11-18 14:06:51.091279	contacted	169 Hyderabad	Apartment	11088613.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
397	Priya Singh	priya264@example.com	+91 9326480605	own_crm	2025-09-17 17:09:55.935483	2025-11-18 14:06:53.291457	contacted	173 Kolkata	Duplex	10187424.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
395	Isha Bansal	isha262@example.com	+91 9625709152	own_crm	2025-09-17 17:09:55.930576	2025-11-18 14:06:59.026052	working	66 Noida	Apartment	7795290.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
394	Rohit Kapoor	rohit261@example.com	+91 9690661398	own_crm	2025-09-17 17:09:55.928379	2025-11-18 14:07:02.839398	lost	87 Kanpur	Penthouse	9358008.00	Looking for semi-furnished 3BHK	t	\N	\N	manual	\N	\N	\N
393	Tanya Arora	tanya260@example.com	+91 9054951638	own_crm	2025-09-17 17:09:55.926205	2025-11-18 14:07:15.766679	contacted	134 Chennai	Penthouse	9767693.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
392	Rohit Kapoor	rohit259@example.com	+91 9739459179	own_crm	2025-09-17 17:09:55.924411	2025-11-18 14:07:18.221493	qualified	158 Lucknow	Penthouse	6007923.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
391	Priya Singh	priya258@example.com	+91 9305049777	own_crm	2025-09-17 17:09:55.923178	2025-11-18 14:07:20.45266	contacted	200 Lucknow	Villa	8350736.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
390	Divya Menon	divya257@example.com	+91 9383803241	own_crm	2025-09-17 17:09:55.921419	2025-11-18 14:08:18.330664	working	178 Mumbai	Villa	11196594.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
389	Tanya Arora	tanya256@example.com	+91 9374019082	own_crm	2025-09-17 17:09:55.919703	2025-11-18 14:08:22.175731	contacted	143 Noida	Penthouse	8733322.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
388	Aryan Pandey	aryan255@example.com	+91 9241790004	own_crm	2025-09-17 17:09:55.917973	2025-11-18 14:08:25.090834	proposal sent	171 Lucknow	Apartment	8956854.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
386	Simran Kaur	simran253@example.com	+91 9534761969	own_crm	2025-09-17 17:09:55.914283	2025-11-18 14:08:30.503675	contacted	1 Kanpur	Villa	10417482.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
387	Riya Sharma	riya254@example.com	+91 9744454236	own_crm	2025-09-17 17:09:55.91623	2025-11-18 14:08:34.629457	contacted	17 Noida	Villa	7117067.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
384	Priya Singh	priya251@example.com	+91 9258660992	own_crm	2025-09-17 17:09:55.910004	2025-11-18 14:08:42.302354	lost	120 Bangalore	Villa	4841058.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
383	Nikhil Jain	nikhil250@example.com	+91 9766061199	own_crm	2025-09-17 17:09:55.905741	2025-11-18 14:08:50.785233	contacted	24 Bangalore	Penthouse	5742502.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
382	Vikram Desai	vikram249@example.com	+91 9514011359	own_crm	2025-09-17 17:09:55.903568	2025-11-18 14:08:52.861612	qualified	81 Kanpur	Villa	6723493.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
380	Pooja Nair	pooja247@example.com	+91 9437164772	own_crm	2025-09-17 17:09:55.898523	2025-11-18 14:08:55.180301	contacted	191 Pune	Penthouse	4080144.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
381	Divya Menon	divya248@example.com	+91 9215204594	own_crm	2025-09-17 17:09:55.901261	2025-11-18 14:08:57.990116	proposal sent	173 Mumbai	Villa	4043828.00	Looking for luxury villa	t	\N	\N	manual	\N	\N	\N
379	Sanya Malhotra	sanya246@example.com	+91 9662491910	own_crm	2025-09-17 17:09:55.895666	2025-11-18 14:09:01.171657	working	41 Pune	Villa	11538132.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
378	Simran Kaur	simran245@example.com	+91 9748704858	own_crm	2025-09-17 17:09:55.892558	2025-11-18 14:09:03.358261	working	112 Noida	Apartment	4877136.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
377	Karan Mehta	karan244@example.com	+91 9130224946	own_crm	2025-09-17 17:09:55.889784	2025-11-18 14:09:05.380974	qualified	197 Bangalore	Apartment	5152729.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
376	Nikhil Jain	nikhil243@example.com	+91 9458875810	own_crm	2025-09-17 17:09:55.887479	2025-11-18 14:09:07.644855	working	147 Delhi	Apartment	6033486.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
375	Vikram Desai	vikram242@example.com	+91 9078992533	own_crm	2025-09-17 17:09:55.883721	2025-11-18 14:09:10.561471	proposal sent	141 Hyderabad	Penthouse	6696425.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
374	Neha Gupta	neha241@example.com	+91 9804906747	own_crm	2025-09-17 17:09:55.881958	2025-11-18 14:09:12.947343	proposal sent	167 Kanpur	Villa	5367467.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
435	Darshan Valand	webdeveloper12.intelliworkz@gmail.com	1919332929	own_crm	2025-11-01 10:38:45.48645	2025-11-01 12:00:15.368397	proposal sent	sdfgh	villa	12345.00	okff	t	\N	66	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
436	Hiral	hiraltailor2002@gmail.com	4653563522	own_crm	2025-11-01 10:47:44.593275	2025-11-01 11:59:55.142929	proposal sent	asdfgh	asasas	123456.00	okkk 	t	\N	66	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
439	Ajay Patel	user1@example.com	+91 9807076318	own_crm	2025-05-29 05:30:00	\N	Qualified	265 Main Street, Mumbai	Villa	7198777.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
440	Rakesh Kumar	user2@example.com	+91 9238119179	own_crm	2025-06-28 05:30:00	\N	Contacted	733 Main Street, Bangalore	Plot	18489554.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
441	Deepak Kumar	user3@example.com	+91 9486576600	own_crm	2025-01-21 05:30:00	\N	Closed	220 Main Street, Kolkata	Penthouse	14683899.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
442	Anil Singh	user4@example.com	9530950696	own_crm	2025-11-03 05:30:00	2025-11-13 13:07:31.823794	Contacted	183 Park Avenue, Mumbai	Studio	7685840.00	Requesting callback	t	\N	67	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Cold
443	Meena Singh	user5@example.com	+91 9700702089	own_crm	2025-07-01 05:30:00	\N	New	17 Main Street, Lucknow	Villa	10918493.00	Need more info	t	\N	\N	manual	\N	\N	Cold
444	Anil Kumar	user6@example.com	+91 9211188789	own_crm	2025-02-06 05:30:00	\N	Qualified	564 Lane, Noida	Apartment	6170557.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
445	Nitin Kumar	user7@example.com	+91 9440601840	own_crm	2025-09-19 05:30:00	2025-11-18 13:56:53.263522	working	85 Park Avenue, Delhi	Plot	4161673.00	Requesting callback	t	\N	\N	manual	\N	\N	Cold
433	Harsh Bhai	harsh@gmail.com	9876543210	magicbricks	2025-09-18 15:30:49.948713	2025-11-18 13:56:59.124002	qualified	\N	\N	\N	\N	t	\N	\N	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
432	Karan Mehta	karan299@example.com	9439746564	own_crm	2025-09-17 17:09:56.019867	2025-11-18 13:57:01.630802	working	158 Kolkata	Duplex	7320835.00	Looking for 2BHK furnished	t	\N	1	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
431	Mohit Suri	mohit298@example.com	9024111085	own_crm	2025-09-17 17:09:56.016298	2026-06-03 12:09:49.964697	new	5 Chennai	Penthouse	9707952.00	Looking for luxury villa	t	\N	\N	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
430	Simran Kaur	simran297@example.com	9176960823	own_crm	2025-09-17 17:09:56.013051	2025-11-18 13:57:05.886543	contacted	182 Kolkata	Apartment	6160964.00	Wants penthouse with pool	t	\N	\N	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
429	Nikhil Jain	nikhil296@example.com	+91 9312426691	own_crm	2025-09-17 17:09:56.009301	2025-11-18 13:57:09.546958	contacted	75 Lucknow	Duplex	7592365.00	Looking for luxury villa	t	\N	\N	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
428	Priya Singh	priya295@example.com	9231626755	own_crm	2025-09-17 17:09:56.005863	2025-11-18 13:57:12.767005	proposal sent	40 Hyderabad	Penthouse	11391624.00	Interested in 4BHK villa	t	\N	\N	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
427	Divya Menon	divya294@example.com	9167600669	own_crm	2025-09-17 17:09:56.004633	2025-11-18 13:57:15.309728	proposal sent	30 Hyderabad	Villa	4595316.00	Interested in duplex house	t	\N	\N	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
426	Ananya Rao	ananya293@example.com	+91 9025218889	own_crm	2025-09-17 17:09:56.003436	2025-11-18 13:57:17.990623	proposal sent	77 Kolkata	Duplex	6622603.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
425	Rahul Khanna	rahul292@example.com	+91 9092728949	own_crm	2025-09-17 17:09:56.002048	2025-11-18 13:57:20.965692	proposal sent	108 Noida	Apartment	7739785.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
424	Nikhil Jain	nikhil291@example.com	+91 9490027144	own_crm	2025-09-17 17:09:56.000163	2025-11-18 13:57:23.349926	qualified	117 Lucknow	Villa	7840245.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
415	Saurabh Tiwari	saurabh282@example.com	+91 9762958145	own_crm	2025-09-17 17:09:55.975703	2025-11-18 13:57:28.360382	contacted	183 Mumbai	Duplex	11141880.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
422	Priya Singh	priya289@example.com	+91 9467979865	own_crm	2025-09-17 17:09:55.993959	2025-11-18 13:57:33.451691	contacted	56 Lucknow	Penthouse	6444234.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
419	Divya Menon	divya286@example.com	+91 9622146699	own_crm	2025-09-17 17:09:55.98511	2025-11-18 13:57:36.219973	contacted	55 Mumbai	Apartment	4634204.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
421	Isha Bansal	isha288@example.com	+91 9064828490	own_crm	2025-09-17 17:09:55.989803	2025-11-18 13:57:38.942245	qualified	89 Mumbai	Duplex	4684339.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
420	Nikhil Jain	nikhil287@example.com	+91 9843888140	own_crm	2025-09-17 17:09:55.987465	2025-11-18 13:57:41.132932	qualified	152 Bangalore	Penthouse	6619210.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
418	Riya Sharma	riya285@example.com	+91 9326941456	own_crm	2025-09-17 17:09:55.982359	2025-11-18 13:57:43.895107	contacted	116 Chennai	Duplex	5047374.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
417	Aditya Verma	aditya284@example.com	+91 9981876640	own_crm	2025-09-17 17:09:55.979578	2025-11-18 13:57:46.077034	proposal sent	176 Bangalore	Duplex	8182591.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
416	Rohit Kapoor	rohit283@example.com	+91 9748746519	own_crm	2025-09-17 17:09:55.977602	2025-11-18 13:57:49.100376	proposal sent	190 Hyderabad	Villa	10723071.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
414	Saurabh Tiwari	saurabh281@example.com	+91 9814463220	own_crm	2025-09-17 17:09:55.974219	2025-11-18 13:57:52.045801	proposal sent	22 Kolkata	Villa	11090379.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
413	Aditya Verma	aditya280@example.com	+91 9547085963	own_crm	2025-09-17 17:09:55.97222	2025-11-18 14:06:08.562238	contacted	14 Lucknow	Duplex	10785343.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
411	Divya Menon	divya278@example.com	+91 9774904994	own_crm	2025-09-17 17:09:55.967987	2025-11-18 14:06:12.726273	contacted	104 Chennai	Villa	7655477.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
410	Neha Gupta	neha277@example.com	+91 9693654957	own_crm	2025-09-17 17:09:55.965737	2025-11-18 14:06:14.819398	contacted	110 Kanpur	Villa	8281171.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
409	Vikram Desai	vikram276@example.com	+91 9236947976	own_crm	2025-09-17 17:09:55.962489	2025-11-18 14:06:17.427785	qualified	60 Lucknow	Apartment	11620416.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
408	Aditya Verma	aditya275@example.com	+91 9627539816	own_crm	2025-09-17 17:09:55.958936	2025-11-18 14:06:19.477816	qualified	103 Kanpur	Apartment	5463736.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
407	Saurabh Tiwari	saurabh274@example.com	+91 9164592400	own_crm	2025-09-17 17:09:55.956905	2025-11-18 14:06:21.708924	working	196 Pune	Duplex	11612516.00	Interested in 2BHK flat	t	\N	\N	manual	\N	\N	\N
406	Vikram Desai	vikram273@example.com	+91 9106410684	own_crm	2025-09-17 17:09:55.954582	2025-11-18 14:06:24.604626	working	170 Hyderabad	Duplex	7539884.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
405	Mohit Suri	mohit272@example.com	+91 9989966166	own_crm	2025-09-17 17:09:55.952499	2025-11-18 14:06:27.468732	proposal sent	84 Kolkata	Villa	8858038.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
404	Riya Sharma	riya271@example.com	+91 9212701404	own_crm	2025-09-17 17:09:55.950573	2025-11-18 14:06:30.429878	working	42 Delhi	Penthouse	7350860.00	Wants penthouse with pool	t	\N	\N	manual	\N	\N	\N
403	Saurabh Tiwari	saurabh270@example.com	+91 9449655527	own_crm	2025-09-17 17:09:55.948645	2025-11-18 14:06:35.895301	contacted	27 Bangalore	Villa	10777667.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
401	Isha Bansal	isha268@example.com	+91 9676196334	own_crm	2025-09-17 17:09:55.942607	2025-11-18 14:06:40.115664	contacted	68 Chennai	Penthouse	6648787.00	Interested in 4BHK villa	t	\N	\N	manual	\N	\N	\N
400	Isha Bansal	isha267@example.com	+91 9679415723	own_crm	2025-09-17 17:09:55.941155	2025-11-18 14:06:44.046004	proposal sent	17 Delhi	Duplex	10929006.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
446	Amit Singh	user8@example.com	+91 9888350225	own_crm	2025-03-28 05:30:00	\N	Contacted	611 Park Avenue, Mumbai	Studio	12609176.00	Requesting callback	t	\N	\N	manual	\N	\N	Warm
447	Isha Gupta	user9@example.com	+91 9740431307	own_crm	2025-07-10 05:30:00	\N	Qualified	417 Sector, Chennai	Plot	3397282.00	Looking for investment property	t	\N	\N	manual	\N	\N	Warm
448	Rajesh Sharma	user10@example.com	+91 9362129618	own_crm	2025-03-11 05:30:00	\N	Qualified	81 Sector, Chennai	Villa	15162218.00	Interested in buying	t	\N	\N	manual	\N	\N	Warm
3899	\N	46174.00011574074	\N	website	2026-06-16 14:55:01.486	\N	new	\N	\N	\N	\N	t	\N	\N	manual	\N	\N	\N
449	Sonal Kumar	user11@example.com	+91 9542155592	own_crm	2025-04-26 05:30:00	\N	Contacted	526 Main Street, Chennai	Apartment	13842826.00	Looking for investment property	t	\N	\N	manual	\N	\N	Cold
450	Tina Singh	user12@example.com	+91 9752578718	own_crm	2025-01-24 05:30:00	\N	Contacted	221 Lane, Bangalore	Penthouse	13714865.00	Interested in buying	t	\N	\N	manual	\N	\N	Warm
451	Manoj Sharma	user13@example.com	+91 9553807795	own_crm	2025-06-21 05:30:00	\N	Closed	938 Lane, Bangalore	Apartment	4673440.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
452	Vivek Gupta	user14@example.com	+91 9335463603	own_crm	2025-04-30 05:30:00	\N	Closed	583 Park Avenue, Noida	Villa	8380700.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
453	Divya Kumar	user15@example.com	+91 9283656011	own_crm	2025-02-25 05:30:00	\N	Contacted	74 Sector, Bangalore	Studio	14271790.00	Need more info	t	\N	\N	manual	\N	\N	Cold
454	Rajesh Gupta	user16@example.com	+91 9173447025	own_crm	2025-01-17 05:30:00	\N	New	320 Lane, Pune	Penthouse	14831235.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
455	Isha Patel	user17@example.com	+91 9933656887	own_crm	2025-06-03 05:30:00	\N	Closed	490 Main Street, Chennai	Apartment	12687679.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
456	Akash Singh	user18@example.com	+91 9995958062	own_crm	2025-03-16 05:30:00	\N	New	234 Main Street, Mumbai	Villa	9265360.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
457	Monika Gupta	user19@example.com	+91 9951224041	own_crm	2025-01-05 05:30:00	\N	Qualified	299 Main Street, Pune	Penthouse	16943043.00	Need more info	t	\N	\N	manual	\N	\N	Hot
458	Pooja Singh	user20@example.com	+91 9154856743	own_crm	2025-05-04 05:30:00	\N	Closed	701 Main Street, Delhi	Studio	14629216.00	Requesting callback	t	\N	\N	manual	\N	\N	Cold
459	Tina Patel	user21@example.com	+91 9588836850	own_crm	2025-02-11 05:30:00	\N	Qualified	849 Lane, Bangalore	Villa	7053317.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
460	Mitali Sharma	user22@example.com	+91 9633788413	own_crm	2025-01-18 05:30:00	\N	New	258 Main Street, Chennai	Villa	4723088.00	Need more info	t	\N	\N	manual	\N	\N	Hot
461	Ajay Patel	user23@example.com	+91 9792152629	own_crm	2025-08-29 05:30:00	\N	New	819 Main Street, Lucknow	Villa	17272079.00	Looking for investment property	t	\N	\N	manual	\N	\N	Warm
462	Vivek Sharma	user24@example.com	+91 9946261759	own_crm	2025-01-18 05:30:00	\N	Qualified	467 Main Street, Hyderabad	Penthouse	14701792.00	Interested in buying	t	\N	\N	manual	\N	\N	Warm
463	Rekha Gupta	user25@example.com	+91 9594322759	own_crm	2025-05-28 05:30:00	\N	New	238 Park Avenue, Kolkata	Studio	5047377.00	Requesting callback	t	\N	\N	manual	\N	\N	Warm
464	Meena Kumar	user26@example.com	+91 9569984875	own_crm	2025-03-18 05:30:00	\N	Closed	446 Main Street, Chennai	Studio	12073604.00	Looking for investment property	t	\N	\N	manual	\N	\N	Cold
465	Simran Patel	user27@example.com	+91 9764765266	own_crm	2025-05-07 05:30:00	\N	New	413 Park Avenue, Delhi	Apartment	4725605.00	Requesting callback	t	\N	\N	manual	\N	\N	Warm
466	Amit Kumar	user28@example.com	+91 9330119103	own_crm	2025-02-03 05:30:00	\N	Qualified	898 Park Avenue, Pune	Plot	10319562.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
467	Rakesh Gupta	user29@example.com	+91 9813114674	own_crm	2025-09-11 05:30:00	\N	Qualified	111 Sector, Bangalore	Studio	18359252.00	Requesting callback	t	\N	\N	manual	\N	\N	Cold
468	Priya Gupta	user30@example.com	+91 9786333866	own_crm	2025-08-29 05:30:00	\N	New	290 Park Avenue, Mumbai	Studio	15343933.00	Looking for investment property	t	\N	\N	manual	\N	\N	Warm
469	Anita Patel	user31@example.com	+91 9900599794	own_crm	2025-07-13 05:30:00	\N	Contacted	467 Lane, Lucknow	Plot	4381135.00	Need more info	t	\N	\N	manual	\N	\N	Warm
471	Tina Sharma	user33@example.com	+91 9608032340	own_crm	2025-06-28 05:30:00	\N	New	561 Main Street, Hyderabad	Villa	10707780.00	Interested in buying	t	\N	\N	manual	\N	\N	Hot
472	Vivek Gupta	user34@example.com	+91 9292561042	own_crm	2025-07-03 05:30:00	\N	Contacted	836 Lane, Delhi	Penthouse	9005295.00	Need more info	t	\N	\N	manual	\N	\N	Cold
473	Sneha Singh	user35@example.com	+91 9894038982	own_crm	2025-09-07 05:30:00	\N	Closed	426 Park Avenue, Mumbai	Villa	11187790.00	Need more info	t	\N	\N	manual	\N	\N	Cold
474	Meena Patel	user36@example.com	+91 9810679532	own_crm	2025-10-09 05:30:00	\N	Contacted	26 Lane, Bangalore	Studio	7408365.00	Requesting callback	t	\N	\N	manual	\N	\N	Cold
475	Ritu Gupta	user37@example.com	+91 9913602953	own_crm	2025-05-04 05:30:00	\N	Qualified	199 Lane, Jaipur	Studio	11901235.00	Need more info	t	\N	\N	manual	\N	\N	Cold
476	Kiran Sharma	user38@example.com	+91 9427801228	own_crm	2025-01-26 05:30:00	\N	Qualified	706 Sector, Kolkata	Apartment	6297229.00	Requesting callback	t	\N	\N	manual	\N	\N	Warm
477	Anita Patel	user39@example.com	+91 9307820762	own_crm	2025-05-25 05:30:00	\N	Contacted	951 Lane, Noida	Villa	9479780.00	Need more info	t	\N	\N	manual	\N	\N	Cold
478	Ananya Gupta	user40@example.com	+91 9634740838	own_crm	2025-06-05 05:30:00	\N	Closed	913 Park Avenue, Kolkata	Villa	5778278.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
479	Priya Kumar	user41@example.com	+91 9795927021	own_crm	2025-04-04 05:30:00	\N	Contacted	755 Park Avenue, Delhi	Plot	14909552.00	Requesting callback	t	\N	\N	manual	\N	\N	Warm
480	Rakesh Kumar	user42@example.com	+91 9381268924	own_crm	2025-09-01 05:30:00	\N	Qualified	345 Main Street, Kolkata	Studio	7908738.00	Need more info	t	\N	\N	manual	\N	\N	Hot
482	Deepak Gupta	user44@example.com	+91 9986697666	own_crm	2025-07-11 05:30:00	\N	Qualified	87 Main Street, Hyderabad	Penthouse	15222940.00	Need more info	t	\N	\N	manual	\N	\N	Cold
483	Mitali Singh	user45@example.com	+91 9782527748	own_crm	2025-04-10 05:30:00	\N	Contacted	61 Sector, Mumbai	Penthouse	13258197.00	Need more info	t	\N	\N	manual	\N	\N	Hot
485	Ananya Kumar	user47@example.com	+91 9126429903	own_crm	2025-02-24 05:30:00	\N	New	159 Lane, Jaipur	Studio	17483215.00	Looking for investment property	t	\N	\N	manual	\N	\N	Cold
486	Amit Patel	user48@example.com	+91 9639749536	own_crm	2025-03-10 05:30:00	\N	New	610 Park Avenue, Kolkata	Apartment	17633349.00	Interested in buying	t	\N	\N	manual	\N	\N	Warm
487	Sanjay Patel	user49@example.com	+91 9247092761	own_crm	2025-05-12 05:30:00	\N	Contacted	736 Sector, Kolkata	Studio	8244928.00	Need more info	t	\N	\N	manual	\N	\N	Warm
488	Tanvi Sharma	user50@example.com	+91 9445046749	own_crm	2025-07-02 05:30:00	\N	Closed	108 Main Street, Chennai	Penthouse	6360281.00	Interested in buying	t	\N	\N	manual	\N	\N	Hot
481	Pooja Sharma	user43@example.com	+91 9365343373	own_crm	2025-10-04 05:30:00	2025-11-18 13:56:49.53894	contacted	684 Park Avenue, Jaipur	Studio	14106164.00	Looking for investment property	t	\N	\N	manual	\N	\N	Hot
470	Sunil Sharma	user32@example.com	9658462136	own_crm	2025-11-02 05:30:00	2025-11-13 13:08:00.215885	Contacted	681 Park Avenue, Noida	Villa	14563091.00	Interested in buying	t	\N	67	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Cold
437	Chirag Gohil	gohil.chirag511@gmail.com	7773788790	own_crm	2025-11-11 10:24:47.212803	2025-11-18 13:58:18.494897	proposal sent	Ahmedabad, Gujarat, 380001, India	Villa	8765443.00	Okay	t	\N	66	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Cold
3174	Amrit Lal Bhargava  (Owner)	amritlalbhargava@gmail.com	7228860051	housing	2026-06-10 13:30:00.899429	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
3191	Shivam thakur Thakur colour contractor	thakurshivam8082@gmail.com	9770391543	housing	2026-06-10 17:30:01.161475	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
2908	Om Prakash Tomar	0mprakash912tomar@gmail.com	7879369912	housing	2026-06-05 15:10:01.748098	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3636	Ajit Mishra	ajitmishra487@gmail.com	7275425766	housing	2026-06-13 15:00:02.717666	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
3637	THAKOR  VISHAL	vishalthakor7534@gmail.com	9724544297	housing	2026-06-13 15:00:02.773511	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
3647	Ranchod Makvana	ranchodmakvana8@gmail.com	9313610062	housing	2026-06-15 10:40:00.801322	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3648	B D Rathaur	bhagwandas50@gmail.com	9714097121	housing	2026-06-15 10:40:00.831349	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3155	Jagdish Parjapti	jagdishparjapti8@gmail.com	9824822455	housing	2026-06-10 12:30:01.180776	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
3156	OM SAI RAM (Owner)	virendragupta129@gmail.com	9725323334	housing	2026-06-10 12:30:01.214427	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
3157	Akash	adhjkgdg7@gmail.com	7405406041	housing	2026-06-10 12:30:01.220808	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3158	H M	boss.devendra1805@gmail.com	7984815033	housing	2026-06-10 12:30:01.228779	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3640	Ankur Saxena	ankursaxena8319@gmail.com	7830550033	housing	2026-06-14 12:30:07.223566	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4000000 - 5000000	t	\N	\N	manual	\N	\N	\N
3641	Bablu Raj	babluraj553192@gmail.com	7549553192	housing	2026-06-14 12:30:07.332475	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3642	Pooja Kharat (Broker)	poojakharat1234567@gmail.com	8369606693	housing	2026-06-14 12:30:07.35827	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3643	Janki Rathod	janki.rathod1007@gmail.com	8980686417	housing	2026-06-14 12:30:07.381468	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
2876	Chandni Kadbe	chandni.kadbe2000@gmail.com	8238320286	website	2026-06-05 13:18:00	\N	new	\N	\N	\N	Channel Partner	t	\N	\N	manual	shyam:contact:811	\N	\N
3199	???? Payment 36,824.79 USDC ????>> graph.org/BALANCE-3682444-USD-04-21-3?hs=42a2233ec02e182fb8fbea6b993d4bd7& ????	cuoy0ir2laas23@web-library.net	195589251677	website	2026-06-11 04:24:55	\N	new	\N	\N	\N	dw592i: 59fpc6	t	\N	\N	manual	shyam:contact:817	\N	\N
3200	WhatsApp Lead	\N	7016549558	website	2026-06-10 12:15:12	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:118	\N	\N
3201	WhatsApp Lead	\N	13455161516	website	2026-06-10 15:16:36	\N	new	\N	\N	\N	Looking for commercial shops	t	\N	\N	manual	shyam:whatsapp:119	\N	\N
3141	WhatsApp Lead	\N	61470270986	website	2026-06-08 01:26:57	\N	new	\N	\N	\N	Hi may I have browser and price please.	t	\N	\N	manual	shyam:whatsapp:114	\N	\N
3161	Youssef Abdullah	yabdullah.agency@gmail.com	83548798928	website	2026-06-09 10:42:26	\N	new	Izegem	\N	\N	Seasons Greetings, \r\n \r\nWe are a Dubai-based business consulting and sourcing company with an extensive network of buyers, importers, distributors, and investors across the UAE and the Middle East. \r\n \r\nBased on the growing demand from our clients, we are seeking to establish business relationships with reputable manufacturers, traders, and distributors interested in expanding their products into the UAE market. \r\n \r\nThrough our network, we can introduce qualified buyers and business opportunities in sectors such as agriculture, manufacturing, construction, mining, oil and gas, consumer goods, and other industries. We conduct our business professionally and in full compliance with UAE laws and regulations. \r\n \r\nIf your company is interested in exploring cooperation opportunities, please send us your company profile, product e-catalog, and pricing information. We would be pleased to review your offerings and discuss potential business opportunities. \r\n \r\nContact me on this email address: yabdullah-agency@finvlimited.com \r\n \r\nKind regards, \r\nMr. Youssef Abdullah \r\nDubai Business Consultants	t	\N	\N	manual	shyam:modal:205	\N	\N
3162	WhatsApp Lead	\N	9537379127	website	2026-06-09 23:54:20	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:116	\N	\N
434	Govind Appa	developer9.intelliworkz@gmail.com	9276543210	meta	2025-10-30 11:41:40.197413	2025-11-18 13:56:43.895119	contacted	Ahmedabad, Gujarat, 380001, India	\N	87654.66	OK done!	t	\N	66	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
484	Simran Gupta	user46@example.com	+91 9383733685	own_crm	2025-10-11 05:30:00	2025-11-18 13:56:46.665847	contacted	122 Main Street, Hyderabad	Apartment	7391987.00	Requesting callback	t	\N	\N	manual	\N	\N	Hot
423	Rohit Kapoor	rohit290@example.com	+91 9845182140	own_crm	2025-09-17 17:09:55.997924	2025-11-18 13:57:30.932624	contacted	140 Kolkata	Duplex	6148217.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
412	Priya Singh	priya279@example.com	+91 9997170128	own_crm	2025-09-17 17:09:55.97021	2025-11-18 14:06:10.258501	contacted	66 Pune	Duplex	10970675.00	Interested in duplex house	t	\N	\N	manual	\N	\N	\N
402	Rohit Kapoor	rohit269@example.com	+91 9367544579	own_crm	2025-09-17 17:09:55.945056	2025-11-18 14:06:38.355635	contacted	103 Kolkata	Penthouse	9507552.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
399	Priya Singh	priya266@example.com	+91 9175015198	own_crm	2025-09-17 17:09:55.939027	2025-11-18 14:06:47.718677	proposal sent	137 Lucknow	Duplex	11808185.00	Interested in 3BHK flat	t	\N	\N	manual	\N	\N	\N
396	Priya Singh	priya263@example.com	+91 9747757488	own_crm	2025-09-17 17:09:55.933457	2025-11-18 14:06:55.921314	proposal sent	181 Delhi	Duplex	7091765.00	Looking for 2BHK furnished	t	\N	\N	manual	\N	\N	\N
385	Aryan Pandey	aryan252@example.com	+91 9689396409	own_crm	2025-09-17 17:09:55.912067	2025-11-18 14:08:37.693144	proposal sent	130 Kolkata	Apartment	8982970.00	Looking for 3BHK near metro	t	\N	\N	manual	\N	\N	\N
489	Chirag Gohil	chirag@gmail.com	8729372910	meta	2025-12-04 16:07:20.578533	2025-12-04 16:22:52.945034	new	The Heritage Serviced Residence Mines	\N	123456532.00	Hello	t	\N	66	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	Hot
490	Naresh Bherwani	nkbherwani@gmail.com	8860981302	website	2025-12-31 16:25:01.726	\N	new	\N	\N	\N	Site Visit: I am going to visit Dholera on Dt 7th December Please send me the details of your site location and the contact person at the site	t	\N	\N	manual	\N	\N	\N
491	Sanjeev Yadav	sanjeev175634@gmail.com	9219839005	website	2025-12-31 16:25:01.76	\N	new	Delhi	\N	\N	I'm looking for residential or commercial property at Dholera	t	\N	\N	manual	\N	\N	\N
492	Md aftab alam	mdaftabalamkhan2024@gmail.com	7352355900	website	2025-12-31 16:25:01.763	\N	new	Kolkata	\N	\N	I have intrest to invast	t	\N	\N	manual	\N	\N	\N
493	Vikas	vikas.r12@gmail.com	6262272719	website	2025-12-31 16:25:01.765	\N	new	Ahmedabad	\N	\N	invest	t	\N	\N	manual	\N	\N	\N
494	Pravin	pravin.sharma@gmail.com	9213005115	website	2025-12-31 16:25:01.767	\N	new	Kolkata	\N	\N	I want to invest in Dholera SIR for plots	t	\N	\N	manual	\N	\N	\N
495	Taslim	dm4.intelliworkz@gmail.com	1234567891	website	2025-12-31 16:25:01.775	2025-12-31 16:48:23.659465	new	Ahmedabad	\N	\N	test mail.	t	\N	\N	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Hot
496	Deepti Kaushik	kaushikdeepti1312@gmail.com	9824166647	99acres	2026-01-01 16:20:03.685669	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	\N	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
497	praveen modi	modipraveen381@gmail.com	9982701170	housing	2026-01-01 16:46:00.71263	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
498	Srushti Chauhan	\N	9723959119	housing	2026-01-01 16:46:00.766739	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
499	Bipin Prajapati	\N	7575084750	housing	2026-01-01 16:46:00.773099	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
500	Anjali Prajapati	\N	8140961038	housing	2026-01-01 16:46:00.778502	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
501	ZALA YASHVANTSINH (Broker)	zalayashvantsinh92@gmail.com	7359946827	housing	2026-01-01 16:46:00.782866	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
502	soninikunj	\N	9925197957	housing	2026-01-01 16:46:00.785621	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
503	Rajesh solanki	\N	9265831487	housing	2026-01-01 16:46:00.788537	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
504	kirit Gautambhai Vasita	kk.vasita2411@gmail.com	7698009827	housing	2026-01-01 16:46:00.793323	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
505	manish	prajapatikunal1137@gmail.com	9574458694	housing	2026-01-01 16:46:00.796934	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
506	Jitesh	joshi.jitesh143@gmail.com	7405270844	housing	2026-01-01 16:46:00.803971	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
507	Nitin Moradiya	n2412p@gmail.com	9913645009	housing	2026-01-01 16:46:00.807538	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
508	Ravi Gajjar	ravigajjar92@gmail.com	9328675068	housing	2026-01-01 16:46:00.810214	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
509	Khoda Ghelabhai (Broker)	khodaghelabhai@gmail.com	9727854294	housing	2026-01-01 16:46:00.815797	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
510	Rohit Patel	rohitpatelpi66@gmail.com	9913571254	housing	2026-01-01 16:46:00.821198	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
511	Anil Ray	\N	8000712282	housing	2026-01-01 16:46:00.834732	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
512	Rajdeep Tilavat	rajdeeptilavath25195@gmail.com	7016907315	housing	2026-01-01 16:46:00.849504	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
513	Karan Saragra	karansaragra259@gmail.com	7043033096	housing	2026-01-01 16:46:00.863334	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
514	Padhiyar Mitali (Owner)	mitalipadhiyar354@gmail.com	6351543562	housing	2026-01-01 16:46:00.869118	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
515	Jay	\N	7801871797	99acres	2026-01-01 16:47:04.275447	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
516	Mr Bhatt	mrbhatt046@gmail.com	8758965963	99acres	2026-01-01 16:47:04.281655	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
517	Anil Parmar	anilprinceanilprince4@gmail.com	7621913960	99acres	2026-01-01 16:47:04.302278	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
518	Shailesh	\N	9677120360	99acres	2026-01-01 16:47:04.305458	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1388	mukesh	m.ghasadia@gmail.com	9824633431	website	2015-02-18 21:57:51	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:41	\N	\N
519	Sahil Shaikh	shaikhsahil1505@gmail.com	8140430167	99acres	2026-01-01 16:47:04.308423	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
520	Amitsinh	dineshsinhdunesdarbar@gmail.com	6359361070	99acres	2026-01-01 16:47:04.318894	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
521	AU ProVC ProVC	\N	8200724345	99acres	2026-01-01 16:47:04.322095	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
522	Pranav Gadhvi	pranavgadhvi1989@gmail.com	9974239789	99acres	2026-01-01 16:47:04.32886	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
523	Arvind	arvindthumar@gmail.com	9925304216	99acres	2026-01-01 16:47:04.331837	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
524	Kartik Gosai	\N	9664820176	housing	2026-01-01 17:33:03.464601	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
525	Heer Modi	7600653906@99acres.com	7600653906	99acres	2026-01-01 17:55:03.02681	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
526	Satish Prajapati	satishbhai621@gmail.com	9016997326	housing	2026-01-01 18:24:00.46441	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
527	Arun Dwivedi	\N	9904725296	99acres	2026-01-01 19:16:01.61795	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
528	Kanojiya amankumar rajendra	amankanojiya81205@gmail.com	9265464537	housing	2026-01-01 19:29:00.749429	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
529	Diganta Borah	\N	9560743284	99acres	2026-01-02 04:09:01.243398	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
530	Ashish	ashish.gupta.work@gmail.com	9833767848	99acres	2026-01-02 05:33:01.426979	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
781	Nandan Pandit	\N	\N	housing	2026-01-16 14:40:00.597967	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
531	Kp Rajput	kprajput334@gmail.com	9664726077	housing	2026-01-02 11:25:00.684773	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
532	ankit navik	ankitnavik@gmail.com	9033552273	housing	2026-01-02 13:17:00.550945	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
533	chandra prakash	cp735245@gmail.com	7976362282	housing	2026-01-02 13:33:00.752506	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
534	Gudiya Ranni	\N	7859818864	housing	2026-01-02 14:32:01.092065	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
535	Ck Madhav Rajput	\N	7466965868	housing	2026-01-02 17:24:00.627901	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
536	Kishan Detrojiya	kishandetrojiya85@gmail.com	9664637187	housing	2026-01-03 09:22:00.74773	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
537	Rajput Arunesh (Owner)	raruneshkr@gmail.com	9405130050	housing	2026-01-03 09:22:00.779189	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
538	Asha Pillai	gnrasha@786gmail.com	9327373693	housing	2026-01-03 09:22:00.781779	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
539	Dilpesh B panchal (Owner)	panchaldilpesh70@gmail.com	9998986170	housing	2026-01-03 09:22:00.784933	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
540	Satyam Sharma	\N	9279255830	housing	2026-01-03 09:22:00.786965	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
541	yuvraj	vegadanitin202@gmail.com	9723417681	housing	2026-01-03 09:22:00.79096	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
542	Kuldeep pathak	priyadevi366666@gmail.com	7050273777	housing	2026-01-03 09:22:00.793275	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
543	mayur rana	mayurrana152007@gmail.com	9157054419	housing	2026-01-03 09:22:00.796579	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
544	Uditanshu	twitterhelp48@gmail.com	9054861428	housing	2026-01-03 10:11:00.906919	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
545	Anupkumar Kaithwas	kaithwasanup5@gmai.coml	7048547168	housing	2026-01-03 10:58:00.895702	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
546	Shashikant Jha	\N	7838263364	housing	2026-01-03 11:10:00.812385	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
547	Krishna	kshwhshradha@gmail.com	8511560724	housing	2026-01-03 11:19:00.675804	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
548	pratik	ranwpratik@gmail.com	8153058669	housing	2026-01-03 13:20:00.484602	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
549	Ramesh mavani	mavaniramesh9@gmail.com	9328493183	housing	2026-01-03 14:25:04.972559	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
550	Suraj	\N	+61-452331595	99acres	2026-01-03 17:11:01.463934	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
551	Nirmal Darji (Broker)	darjinirmal013@gmail.com	9913146010	housing	2026-01-05 09:33:00.670747	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
552	Rakesh Shah	rakeshshah9520@gmail.com	7878545585	housing	2026-01-05 09:33:00.689553	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
553	krishna kumar	krishnakr20060825@gmail.com	9229871612	housing	2026-01-05 09:33:00.694064	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
554	Nilesh Dixit (Broker)	nileshdixit922@gmail.com	8320384735	housing	2026-01-05 09:33:00.696694	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1779	WhatsApp Lead	\N	8238270948	website	2026-03-27 15:07:14	\N	new	\N	\N	\N	hello testing	t	\N	\N	manual	shyam:whatsapp:20	\N	\N
555	Pinky	harshvardan02080s.dungarpur@kvsrojaipuronline.in	9352799419	housing	2026-01-05 09:33:00.699173	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
556	Davda Infrastructure Pvt. Ltd.	build@dipl.asia	8141260600	housing	2026-01-05 09:33:00.704488	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK, Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
557	Ashwin Shamal	ashwinshamal439@gmail.com	8488033483	housing	2026-01-05 09:33:00.708807	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
558	menka sharma	moni_8017@yahoo.com	9664520309	housing	2026-01-05 09:33:00.712067	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
559	kalpesh	tripurakirana866@gmail.com	7073154513	housing	2026-01-05 09:33:00.715377	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
560	Sonu Prajapati	sonusp9114@gmail.com	9793453509	housing	2026-01-05 09:33:00.717524	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
561	Mohini Joshi	vj57765@gmail.com	8401399931	housing	2026-01-05 09:33:00.719791	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
562	Mayur	mayur.bambharolia@gmail.com	8200623663	housing	2026-01-05 09:33:00.721841	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
563	Ritesh patil	ritesh203.patil@gmail.com	9537978029	housing	2026-01-05 09:33:00.724017	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
564	Ghanshyambhai Koli	ghanshyamgohil9999@gmail.com	9998929346	99acres	2026-01-05 09:33:02.39972	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
565	Niharika	niharika.chhatbar@gmail.com	9926330206	99acres	2026-01-05 09:33:02.403575	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
566	Nitesh Halpati	niteshhalpati205@gmail.com	8128082355	99acres	2026-01-05 09:33:02.406872	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
567	Kamla	kamla_sathwara2001@yahoo.com	9879041432	99acres	2026-01-05 09:33:02.411393	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
568	Jashvan Bariya	jasavantabaria8@gmail.com	9274956510	99acres	2026-01-05 09:33:02.414489	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
569	USER	prince_crystal1@yahoo.com	9924431649	99acres	2026-01-05 09:33:02.417477	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
570	Narendra T	\N	7588412206	99acres	2026-01-05 09:33:02.422228	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
571	Sitinder Jamkar	hellboy5900@gmail.com	7096789999	99acres	2026-01-05 09:33:02.427378	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
572	FinESTATE GROUP	\N	9054481145	99acres	2026-01-05 09:33:02.429859	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
573	Binaca Patel	binacapatel24@gmail.com	7990939693	housing	2026-01-05 10:31:01.428901	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
574	Kushwah Rahul	kushwahrahul96763@gmail.com	9265003891	housing	2026-01-05 10:32:00.331265	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
575	sonubhai	sonubipl2015@gmail.com	9316748181	housing	2026-01-05 11:46:00.806592	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
576	imtiyaz ajmerwala	imtiyaz.ajmerwala@gmail.com	9913533274	housing	2026-01-05 12:40:00.548359	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
577	Saheb mishra (Owner)	sahebmishra1999@gmail.com	9724161950	housing	2026-01-05 13:52:00.836003	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
578	Urvashi	rituthadani@gmail.com	8849735261	99acres	2026-01-05 14:21:02.518043	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this property. Please call back.	t	\N	\N	manual	\N	\N	Medium
579	Niketa Sisodiya	niketasisodiya31@gmail.com	8160890147	99acres	2026-01-05 15:15:02.286597	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
580	Patel	rkpatel82999@gmail.com	9664695093	housing	2026-01-05 15:49:00.41631	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
581	Jakir Khan	\N	9875674654	housing	2026-01-05 16:26:00.360945	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
582	Saumya Patel	saumya101218@gmail.com	9825445326	99acres	2026-01-05 17:15:04.708185	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
583	Arpan patel	arpan3301@gmail.com	9099205998	housing	2026-01-06 09:22:00.884031	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
584	Anupavan	anushaanusha8797@gmail.com	7892818401	housing	2026-01-06 09:22:00.915066	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
585	Sonal Mishra	\N	8780044197	housing	2026-01-06 09:22:00.922415	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
586	Bimal	bimalghiya@gmail.com	8320388684	99acres	2026-01-06 09:22:01.898231	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp, call after 3 pm	t	\N	\N	manual	\N	\N	Medium
587	Vinay	\N	9981061457	99acres	2026-01-06 09:22:01.909553	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
588	Pkrishnaveni	kittullb10@gmail.com	9500035861	99acres	2026-01-06 09:22:01.912538	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
589	Rahul Ganguly	\N	7584862849	99acres	2026-01-06 09:22:01.915606	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
590	Mrudul	mrudul7@yahoo.com	9113963562	housing	2026-01-06 10:21:00.299126	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
591	Jo Riggs	joriggsvideo@gmail.com	\N	website	2026-01-08 11:45:01.601	\N	new	Ahmedabad	\N	\N	Hi,\n\nI just visited shyamgroups.co.in and wondered if you'd ever thought about having an engaging video to explain what you do?\n\nOur prices start from just $195 USD.\n\nLet me know if you're interested in seeing samples of our previous work.\n\nRegards,\nJo	t	\N	\N	manual	\N	\N	\N
592	priyanka	gudiyavijay0594@gmail.com	8087776946	housing	2026-01-08 11:50:01.086609	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
593	sambhu	dewasisambhu@gmail.com	9875212798	housing	2026-01-08 11:50:01.10397	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
594	Tomar Hitesh	tomarhitesh8595@gmail.com	8128208315	housing	2026-01-08 11:50:01.112516	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
595	Raval krushang	ravalkrushang123@gmail.com	8160380392	housing	2026-01-08 11:50:01.118157	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
596	Nazir Hussain	nazirhussainkvd@gmail.com	9909411979	housing	2026-01-08 11:50:01.123962	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
597	Vishal mahant (Owner)	mahantvishal356@gmail.com	9173537510	housing	2026-01-08 11:50:01.129011	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
598	Sanjay	rutvikparmar724@gmail.com	9512121563	housing	2026-01-08 11:50:01.137958	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
599	Aakash patil	patilaakash84075@gmail.com	7096647161	housing	2026-01-08 11:50:01.144003	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
600	Mitesh Joshi	mitesh.joshi1503@gmail.com	8356055592	housing	2026-01-08 11:50:01.152908	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
601	Tushar kakaiya (Owner)	tkakaiya@gmail.com	9561234024	housing	2026-01-08 11:50:01.158571	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
602	rajnikant  (Owner)	rajnita143@gmail.com	9998336812	housing	2026-01-08 11:50:01.165998	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
603	jadav vishal	vishaljadav4372@gmail.com	7574851381	housing	2026-01-08 11:50:01.172885	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
604	Suraj rajbhar	\N	7080233360	housing	2026-01-08 11:50:01.178469	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
605	Gaurang	gaurang.1109@gmail.com	7984583621	housing	2026-01-08 11:50:01.188631	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
606	yuvraj hirvaniya	\N	9327968163	housing	2026-01-08 11:50:01.194214	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
607	पुजारीपु	pujarijasval@gmail.com	9687939916	housing	2026-01-08 11:50:01.204242	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
608	dave mukesh	mukeshdave503@gmail.com	9724064771	housing	2026-01-08 11:50:01.212991	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
609	Rajakishore Ojha	rajakishor.ojha@gmail.com	8200980489	housing	2026-01-08 11:50:01.219838	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
610	Mahesh Sharma (Owner)	mahesarma@yahoo.co.in	9978440443	housing	2026-01-08 11:50:01.22554	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
611	aryan (Broker)	aryangohil3115@gmail.com	9727592353	housing	2026-01-08 11:50:01.233944	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
612	Pardeep Kalasava	\N	9023768361	housing	2026-01-08 11:50:01.240428	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
613	Lodd ramgopal	loddramgopal@yahoo.co.in	9840016332	99acres	2026-01-08 11:50:04.631043	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
614	Rajendra Modi	cashadwatmodi@gmail.com	9099021604	99acres	2026-01-08 11:50:04.634335	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
615	kamaldan	kk@gmaol.com	9904622537	99acres	2026-01-08 11:50:04.63711	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
616	Deepak Rawal	rawaldeepak224@gmail.com	8140309065	99acres	2026-01-08 11:50:04.640073	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
617	User	threadsutraint9@gmail.com	9537510331	99acres	2026-01-08 11:50:04.642971	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
618	Mukesh	raju.singh@gmail.com	9712948463	99acres	2026-01-08 11:50:04.647224	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
619	Bantisingh Hamraj	buntysingh2521@gmail.com	9773122115	99acres	2026-01-08 11:50:04.651691	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
620	jagrutirathod	jagrutirathod9664@gmail.com	8733904675	99acres	2026-01-08 11:50:04.655056	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
621	Kalpesh Khuman	kalpesh.khuman@yahoo.com	9924616124	99acres	2026-01-08 11:50:04.659658	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
622	Jayanti Lalwani	jayantilalwani84@gmail.com	7984600023	99acres	2026-01-08 11:50:04.664707	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
623	Nilesh Patel	nilesh.amdavadproperty@gmail.com	9925007767	99acres	2026-01-08 11:50:04.670217	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1710	Ravi Singh	baghelravisingh561@gmail.com	8780501037	website	2023-09-14 15:02:30	\N	new	\N	\N	\N	For buying plot	t	\N	\N	manual	shyam:contact:526	\N	\N
624	Samir	samirrshah17@gmail.com	8160695238	99acres	2026-01-08 11:50:04.675275	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
625	Shantilal Patel	\N	8200406668	99acres	2026-01-08 11:50:04.680229	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
626	Bhagesh Thakor	\N	8320239668	housing	2026-01-08 12:30:00.582367	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
627	Tomar Vinay	vinaytomar500@gmail.com	8980441997	housing	2026-01-10 12:50:01.902674	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
628	Tushar Raval (Broker)	tushar_raval2000@yahoo.com	9662312724	housing	2026-01-10 12:50:01.957131	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
629	Xyz XYZ	prakash190984@gmail.com	8511375151	housing	2026-01-10 12:50:01.964636	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
630	Nagsen Taksande	\N	7874137623	housing	2026-01-10 12:50:01.971289	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
631	Baisane Bhushan	baisanerohit63@gmail.com	6352100598	housing	2026-01-10 12:50:01.977977	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
632	Deepu Patil	deepubhai968@gmail.com	8733069908	housing	2026-01-10 12:50:01.98766	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
633	Ramu Kumar	\N	6387003565	housing	2026-01-10 12:50:01.992694	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
634	Rajput Narendra	nrrajput240982@gmail.com	9998240982	housing	2026-01-10 12:50:01.997249	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
635	Nikunj Brahmabhatt	\N	7999318065	housing	2026-01-10 12:50:02.001078	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
636	Minita Patel	minitapatel24@gmail.com	9824006931	housing	2026-01-10 12:50:02.008129	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
637	Sayra Shindhi	\N	9499622256	housing	2026-01-10 12:50:02.010995	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
638	Bharti Bharti	\N	9601419892	housing	2026-01-10 12:50:02.013987	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
639	Sukhaveer Tomar	\N	7005512878	housing	2026-01-10 12:50:02.016926	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
640	uttam singh	uttamsingh962m@gmail.com	9131495647	housing	2026-01-10 12:50:02.023708	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
641	bhumika khatik	bhumikakhatik295@gmail.com	7990676517	housing	2026-01-10 12:50:02.028833	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
642	DIksha Shende	dikshaashende2@gmail.com	9016117355	housing	2026-01-10 12:50:02.032602	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
643	NILESH ZALA	nileshzala2307@gmail.com	8733822073	housing	2026-01-10 12:50:02.036925	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
644	Vidyut Desai	pallavhosp@gmail.com	9824021049	99acres	2026-01-10 12:50:03.635555	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
645	Mayur Satani	mayur.shaifali@yahoo.com	9925196040	99acres	2026-01-10 12:50:03.644211	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
646	Ramesh Patel Koli	patelramesh00r@gmail.com	9909077206	99acres	2026-01-10 12:50:03.651774	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
647	Vandana	ravalvandana25@yahoo.com	9712126700	99acres	2026-01-10 12:50:03.662428	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
648	Shailesh Vaniya	shailpiya1314@gmail.com	8155864143	99acres	2026-01-10 12:50:03.668569	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
649	Ronak	rpparikh@ymail.com	9408419293	99acres	2026-01-10 12:50:03.675049	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
650	Dilip Vyas	vyas2922@gmail.com	9825531295	99acres	2026-01-10 12:50:03.680188	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
651	Arvind Ohdar	\N	9265346862	99acres	2026-01-10 12:50:03.686503	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 3BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
652	Anand Sharma	abhinandan230514@gmail.com	9417293789	99acres	2026-01-10 12:50:03.693542	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
653	Kaushal Rana	kaushal.rana1984@yahoo.in	9824266724	99acres	2026-01-10 12:50:03.711068	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 3BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
654	Niyati	\N	9404216627	99acres	2026-01-10 12:50:03.718206	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
655	Shekhar Bhatt	\N	9824115547	99acres	2026-01-10 12:50:03.726049	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
656	Ashish Gaur	ashishgaur.mca@gmail.com	9727393325	99acres	2026-01-10 12:50:03.731747	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
657	gohilshvar	gohilavyan12@gmail.com	8238382754	housing	2026-01-10 14:10:01.109657	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
658	bhavesh Vaja	\N	9909100090	housing	2026-01-10 14:30:00.68475	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
659	rajan  (Owner)	rajandixit731832@gmail.com	8303793939	housing	2026-01-10 14:50:00.519417	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
660	Anand Suva	\N	9426300222	housing	2026-01-10 16:40:00.404705	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
661	Parvin Jamre	jaimbreparamila@gmail.com	9023684741	99acres	2026-01-10 16:40:03.351823	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
662	Pankaj Mistry	pankajmistry912@gmail.com	7778891717	housing	2026-01-10 16:50:00.464361	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
663	Viditye Rathor naam hi kafih	\N	8949791603	housing	2026-01-12 09:10:02.087945	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
664	Pathan Ayankhan	ayan.pathan3182@gmail.com	7600927670	housing	2026-01-12 09:10:02.182462	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
665	chirag devrukhkar	\N	7041803332	housing	2026-01-12 09:10:02.188711	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
666	kishorlalvyas	\N	9104807063	housing	2026-01-12 09:10:02.194191	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
667	AJAY	ajayamar6683@gmail.com	9428330010	housing	2026-01-12 09:10:02.20085	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
668	Manojbhai Joshi	manojjoshi94087@gmail.com	9408701764	housing	2026-01-12 09:10:02.20914	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
669	Mukesh Prajapati	mukeshp3957@gmail.com	9924541780	housing	2026-01-12 09:10:02.213396	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
670	Abhishek Chourasiya	ar.abhishek98@gmail.com	8401940734	housing	2026-01-12 09:10:02.218462	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
671	Ramsingh Pal	\N	9484614031	housing	2026-01-12 09:10:02.221551	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
672	Ketanbhai Harsora	krishharsora@gmail.com	9106227594	housing	2026-01-12 09:10:02.226957	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
673	Nihar Purohit	niharpurohit96@gmail.com	6354778257	housing	2026-01-12 09:10:02.233085	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
674	jatin kuchara (Owner)	jatinkuchara08@gmail.com	8320790679	housing	2026-01-12 09:10:02.238041	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
675	Mohanani Tamanna	mohananitamanna@gmail.com	9265118167	housing	2026-01-12 09:10:02.242157	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
676	Ashvin Jayswal	ashvinjayswal@gmail.com	9265570279	housing	2026-01-12 09:10:02.247967	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
677	Bhaumik Kharva	bhaumikkharva226@gmail.com	7878303871	housing	2026-01-12 09:10:02.253643	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
678	naimeesh  (Owner)	naimishparmar4@gmail.com	9016823728	housing	2026-01-12 09:10:02.257605	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
679	Krunal Pandya  (Owner)	k.pandya31@yahoo.com	8849198670	housing	2026-01-12 09:10:02.263633	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
680	Housing User (Owner)	\N	7015294511	housing	2026-01-12 09:10:02.268493	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
681	Nisha Alika	nishaalikamsw@gma.com	7600208305	housing	2026-01-12 09:10:02.273914	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
682	ANAND MAHERIYA	mr.maheriya5040@gmail.com	8799255040	housing	2026-01-12 09:10:02.278952	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
683	rakesh Joshi (Owner)	wwwhardikhardik713@gmail.com	8160053470	housing	2026-01-12 09:10:02.284396	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
684	Sadik Shaik	shaiksadikali42@gmail.com	9726171932	99acres	2026-01-12 09:10:03.246889	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
685	Hardik Patel	hardik.patel@bcfoods.com	9328417519	99acres	2026-01-12 09:10:03.257456	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
686	Neeraj Sharma	neeraj6676@yahoo.co.in	9910694950	99acres	2026-01-12 09:10:03.263235	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 0BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
687	Jayesh	jayeshniti@yahoo.co.in	7976088807	99acres	2026-01-12 09:10:03.270936	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
688	Shrimali Mayur	shrmit16@gmail.com	9033518370	99acres	2026-01-12 09:10:03.276962	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
689	Radhe Developer IT Services	\N	9737275719	99acres	2026-01-12 09:10:03.287181	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
690	Vipul Taraben Narsinhbhai	drvipul.parmar786@gmail.com	9033039345	99acres	2026-01-12 09:10:03.293118	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
691	Tarun Yadav	tarunyadav1352006@gmail.com	9817267084	99acres	2026-01-12 09:10:03.297426	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
692	Deshna	\N	7999847796	99acres	2026-01-12 09:10:03.302714	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this property. Please call back.	t	\N	\N	manual	\N	\N	Medium
693	Payal	payalchaklasia2@gmail.com	9737505699	99acres	2026-01-12 09:10:03.307762	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
694	Arti Sindhe	arti1987sindhe@gmail.com	8866018885	housing	2026-01-12 10:10:01.228992	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
695	Ravi Sing	sardarravisingh0@gmail.com	8849538641	housing	2026-01-12 10:40:00.597901	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
696	chavda bharatbhai	chavdabharatbhai1@gmail.com	7600272721	housing	2026-01-12 11:10:00.956444	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
697	MELAJI THAKOR	melajithakor4556@gmail.com	9974026399	housing	2026-01-12 12:20:01.056634	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
698	indrajeetsinh parmar	indrasinhparmar1212@gmail.com	6355472221	housing	2026-01-12 12:30:01.202234	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
699	Yogendra kaur maan Maan	maanpinky78@gmail.com	8141126189	housing	2026-01-12 12:50:01.423338	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
700	Sanjay Patel	kolisanjaykolio8@gmail.com	9510261751	housing	2026-01-12 15:10:01.856428	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
701	Rashmi Brahmbhatt	\N	7227088459	housing	2026-01-13 09:10:01.322416	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
702	Priya Barot	\N	9327516103	housing	2026-01-13 09:10:01.402497	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
703	Poojeben Prajapati	poojaozza109@gmail.com	8320622773	housing	2026-01-13 09:10:01.408767	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
704	GAJENDRA MORYA	gajendramoryag@gmail.com	7024165856	housing	2026-01-13 09:10:01.412281	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
705	dilip vataliya	\N	9408644154	housing	2026-01-13 09:10:01.437781	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
706	Ashoo Talwar	talwar.ashoo@gmail.com	9818061396	99acres	2026-01-13 09:10:04.265261	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
707	Anjali Mehta	mehtaanju021ez@gmail.com	9879511263	99acres	2026-01-13 09:10:04.268062	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
708	Rajesh G Sharma	rajeshgsharm12@gmail.com	7600011222	99acres	2026-01-13 09:10:04.272497	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
709	Manish Mishra	medica.ventures@gmail.com	9898982333	99acres	2026-01-13 09:10:04.2748	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
710	Mahesh Dave	shivamdave68@gmail.com	7984955329	99acres	2026-01-13 09:10:04.287331	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this property. Please call back.	t	\N	\N	manual	\N	\N	Medium
711	Divya Yadav	ydivya239@gmail.com	8780966318	housing	2026-01-13 12:30:00.922565	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
712	Rekha Solanki	\N	9428106110	housing	2026-01-13 12:50:00.577751	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
713	Tarachand Saha	sahatarachand271@gamil.com	9427627940	housing	2026-01-13 15:00:00.63011	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 6800000 - 20100000	t	\N	\N	manual	\N	\N	\N
714	Mukesh Rajput	mukeshsuwalka@gmail.com	9173489258	housing	2026-01-16 09:20:03.607002	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
715	EHS Mr Vishal Sharma	vishalshar8756@gmail.com	7319737721	housing	2026-01-16 09:20:03.718151	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
716	Pradeep sahu	pradeep1979sahu@gmail.com	9425077097	housing	2026-01-16 09:20:03.730185	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
717	rahul Rathore	malanpur11234@gmail.com	6266883505	housing	2026-01-16 09:20:03.743191	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
718	Ravi Singh	\N	9558204650	housing	2026-01-16 09:20:03.755071	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
719	Gaurav (Owner)	gauravitarsi73@gmail.com	8319872963	housing	2026-01-16 09:20:03.763218	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
720	kajal	dharjiyakajal753@gmail.com	9067008866	housing	2026-01-16 09:20:03.771199	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
721	Uttam vyas	uttamvyas81@gmail.com	8156002722	housing	2026-01-16 09:20:03.779953	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
722	Sahil Jod	sahiljod054@gmail.com	9625520994	housing	2026-01-16 09:20:03.791708	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
723	Anand Pal	\N	7084236622	housing	2026-01-16 09:20:03.798312	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
724	Dhanesh Rathod	dhaneshrathod26@gmail.com	9321550255	housing	2026-01-16 09:20:03.80444	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
725	Prakash Vaghela	prakashvaghela24@gmail.com	8980036216	housing	2026-01-16 09:20:03.809973	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
726	Nandan Pandit	\N	\N	housing	2026-01-16 09:20:03.826354	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
727	Jigna Vaghela	\N	7984220740	housing	2026-01-16 09:20:03.834012	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
728	Parthraj Mehta	parthrajmehta9898@jemaile.com	9898988689	housing	2026-01-16 09:20:03.843971	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
729	sandeep kumar	sandeeprajapatislpl2@gmail.com	9981599152	housing	2026-01-16 09:20:03.851806	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
730	Devdatt Kumar	\N	8858702695	housing	2026-01-16 09:20:03.859271	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
731	narendrasinh vaghela (Owner)	vaghelanarendrasinh30783@gmail.com	9067706875	housing	2026-01-16 09:20:03.865845	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
732	udjdu hzusnw	minitjoshi29@gmail.com	7490073728	housing	2026-01-16 09:20:03.879796	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
733	Devjaat	d99797438@gmail.com	7041880624	housing	2026-01-16 09:20:03.888396	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
734	C C	\N	8955656846	housing	2026-01-16 09:20:03.896498	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
735	Dixit Parth	dixitparth201@gmail.com	8460467818	99acres	2026-01-16 09:20:04.263299	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
736	USER	\N	9265880754	99acres	2026-01-16 09:20:04.271353	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
737	Amargit Kumar Raja	kteju864@gmail.com	7009811793	99acres	2026-01-16 09:20:04.281469	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
738	Varun	varun.mait.eee@gmail.com	9979991223	99acres	2026-01-16 09:20:04.291553	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
739	Dhruvi Saroj	\N	9725270576	99acres	2026-01-16 09:20:04.301778	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
740	Mk Giri	giri.mk@yahoo.com	6303477528	99acres	2026-01-16 09:20:04.308859	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
741	Sanjay Mahara	sanjaymahara@gmail.com	9717375439	99acres	2026-01-16 09:20:04.314378	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
742	Navneet Kadam	\N	9558819873	99acres	2026-01-16 09:20:04.31876	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
743	manoj sharma	sagarsharma.ags@gmail.com	9711345646	99acres	2026-01-16 09:20:04.329914	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 4BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
744	Uday vir	\N	9910565529	99acres	2026-01-16 09:20:04.333875	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
745	Gaurav	gauravmehra0591@gmail.com	9145965511	99acres	2026-01-16 09:20:04.340063	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
746	Swayam Dupare	\N	7249532782	99acres	2026-01-16 09:20:04.344241	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
747	Ddj	vujadav2018@gmail.com	9428219696	99acres	2026-01-16 09:20:04.352795	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
748	Tanvendra Rathod	tanvendra9001925959@gmail.com	7014169823	99acres	2026-01-16 09:20:04.360507	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
749	Jigar Bhavsar	jeegar.chem@gmail.com	8010303388	99acres	2026-01-16 09:20:04.369398	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
750	Parshant Mahto	\N	7861908434	99acres	2026-01-16 09:20:04.375776	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
751	hitesh	hthakre44@gmail.com	6265941397	housing	2026-01-16 09:30:00.718624	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
752	Nandan Pandit	\N	\N	housing	2026-01-16 09:30:00.922324	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
753	Nandan Pandit	\N	\N	housing	2026-01-16 09:40:00.676122	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
754	Nandan Pandit	\N	\N	housing	2026-01-16 09:50:00.713913	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
755	Nandan Pandit	\N	\N	housing	2026-01-16 10:00:01.291038	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
756	Nandan Pandit	\N	\N	housing	2026-01-16 10:10:01.063574	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
757	Nandan Pandit	\N	\N	housing	2026-01-16 10:20:01.865006	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
758	Nandan Pandit	\N	\N	housing	2026-01-16 10:30:01.367547	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
759	Nandan Pandit	\N	\N	housing	2026-01-16 10:40:00.698745	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
760	Nandan Pandit	\N	\N	housing	2026-01-16 10:50:01.063342	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
761	Nandan Pandit	\N	\N	housing	2026-01-16 11:00:00.675401	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
762	Nandan Pandit	\N	\N	housing	2026-01-16 11:10:01.415818	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
763	Nandan Pandit	\N	\N	housing	2026-01-16 11:20:01.140641	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
764	Nandan Pandit	\N	\N	housing	2026-01-16 11:30:00.863074	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
765	Nandan Pandit	\N	\N	housing	2026-01-16 11:40:02.103697	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
766	Nandan Pandit	\N	\N	housing	2026-01-16 11:50:00.548069	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
767	Nandan Pandit	\N	\N	housing	2026-01-16 12:00:01.727898	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
768	Nandan Pandit	\N	\N	housing	2026-01-16 12:10:01.485271	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
769	Nandan Pandit	\N	\N	housing	2026-01-16 12:20:01.154859	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
770	Nandan Pandit	\N	\N	housing	2026-01-16 12:30:00.658312	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
771	Nandan Pandit	\N	\N	housing	2026-01-16 12:40:00.37226	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
772	Nandan Pandit	\N	\N	housing	2026-01-16 12:50:00.430967	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
773	Sharma Pooja	poojas82280@gmail.com	7048625235	housing	2026-01-16 13:00:00.909317	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
774	Nandan Pandit	\N	\N	housing	2026-01-16 13:00:00.985003	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
775	Nandan Pandit	\N	\N	housing	2026-01-16 13:10:00.552571	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
776	Tapan Ghosh	\N	8926758451	housing	2026-01-16 13:20:00.904714	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
777	Nandan Pandit	\N	\N	housing	2026-01-16 13:20:00.953344	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
778	Nandan Pandit	\N	\N	housing	2026-01-16 14:10:02.57226	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
779	Nandan Pandit	\N	\N	housing	2026-01-16 14:20:00.917188	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
780	Nandan Pandit	\N	\N	housing	2026-01-16 14:30:00.68505	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
782	Nandan Pandit	\N	\N	housing	2026-01-16 14:50:00.703091	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
783	Nandan Pandit	\N	\N	housing	2026-01-16 15:00:00.740063	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
784	Nandan Pandit	\N	\N	housing	2026-01-16 15:10:00.721328	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
785	Nandan Pandit	\N	\N	housing	2026-01-16 15:20:00.744419	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
786	Nandan Pandit	\N	\N	housing	2026-01-16 15:30:01.131396	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
787	Nandan Pandit	\N	\N	housing	2026-01-16 15:40:01.800662	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
788	Nandan Pandit	\N	\N	housing	2026-01-16 15:50:00.555728	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
789	Nandan Pandit	\N	\N	housing	2026-01-16 16:00:00.832398	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
790	Nandan Pandit	\N	\N	housing	2026-01-16 16:10:01.506252	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
791	Nandan Pandit	\N	\N	housing	2026-01-16 16:20:01.072958	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
792	Nandan Pandit	\N	\N	housing	2026-01-16 16:30:00.713711	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
793	Nandan Pandit	\N	\N	housing	2026-01-16 16:40:00.769159	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
794	Nandan Pandit	\N	\N	housing	2026-01-16 16:50:01.418246	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
795	Nandan Pandit	\N	\N	housing	2026-01-16 17:00:00.50448	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
796	Nandan Pandit	\N	\N	housing	2026-01-16 17:10:00.876471	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
797	Nandan Pandit	\N	\N	housing	2026-01-16 17:20:00.817918	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
798	Nandan Pandit	\N	\N	housing	2026-01-16 17:30:00.720613	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
799	Nandan Pandit	\N	\N	housing	2026-01-16 17:40:01.882692	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
800	Nandan Pandit	\N	\N	housing	2026-01-16 17:50:00.923228	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
801	shweta	shelikaithwas888@gmail.com	7805804070	housing	2026-01-17 02:00:07.223589	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
802	Yadav Anil	anilyadav3006999@gmail.com	7000328981	housing	2026-01-17 02:00:07.441553	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
803	Kapil Raghav	kr345487@gmail.com	8059344284	housing	2026-01-17 02:00:07.449652	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
804	Rashmi shree	rshmrnk829@gmail.com	9558762102	housing	2026-01-17 02:00:07.459264	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
805	anand prakash	anandprakashjkn@gmail.com	7844885560	housing	2026-01-17 02:00:07.470203	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
806	Prabhulal Sarwar	\N	9998194774	housing	2026-01-17 02:00:07.483978	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
807	Nandan Pandit	\N	\N	housing	2026-01-17 02:00:07.541737	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
808	Saalim	inquries@gmail.com	9023560939	website	2026-02-07 10:55:01.342	\N	new	Ahmedabad	\N	\N	Message	t	\N	\N	manual	\N	\N	\N
809	Saalim	ciyefa1810@noihse.com	9023560938	website	2026-02-07 10:55:01.362	\N	new	Ahmedabad	\N	\N	test	t	\N	\N	manual	\N	\N	\N
810	Vinod Kumar	vinod.design@gmail.com	9930860871	website	2026-02-07 10:55:01.373	\N	new	Mumbai	\N	\N	Please share the project plot layout and rate for purchase.	t	\N	\N	manual	\N	\N	\N
811	neha	webdesigner.intelliworkz@gmail.com	8875559265	website	2026-02-07 10:55:01.39	\N	new	\N	\N	\N	test: test	t	\N	\N	manual	\N	\N	\N
812	Bipin makwana	raj357131@gmail.com	8780351479	housing	2026-02-07 11:00:00.525357	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
813	anil Patel	anilkumarb67@gmail.com	9426451131	housing	2026-02-07 11:00:00.539782	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
814	Anwar Arab	anwararab1972@gmail.com	9898555107	housing	2026-02-07 11:00:00.543691	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
815	Dark Night	knitish6952@gmail.com	9934423749	housing	2026-02-07 11:00:00.547828	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
816	samat bharwad	samat99049@gmail.com	9904919325	housing	2026-02-07 11:00:00.552769	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
817	Mukesh Chunrar	\N	9510141661	housing	2026-02-07 11:00:00.55618	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
818	Suryakant Raut	ssraut1301@gmail.com	9270171329	housing	2026-02-07 11:00:00.560549	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
819	Bhaskar Rami	rami.bhaskar1@gmail.com	9426768974	housing	2026-02-07 11:00:00.56358	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
820	mahendrasinh jadeja	mahendra.igi@gmail.com	9979088640	housing	2026-02-07 11:00:00.567483	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
821	Laksh Patani	patanilaksh7@gmail.com	8799550293	housing	2026-02-07 11:00:00.573637	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 1 BHK, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
822	Praveen Goyal	\N	9328506163	housing	2026-02-07 11:00:00.57651	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
823	Mayur Maru	mayurmaru25@gmail.com	9016741404	housing	2026-02-07 11:00:00.579809	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
824	Dhiren Bhatia	dhiren.bhatia1950@gmail.com	7021631782	housing	2026-02-07 11:00:00.584044	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
825	Kinjal Solanki	kinjalsolanki02002@gmail.com	9327562508	housing	2026-02-07 11:00:00.588275	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
826	Ramesh Vankar	\N	6352599889	housing	2026-02-07 11:00:00.590729	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
827	Hardik Mistry  (Owner)	hardik.dcm@gmail.com	8320433719	housing	2026-02-07 11:00:00.594462	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
828	Md Prajapati	mdprajapati898@gmail.com	7600515352	housing	2026-02-07 11:00:00.598427	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
829	Om	ddk10931@gaml.com	9773494542	housing	2026-02-07 11:00:00.602403	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
830	raj Kushwaha	rajkushwaha06122000@gmail.com	9724975293	housing	2026-02-07 11:00:00.605007	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
831	Hitesh Prasad	hiteshprasad77.hm@gmail.com	7990345311	housing	2026-02-07 11:00:00.608017	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
832	Mrityunjay Sharma	mjgenius21041992@gmail.com	7976732008	99acres	2026-02-07 11:00:02.906301	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
833	Pankaj Parmar	pankajparmar982@gmail.com	9537257671	99acres	2026-02-07 11:00:02.90924	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
834	Milind Dixit	mil_f@ymail.com	9904738694	99acres	2026-02-07 11:00:02.912836	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
835	Mohan Malaviya	mohanmalaviya12@gmail.com	9825749133	99acres	2026-02-07 11:00:02.916724	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
836	PRIYA Suresh	priyasureshmama@gmail.com	8754306504	99acres	2026-02-07 11:00:02.920871	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
837	Not Mentioned	kumarkhadak98@gmail.com	7737105833	99acres	2026-02-07 11:00:02.925373	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
838	Hiren Joshi	not mentioned	8758493357	99acres	2026-02-07 11:00:02.929392	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
839	Sonam Rajput	\N	9924076591	99acres	2026-02-07 11:00:02.932531	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
840	Ayan Kumar Ghosh	ghoshayankumar94@gmail.com	8282927001	99acres	2026-02-07 11:00:02.93675	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
841	Sushim chaudhary	sushim07@yahoo.com	8347372681	99acres	2026-02-07 12:10:04.30965	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
842	Abhishek Hirat	\N	8160949046	housing	2026-02-07 12:30:00.485753	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
843	harsh	test234@gmail.com	8460606842	housing	2026-02-07 14:30:02.431111	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
844	Zapadiya Nilam	\N	9033941012	housing	2026-02-07 14:30:02.937759	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
845	USER	jay.jp680@gmail.com	9909976116	99acres	2026-02-07 16:40:04.205876	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
846	Ajay Chavda	yahooucom2155@gmail.com	6356775613	housing	2026-02-07 17:30:00.696616	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
847	Maulik Mehta	maulikmehta10@gmail.com	9825223464	housing	2026-02-09 09:50:01.559317	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
848	Ishraram Choudhary	ishrarampchoudharydhanta1288@gmail.com	9950104734	housing	2026-02-09 09:50:01.599407	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
849	Ravi Dave	daver2570@gmail.com	9023849532	housing	2026-02-09 09:50:01.604447	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
850	Aaditya Raj	rajaaditya2212@gmail.com	6206517697	housing	2026-02-09 09:50:01.60754	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
851	Trp Sidhu	\N	8320750257	housing	2026-02-09 09:50:01.615395	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
852	Vikash Dubey	dubey.vikash1984@gmail.com	8156052336	housing	2026-02-09 09:50:01.619944	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
853	Bhavna Bhavna	bhavnakabarybhavna854@gmail.com	9662214270	housing	2026-02-09 09:50:01.622696	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
854	Adhik yadav Raj	\N	6202085039	housing	2026-02-09 09:50:01.64621	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
855	MAHENDRA NATH	nathm2080@gmail.com	7742069323	housing	2026-02-09 09:50:01.649432	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
856	Shubham Parmar	singhmirdula150@gmail.com	9263566828	housing	2026-02-09 09:50:01.652244	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
857	Devam Patel	\N	7041832327	housing	2026-02-09 09:50:01.657186	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
858	Isha Kuila	ishakuila0607@gmail.com	9426451275	housing	2026-02-09 09:50:01.661584	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
859	Sushil Rathod	sushilrathod3006@gmail.com	8200882549	housing	2026-02-09 09:50:01.664442	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
860	Amit Sonker	amitapr12345@gmail.com	9919030779	99acres	2026-02-09 09:50:03.704645	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
861	Vipul Mehta	mehta_vipul@hotmail.com	9925190900	99acres	2026-02-09 09:50:03.706564	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
862	Hitesh Patel	japatelkanipur@gmail.com	9879012079	99acres	2026-02-09 09:50:03.708345	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
863	Ramdevsinh Vala	valaramdevsinh712@gmail.com	8866579244	99acres	2026-02-09 09:50:03.711751	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
864	HappyAppy	arpanakhamar55@gmail.com	7434957323	99acres	2026-02-09 09:50:03.714081	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
865	Vasti	\N	9029202021	99acres	2026-02-09 09:50:03.718548	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
866	Virsingh	7984132021@99acres.oeo.com	7984132021	99acres	2026-02-09 09:50:03.721387	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
867	Naitik Joshi	naitikjoshiofficial02@gmail.com	9925709155	99acres	2026-02-09 09:50:03.724331	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
868	Uma Digajarla	umadigajarla2713@gmail.com	7386868353	99acres	2026-02-09 09:50:03.726594	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
869	Bharat Parekh	bharatbarekh515@gmail.com	8758685253	99acres	2026-02-09 09:50:03.728583	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
870	Raja	ammuece1996@gmail.com	9080710652	99acres	2026-02-09 09:50:03.73069	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
871	Lunaram	\N	8955989220	99acres	2026-02-09 09:50:03.732145	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
872	Not Mentioned	aaran74@gmail.com	7490021323	99acres	2026-02-09 09:50:03.73731	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
873	Akash	\N	7777999049	99acres	2026-02-09 09:50:03.739111	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
874	Sanjeev Kumar Sunger	sanjeevsunger@yahoo.com	9426419214	99acres	2026-02-09 09:50:03.740949	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
875	DAKSHA SHAH	\N	9824409026	99acres	2026-02-09 09:50:03.742278	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
876	Yogesh Gotecha	yogeshgotecha1964@gmail.com	7023104004	99acres	2026-02-09 09:50:03.744267	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
877	Nikhil	imnikhil1st@rediffmail.com	9766700262	99acres	2026-02-09 09:50:03.746102	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
878	Bhautik Sukhadiya	bhautiksukhadiya7@gmail.com	7779042952	housing	2026-02-09 11:00:00.816659	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
879	Love Chouhan	lovechouhan308@gmail.com	8517004989	housing	2026-02-09 14:20:00.834628	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
880	Harsh Rana	rh389317@gmail.com	6355405252	housing	2026-02-09 17:10:00.915757	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
881	Rakeshbhai	sheladiyarakesh4404@yahoo.com	7878515113	housing	2026-02-09 18:20:01.049294	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
882	hitesh patel	hitp75753@gmail.com	9879989545	99acres	2026-02-10 09:30:04.370694	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
883	Preeti	preetiad1511@gmail.com	9173420433	99acres	2026-02-10 09:30:04.415474	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
884	Kallol Pramanik	\N	9725322960	99acres	2026-02-10 09:30:04.429573	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
885	Makwana Prahlad	\N	9737941239	99acres	2026-02-10 09:30:04.432762	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
886	Saurabh kotwal	\N	9274331277	99acres	2026-02-10 09:30:04.435804	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
887	Harsh Sharma	hs725490@gmail.com	9558136326	housing	2026-02-10 09:40:01.836288	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
888	brijesh shiyolkar	brijeshshiyolkar@gmail.com	7567342311	housing	2026-02-10 09:40:01.875708	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
889	Dixita Ninama	dixitaninama1996@gmail.com	7567029170	housing	2026-02-10 09:40:01.88378	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
890	Piyush Bhavsar	piyushbhavsar579@gmail.com	9879555222	housing	2026-02-10 09:40:01.887347	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
891	Ankit Singh	ankitsinghrajput2904@gmail.com	7850849001	housing	2026-02-10 09:40:01.890307	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
892	Kavita Patel	\N	7984137385	99acres	2026-02-10 10:10:02.753998	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
893	Jitendra Pal	\N	9104609928	housing	2026-02-10 12:10:00.412662	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
894	Tushar Chandak	tusharchandak1120@gmail.com	7221970375	housing	2026-02-10 15:30:00.94506	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
895	Monika Rathod	monikarathod1978@gmail.com	7778024253	99acres	2026-02-10 17:30:02.676204	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
896	Ashokbhai Nanjibhai Parmar	ashokparmar006@gmail.com	9374079780	housing	2026-02-11 09:20:00.91168	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
897	Shivam Kumar	shivamking731011@gmail.com	9651202998	housing	2026-02-11 09:20:00.946558	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
898	MAKWANA KALPESH	kalpeshmakwana5231@gmail.com	8849384093	housing	2026-02-11 09:20:00.958243	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
899	Solanki Abhiraj	solankiabhiraj131@gmail.com	9429612921	housing	2026-02-11 09:20:00.972996	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
900	Shashi Rathod (Owner)	shashiratho026@gmail.come	9726766347	housing	2026-02-11 09:20:00.980203	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
901	Manthan	manthanchaudhary2010@gmail.com	9723652010	99acres	2026-02-11 09:20:03.038532	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
902	Jay	jayrajguru1501@gmail.com	7600067258	99acres	2026-02-11 09:20:03.043944	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
903	DrVipul Bharatiya	vipulkumarbharatiya@gmail.com	9429718125	99acres	2026-02-11 09:20:03.053179	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
904	Arindam Koner	arindam_koner@yahoo.co.in	6287399926	99acres	2026-02-11 09:20:03.056555	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property. Please call back.	t	\N	\N	manual	\N	\N	Medium
905	G Anil	greta.anil@ril.com	9998001005	99acres	2026-02-11 09:20:03.059987	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
906	Sid	\N	8368372223	99acres	2026-02-11 09:20:03.062829	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
907	Ric	\N	6305222083	99acres	2026-02-11 09:20:03.065125	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
908	Kartavi Agravat	\N	7990494058	99acres	2026-02-11 09:20:03.070509	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
909	Mihir Patel	mihir8023@gmail.com	8128388127	housing	2026-02-11 09:50:00.51385	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
910	Aasha khasiya	aashakhasiya@gmail.com	9687226778	housing	2026-02-11 10:40:00.837672	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
911	Viral	viralthakor2453@gmail.com	9054902453	housing	2026-02-11 12:30:00.519786	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
912	Housing User	prabalprataprajawat321@gmail.com	7227847381	housing	2026-02-11 12:40:01.112021	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
913	Rahul	\N	9798155088	99acres	2026-02-11 13:00:05.477894	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
914	Kartik patel	kartikp235@gmail.com	8154860998	housing	2026-02-11 14:00:00.59974	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
915	Rahul Rajput Rahul Rajput	\N	9510615842	housing	2026-02-11 15:50:00.542248	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
916	Aasiya Kagzi	dindrolprimaryschool1@gmail.com	7874041515	housing	2026-02-11 17:10:00.546185	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
917	Yogesh Mistry	yrmistry@yahoo.com	9925848416	99acres	2026-02-11 17:10:07.355475	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
918	Jay	jai9549685349@gmail.com	8141476662	housing	2026-02-12 09:30:01.337872	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
919	ASHOK MAKWANA	aj.makwana21@gmail.com	9726121921	housing	2026-02-12 09:30:01.377135	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
920	Sanjay Bamaniya	sk6447378679@gmail.com	9302574183	housing	2026-02-12 09:30:01.385073	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
921	irfan shaikh	panjabiirfan4@gmail.com	7567245113	housing	2026-02-12 09:30:01.390687	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
922	Samee Kadri	kadrisamee121@gmail.com	6354953654	housing	2026-02-12 09:30:01.396027	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
923	rakesh (Owner)	hahjsjjdjd@gmail.com	7874757173	housing	2026-02-12 09:30:01.40182	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
924	Honest Marketing	kalim9788@gmail.com	9824712531	housing	2026-02-12 09:30:01.406879	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
925	Reema Patel	reemapatel916@gmail.com	9106100425	99acres	2026-02-12 09:30:06.13679	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
926	Abhi Chauhan	abhiod1998@gmail.com	8000005333	99acres	2026-02-12 09:30:06.142528	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
927	Yogi Ish	yogsestate@gmail.com	9327072787	99acres	2026-02-12 09:30:06.147988	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
928	Dipti sheth	dipti.sheth_104@yahoo.com	9275002945	99acres	2026-02-12 09:30:06.154474	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
929	Neharika Vaidya	neharika.rakesh.sharma@gmail.com	9909336679	99acres	2026-02-12 09:30:06.160006	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
930	Sanjay Hingorani	sanjay.hingorani@siemens.com	8758969725	99acres	2026-02-12 09:30:06.18331	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 3BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
931	Darshan Vala	darshanvala194@gmail.com	9712851572	99acres	2026-02-12 09:30:06.187726	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
932	Sachin Pawar	amdk9999@gmail.com	9270231111	website	2026-02-27 09:55:01.783	\N	new	Ahmednagar	\N	\N	Want a buy plot	t	\N	\N	manual	\N	\N	\N
933	krinal patel	krinalpatel1413@gmail.com	9104750524	website	2026-02-27 09:55:01.842	\N	new	\N	\N	\N	For a job in sales executive: I am confident that my skills and experience will add value to your organization.	t	\N	\N	manual	\N	\N	\N
934	Rakhee Parihar	rakheeparihar853@gmail.com	9699659460	website	2026-02-27 09:55:01.872	\N	new	\N	\N	\N	need to property information: NEED RATED	t	\N	\N	manual	\N	\N	\N
935	chandan	chandanbag1234568@gmail.com	9722229229	housing	2026-02-27 10:00:00.899338	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
936	R G	rajugaikwad198300@gmail.com	8160362839	housing	2026-02-27 10:00:00.92722	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
937	Dk Gupta	dkgupta.4m@gmail.com	9729428686	housing	2026-02-27 10:00:00.937095	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
938	swetaba dabhi	dabhisweta649@gmail.com	9510730379	housing	2026-02-27 10:00:00.948685	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
939	shiddhishukla	shiddhishukla7777@gmail.com	6352899193	housing	2026-02-27 10:00:00.958812	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
940	Usman nadaf	nadafusman798@gmail.com	9284835159	housing	2026-02-27 10:00:00.966184	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
941	harpreet Singh	harpreetsinghsingh312@gmail.com	8872682804	housing	2026-02-27 10:00:00.973924	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
942	Gourav Soni	mahadevsoni120@gmail.com	8769372552	housing	2026-02-27 10:00:00.981854	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
943	Jayraj VlOGS Vlogging	\N	9023165628	housing	2026-02-27 10:00:00.987898	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
944	Dn P	parmardn4@gmail.com	8200717103	housing	2026-02-27 10:00:00.997794	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
945	Ankit Vishindasani	ankitvishindasani031@gmail.com	9284799825	housing	2026-02-27 10:00:01.004506	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
946	Tt T	tanvithakkar745@gmail.com	9104030440	housing	2026-02-27 10:00:01.011082	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
947	Mohammad Soyab Chaudhary	mohammadsoyabchaudhary@gmail.com	9558908110	housing	2026-02-27 10:00:01.020414	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
948	kishan Seth	kishansoni1901@gmail.com	9250597416	housing	2026-02-27 10:00:01.028336	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
949	chandan.tiwari.01******	chandan.tiwari.01011994@gmail.com	8878358341	housing	2026-02-27 10:00:01.034188	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
950	M S	sanishaikh134@gmail.com	7572822913	housing	2026-02-27 10:00:01.040099	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
951	Aliza Khatri	alizakhatri0111@gmail.com	9969183894	housing	2026-02-27 10:00:01.047768	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
952	yashvant	rathodmn2019@gmail.com	8347428785	housing	2026-02-27 10:00:01.05594	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
953	Aakash Kukdeja	kukdeja3600@gmail.com	7698733731	housing	2026-02-27 10:00:01.064044	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
954	RITEAH KUMAR	riteshjee998@gmail.com	6200819700	housing	2026-02-27 10:00:01.071083	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
955	Manoj Kumar	mksinghgnews@gmail.com	9773603540	housing	2026-02-27 10:00:01.076943	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
956	Ghanshyam THAKOR	ghanshyamthakor862@gmail.com	7096089430	housing	2026-02-27 10:00:01.083937	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
957	Jay kishan Havaliya	jaykishanhavaliya668@gmail.com	9879531653	housing	2026-02-27 10:00:01.090631	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
958	Aryan Kamboj	aryankamboj0320@gmail.com	8307415425	housing	2026-02-27 10:00:01.098932	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
959	Girish Patel	girishpatel2080@gmail.com	9925189956	housing	2026-02-27 10:00:01.107549	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
960	deepak singva	deepaksingva@gmail.com	8839246671	housing	2026-02-27 10:00:01.116142	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
961	Trivedi	\N	8487816004	99acres	2026-02-27 10:00:04.434292	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
962	Khushboo Kumari	khushbookmr74@gmail.com	7574811740	99acres	2026-02-27 10:00:04.443014	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
963	Rawat	dskr300@gmail.com	7069576434	99acres	2026-02-27 10:00:04.450477	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp, Callback in evening time preferably	t	\N	\N	manual	\N	\N	Medium
964	Sandhya	rajeev.tiwari@sterlite.com	9200000156	99acres	2026-02-27 10:00:04.457613	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
965	Rahul	bullet.rider0511@gmail.com	7667213563	99acres	2026-02-27 10:00:04.465914	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
966	Pravin Savaliya	\N	7573979531	99acres	2026-02-27 10:00:04.471302	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
967	Jas	xyzddadd@gmail.com	9321883393	99acres	2026-02-27 10:00:04.482621	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
968	Hetal	heli.ashu@gmail.com	9998959146	99acres	2026-02-27 10:00:04.489593	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
969	Anjali Singh Rajput	sanjali9818@gmail.com	9818571066	99acres	2026-02-27 10:00:04.501012	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
970	Satish	meenusharma_2009@rediffmail.com	7042767422	99acres	2026-02-27 10:00:04.510243	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
971	Dushyant	dppatel593@gmail.com	8160602027	99acres	2026-02-27 10:00:04.520864	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
972	Jp Padaya	jppadaya.art@gmail.com	9428970593	99acres	2026-02-27 10:00:04.53211	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 3BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
973	prashant	er_prashant81@rediffmail.com	9818643603	99acres	2026-02-27 10:00:04.543567	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
974	Siddhi Kishorbhai Kagathara	siddhikagathara5@gmail.com	9558656063	99acres	2026-02-27 10:00:04.554735	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
975	Ketan	kcv333@gmail.com	7096352847	housing	2026-02-27 10:30:00.485833	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
976	anil kumar Soni	anilsoni7984@gmail.com	9016255973	housing	2026-02-27 11:20:00.454545	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
977	Sunil Chohan	sunilchohan221@gmail.com	7828213099	housing	2026-02-27 12:10:01.3275	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
978	harsh purabiya	harshpurabiya959@gmail.com	6355181518	housing	2026-02-27 14:10:01.617784	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
979	Shriesh Badganchi	shriesh1402.badganchi@gmail.com	7066470066	housing	2026-02-27 15:10:00.619795	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
980	amjdkhan432	amjdkhan432@gmail.com	9979865940	housing	2026-02-27 16:00:00.71748	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
981	Vishal Solanki	vishalsolanki8766@gmail.com	7201083457	housing	2026-02-27 16:00:00.768606	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
982	Nandhini	sanathkumar16904@gmail.com	9841825410	housing	2026-02-27 16:40:00.543564	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
983	Zala	digvijaysinhzala1984@gmail.com	9978908627	housing	2026-03-02 09:20:01.134173	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1389	NIRAV PATHAK	nir205@gmail.com	8826922450	website	2015-02-19 17:45:39	\N	new	\N	\N	\N	What is the rate per SqYrd Residential Plot  in Shyam Group?	t	\N	\N	manual	shyam:contact:43	\N	\N
984	Sumant Kumar	sumantkumar6305163@gmail.com	6305163204	housing	2026-03-02 09:20:01.187034	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
985	Harshad	pharshad10@gmail.com	9925210320	housing	2026-03-02 09:20:01.197071	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
986	Brij	brijp883@gmail.com	8780492078	housing	2026-03-02 09:20:01.204509	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK, Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
987	patilprakash	patilprakash1010@gmail.com	9978811575	housing	2026-03-02 09:20:01.210778	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
988	Vinod Machhoya	vmachhoya@gmail.com	8849399022	housing	2026-03-02 09:20:01.219688	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
989	Ronak (Owner)	thakarronak68@gmail.com	8000356049	housing	2026-03-02 09:20:01.22932	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
990	Ashish Sharma	as206921@gmail.com	9026250476	housing	2026-03-02 09:20:01.238744	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
991	Anil Karkera	anildas7941@gmail.com	8895455928	housing	2026-03-02 09:20:01.245695	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
992	Dabhi Payal	dabhipayal598@gmail.com	9898029087	housing	2026-03-02 09:20:01.25503	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
993	Janak Patel	janaknewsphoto@gmail.com	9824487362	housing	2026-03-02 09:20:01.271583	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
994	Surendra Bohara	bohrasurendra48@gmail.com	8128696657	housing	2026-03-02 09:20:01.281641	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
995	sa	sameermetar@rediffmail.com	9979972670	housing	2026-03-02 09:20:01.293387	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
996	mohd Salim	taslimasalim445@gmail.com	9541568553	housing	2026-03-02 09:20:01.301781	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
997	Desai Desai	dineshdesai2591987@gmail.com	8511220588	housing	2026-03-02 09:20:01.315092	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK, 3 BHK, Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
998	Umang Maruti	umangmaruti806@gmail.com	9104734971	housing	2026-03-02 09:20:01.321729	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
999	Diwakar Ankush	diwakarankush65@gmail.com	8511522851	housing	2026-03-02 09:20:01.329664	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1000	anjali	anjali.kumari18930@gmail.com	7096334553	housing	2026-03-02 09:20:01.337973	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1001	MURUGANANDHAM	nithyamurugan2231@gmail.com	9965846107	housing	2026-03-02 09:20:01.345044	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1002	nilash	nikhilpatel9362@gmail.com	6359126634	housing	2026-03-02 09:20:01.35102	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1003	Sintu Singh	chauhanabhay7654@gmail.com	7041024274	housing	2026-03-02 09:20:01.358937	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1004	Kaival Hiren	kaivalc@gmail.com	9879007171	99acres	2026-03-02 09:20:02.531606	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1005	Hanish Bhesania	nhbhesania@yahoo.com	9512709099	99acres	2026-03-02 09:20:02.53808	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1006	Pradeep S Rock	pradipshukla073@gmail.com	7405217642	99acres	2026-03-02 09:20:02.544932	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1007	Jadeja	\N	9724342363	99acres	2026-03-02 09:20:02.55016	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1008	Varun Dahisaria	varun.dahisaria@gmail.com	7984217585	99acres	2026-03-02 09:20:02.557123	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1009	Bhavna	\N	8799088270	99acres	2026-03-02 09:20:02.562432	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1010	Vijay Singh	\N	7874348854	99acres	2026-03-02 09:20:02.568168	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1011	Jaydeep Vaghela	9099172767@99acres.com	9099172767	99acres	2026-03-02 09:20:02.576028	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
1012	Advait Advait	\N	7405269968	99acres	2026-03-02 09:20:02.582816	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1013	Rajesh Gupta	rkguptax@gmail.com	9824466751	99acres	2026-03-02 09:20:02.590928	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1014	Manish	\N	9840074696	99acres	2026-03-02 09:20:02.597678	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1015	Jayesh Arjanbhai Kamaliya	\N	8460053700	99acres	2026-03-02 09:20:02.609999	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1016	USER	\N	6359959493	99acres	2026-03-02 09:20:02.616732	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1017	hetal	zhetal76@yahoo.in	9825625590	housing	2026-03-02 09:50:00.802653	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK, Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1018	Sanjay Shukla	sanjayshukla12317@gmail.com	9428607615	99acres	2026-03-02 15:00:03.711634	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1019	Rakesh Shah	mnskumar@gmail.com	9099033249	99acres	2026-03-02 15:00:03.758562	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1020	Ganpat Singh	ganpat992549@gmail.com	9925497737	housing	2026-03-02 17:20:01.636583	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1021	jignasolanki	parmarpintu514@gmail.com	6352726723	housing	2026-03-03 09:20:01.264503	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1022	Zala mahipat sinh	zalamahipat039@gmail.com	9904179779	housing	2026-03-03 09:20:01.302003	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1023	Vijesh Purbia	vijesh.purbia@hotmail.com	9660743243	99acres	2026-03-03 09:20:02.981083	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1024	Sanjay Pal	\N	9993654353	99acres	2026-03-03 09:20:03.022003	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
1025	Nikhil Kumar	nikhilkumar60506@gmail.com	7619846062	housing	2026-03-03 10:40:00.356558	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1026	Nihar oza	nihar33666@gmail.com	9974666433	housing	2026-03-03 10:50:00.591474	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1027	B K Biswas	biswas.binaykumar@gmail.com	9748774034	99acres	2026-03-03 13:20:04.50859	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1028	Parmar StoreofficerGOG	gitabharwad1980@gmail.com	9979021022	housing	2026-03-03 14:30:00.554489	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1029	ZENIN Notxy	kcrafting5@gmail.com	9909849743	housing	2026-03-03 15:00:00.329776	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1030	Amaan Malek	malekamaan6@gmail.com	7383385637	housing	2026-03-03 15:50:02.095629	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1031	Meenakshi kataria	meenjeet1980@gmail.com	8607924001	housing	2026-03-03 15:50:02.240283	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1032	Pagi Sartansinh	\N	9773442791	99acres	2026-03-03 16:10:02.44934	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
1033	Housing User	\N	8530198443	housing	2026-03-03 16:40:00.339659	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1034	Dev Joshi	\N	8160934930	99acres	2026-03-03 17:10:04.266262	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1035	Alok Kumar	alokrealme12pro5g@gmail.com	8757077947	housing	2026-03-05 09:10:01.93448	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1036	Junedcool Juned khan	junedcool1988@gmail.com	9904916986	housing	2026-03-05 09:10:02.006019	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1037	Sonal Vihola (Owner)	sonalvihola@gmail.com	8780060133	housing	2026-03-05 09:10:02.014719	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1038	Nanda Patel	nandapatel72@gmail.com	9096094150	housing	2026-03-05 09:10:02.020711	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1039	Dabhi anil	dabhianil9603@gmail.com	9313508596	housing	2026-03-05 09:10:02.028419	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1040	Kanubhai Baraiya	kmbaraiya2000@gmail.com	9725202078	housing	2026-03-05 09:10:02.035812	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1041	sanket kumar	punamkumarimadhopur74@gmail.com	7482921923	housing	2026-03-05 09:10:02.042534	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1042	Anil Khandu Godse	anilgodse5@rediffmail.com	8806189423	housing	2026-03-05 09:10:02.049845	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1043	Mit Thakkar	mitthakkar1985@gmail.com	9825442368	housing	2026-03-05 09:10:02.06409	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1044	NITIN SATWANI	nitinsatwani94@gmail.com	9998339065	housing	2026-03-05 09:10:02.070749	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1045	Shailesh Gandhi	aagnyaasso@yahoo.com	9426724944	housing	2026-03-05 09:10:02.08047	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1046	Misba challgotawala	misbazauwala@gmail.com	9974707745	housing	2026-03-05 09:10:02.088237	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1047	Rakesh Chawla	rakeshchawla556677@gmail.com	8742055295	housing	2026-03-05 09:10:02.097335	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
1048	Atiq_Electricn	\N	7041597250	housing	2026-03-05 09:10:02.107308	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1049	Hridank Jayanand  Nayak	thejaynayak@gmail.com	9702250731	housing	2026-03-05 09:10:02.145221	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
1050	Jigar	jigs_372@rediffmail.com	9924324243	99acres	2026-03-05 09:10:03.841981	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1051	USER	sanjayjune72@gmail.com	8000792283	99acres	2026-03-05 09:10:03.848334	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1052	Jaykishor	jay28542@gail.com	9724506316	99acres	2026-03-05 09:10:03.855562	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1053	Jasmin Patel	pateljasmind@yahoo.com	9327063535	99acres	2026-03-05 09:10:03.861209	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1054	jayendra pujalal vyas	vyasjayendeavyas@gmail.com	9898695252	99acres	2026-03-05 09:10:03.868898	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1055	Shiv Kumar logar	techwell98@gmail.com	9898206900	99acres	2026-03-05 09:10:03.879222	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1056	Yogesh C	\N	6356825189	99acres	2026-03-05 09:10:03.886322	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1057	Rajesh Singh	rajesh.v8n80@gmail.com	8758893082	99acres	2026-03-05 09:10:03.897916	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1058	Kirtish	chotaliyakir12@gmail.com	9722493814	99acres	2026-03-05 09:10:03.90352	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1059	Manish Vataliya	\N	7575087925	99acres	2026-03-05 09:10:03.90756	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1060	Priti	pritiparmar140989@gmail.com	9875236169	99acres	2026-03-05 09:10:03.91257	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1061	Vishal	test12@gmail.com	7574943006	99acres	2026-03-05 09:10:03.920173	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1062	Neha Singh	\N	8780238150	99acres	2026-03-05 09:10:03.923452	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1063	Siddharth Dahiwale	\N	9423108281	99acres	2026-03-05 09:10:03.927522	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1064	Nishant Vyas	\N	8469816132	99acres	2026-03-05 09:10:03.93124	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1065	ramesh agrawal	rameshagrawal1979@gmail.com	9574548901	housing	2026-03-05 13:20:00.489412	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1066	pankaj mishra	pank.mishra1995@gmail.com	9558948079	housing	2026-03-05 14:30:00.659896	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1067	Kajal Parmar	kajalsandy19@gmail.com	9081679769	housing	2026-03-05 14:30:00.734333	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1068	Shantvan Panchal	shantvan@wallcanotiles.co.uk	9574191183	99acres	2026-03-05 14:50:02.486714	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1069	Advik Singh	advik9497@gmail.com	9499582770	housing	2026-03-05 16:00:00.540886	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1070	Pragnesh Chaudhari	chaudharipragnesh895@gmail.com	8238442091	99acres	2026-03-05 16:40:06.191258	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Interested in 441992-Bellevue Vieraaa by Davda Infra+OA	t	\N	\N	manual	\N	\N	Medium
1071	Vishal Thakkar	jalvishalthakkar1234@gmail.com	9978086798	99acres	2026-03-05 16:50:04.230335	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1072	Laxman Dabhi	dabhilaxman855@gmail.com	9327510117	housing	2026-03-06 09:00:00.992595	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1073	Bhavana	bhavanasuthar612@gmail.com	8000733274	housing	2026-03-06 09:00:01.047821	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1074	Avni ben Patel	avnibenpatel14@gmail.com	9723969339	housing	2026-03-06 09:00:01.053488	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1075	Raju Pasvan (Owner)	rp8605071@gmail.com	9574604715	housing	2026-03-06 09:00:01.058892	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1076	Nilesh Panchal	n.panchal2686@gmail.com	9913366027	99acres	2026-03-06 09:00:04.874868	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1077	Rupali Patel	\N	9081166432	99acres	2026-03-06 09:00:04.883764	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1078	Mahavirsinh Solanki	solankimahavirsinh18@gmail.com	9173018540	housing	2026-03-06 11:50:00.771481	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1079	Avinash Raval	ravalavinash121@gmail.com	6356041138	housing	2026-03-06 14:30:00.653599	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1080	Hirenbhai	\N	8160966962	99acres	2026-03-06 15:30:02.574537	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1081	Ajay Thakor	ajaythakor2117@gmail.com	8866482117	housing	2026-03-06 15:50:00.686145	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1082	Priyanshu Varma	priyanshuvarma1007@gmail.com	7016817616	99acres	2026-03-06 16:20:04.626188	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp,	t	\N	\N	manual	\N	\N	Medium
1083	Parth Sheth	parth.sheth644@gmail.com	8347384798	housing	2026-03-07 09:20:01.62513	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1084	seth	aashusoni6342@gmail.com	9039986342	housing	2026-03-07 09:20:01.710405	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1085	Bhavik	prajapatibhavikj7036@gmail.com	9624929297	housing	2026-03-07 09:20:01.71973	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1086	Mahendrakumar Raval	ravalmahendrakumar1958@gmail.com	9879318430	housing	2026-03-07 09:20:01.724763	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1087	Mayur Kumar	editormayur@gmail.com	9426730251	housing	2026-03-07 09:20:01.732895	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1088	Shershingh	shershinghpal90@gmail.com	7396195810	housing	2026-03-07 09:20:01.746701	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1089	USER	sa9819083@gmail.com	9624806140	99acres	2026-03-07 09:20:03.259432	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1090	Tapan	tapangajjar123@gmail.com	7600628365	99acres	2026-03-07 09:20:03.308648	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1091	Samidul Hoque	sh2051183@gmail.com	7638093924	housing	2026-03-07 09:40:01.206805	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1092	Bhaskarbabupanday	b43977907@gmail.com	9016515686	housing	2026-03-07 10:50:01.001811	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1093	chetan kumavat	kwmtchetan@gmail.com	8511837401	housing	2026-03-07 11:00:00.741618	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1094	NAYAN THAKOR	chandanthakor508@gmail.com	9316683097	housing	2026-03-07 12:00:00.899931	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1095	Ajit Rajput	rajputajit9428@gmail.com	9724759167	housing	2026-03-07 12:30:01.132001	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1096	Jignesh Bhatt	bjignesh544@gmail.com	9638610170	housing	2026-03-09 09:20:01.445343	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1097	Raju Ram	rr9255552@gmail.com	6306144272	housing	2026-03-09 09:20:01.514103	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1098	Nikhil Rtw	rathwaankit164@gmail.com	6352238584	housing	2026-03-09 09:20:01.52252	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1099	Darshan Dabhi	dabhidarshan1331@gmail.com	7600921867	housing	2026-03-09 09:20:01.528951	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1100	korishiva	korishiva2026@gmail.com	7980086619	housing	2026-03-09 09:20:01.535791	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1101	tousif raza	razat7910@gmail.com	8868095700	housing	2026-03-09 09:20:01.547075	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1102	Ramsevak Kushwah Ramsevak Kushwah	ramsevakkushvahramsevakkushvah@gmail.com	9714632115	housing	2026-03-09 09:20:01.55771	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1103	Sunil Singh	anilraj8487059952@gmail.com	9512741161	housing	2026-03-09 09:20:01.560487	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1104	kiran palaliya	palaliyak@gmail.com	9898584958	housing	2026-03-09 09:20:01.573172	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1105	solanki pragnesh	solankipragnesh6463@gmail.com	7043418065	housing	2026-03-09 09:20:01.575862	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1106	Mohit Singh	sahil99318@gmail.com	9931720423	housing	2026-03-09 09:20:01.578326	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1107	ajitsinh	baradajit1243@gmail.com	9157349377	housing	2026-03-09 09:20:01.581135	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1108	kahar amarbhai	djbalaji71@gmail.com	9913016007	housing	2026-03-09 09:20:01.585684	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1109	Miki Modi	mikimodi93@gmail.com	8511393900	housing	2026-03-09 09:20:01.589696	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1110	PAWAN rai	pawankrai@2014gmail.com	8238444905	housing	2026-03-09 09:20:01.592363	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1111	Balijichauhan	balijichauhan577@gmail.com	8780216260	housing	2026-03-09 09:20:01.59505	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1112	Rohit Hans	\N	8469766492	99acres	2026-03-09 09:20:03.052191	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1113	Rajeevsingh Tiwari	rajeevstiwari@gmail.com	9099078001	99acres	2026-03-09 09:20:03.058303	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1114	Mitesh	miteshp541@gmail.com	9879380720	99acres	2026-03-09 09:20:03.061411	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1115	Mrunalini Rana	mrunalini_rana@yahoo.co.in	9879792545	99acres	2026-03-09 09:20:03.065479	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1116	USER	\N	9662441886	99acres	2026-03-09 09:20:03.070966	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp, whatsapp first then call	t	\N	\N	manual	\N	\N	Medium
1117	Jalpa Somani	somanijalpa@gmail.com	8469131341	99acres	2026-03-09 09:20:03.075058	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1118	Virendra Shah	shahvirendra17@gmail.com	9375097887	99acres	2026-03-09 09:20:03.078254	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1119	Arun K Parihar	\N	+1-7137051156	99acres	2026-03-09 09:20:03.080514	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this property. Please call back.	t	\N	\N	manual	\N	\N	Medium
1120	Mitul Mehta	\N	9274511427	99acres	2026-03-09 09:20:03.084878	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1121	Shreyansh	\N	8076340350	99acres	2026-03-09 09:20:03.114586	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1122	Giris somani	rajputdaulatsingh@gmail.com	8849829651	99acres	2026-03-09 09:20:03.121744	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1123	Bharat Thakor	\N	7984002719	housing	2026-03-09 09:40:00.362086	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1124	Dharm Chavda	dharmc966@gmail.com	9712010177	housing	2026-03-09 10:50:01.048601	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1125	Mohan Kudiya	mohankudiya955@gmail.com	9426866035	housing	2026-03-09 11:10:00.584772	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1126	ABHISHEK SINGH	singhabhishek77522@gmail.com	7000394721	housing	2026-03-09 11:20:00.651252	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1127	Satyawan Jadhav	satyamahi0369@gmail.com	8000018851	99acres	2026-03-09 14:00:05.723656	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1128	Umesh Rathod	umeshrathod78@gmail.com	9054394111	housing	2026-03-10 09:20:00.656038	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1129	Dilip Rathwa Dilip Rathwa	diliprath******@*******com	96382*****	housing	2026-03-10 09:20:00.743302	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1130	Dhokiya raj	rajdhokiya9@gmail.com	8200092816	housing	2026-03-10 09:20:00.755934	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1131	Gupta Vaibhav	sita585484@gmail.com	9537483528	housing	2026-03-10 09:20:00.769104	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1132	samir Bauri	sb583615@gmail.com	9641188939	housing	2026-03-10 12:30:01.199871	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1133	Mannat Nahar	mannatnahar4857@gmail.com	8847012374	housing	2026-03-10 13:00:01.31081	2026-03-10 14:42:38.102246	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	72	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Hot
1134	Sanjay Chaudhary	sanjay708850@gmail.com	9286494033	housing	2026-03-10 16:00:00.497581	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1135	Shivam Duvey	shivamduvey872@gmail.com	8938851902	housing	2026-03-10 16:00:00.538677	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1136	Dilip Rathwa Dilip Rathwa	diliprathwa662@gmail.com	9638242660	housing	2026-03-10 16:40:01.119192	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1137	Prakash Belwal	prkashbelwal144@gmail.com	7983816517	housing	2026-03-11 09:20:01.738771	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1138	prakash kag	kagprakash81@gmail.com	9898608097	housing	2026-03-11 09:20:01.7901	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1139	Sss	sunshinegrow9@gmail.com	7265837004	housing	2026-03-11 09:20:01.797346	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1140	Karan	dm1.intelliworkz@gmail.com	9512818567	website	2026-03-11 09:20:02.346	\N	new	\N	\N	\N	other: This is Inquiry Testing	t	\N	\N	manual	\N	\N	\N
1141	Ishwar Thakor  (Owner)	icthakor6677@gmail.com	9898241563	housing	2026-03-11 11:20:01.673471	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1142	Anant Deshmukh	anantdeshmukh.akola@gmail.com	9422193212	housing	2026-03-11 11:20:01.723936	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1143	Ramnath Show	ramnathshow453@gmail.com	9832341692	housing	2026-03-11 15:10:00.832038	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1144	Gp Raja	\N	9664972021	housing	2026-03-17 14:20:00.754514	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1145	ગુરુ શિખર વેલવાડા Dungarpura	bharatpuridungarpura@gmail.com	9274880591	housing	2026-03-17 14:20:00.80754	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1146	Tejas Gajjar	tejasgajjar74@gmail.com	7096825933	housing	2026-03-17 14:20:00.820273	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1147	Dilip Kumar Gogaliya	dilipkumargogaliya@gmail.com	9772909099	housing	2026-03-17 14:20:00.830325	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1148	MAHESH PRAJAPATI	p3908480@gmail.com	7878234470	housing	2026-03-17 14:20:00.846	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1149	Gaurav singh	gauravsingh637578@gmail.com	7802028103	housing	2026-03-17 14:20:00.854854	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1150	Kapil Sahu	kapil.sahu.kittu@gmail.com	7567834963	housing	2026-03-17 14:20:00.863811	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1151	Jignesh Thakor	jbthakor3835@gmail.com	6358239646	housing	2026-03-17 14:20:00.87411	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1152	Pawan Lohra	pawankuma9157@gmail.com	9264450236	housing	2026-03-17 14:20:00.880475	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1153	Golu	\N	8349223418	housing	2026-03-17 14:20:00.887155	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1154	chhotu gupta	cg3923391@gmail.com	8736034382	housing	2026-03-17 14:20:00.893452	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1155	Sulochana Baberwal	sulochanababerwal92113@gmail.com	9928568444	housing	2026-03-17 14:20:00.905636	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1156	Devendra Baxi	devendra.baxi@gmail.com	9979474014	housing	2026-03-17 14:20:00.91425	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1157	Dhaval Oza	dhavaloza83@gmail.com	9824171976	housing	2026-03-17 14:20:00.923406	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1158	Vishal Singh	vishalbannaqqqq@gmail.com	7014581057	housing	2026-03-17 14:20:00.931306	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1159	Vijay talpada (Owner)	pintutalpada@gmail.com	9662161262	housing	2026-03-17 14:20:00.952323	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1160	Dharmesh Patel	dharmeshpatel420420@gmail.com	6355693538	housing	2026-03-17 14:20:00.978024	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1161	surendrasinh gohil	s.p.12486@gmail.com	8000838585	housing	2026-03-17 14:20:00.992986	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1162	Ajay koriya	ajaykoriya1818@gmail.com	7573901818	housing	2026-03-17 14:20:01.01775	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1163	Kelash Kumar Khatri	kelashkumarkhatri9@gmail.com	9216855085	housing	2026-03-17 14:20:01.039845	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1164	Chitra Panchal (Owner)	panchalchitra8@gmail.com	9664916218	housing	2026-03-17 14:20:01.054859	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1165	Alpesh Leuva	alpeshleuva440@gmail.com	8200774237	housing	2026-03-17 14:20:01.067025	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1166	Jyoti rajput	jyoti.raj143@gmail.com	6263183278	housing	2026-03-17 14:20:01.08595	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1167	BHAVNA PALAN	\N	9825531051	housing	2026-03-17 14:20:01.093273	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1168	Devendrasinh	devendrasinh3737@gmail.com	8488804336	housing	2026-03-17 14:20:01.10954	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1169	sandhya sharma	sandysen656@gmail.com	9624377834	housing	2026-03-17 14:20:01.122758	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1170	Shivam Thakur	shivamlvthakur@gmail.com	9857050777	housing	2026-03-17 14:20:01.144234	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1171	Tusi  Bhuinya	tusibhuinya7@gmail.com	8420075953	housing	2026-03-17 14:20:01.161362	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1172	Chandrama Prasad	chandrama8792@gmail.com	8511707318	housing	2026-03-17 14:20:01.176149	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1173	Amit Vaidya (Owner)	amitlvaidya.1969@gmail.com	9714636009	housing	2026-03-17 14:20:01.193262	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1174	Makwana Parshottambhai	pmakwan3@gmail.com	7043659663	housing	2026-03-17 14:20:01.218661	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1175	Jatin Kumar	jatinkomur@gmail.com	8527968858	website	2026-03-17 14:20:02.477	\N	new	Noida	\N	\N	Looking for a small plot	t	\N	\N	manual	\N	\N	\N
1176	Makwana Pintu	\N	9824550566	housing	2026-03-17 16:10:01.251503	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1177	Sima	seemaseema42672@gmail.com	6355069151	housing	2026-03-17 17:10:00.819328	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1178	Jentilal Pipaliya	pipaliyajentilal@gmail.com	9574158579	99acres	2026-03-18 09:10:08.556636	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Interested in 441992-Bellevue Vieraaa by Davda Infra+OA	t	\N	\N	manual	\N	\N	Medium
1179	Kuldeep Patel	patelkuldeep0703@gmail.com	9998580965	99acres	2026-03-18 09:10:08.612821	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1180	User	prakashsuthar0105990@gmail.com	7600021679	99acres	2026-03-18 09:10:08.617702	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1181	Kunal Shah	kunalshah1981@yahoo.com	9898247000	99acres	2026-03-18 09:10:08.623733	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1182	Samirkumar Solanki	samirsolanki123@gmail.com	9327565842	99acres	2026-03-18 09:10:08.631241	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1183	Reena Jayswal	jreena487@gmail.com	9924300945	99acres	2026-03-18 09:10:08.637159	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1184	Jayesh Shah	jayesh.demai@gmail.com	9909904636	99acres	2026-03-18 09:10:08.646525	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1185	Dr Aishwarya Sharma	anandratra1234@gmail.com	8117057550	99acres	2026-03-18 09:10:08.652377	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1186	Avinash	avinashgupta686@gmail.com	9988257721	99acres	2026-03-18 09:10:08.660163	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1187	Vasudev	vhf.surat@gmail.com	9374721834	99acres	2026-03-18 09:10:08.665256	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1188	USER	mynk109124@gmail.com	8320650299	99acres	2026-03-18 09:10:08.670395	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1189	sp4913**	sp491330@gmail.com	6260746189	housing	2026-03-18 09:20:01.3523	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1190	Jayesh Khengar	jayeshkhengar07808@gmail.com	6352264290	housing	2026-03-18 09:20:01.415194	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1191	vijay	pv457698@gmail.com	9054325674	housing	2026-03-18 09:20:01.421833	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1192	ANITA CHAUHAN	\N	8780509559	housing	2026-03-18 09:20:01.427245	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1193	chirag	chirag27chauhan@gmail.com	9316556263	housing	2026-03-18 09:20:01.432419	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1194	ARVIND	vaghaaravinda@gmail.com	7069895044	housing	2026-03-18 09:20:01.43704	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1195	Rathod BhaveshBhai	bhaveshr60@gmail.com	9099443535	housing	2026-03-18 09:20:01.442677	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1196	Patel sarveah	patelsarvesh0299@gmail.com	7383933522	housing	2026-03-18 09:20:01.446883	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1197	hiral kumari	solankihiral1101@gmail.com	9276251290	housing	2026-03-18 09:20:01.450723	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1198	Bahadu rajput (Owner)	gaytrichouhanchouhan5@gmail.com	7568695234	housing	2026-03-18 09:20:01.454491	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1199	Hari Patel	patelhari446@gmail.com	8511789123	housing	2026-03-18 09:20:01.457073	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1200	Yagnesh Tandel	bhagyags0104@gmail.com	9974684224	housing	2026-03-18 09:40:00.801972	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1201	Swati Kulkarni	swatiboralkar@gmail.com	7020817314	housing	2026-03-18 12:10:01.745394	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1202	Hiren	hirenparmar3034@gmail.com	9313653397	housing	2026-03-18 12:40:00.793773	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1203	Kishan Makwana	makwanakishan4444@gmail.com	7600999071	housing	2026-03-18 13:00:01.237847	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1204	Godavariben Bhatt	godavariben1964@gmail.com	9924586872	housing	2026-03-18 13:00:01.283977	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1205	Ali Shaikh	alishaikhneseer@gmail.com	9226755743	housing	2026-03-18 13:20:00.626514	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1206	shyamal Halder	shyamalhalder121970@gmail.com	7044881310	housing	2026-03-19 09:20:02.003384	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1207	Ishika Dutt	ishikadatniyadatniya@gmail.com	8849211475	housing	2026-03-19 09:20:02.070587	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1208	Nitu kumari	rajanitu0000@gmail.com	7096338160	housing	2026-03-19 09:20:02.078041	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1209	Surendar Bishnoi	raharvinod31@gmail.com	9057438580	housing	2026-03-19 09:20:02.087103	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1210	divyan bhajikhau	devangellove@gmail.com	9106034682	housing	2026-03-19 09:20:02.091309	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1211	ID Dipali Banavali	dipalibanavali@gmail.com	9081819209	housing	2026-03-19 09:20:02.101987	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1212	Shelu Patel	sppatelandco.rajkot@gmail.com	8155041583	99acres	2026-03-19 09:20:02.609243	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1213	Vishal Mehta	vishal.mehtaa@gmail.com	9099946999	99acres	2026-03-19 09:20:02.615749	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1214	Pavan Raval	\N	7572968075	99acres	2026-03-19 09:20:02.621061	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1215	અજીતભાઈ દંતાણી	ab6752340@gmail.com	7778051125	housing	2026-03-19 12:20:01.345957	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1216	Pravina Shrivastav	pravinashrivastav1976@gmail.com	9712821447	housing	2026-03-19 16:10:01.40484	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1217	Prashant	\N	8200016816	99acres	2026-03-19 16:40:01.584371	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp,	t	\N	\N	manual	\N	\N	Medium
1218	karan s parmar	ak25803936@gmsil.com	9054425137	housing	2026-03-20 09:10:01.378534	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1219	chamanlal thakor	chamanlal1741@gmail.com	9376194269	housing	2026-03-20 09:10:01.412923	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
1220	Vasant Rayalwar	vasant.rayalwar@gmail.com	8275390419	housing	2026-03-20 09:10:01.420865	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1221	Sonali Satpute  (Owner)	sdahibhate89@gmail.com	7350437249	housing	2026-03-20 09:10:01.425601	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1222	Shyam Sunder Sharma	manpreet1962@gmail.com	9173900634	99acres	2026-03-20 09:10:02.197121	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1223	Punit Raj Kumar	raviranjankumardss880@gmail.com	9117063553	99acres	2026-03-20 09:10:02.202731	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1224	Chandresh Panchal	cm_panchal187@yahoo.co.in	9662294975	99acres	2026-03-20 09:10:02.209967	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1225	SANJEEV TIWARI	\N	7972354366	99acres	2026-03-20 09:10:02.224035	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1226	Trishna	trishna.parashar63@gmail.com	9717786364	99acres	2026-03-20 09:10:02.229018	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1227	Sahiba Khan	sahibakhan2804@gmail.com	7489717186	housing	2026-03-20 11:00:03.271683	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1390	rohitkumar	rohitajani743@gmial.com	9624394129	website	2015-03-03 23:16:53	\N	new	\N	\N	\N	interested for buying plot form villa	t	\N	\N	manual	shyam:contact:44	\N	\N
1228	Reena Chandak	reena.chandak11@gmail.com	9899985736	housing	2026-03-20 11:00:03.342906	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1229	Paresh patni Paresh patni (Owner)	pareshpatnipareshpatni9@gmail.com	7486828932	housing	2026-03-20 11:50:01.338037	\N	new	Bavla, Ahmedabad	Plot, Villa	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1230	Yamini Patel IW	webdeveloper3.intelliworkz@gmail.com	9062011306	website	2026-03-20 14:20:01.121	\N	new	\N	\N	\N	Testing	t	\N	\N	manual	\N	\N	\N
1231	Kaushik Lolaria	kaushik.lolaria@gmail.com	9374819666	99acres	2026-03-20 15:40:01.751188	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
1232	Vijay Shyam	\N	8747951176	housing	2026-03-23 09:20:01.322612	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1233	Raaj Yadav	yrajyadav21234@gmail.com	7600982834	housing	2026-03-23 09:20:01.370298	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1234	suhas	suhassutariya1997@gmail.com	9537365614	housing	2026-03-23 09:20:01.382256	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1235	Vijay Parmar	vp978553@gmail.com	9586137695	housing	2026-03-23 09:20:01.394244	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1236	CHANDRIKABEN	chandrikamaruda@gmail.com	9327786424	housing	2026-03-23 09:20:01.40082	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1237	Shambhudayal Jangid	jyotiglass22600@gmail.com	9825560019	housing	2026-03-23 09:20:01.415971	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
1238	Sonu Dk	kamleshsingh7550662877@gmail.com	7550662877	housing	2026-03-23 09:20:01.426453	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1239	Hardik	hardikkoshti10@gmail.com	7226906972	housing	2026-03-23 09:20:01.436287	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
1240	Chauhan Dharmendrasinh	cd7393111@gmail.com	9773006123	housing	2026-03-23 09:20:01.445507	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1241	Rohit	pawanprasad070@gmail.com	7801810601	housing	2026-03-23 09:20:01.45535	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1242	Mahesh Patel	mahesh19572003@gmail.com	9586867042	housing	2026-03-23 09:20:01.463496	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1243	Prem Prem	prem2002pretty@gmail.com	9316559317	housing	2026-03-23 09:20:01.470195	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1244	rahul diwakar	rahuldiwakar3152@gmail.com	8003053152	housing	2026-03-23 09:20:01.476643	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1245	Vijay Kumar jangid	vijayjangir205@gmail.com	9624531973	housing	2026-03-23 09:20:01.484631	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1246	Kamlesh Dagolai	kamleshdagolai162@gmail.com	9079829443	housing	2026-03-23 09:20:01.544715	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1247	Ramjeebhai Sandapa	ramjeebhai1972@gmail.com	9879906683	housing	2026-03-23 09:20:01.551368	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot, 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 2500000 - 11800000	t	\N	\N	manual	\N	\N	\N
1248	deepali	disharaval84@gmail.com	7043159775	housing	2026-03-23 09:20:01.564942	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1249	Gyan Pavar	gyan_pavar@yahoo.co.in	9427015141	housing	2026-03-23 09:20:01.570974	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1250	Mamta Trivedi	mamtatrivedi210@gmail.com	8460229135	housing	2026-03-23 09:20:01.577021	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1251	Chhoti Zala	zindrajit5@gmail.com	6352408849	housing	2026-03-23 09:20:01.584124	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1252	Dixit Patel	pateldixit544@gmail.com	9537583362	housing	2026-03-23 09:20:01.590163	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1253	MR RAVAN	\N	9714930145	housing	2026-03-23 09:20:01.594831	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1254	RAJ BARMAN	rb376700@gmail.com	8109898655	housing	2026-03-23 09:20:01.599817	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1255	Dhrupenkumar Shah	dhrupen@gmail.com	9586560002	99acres	2026-03-23 09:20:01.935858	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1256	FRANCIS MACWAN	francis.macwan2211@gmail.com	9898137986	99acres	2026-03-23 09:20:01.941486	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1257	Dinesh Bhatia	dikubha@gmail.com	7984689019	99acres	2026-03-23 09:20:01.945796	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1258	Jagdish Shah	jagdishmshah@gmail.com	9624500800	99acres	2026-03-23 09:20:01.949502	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1259	Atul Gohel	atul.gohel@ceat.com	7046982332	99acres	2026-03-23 09:20:01.954043	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp,	t	\N	\N	manual	\N	\N	Medium
1260	Ankit Vikram	ankit.myfrnd@yahoo.in	8789664637	99acres	2026-03-23 09:20:01.990249	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	This project looks good! Please send me more details	t	\N	\N	manual	\N	\N	Medium
1261	Makadiya Divy	\N	7984170285	99acres	2026-03-23 09:20:01.992861	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1262	sneha G	shgjhfjh@gmail.com	9226722938	99acres	2026-03-23 09:20:01.995657	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1263	parikh	parikh32@gmail.com	9998335364	99acres	2026-03-23 09:20:01.998759	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
1264	Rameshbhai	\N	8511639372	99acres	2026-03-23 09:20:02.03681	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1265	Bhushan Singh	daivik251120@gmail.com	7600779610	99acres	2026-03-23 09:20:02.061843	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1266	Kanku	\N	7679142653	99acres	2026-03-23 09:20:02.065704	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1267	Yogesh	abc@gmail.com	7041678545	website	2026-03-23 09:20:02.34	\N	new	Ahmedabad	\N	\N	\N	t	\N	\N	manual	\N	\N	\N
1268	sanjana	greatarchana007@gmail.com	9560997423	housing	2026-03-23 13:00:01.635011	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1269	Vineeth John	vineethjohn2703@gmail.com	7780350057	housing	2026-03-23 14:30:01.780213	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1270	Bhoomi	bhoomikakahar0@gmail.com	6355064539	housing	2026-03-23 14:40:01.715712	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1271	VIJAY GOHEL	vjgohel30999@gmail.com	7048784690	99acres	2026-03-23 16:10:10.748821	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Unknown	\N	Hot Lead, Interested in 0BHK, Reach out to customer via Whatsapp,	t	\N	\N	manual	\N	\N	Medium
1272	Lakhi	prtshaw58@gmail.com	9038629267	housing	2026-03-24 09:30:03.389111	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1273	Umesh	umeshparmar5139@gmail.com	9106054067	housing	2026-03-24 09:30:03.426052	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1274	Raju Mugalkhod	digital.raju5@gmail.com	9740606969	housing	2026-03-24 09:30:03.43031	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot, 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 2500000 - 20100000	t	\N	\N	manual	\N	\N	\N
1275	Yogesh Donga	yogeshpatel7044@gmail.com	9879470444	housing	2026-03-24 09:30:03.434944	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1276	Shweta	\N	8920270259	99acres	2026-03-24 09:30:04.369756	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1277	Deepak	umatextileagency@gmail.com	9328259757	99acres	2026-03-24 09:30:04.384793	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in Residential Land Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1278	HEM SHAH	\N	9924007147	99acres	2026-03-24 09:30:04.388207	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1279	chandrakant	chandreshpatil208@gmail.com	9725797852	housing	2026-03-24 10:40:01.579314	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1280	Nikita Patel	hp5558970@gmail.com	7284959502	housing	2026-03-24 12:10:01.680903	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1281	Deep Vaghela	cvvaghela.7812@gmail.com	9722801380	housing	2026-03-24 12:50:02.155988	\N	new	Bavla, Ahmedabad	Villa, Plot	\N	Interested in Residential Plot at Bavla, Ahmedabad. Budget: 2500000 - 10100000	t	\N	\N	manual	\N	\N	\N
1282	SATYAM KUMAR SINGH	satyamkumarsingh0505@gmail.com	8757392121	website	2026-05-23 11:55:01.233	\N	new	\N	\N	\N	Need For JOB In IT Field: Need for job in IT Field. Currently workking in Orbit Techsol India Pvt. Ltd. and the client is Jindal Steal Ltd. (Patratu Ramgarh, Jharkhand)	t	\N	\N	manual	\N	\N	\N
1283	Asif Shaikshni	sheikhasif09890@gmail.com	1917774036070	website	2026-05-23 11:55:01.252	\N	new	Pura Gana Cal	\N	\N	\N	t	\N	\N	manual	\N	\N	\N
1284	Pooja	pooja2308@gmail.com	9893023203	website	2026-05-23 11:55:01.256	\N	new	Indore	\N	\N	\N	t	\N	\N	manual	\N	\N	\N
1285	Hardevsinh Zala	zala.sh1708@gmail.com	9054472717	website	2026-05-23 11:55:01.26	\N	new	Ahmedabad	\N	\N	Details for project	t	\N	\N	manual	\N	\N	\N
1286	Shailendra Gupta	shailendragupta42@gmail.com	8411043000	website	2026-05-23 11:55:01.262	\N	new	Vadodara	\N	\N	Want to buy plot at Dholera SIR	t	\N	\N	manual	\N	\N	\N
1287	DavidTaw	no.reply.MiguelSimonson@gmail.com	81928499666	website	2026-05-23 11:55:01.264	\N	new	Bhopal	\N	\N	Salutations! shyamgroups.co.in, \nI recently discovered your page while browsing. \nWe also provide  that helps businesses connect with website owners through contact forms. \nThis platform allows companies to reach websites in various industries. \n  \n  \nIf this approach seems useful, feel free to reach out. \n \nHave a wonderful day. \nContact us. \nTelegram - https://t.me/FeedbackFormEU \nWhatsApp - +375259112693 \nWhatsApp  https://wa.me/+375259112693	t	\N	\N	manual	\N	\N	\N
1288	Ms Chopra	ipschopra@gmail.com	8837648652	website	2026-05-23 11:55:01.265	\N	new	Chandigarh	\N	\N	Interested in residential plot in Dholera... Please call to provide details of your projects. Thank you !	t	\N	\N	manual	\N	\N	\N
1289	📉 Gift 3000 $ GET - telegra.ph/Free-Promocode---3000-04-08?hs=42a2233ec02e182fb8fbea6b993d4bd7& 📉	xatunahome@warunkpedia.com	598238917573	website	2026-05-23 11:55:01.269	\N	new	\N	\N	\N	n6mzkg: w2867w	t	\N	\N	manual	\N	\N	\N
1290	MOHSIN CHUNAWALA	mohsin.chunawala@gmail.com	8000308600	website	2026-05-23 11:55:01.274	\N	new	AHMEDABAD	\N	\N	Investment in Dholera Sir	t	\N	\N	manual	\N	\N	\N
1291	Atul Solanki	atulkgn1000@gmail.com	9479400587	website	2026-05-23 11:55:01.276	\N	new	Ahmedabad	\N	\N	Interested for investment	t	\N	\N	manual	\N	\N	\N
1292	Rishabh	hm016_ahm@gmail.com	9586763936	website	2026-05-23 11:55:01.278	\N	new	Ahmedabad	\N	\N	\N	t	\N	\N	manual	\N	\N	\N
1293	Kashmira Patani	kashmira.kp@gmail.com	7863834841	website	2026-05-23 11:55:01.28	\N	new	Gandhinagar	\N	\N	Call me	t	\N	\N	manual	\N	\N	\N
1294	Himanshi	himanshu@gmail.com	9724254120	website	2026-05-23 11:55:01.283	\N	new	Ahmedabad	\N	\N	Residential	t	\N	\N	manual	\N	\N	\N
1295	SHAILESH	shaileshbhoi745@gmail.com	6005246863	website	2026-05-23 11:55:01.286	\N	new	Lunawada, mahisagar	\N	\N	Reshideshi plot	t	\N	\N	manual	\N	\N	\N
1296	Sumit Kumar Singh	tomarsumit547@gmail.com	7017957009	website	2026-05-23 11:55:01.289	\N	new	\N	\N	\N	residential plot	t	\N	\N	manual	\N	\N	\N
1297	Richard	richardmiller2021@gmail.com	85725193613	website	2026-05-23 11:55:01.291	\N	new	\N	\N	\N	Content contribution inquiry: Hello, \n \nI’m reaching out to ask if you accept relevant articles on shyamgroups.co.in. \n \nI can share a high-quality piece that adds value, improves reader engagement, and complements your existing content. \n \nHappy to send a topic if you’re open. \n \nThanks.	t	\N	\N	manual	\N	\N	\N
1332	Banshi Lal	bl8924322@gmail.com	7984065413	housing	2026-05-26 09:00:01.429305	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1521	JimmiNi	jimosa4ccf2@hotmail.com	13166595290	website	2017-10-21 02:40:05	\N	new	\N	\N	\N	SGAVmg http://www.FyLitCl7Pf7ojQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:262	\N	\N
1298	Naif Ali Abdullah AlHammad	naifalhammadprivate1@gmail.com	82166268985	website	2026-05-23 11:55:01.293	\N	new	Kilkenny	\N	\N	Salaam, \n \nI hope this message finds you well. I represent the Saudi Investment Bank, and we are seeking a new business or project for possible funding and capital financing. Please indicate by email if you would like more details let's schedule a meeting. \n \nRespectfully, \nNaif Ali Abdullah AlHammad \nExecutive Member \nSaudi Investment Bank \nRiyadh Saudi Arabia \nnaif.hammad-al@advisorysib.com	t	\N	\N	manual	\N	\N	\N
1299	R Rr	r7573674@gmail.com	6352830154	housing	2026-05-23 12:00:00.729801	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1300	Gaurav Garg	gauravshield17@gmail.com	9571747219	housing	2026-05-23 12:00:00.739058	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1301	Bahaddur	mamshdabup@gmail.com	7804930705	housing	2026-05-23 12:00:00.741327	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1302	Snehal B Bhatt	snehalb944@gmail.com	9724473360	housing	2026-05-23 12:00:00.74382	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1303	Snehal Panchal	viral04.india.sp@gmail.com	9409225944	housing	2026-05-23 12:00:00.750377	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1304	harsh	hgandhi7498@gmail.com	7069887498	housing	2026-05-23 12:00:00.754406	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1305	Avni Shukla	avnishukla2000@yahoo.com	9978637683	99acres	2026-05-23 12:00:00.858055	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1306	Rakesh	\N	9979204909	99acres	2026-05-23 12:00:00.861213	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1307	Ashish	\N	9510796196	99acres	2026-05-23 12:00:00.866624	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1308	Parag	moradparag@yahoo.com	8849126553	99acres	2026-05-23 12:00:00.86994	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1309	Nilesh	\N	9638777799	99acres	2026-05-23 12:00:00.872288	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1310	Viral	poojaviral1432@gmail.com	8698824163	99acres	2026-05-23 12:00:00.879361	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 3BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
1311	Jenish Farasrami	jenish.jems@gmail.com	9722966863	99acres	2026-05-23 12:00:00.884047	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1312	Pranati Mallick	\N	9938733510	housing	2026-05-23 14:00:00.686137	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1313	HOME	hommmy22@gmail.com	9724766737	housing	2026-05-23 15:00:00.544059	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1314	Rohan	\N	8140576924	99acres	2026-05-23 15:30:01.792698	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1315	Aryan	developer16.intelliworkz@gmail.com	9898777456	ea22560e-0e03-494a-ae8a-046c760dfc0a	2026-05-23 15:44:28.349378	\N	new	B Block, Office No, 912-A, World Trade Tower, Sarkhej - Gandhinagar Hwy, behind BMW Car Showroom, Makarba, Ahmedabad, Sarkhej-Okaf, Gujarat 382210	\N	\N	\N	t	\N	72	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
1316	Jayantibhai Parmar	jayantiparmar9898@gmail.com	9898296097	99acres	2026-05-23 15:50:01.125488	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	t	\N	\N	manual	\N	\N	Medium
1325	Shravan Chauhan	shravanchauhan424@gmail.com	9726187423	housing	2026-05-25 09:20:01.194371	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1317	Aryan	543ahihdfa9.intelliworkz@gmail.com	7778889990	ea22560e-0e03-494a-ae8a-046c760dfc0a	2026-05-23 16:38:26.203667	2026-05-23 16:51:25.880257	new	B Block, Office No, 912-A, World Trade Tower, Sarkhej - Gandhinagar Hwy, behind BMW Car Showroom, Makarba, Ahmedabad, Sarkhej-Okaf, Gujarat 382210	\N	\N	\N	t	\N	\N	manual	\N	047cbd62-bd78-4e42-be1c-72395edaf057	\N
1318	Aryan	developer9.ielliworkz@gmail.com	9898855652	own_crm	2026-05-23 16:44:40.501016	2026-05-23 17:10:28.722287	new	B Block, Office No, 912-A, World Trade Tower, Sarkhej - Gandhinagar Hwy, behind BMW Car Showroom, Makarba, Ahmedabad, Sarkhej-Okaf, Gujarat 382210	\N	\N	\N	t	\N	72	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Warm
1319	Birbalsirnhgal	birbalsingar843@gmail.com	6267736869	housing	2026-05-25 09:20:01.082655	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1320	Sumitraben Ninama	sumitrabenninama9@gmail.com	9408174126	housing	2026-05-25 09:20:01.110126	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1321	Satish Pargi	satishpargi031999@gmail.com	7023721689	housing	2026-05-25 09:20:01.117145	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
1322	Dilipbhai pandya (Owner)	dilipbhaipandya01@gmail.com	8849202517	housing	2026-05-25 09:20:01.122768	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1323	Ankan Roy	royankan79@gmail.com	8658434780	housing	2026-05-25 09:20:01.126974	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
1324	Riya Shah	riyabhavesh86@gmail.com	9054544132	housing	2026-05-25 09:20:01.14221	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1326	Bhagora Arjun	bhgrarjun@gmail.com	8141909153	housing	2026-05-25 09:20:01.198687	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1327	Khant Bharat	khantbharat1999@gmail.com	9510682969	housing	2026-05-25 09:20:01.203702	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1328	bodycare fitness	bodycareahmedabad@gmail.com	7016559471	housing	2026-05-25 09:20:01.209091	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1329	Jinal Patel  (Owner)	pateljinal1454@gmail.com	9537359865	housing	2026-05-25 09:20:01.212921	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1330	Rohit Bamana	rohitbamana3@gmail.com	9257441780	housing	2026-05-25 11:20:00.982071	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1331	Popatlal	popatlaldamor153@gmail.com	7851971939	housing	2026-05-26 09:00:01.364905	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1556	Aditya	sims.realeste17@gmail.com	9860706722	website	2018-03-20 23:26:42	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:322	\N	\N
1333	Pravin ninama Pravin ninama	pravinninamapravinninama771@gmail.com	6355369106	housing	2026-05-26 09:00:01.439487	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1334	Suresh Chand	sc1450478@gmail.com	7740944035	housing	2026-05-27 11:50:01.017434	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1335	Bharat Chaudhary	bharat40895@gmail.com	9909840895	housing	2026-05-27 13:10:00.786081	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1336	Amit	formitsaraiya@gmail.com	9016398037	housing	2026-05-28 10:30:00.618056	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1337	📖 Transfer to you. SIGN IN >>> graph.org/BALANCE-36824-US-DOLLARS-04-24?hs=42a2233ec02e182fb8fbea6b993d4bd7& <<< 📖	vv2lc66enw3ca0@wshu.net	916240396558	website	2026-05-28 10:55:01.933	\N	new	\N	\N	\N	ke5qea: vxlc1t	t	\N	\N	manual	\N	\N	\N
1338	Joanna Riggs	joannariggs68@gmail.com	447112852	website	2026-05-28 10:55:01.952	\N	new	Beckenham	\N	\N	Hi,\n\nI just visited shyamgroups.co.in and wondered if you'd ever thought about having an engaging video to explain what you do?\n\nOur prices start from just $195 (USD).\n\nLet me know if you're interested in seeing samples of our previous work.\n\nRegards,\nJoanna\n\nUnsubscribe: https://unsubscribe.video/unsubscribe.php?d=shyamgroups.co.in	t	\N	\N	manual	\N	\N	\N
1339	Dilipbhai Bhawnani	dkbhawnani15@gmail.com	9558834448	99acres	2026-05-28 11:00:00.956287	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
1340	Laxmi	lksingh1802@gmail.com	8128176664	99acres	2026-05-28 11:00:00.986061	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
3911	WhatsApp Lead	\N	9394670001	website	2026-06-16 04:04:31	\N	new	\N	\N	\N	Is there loan facility on your commercial ground floor shop ??	t	\N	\N	manual	shyam:whatsapp:126	\N	\N
1341	Meet	mrmeet2212@gmail.com	9909135450	99acres	2026-05-28 11:00:00.991064	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
1342	Jadaun Shiv Singh	jadaunbapu989889@gmail.com	6351967494	99acres	2026-05-28 11:00:00.996099	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1343	Akshay	ekukreja06@gmail.com	8310618130	99acres	2026-05-28 11:00:01.001296	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1344	Yash Chauhan	9574156067@99acres.oeo.com	9574156067	99acres	2026-05-28 11:00:01.007767	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1345	Dipesh Nagla	dipeshnagla@gmail.com	9920669747	99acres	2026-05-28 11:00:01.01513	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1346	RAJESHKUMAR SINHA	sinha_2003@rediffmail.com	9106495913	housing	2026-05-29 09:50:01.052455	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1347	Dilip Ribadiya	dilipribadiya086@gmail.com	9601506072	housing	2026-05-29 09:50:01.085178	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1349	Vinod  Kumar Bodakiya BJP	vinodbodakiya@gmail.com	8780252586	housing	2026-05-29 11:20:00.795814	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1348	Yoges Patel	patelyoges767@gmail.com	9898860836	housing	2026-05-29 09:50:01.094459	2026-06-01 09:54:12.571207	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
1350	Hasmukh Solanki (Owner)	hasmukhbsolanki@gmail.com	9601359787	housing	2026-06-01 10:00:01.079794	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1351	Manna khan Mannan	m0933167@gmail.com	8391850059	housing	2026-06-01 10:00:01.111193	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
1352	Rana Mihir	ranamihir645@gmail.com	9106390907	housing	2026-06-01 10:00:01.136238	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1353	elena Sharma	pooja2702sharma@gmail.com	7383341283	housing	2026-06-01 10:00:01.154059	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1354	Jk Joshi	jjk89219@gmail.com	9328854994	housing	2026-06-01 10:00:01.171748	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1355	rahul pargi	pargi0134@gmail.com	9265987767	housing	2026-06-01 10:00:01.190027	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1356	Kartavya Chauhan	kartavya8398@gmail.com	7622007219	housing	2026-06-01 10:00:01.20534	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1357	Payal Vaghasiya	payaldv2109@gmail.com	8155816352	housing	2026-06-01 10:00:01.221752	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1358	Sunny jaishwal	sunnyjaishwal143@gmail.com	7698161681	housing	2026-06-01 10:30:00.852955	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1359	Rahul Dantani	rahuldantani6373@gmail.com	8866594243	housing	2026-06-01 12:20:01.592983	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
1360	DieselFuel.net	fuelfuel321@gmail.com	83594475181	website	2025-11-28 10:53:19	\N	new	Mumbai	\N	\N	Hello, \r\n \r\nWe kindly ask you to include our website dieselfuel.net in your business directory or supplier listings. \r\n \r\nOur site provides verified information about global EN590 diesel suppliers and contact details of logistics companies. \r\nMany businesses use our platform for B2B fuel trading, supplier sourcing, and industry networking. \r\n \r\nIf your website includes: \r\n• a business directory \r\n• supplier listings \r\n• a resources page \r\n• a B2B marketplace \r\n• a partners or contacts section \r\n \r\n—we would appreciate adding a link to: \r\n \r\nhttps://dieselfuel.net \r\n \r\nShort description (optional): \r\nDieselFuel.net – Global EN590 suppliers, logistics contacts, B2B fuel marketplace. \r\n \r\nWe are also a direct fuel supplier and can offer annual diesel delivery contracts if your company requires regular supplies. \r\n \r\nThank you for your time and consideration. \r\nIf you need any additional information, feel free to contact us. \r\n \r\nBest regards, \r\nDieselFuel.net Team	t	\N	\N	manual	shyam:modal:4	\N	\N
1384	Niraj Nagulkar	nagulkar.niraj@gmail.com	9900043090	website	2015-01-26 18:25:44	\N	new	\N	\N	\N	Wanted to know the price list	t	\N	\N	manual	shyam:contact:36	\N	\N
1385	himmat jain	\N	9687700011	website	2015-01-27 02:25:05	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:37	\N	\N
1386	Sagar Sheth	sagarsheth85@gmail.com	9820104058	website	2015-02-03 19:03:22	\N	new	\N	\N	\N	Dholera Plot: please call me for Dholera plot	t	\N	\N	manual	shyam:contact:39	\N	\N
1387	Akshay Kapoor	akshaykapoor24@gmail.com	9871953355	website	2015-02-10 07:47:40	\N	new	\N	\N	\N	Dholera Properties: Pls advice for your projects	t	\N	\N	manual	shyam:contact:40	\N	\N
1361	Mike Stefan Mertens	info@digital-x-press.com	84528539615	website	2025-12-18 22:37:55	\N	new	Kolkata	\N	\N	Hi, \r\nI understand that most website owners struggle recognizing that Answer Engine Optimization (AEO) is a continuous effort and a well-planned ongoing investment. \r\n \r\nSadly, very few marketers have the patience to recognize the gradual yet significant results that can completely transform their online presence. \r\n \r\nWith constant algorithm changes, a consistent, long-term strategy including Answer Engine Optimization (AEO) is essential for securing a positive ROI. \r\n \r\nIf you agree this as the ideal approach, collaborate with us! \r\n \r\nDiscover Our Monthly SEO Services https://www.digital-x-press.com/unbeatable-seo/ \r\n \r\nTalk to Us on Instant Messaging https://www.digital-x-press.com/whatsapp-us/ \r\n \r\nWe provide remarkable outcomes for your resources, and you will appreciate choosing us as your SEO partner. \r\n \r\nWarm regards, \r\nDigital X SEO Experts \r\nPhone/WhatsApp: +1 (844) 754-1148	t	\N	\N	manual	shyam:modal:8	\N	\N
1362	Arvind Rajput	rajputarvind@gmail.com	\N	website	2025-12-23 13:36:13	\N	new	Ahmedabad	\N	\N	test	t	\N	\N	manual	shyam:modal:63	\N	\N
1363	test by developer	webdeveloper10.intelliworkz@gmail.com	7932348763	website	2026-04-07 01:12:01	\N	new	ahmd	\N	\N	ignor	t	\N	\N	manual	shyam:modal:132	\N	\N
1364	TEST	webdeveloper9.intelliworkz@gmail.com	9898989898	website	2026-04-10 00:10:31	\N	new	Ahmedabad	\N	\N	TEST	t	\N	\N	manual	shyam:modal:139	\N	\N
1365	Siddharth	dm4.intelliworks@gmail.com	9537379188	website	2026-05-05 11:29:53	\N	new	Ahmedabad	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:modal:168	\N	\N
1366	Amin Mansuri	dm11.intelliworkz@gmail.com	9087654321	website	2026-05-06 18:41:42	\N	new	abc	\N	\N	seo test	t	\N	\N	manual	shyam:modal:170	\N	\N
1367	sid	dm4@gmail.com	9537379178	website	2026-06-01 12:45:22	\N	new	Ahmedabad	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:modal:195	\N	\N
1368	Sumair	sumairvidha@yahoo.com	9879636303	website	2014-10-18 19:23:28	\N	new	\N	\N	\N	Need to have plots.	t	\N	\N	manual	shyam:contact:8	\N	\N
1369	sanjay	sanjay768@yahoo.co.i	9045020080	website	2014-10-29 02:47:07	\N	new	\N	\N	\N	dholera sir plot	t	\N	\N	manual	shyam:contact:11	\N	\N
1370	John P	\N	000000	website	2014-11-08 21:20:09	\N	new	\N	\N	\N	Hi, \r\n \r\nI'm John Pim, a marketing manager at Traffic Institution. I came across www.shyamgroups.co.in and see that it has the potential to get a lot more visitors. \r\n \r\nI just wanted to tell you, in case you didn't already know... We cater to over 7,000 small and medium biz and website owners - many in your niche, all seeing a TON more sales, subscribers and clickthroughs. \r\n \r\nWe're network partners with the largest media banner networks - the same networks that serve traffic to hundreds of thousands of popular news, cooking, animal, research, shopping, etc websites you already use daily. \r\n \r\nSimply put, I think www.shyamgroups.co.in can get a lot more exposure from buying and driving traffic the same way all of these other successful websites have been doing for so long! \r\n \r\nLet me give you all the details here: \r\nhttp://trafficinstitution.com/traffic-plans/ \r\n \r\nAll that any successful website is is simply visitors who come and want to visit, read and engage with it - could www.shyamgroups.co.in genuinely benefit from any of these future events? \r\n \r\n- 100% real people clicking through from blogs and websites in your niche to your blog - ensuring the best chances of engagement, whether you want leads, email subscribers or sales? \r\n- MONTHLY visitors to set up once, and focus on improving your website appearance, salesfunnel, etc - never to have to worry about traffic again? \r\n- QUICK exposure, sales and brand awareness building for your website without spending $1,000s on SEO and social media and waiting months for rankings and followers to appear? \r\n \r\nIf your answer is YES to any of these, the answer is as simple as increasing the traffic to your website ASAP. Not having to worry about where to find quality visitors for your website is 70% of the overall hassle gone - so I hope I can assist you with that :) \r\n \r\nIf you're ready and want to watch www.shyamgroups.co.in explode with traffic ASAP - go here: http://trafficinstitution.com/traffic-plans/ \r\n \r\nIf you have any questions regarding if we have traffic in particular niches or countries - please email me at admin@trafficinstitutionemail.com \r\n \r\nHere's to your success and quick website growth!	t	\N	\N	manual	shyam:contact:14	\N	\N
1371	Gary Mitchell	mitchellgary084@gmail.com	\N	website	2014-11-20 20:49:19	\N	new	\N	\N	\N	Want more clients and customers? We will help them find you by putting you on the 1st page of Google. Email us back to get a full proposal.	t	\N	\N	manual	shyam:contact:16	\N	\N
1372	Bernardo Jaxson	jaxsonbernardo076@gmail.com	\N	website	2014-11-20 21:21:01	\N	new	\N	\N	\N	Want more clients and customers? We will help them find you by putting you on the 1st page. Email us back to get a full proposal.	t	\N	\N	manual	shyam:contact:17	\N	\N
1373	Gary Mitchell	mitchellgary965@gmail.com	0000000000	website	2014-11-20 21:41:12	\N	new	\N	\N	\N	Marketing suggestion for your website: Want more clients and customers? We will help them find you by putting you on the 1st page of Google. Email us back to get a full proposal.	t	\N	\N	manual	shyam:contact:18	\N	\N
1374	BladerSuct	user14t@outlook.com	123456	website	2014-11-22 16:54:09	\N	new	\N	\N	\N	Hi, Best 0day Music, Download mp3 tracks, Private FTP: http://0daymusic.org \r\nBest Albums Hardstyle, Hardcore, House, Techno, Trance, Dance...	t	\N	\N	manual	shyam:contact:19	\N	\N
1375	RAKESH VARMA	rakeshvarma2008@gmail.com	9930312308	website	2014-11-24 02:04:42	\N	new	\N	\N	\N	Detail sof project in respect of configuration, rate, funding arrangements etc	t	\N	\N	manual	shyam:contact:20	\N	\N
1376	maulik meghani	maulikmeghani140@gmail.com	9978864969	website	2014-11-25 18:46:37	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:23	\N	\N
1377	kanaiyalal barot	kbarot@live.com	09545508893	website	2014-12-05 04:52:03	\N	new	\N	\N	\N	i want plot no.18. plz. book and give me all details	t	\N	\N	manual	shyam:contact:24	\N	\N
1378	Ajay Dhimmar	ajay_dhimmar@hotmail.com	9898186745	website	2014-12-12 13:35:44	\N	new	\N	\N	\N	I need a plot near Dholera SIR	t	\N	\N	manual	shyam:contact:25	\N	\N
1379	Sharad	sharadbhalla08@gmail.com	9729132889	website	2014-12-26 22:57:05	\N	new	\N	\N	\N	Intrested in buying plot for investment purpose. Please contact on my cell number.	t	\N	\N	manual	shyam:contact:29	\N	\N
1380	Govind Gajjar	surag1982@gmail.com	\N	website	2014-12-30 11:16:58	\N	new	\N	\N	\N	We are interested in the purchase of  a plot, can you email me the details.\r\n\r\n\r\nThank you	t	\N	\N	manual	shyam:contact:30	\N	\N
1381	Angelina	pwhpelufwh@hotmail.com	\N	website	2015-01-03 12:49:53	\N	new	\N	\N	\N	Hi, my name is Angelina and I am the marketing manager at StarSEO Marketing. I was just looking at your website and see that your site has the potential to become very popular. I just want to tell you, In case you don't already know... There is a website service which already has more than 16 million users, and most of the users are looking for niches like yours. By getting your website on this service you have a chance to get your site more visitors than you can imagine. It is free to sign up and you can find out more about it here: http://www.dreamingson.com/r/7l - Now, let me ask you... Do you need your website to be successful to maintain your business? Do you need targeted visitors who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your site? If your answer is YES, you can achieve these things only if you get your site on the service I am talking about. This traffic service advertises you to thousands, while also giving you a chance to test the service before paying anything at all. All the popular blogs are using this network to boost their readership and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful website works... Here's to your success! Read more here: http://www.dreamingson.com/r/7l	t	\N	\N	manual	shyam:contact:31	\N	\N
1382	hoking	hoking1d7k@gmail.com	99587234595	website	2015-01-10 11:03:45	\N	new	\N	\N	\N	YgDCPR http://www.FyLitCl7Pf7kjQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:33	\N	\N
1383	pappu kumar	pappukhorra @gmail.com	8880849330	website	2015-01-18 18:06:53	\N	new	\N	\N	\N	I saw on olx please send layout plan	t	\N	\N	manual	shyam:contact:35	\N	\N
1391	Priyanka Chandran	priyankachandran@gmail.com	09916165260	website	2015-03-06 19:42:01	\N	new	\N	\N	\N	Dholera  project: Cannot reach this no pls cal me back	t	\N	\N	manual	shyam:contact:45	\N	\N
1392	Palak	palak123i@gmail.com	9819812588	website	2015-03-08 01:29:56	\N	new	\N	\N	\N	Need site visit	t	\N	\N	manual	shyam:contact:46	\N	\N
1393	Mahesh Patel	mahegeepatel@gmail.com	9925220269	website	2015-03-11 22:58:19	\N	new	\N	\N	\N	want to purchase open plot	t	\N	\N	manual	shyam:contact:47	\N	\N
1394	rushabh	rushabh.savla90@gmail.com	9223147775	website	2015-03-15 03:12:49	\N	new	\N	\N	\N	i need to know the exact location of this villa and prices...	t	\N	\N	manual	shyam:contact:48	\N	\N
1395	gunzain gujarati	gunjangujarati@yahoo.com	9987174638	website	2015-03-20 22:20:17	\N	new	\N	\N	\N	i am interested in this project	t	\N	\N	manual	shyam:contact:49	\N	\N
1396	pravin	pravin2951@gmail.com	9967394349	website	2015-03-22 19:15:54	\N	new	\N	\N	\N	plots	t	\N	\N	manual	shyam:contact:52	\N	\N
1397	Haresh Soni	hpgraphics@gmail.com	9322239490	website	2015-03-22 23:29:17	\N	new	\N	\N	\N	Shyam Villa: What is the rate for Shyam Villa project ? What is the paper work procedure ? Possession ?	t	\N	\N	manual	shyam:contact:53	\N	\N
1398	Pramod Mishra	pramod.mobile.samsung@gmail.com	7048538297	website	2015-04-02 23:41:00	\N	new	\N	\N	\N	information about plots in Dholera SIR	t	\N	\N	manual	shyam:contact:54	\N	\N
1399	Ravi Kant Mishra	ravi.kantmishra@hotmail.com	9619187568	website	2015-04-07 23:15:50	\N	new	\N	\N	\N	want to invest in plot pls contact me or send the details	t	\N	\N	manual	shyam:contact:58	\N	\N
1400	Om	om.sachdev1983@gmail.com	0013233745944	website	2015-04-08 03:08:20	\N	new	\N	\N	\N	Interested to buy a plot.\r\nPlease provide complete details.	t	\N	\N	manual	shyam:contact:59	\N	\N
4007	WhatsApp Lead	\N	7899073789	website	2026-06-16 10:39:37	\N	new	\N	\N	\N	Hi how much for plot cost in Dholera smart city ?	t	\N	\N	manual	shyam:whatsapp:127	\N	\N
1401	NIRAJ NIRMAL	nirajnirmal@yahoo.co.in	9821409420	website	2015-04-08 07:36:54	\N	new	\N	\N	\N	Dear Team, Requesting if you can send me the  brief details of all the three projects with the area and the price list . Thank you. Regards Niraj P Nirmal.	t	\N	\N	manual	shyam:contact:60	\N	\N
1402	gs chouhan	chouhan883@gmail.com	7738785642	website	2015-04-12 17:22:42	\N	new	\N	\N	\N	Pls send detail rate of plots	t	\N	\N	manual	shyam:contact:61	\N	\N
1403	gordon	sbdh47tf@hotmail.com	33292775387	website	2015-04-13 08:04:20	\N	new	\N	\N	\N	lkalTZ http://www.FyLitCl7Pf7kjQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:63	\N	\N
1404	paresh pandya	paresh6113@yahoo.com	9998042405	website	2015-04-18 14:43:51	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:64	\N	\N
1405	klark	klark2d4@gmail.com	21439378192	website	2015-04-24 22:28:40	\N	new	\N	\N	\N	xLMiCg http://www.FyLitCl7Pf7kjQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:65	\N	\N
1406	martin	julian3d5s@hotmail.com	20996390512	website	2015-04-27 04:35:00	\N	new	\N	\N	\N	xaM2rL http://www.FyLitCl7Pf7kjQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:66	\N	\N
1407	anoop	anoop.kr.jaiswal@gmail.com	9029160001	website	2015-05-17 17:25:54	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:68	\N	\N
1408	Vikram Rawal	rawalvikram@gmail.com	6591439199	website	2015-05-25 01:12:24	\N	new	\N	\N	\N	Hi,\r\nI am interested in buying the plot. Please provide the price and payment options detail.\r\nRegards,\r\nVikram	t	\N	\N	manual	shyam:contact:70	\N	\N
1409	Rohit Verma	rohitvermacenti@gmail.com	9971562227	website	2015-06-09 04:23:24	\N	new	\N	\N	\N	I want to buy a home in main dholera smart city	t	\N	\N	manual	shyam:contact:71	\N	\N
1410	Niraj	nirajd91@gmail.com	9028287246	website	2015-06-09 21:19:43	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:72	\N	\N
1411	Saurabh D Jog	saurabhjog@gmail.com	09869317608	website	2015-06-09 22:23:06	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:75	\N	\N
1412	bhupal	bhupal.2007@rediffmail.com	7875090228	website	2015-06-09 23:32:40	\N	new	\N	\N	\N	I want to know detail about project: Plot	t	\N	\N	manual	shyam:contact:76	\N	\N
1413	nitin kulkarni	nitinkulkarni76@gmail.com	9967330205	website	2015-06-10 02:46:11	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:77	\N	\N
1414	Vikas kumar	vikas.kumar5885@gmail.com	8197044222	website	2015-06-23 03:58:33	\N	new	\N	\N	\N	I would like to invest in one of  your projects. Please send the rates & payment options for the same.	t	\N	\N	manual	shyam:contact:78	\N	\N
1415	kamya	kdl_1008@yahoo.in	7405104599	website	2015-06-26 16:30:57	\N	new	\N	\N	\N	i am interested in dholera	t	\N	\N	manual	shyam:contact:79	\N	\N
1416	pareshbhai	ppparesh07@gmail.com	9769097113	website	2015-06-29 22:33:31	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:80	\N	\N
1417	labhu purohit	labhupurohit@gmail.com	8347046940	website	2015-06-30 17:18:55	\N	new	\N	\N	\N	i am inwesting	t	\N	\N	manual	shyam:contact:81	\N	\N
1418	Ankit nahata	ankit.r.nahata@gmail.com	9833926166	website	2015-07-02 02:49:08	\N	new	\N	\N	\N	Want to invest: Please call me since looking at an investment option.	t	\N	\N	manual	shyam:contact:82	\N	\N
1419	Kamlesh Mehta	k.mehta058@gmail.com	96899362798	website	2015-07-04 00:02:46	\N	new	\N	\N	\N	Pl. send more details	t	\N	\N	manual	shyam:contact:83	\N	\N
1420	sagar nagle	sagar.nagle@gmail.com	9714816771	website	2015-07-04 05:42:18	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:84	\N	\N
1421	Sandeep Vyas	sandeepkvyas_2006@yahoo.co.in	971507806940	website	2015-07-05 17:07:44	\N	new	\N	\N	\N	Enquiry about Residential Plot: Hello,\r\nI am interested to buy property in Dholera, Gujarat. I need good proposals to invest there. Request you to suggest.	t	\N	\N	manual	shyam:contact:85	\N	\N
1422	Milan shethna	milanshethna9@gmail.com	9998995800	website	2015-07-05 19:29:47	\N	new	\N	\N	\N	Pls send me your browser with a price	t	\N	\N	manual	shyam:contact:86	\N	\N
1423	mehul mistry	mehulm@graandprix.com	09969826109	website	2015-07-09 15:20:11	\N	new	\N	\N	\N	Fully Imported Home Elevators: Dear Sir,\r\nGood Morning!\r\nGreetings from Graand Prix Elevators!\r\n\r\nWe are glad to introduce our company Graand Prix Elevators India Pvt. Ltd., Mumbai. Graand Prix has been providing special customized solutions for vertical transportation since last 8 years of its presence. More than 1500 customer all over India have been benefited from these solutions. We exclusively represent Star Elevators, Dubai for Pneumatic Vacuum elevator and we can boast of our association with IGV Group SPA Italy for their world class DomusLift. (Hydraulic Home Elevators) IGV is amongst top Five elevator manufacturers in Europe. IGV was pioneer in Hydraulic Elevators in Italy. IGV is exporting to 63 countries across the globe and we can proudly say that, India has been added to their list.\r\n\r\nGraand Prix Elevators Pvt. Ltd, has own office in Mumbai at Mulund and channel partners all over the India. Key reasons of Graand Prixâ€™s success can be stated that, we provide world class solutions and backing up them with unmatched after sales service. We have factory trained technicians to take care of customerâ€™s need 24x7. Our technicianâ€™s team is full time employees and not hired on contract basis, this gives assurance to attend any complaint within 24 hours. No time is wasted in replacing any components in case of any failure because we keep sufficient stock of spares at our head office in Mumbai.\r\n\r\nAlso find attached brief information on our products. Please feel free to contact us for any further assistance in this regard.	t	\N	\N	manual	shyam:contact:87	\N	\N
1424	gopal agrawal	agrawalgopal4 @gmail.com	09887184464	website	2015-07-27 22:21:05	\N	new	\N	\N	\N	I want plot\r\nSize 1000 sft.	t	\N	\N	manual	shyam:contact:91	\N	\N
1425	Pinkesh Patel	pinkeshpatel1980@yahoo.in	9925111687	website	2015-08-02 16:45:53	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:93	\N	\N
1557	Vijay Odedara	vjayodedra03@gmail.com	9722258721	website	2018-03-21 09:43:07	\N	new	\N	\N	\N	What is the price of plot?\r\nPayment process...????	t	\N	\N	manual	shyam:contact:323	\N	\N
1426	Nitin Ghaghda	nitinghaghda@hotmail.co.uk	02083493872	website	2015-08-03 00:21:15	\N	new	\N	\N	\N	Could you please provide full details of the plot and the prices to my email, as in the near future there may well be a possibility of a purchase	t	\N	\N	manual	shyam:contact:94	\N	\N
1427	Bradley	djbrucho3@gmail.com	88335766085	website	2015-08-09 15:24:19	\N	new	\N	\N	\N	Y2dcbM http://www.FyLitCl7Pf7kjQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:95	\N	\N
1428	Johnd843	johnd720@gmail.com	341826383	website	2015-08-31 01:21:40	\N	new	\N	\N	\N	Thanks  for another wonderful article. Where else could anybody get that kind of information in such an ideal way of writing? I have a presentation next week, and I'm on the look for such information. deddccccffkb	t	\N	\N	manual	shyam:contact:99	\N	\N
1429	Smithk765	smithk242@gmail.com	\N	website	2015-08-31 01:21:51	\N	new	\N	\N	\N	Hey esto es un gran poste. Puedo utilizar una porcin en ella en mi sitio? Por supuesto ligara a su sitio as que la gente podra leer el artculo completo si ella quiso a. Agradece cualquier manera. fgccakekbeefeaea	t	\N	\N	manual	shyam:contact:101	\N	\N
1430	Parveen Bhayana	bhayanaparveen09@gmail.com	8950020222	website	2015-09-11 23:26:17	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:103	\N	\N
1431	Anil.Dhamecha	anildhamecha77@gmail.com	9824221216	website	2015-09-15 01:59:02	\N	new	\N	\N	\N	Important I'm Brkar the best location your saite	t	\N	\N	manual	shyam:contact:105	\N	\N
1432	Ricky Tank	justchillricky@gmail.com	9867255952	website	2015-09-15 22:31:27	\N	new	\N	\N	\N	Please send the e-brochure and payment details of Shyam Villa.  Offer the best deal.	t	\N	\N	manual	shyam:contact:106	\N	\N
1433	Ashok	makwanaashok772@gmail.com	9824209302	website	2015-09-21 21:00:25	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:108	\N	\N
1434	Abhay Bhalerao	abhay.brao.trade@gmail.com	8975883102	website	2015-09-26 18:37:37	\N	new	\N	\N	\N	need plot	t	\N	\N	manual	shyam:contact:109	\N	\N
1435	Alisa	frmbgcxngp@beagrinbol.com	\N	website	2016-10-19 06:06:57	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR website and see that your website has the potential to get a lot of visitors. I just want to tell you, In case you don't already know... There is a website network which already has more than 16 million users, and most of the users are looking for websites like yours. By getting your website on this service you have a chance to get your site more popular than you can imagine. It is free to sign up and you can find out more about it here: http://acortarurl.es/15 - Now, let me ask you... Do you need your website to be successful to maintain your way of life? Do you need targeted traffic who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your website? If your answer is YES, you can achieve these things only if you get your site on the network I am describing. This traffic network advertises you to thousands, while also giving you a chance to test the network before paying anything at all. All the popular websites are using this service to boost their traffic and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful site works... Here's to your success! Find out more here: http://brt.st/5lpV   - Unsubscribe here: http://lis.ovh/b2	t	\N	\N	manual	shyam:contact:110	\N	\N
1436	Alisa	wqvrilw@beagrinbol.com	\N	website	2016-10-25 14:48:16	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR website and see that your site has the potential to become very popular. I just want to tell you, In case you didn't already know... There is a website network which already has more than 16 million users, and the majority of the users are looking for websites like yours. By getting your website on this network you have a chance to get your site more visitors than you can imagine. It is free to sign up and you can find out more about it here: http://osws.uk/28m3a - Now, let me ask you... Do you need your site to be successful to maintain your business? Do you need targeted traffic who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your website? If your answer is YES, you can achieve these things only if you get your site on the network I am talking about. This traffic service advertises you to thousands, while also giving you a chance to test the service before paying anything. All the popular websites are using this service to boost their traffic and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful website works... Here's to your success! Find out more here: http://acortarurl.es/15   - Unsubscribe here: http://gd.is/y/eyzsv	t	\N	\N	manual	shyam:contact:116	\N	\N
1437	Nicole	xpkyyrzx@beagrinbol.com	\N	website	2016-11-01 17:22:35	\N	new	\N	\N	\N	Hello my name is Nicole and I just wanted to send you a quick note here instead of calling you. I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more hits. I have found that the key to running a successful website is making sure the visitors you are getting are interested in your website topic. There is a company that you can get keyword targeted traffic from and they let you try the service for free for 7 days. I managed to get over 300 targeted visitors to day to my website. http://hw23.de/eyml0     - Unsubscribe here: http://hw23.de/2291d	t	\N	\N	manual	shyam:contact:117	\N	\N
1438	Hitesh	hiteshdhokiya2000@rediffmail.com	7573022984	website	2016-11-13 17:13:21	\N	new	\N	\N	\N	inquiry for a plot for investment purpose: inquiry for a plot for investment purpose	t	\N	\N	manual	shyam:contact:119	\N	\N
1439	Cameron	ijffty@denarcteal.com	\N	website	2016-11-13 20:32:59	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR website and see that your site has the potential to get a lot of visitors. I just want to tell you, In case you didn't already know... There is a website service which already has more than 16 million users, and the majority of the users are interested in topics like yours. By getting your site on this service you have a chance to get your site more popular than you can imagine. It is free to sign up and you can find out more about it here: http://rhr.online/2znuw - Now, let me ask you... Do you need your site to be successful to maintain your business? Do you need targeted traffic who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your website? If your answer is YES, you can achieve these things only if you get your website on the service I am describing. This traffic network advertises you to thousands, while also giving you a chance to test the service before paying anything at all. All the popular websites are using this network to boost their traffic and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful site works... Here's to your success! Read more here: http://rhr.online/2znuw	t	\N	\N	manual	shyam:contact:120	\N	\N
1440	RAJNIKANT	rajnikantgodwani@gmail.com	8134923106	website	2016-11-21 23:44:41	\N	new	\N	\N	\N	Pls send me all details of projects & location with prices..	t	\N	\N	manual	shyam:contact:121	\N	\N
1584	Loan Cash	chefbinga25@regiopost.trade	86829925272	website	2018-07-10 01:00:25	\N	new	\N	\N	\N	Inquery: no fax installment loans <a href="http://aloan.cars">a loan with bad credit</a> cash advance credit card <a href=http://aloan.cars>1 hour loan</a>	t	\N	\N	manual	shyam:contact:362	\N	\N
1776	WhatsApp Lead	\N	91798798798798	website	2026-02-20 11:56:08	\N	new	\N	\N	\N	test	t	\N	\N	manual	shyam:whatsapp:13	\N	\N
1441	Clara	lieppn@yahoo.com	\N	website	2016-11-25 02:34:20	\N	new	\N	\N	\N	Hello my name is Clara and I just wanted to send you a quick note here instead of calling you. I came to your Shyam Group | Best Residential Plots at Dholera SIR website and noticed you could have a lot more visitors. I have found that the key to running a popular website is making sure the visitors you are getting are interested in your website topic. There is a company that you can get keyword targeted visitors from and they let you try the service for free for 7 days. I managed to get over 300 targeted visitors to day to my site. http://trck.be/1SU	t	\N	\N	manual	shyam:contact:122	\N	\N
3912	Pravinbhai  (Owner)	pravinbhai1985@icloud.com	9898926222	housing	2026-06-16 15:10:04.781456	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3913	Maunang Shah	maunang74@gmail.com	+44-7903097579	housing	2026-06-16 15:10:04.981607	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 13000000	t	\N	\N	manual	\N	\N	\N
1442	Britney	dwdtnspj@ymail.com	\N	website	2016-12-02 03:00:39	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR site and see that your site has the potential to get a lot of visitors. I just want to tell you, In case you didn't already know... There is a website service which already has more than 16 million users, and most of the users are interested in topics like yours. By getting your website on this service you have a chance to get your site more popular than you can imagine. It is free to sign up and you can find out more about it here: http://dmvd.com/a - Now, let me ask you... Do you need your website to be successful to maintain your business? Do you need targeted visitors who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your site? If your answer is YES, you can achieve these things only if you get your site on the service I am describing. This traffic network advertises you to thousands, while also giving you a chance to test the network before paying anything at all. All the popular blogs are using this service to boost their readership and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful website works... Here's to your success! Read more here: http://likes.avanimisra.com/4ox2	t	\N	\N	manual	shyam:contact:123	\N	\N
1443	Evelyn Serrell	gauwqgue@mdwbgykim.com	\N	website	2016-12-11 16:30:33	\N	new	\N	\N	\N	This is a memo to the website creator. I discovered your Shyam Group | Best Residential Plots at Dholera SIR page by searching on Google but it was hard to find as you were not on the first page of search results. I know you could have more traffic to your site. I have found a site which offers to dramatically improve your rankings and traffic to your website: http://hud.sn/6sk5 I managed to get close to 500 visitors/day using their service, you could also get a lot more targeted traffic from search engines than you have now. Their service brought significantly more visitors to my website. I hope this helps!	t	\N	\N	manual	shyam:contact:124	\N	\N
1444	Barnypok	jfvynms4281rt@hotmail.com	18341978947	website	2016-12-28 07:19:19	\N	new	\N	\N	\N	bjkmWE http://www.FyLitCl7Pf7ojQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:125	\N	\N
1445	Nareshkumar Patel	nkp3937@gmail.com	9978336155	website	2017-01-08 00:35:15	\N	new	\N	\N	\N	Sir\r\n Give me a rate	t	\N	\N	manual	shyam:contact:140	\N	\N
1446	Manjeet	mssodhi@gmail.com	9724334399	website	2017-01-12 22:07:32	\N	new	\N	\N	\N	Details please,	t	\N	\N	manual	shyam:contact:144	\N	\N
1447	Xadrian	01kketpb0y@outlook.com	\N	website	2017-01-13 01:16:49	\N	new	\N	\N	\N	That insight solves the prlebom. Thanks!	t	\N	\N	manual	shyam:contact:145	\N	\N
1448	Alexandra	am302igc8o@hotmail.com	\N	website	2017-01-13 01:18:28	\N	new	\N	\N	\N	Haha. I woke up down today. You've cheeerd me up!	t	\N	\N	manual	shyam:contact:147	\N	\N
1449	Blondy	elqkkc5z8w1@gmail.com	\N	website	2017-01-13 01:26:55	\N	new	\N	\N	\N	Wow I must confess you make some very trceahnnt points.	t	\N	\N	manual	shyam:contact:149	\N	\N
1450	Robinson	y996d9k5a@hotmail.com	\N	website	2017-01-13 01:38:16	\N	new	\N	\N	\N	Dag nabbit good stuff you whrpeeisnappprs!	t	\N	\N	manual	shyam:contact:151	\N	\N
1451	keshav sharma	drkeshavsharma.yoga@gmail.com	7574855144	website	2017-01-15 17:09:38	\N	new	\N	\N	\N	Please discuss regarding plots & villas rate	t	\N	\N	manual	shyam:contact:153	\N	\N
1452	LarryTob	larry49@mail.ru	83394491631	website	2017-02-04 15:03:04	\N	new	\N	\N	\N	Choose payment method: Bank wire, WesternUnion, MoneyGram, Google Wallet, Webmoney. \r\n72TB File Storage 0day 1990-2017. \r\nIP restrictions: 3 IP addresses per user at the same time. \r\nOveral server's speed: 500 Mbps. \r\nEasy to use: Most of genres are sorted by days. \r\nServerâ€™s capacity: 72 TB for all FTP. \r\nMore Seven years Of Archives. \r\nNo Waiting Time, No captcha,No Speed Limit, No Ads. \r\nNever Deleted Original Albums, Labels, Save Time And Money. \r\nUpdated On Daily: 20GB-50GB, 300-500 Albums 0-day WEB, Promo, CD, CDA, CDM, CDR, CDS, EP, LP, Vinyl... \r\nUp Time: 99% \r\nAll Genre: House, Club, Techno, Trance, Dance, Italo-Dance, Eurodance, Drum and Bass, Psychedelic, Goa, PsyTrance, Progressive House, Electro, Euro-House, Club-House, Hardtechno, Tech-House, Dutch House, Minimal, Deep-House, Nu-Disco, Hardstyle, Hardcore, Jumpstyle, Electronic, Alternative, Alternative Rock, Ambient, Avantgarde, Ballad, Bass, Beat, Black Metal,Blues, Classical, Chanson, Country, Dance Hall, Death Metal, Disco, Ethnic, Folk, Folk-Rock, Funk, Gangsta Rap, Gothic Rock,Hard Rock, Heavy Metal, Hip-Hop, Indie, Industrial, Instrumental, Jazz, Jungle, Pop, Rock, Metal, Latin, Lo-Fi, New Age, Noise, Oldies, Pop-Folk, Progressive Rock, Psychedelic Rock, Punk Rock, Rap, Reggae, R&B, Rock & Roll, Soul, Soundtrack, Speech, Synthpop, Thrash Metal, Top 40, Vocal etc. \r\nAccount delivery time: 1 to 48 hours. \r\n \r\nhttp://0daymusic.org/premium.php	t	\N	\N	manual	shyam:contact:154	\N	\N
1453	Hasmukh s parikh	hasmukh3878@gmail.com	9824577852	website	2017-02-05 00:01:18	\N	new	\N	\N	\N	I interested in reis plot	t	\N	\N	manual	shyam:contact:156	\N	\N
1454	Jennifer	bxeqwvbugx@ylsjusq.com	\N	website	2017-02-07 06:59:16	\N	new	\N	\N	\N	I decided to leave a message here on your Shyam Group | Best Residential Plots at Dholera SIR page instead of calling you. Do you need more likes for your Facebook Fan Page? The more people that LIKE your website and fanpage on Facebook, the more credibility you will have with new visitors. It works the same for Twitter, Instagram and Youtube. When people visit your page and see that you have a lot of followers, they now want to follow you too. They too want to know what all the hype is and why all those people are following you. Get some free likes, followers, and views just for trying this service I found: http://brt.st/5pFF	t	\N	\N	manual	shyam:contact:157	\N	\N
1455	88952634	\N	88952634	website	2017-02-07 11:15:46	\N	new	\N	\N	\N	88952634	t	\N	\N	manual	shyam:contact:159	\N	\N
1456	Lora Wood	tsujpow@tsribk.com	\N	website	2017-02-08 09:55:30	\N	new	\N	\N	\N	Hi my name is Lora Wood and I just wanted to drop you a quick message here instead of calling you. I discovered your Shyam Group | Best Residential Plots at Dholera SIR website and noticed you could have a lot more visitors. I have found that the key to running a successful website is making sure the visitors you are getting are interested in your subject matter. There is a company that you can get keyword targeted visitors from and they let you try the service for free for 7 days. I managed to get over 300 targeted visitors to day to my site. http://v-doc.co/nm/bat6h	t	\N	\N	manual	shyam:contact:162	\N	\N
1585	Loans Online	bchoe2000@regiopost.trade	82429834882	website	2018-07-10 08:06:33	\N	new	\N	\N	\N	Inquery: loans for people with bad credit <a href="http://aloan.cars">online loans for bad credit</a> loan with bad credit <a href=http://aloan.cars>loans</a>	t	\N	\N	manual	shyam:contact:363	\N	\N
1643	Pradeep Kumar	er.pradeepsingh1989@gmail.com	09650224482	website	2020-09-11 20:31:45	\N	new	\N	\N	\N	Plot enquiry in Dholera global city: I am interested in your project	t	\N	\N	manual	shyam:contact:433	\N	\N
3901	Shalini Mudaliar	mudaliarshalini02@gmail.com	7698047628	99acres	2026-06-16 15:00:01.890189	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
3902	Hariom	digital4wheelsmediaworks@gmail.com	8511465027	99acres	2026-06-16 15:00:01.929281	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
3903	Krushan Patel	krushanpatel2@gmail.com	8140700772	99acres	2026-06-16 15:00:01.981223	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
1457	Sabrina Warren	rqtfhyh@akltlhdrz.com	\N	website	2017-02-13 09:57:40	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR website and see that your site has the potential to become very popular. I just want to tell you, In case you don't already know... There is a website service which already has more than 16 million users, and the majority of the users are looking for websites like yours. By getting your website on this service you have a chance to get your site more popular than you can imagine. It is free to sign up and you can find out more about it here: http://www.v-diagram.com/2syzv - Now, let me ask you... Do you need your website to be successful to maintain your business? Do you need targeted visitors who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your site? If your answer is YES, you can achieve these things only if you get your website on the network I am talking about. This traffic network advertises you to thousands, while also giving you a chance to test the service before paying anything at all. All the popular websites are using this network to boost their traffic and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful website works... Here's to your success! Read more here: http://kfon.eu/3\r\nSabrina Warren http://fot.li/2ne	t	\N	\N	manual	shyam:contact:163	\N	\N
1458	Sabrina Warren	gwxhnoebq@ovrtsbvlivu.com	\N	website	2017-02-16 00:33:50	\N	new	\N	\N	\N	Hi my name is Sabrina Warren and I just wanted to drop you a quick message here instead of calling you. I discovered your Shyam Group | Best Residential Plots at Dholera SIR website and noticed you could have a lot more traffic. I have found that the key to running a popular website is making sure the visitors you are getting are interested in your website topic. There is a company that you can get keyword targeted traffic from and they let you try the service for free for 7 days. I managed to get over 300 targeted visitors to day to my website. http://acortarurl.es/5i	t	\N	\N	manual	shyam:contact:164	\N	\N
1459	JimmiXzSw	jimos4581rt@hotmail.com	50546717051	website	2017-02-19 05:17:40	\N	new	\N	\N	\N	OJqi4q http://www.FyLitCl7Pf7ojQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:165	\N	\N
1460	Sanjai Kumar	sanjai.avi1815@gmail.com	07066686776	website	2017-02-19 12:27:02	\N	new	\N	\N	\N	Wants to know the size n price of plots.	t	\N	\N	manual	shyam:contact:167	\N	\N
1461	Sanjay Badgujar	sanjaybadgujar2734@gmail.com	9409317761	website	2017-02-28 09:37:46	\N	new	\N	\N	\N	Price n rate su che... N how to pay.. Description  pls	t	\N	\N	manual	shyam:contact:168	\N	\N
1462	Deanna Brady	hecbzgdoz@ekcusbbh.com	\N	website	2017-03-06 13:40:24	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR website and see that your website has the potential to get a lot of visitors. I just want to tell you, In case you don't already know... There is a website service which already has more than 16 million users, and most of the users are interested in websites like yours. By getting your site on this service you have a chance to get your site more popular than you can imagine. It is free to sign up and you can read more about it here: http://www.inflightvideo.tv/a/a9 - Now, let me ask you... Do you need your site to be successful to maintain your way of life? Do you need targeted traffic who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your website? If your answer is YES, you can achieve these things only if you get your site on the service I am describing. This traffic network advertises you to thousands, while also giving you a chance to test the network before paying anything at all. All the popular sites are using this service to boost their readership and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful website works... Here's to your success! Find out more here: http://lis.ovh/is	t	\N	\N	manual	shyam:contact:169	\N	\N
1463	Jeffreyneide	dyadikov.ivan@yandex.ua	162278182	website	2017-03-09 04:07:41	\N	new	\N	\N	\N	New Lotus â€” Ð¨Ð°Ð±Ð»Ð¾Ð½Ñ‹ WordPress. Ð¡ÐºÐ°Ñ‡Ð°Ñ‚ÑŒ Ð±ÐµÑÐ¿Ð»Ð°Ñ‚Ð½Ð¾ Ð¿Ñ€ÐµÐ¼Ð¸ÑƒÐ¼ ÑˆÐ°Ð±Ð»Ð¾Ð½ Ð’Ð¾Ñ€Ð´Ð¿Ñ€ÐµÑÑ   http://ruwordpress.ru/new-lotus/ - New Lotus â€” Ð¨Ð°Ð±Ð»Ð¾Ð½Ñ‹ WordPress. Ð¡ÐºÐ°Ñ‡Ð°Ñ‚ÑŒ Ð±ÐµÑÐ¿Ð»Ð°Ñ‚Ð½Ð¾ Ð¿Ñ€ÐµÐ¼Ð¸ÑƒÐ¼ ÑˆÐ°Ð±Ð»Ð¾Ð½ Ð’Ð¾Ñ€Ð´Ð¿Ñ€ÐµÑÑ>>>	t	\N	\N	manual	shyam:contact:172	\N	\N
1464	Deanna Brady	uczsjktkc@mtvyutohii.com	\N	website	2017-03-13 02:51:28	\N	new	\N	\N	\N	Hi my name is Deanna Brady and I just wanted to drop you a quick message here instead of calling you. I came to your Shyam Group | Best Residential Plots at Dholera SIR website and noticed you could have a lot more traffic. I have found that the key to running a successful website is making sure the visitors you are getting are interested in your subject matter. There is a company that you can get keyword targeted traffic from and they let you try the service for free for 7 days. I managed to get over 300 targeted visitors to day to my site. http://www.inflightvideo.tv/a/a9	t	\N	\N	manual	shyam:contact:173	\N	\N
1465	Vickie Figueroa	wdeusrlqwqc@rlxgelt.com	\N	website	2017-03-18 10:58:40	\N	new	\N	\N	\N	I was just looking at your Shyam Group | Best Residential Plots at Dholera SIR site and see that your website has the potential to get a lot of visitors. I just want to tell you, In case you don't already know... There is a website network which already has more than 16 million users, and the majority of the users are looking for topics like yours. By getting your website on this service you have a chance to get your site more visitors than you can imagine. It is free to sign up and you can find out more about it here: http://kfon.eu/k - Now, let me ask you... Do you need your website to be successful to maintain your way of life? Do you need targeted traffic who are interested in the services and products you offer? Are looking for exposure, to increase sales, and to quickly develop awareness for your website? If your answer is YES, you can achieve these things only if you get your website on the network I am talking about. This traffic network advertises you to thousands, while also giving you a chance to test the network before paying anything. All the popular websites are using this service to boost their traffic and ad revenue! Why arenâ€™t you? And what is better than traffic? Itâ€™s recurring traffic! That's how running a successful website works... Here's to your success! Find out more here: http://smpl.city/events/7Yypu	t	\N	\N	manual	shyam:contact:174	\N	\N
1466	Jasbir	write2jsk@gmail.com	\N	website	2017-03-27 12:33:16	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:175	\N	\N
1467	fr46456ygdcs	ds34634g@gmail.com	\N	website	2017-03-31 02:57:14	\N	new	\N	\N	\N	cr346467rhsvczxvmkaskoADKM FD453456YGFFFFdd bvu67i4yhgfdh	t	\N	\N	manual	shyam:contact:176	\N	\N
1468	Barnypok	jimos4581rt1@hotmail.com	39521030256	website	2017-04-01 11:08:38	\N	new	\N	\N	\N	z70nd7 http://www.LnAJ7K8QSpkiStk3sLL0hQP6MO2wQ8gO.com	t	\N	\N	manual	shyam:contact:177	\N	\N
1641	Priyanka Singh	singh20112@gmail.com	9989793662	website	2020-08-04 23:10:56	\N	new	\N	\N	\N	plot: plot	t	\N	\N	manual	shyam:contact:431	\N	\N
1682	PxyAttaglit	sillitteri@holliezelliott.site	87558422399	website	2021-07-24 20:06:13	\N	new	\N	\N	\N	noclegi augustow lazienna 27: augustow pokoje nad netta <a href=https://jamesagoff.lydiawholder.online>https://jamesagoff.lydiawholder.online</a> \r\nstx21	t	\N	\N	manual	shyam:contact:480	\N	\N
1469	Tami Sandoval	plzusejflyb@lvhzqeivbs.com	\N	website	2017-04-06 08:39:20	\N	new	\N	\N	\N	Hello my name is Tami Sandoval and I just wanted to send you a quick note here instead of calling you. I discovered your Shyam Group | Best Residential Plots at Dholera SIR website and noticed you could have a lot more visitors. I have found that the key to running a successful website is making sure the visitors you are getting are interested in your website topic. There is a company that you can get keyword targeted traffic from and they let you try the service for free for 7 days. I managed to get over 300 targeted visitors to day to my site. http://www.axurl.com/5i	t	\N	\N	manual	shyam:contact:181	\N	\N
1470	Lela Guzman	tvnnsif@buaanspe.com	\N	website	2017-04-12 13:58:55	\N	new	\N	\N	\N	Hi my name is Lela Guzman and I just wanted to drop you a quick message here instead of calling you. I discovered your Shyam Group | Best Residential Plots at Dholera SIR website and noticed you could have a lot more traffic. I have found that the key to running a successful website is making sure the visitors you are getting are interested in your subject matter. There is a company that you can get keyword targeted visitors from and they let you try their service for free for 7 days. I managed to get over 300 targeted visitors to day to my website. http://soheavyblog.com/1m	t	\N	\N	manual	shyam:contact:182	\N	\N
1471	pravin yadav	pravinyadav249@gmail.com	8655599103	website	2017-04-14 16:45:13	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:183	\N	\N
1472	Devina sangoi	dvnsavla@yahoo.co.in	9223378869	website	2017-04-19 11:41:17	\N	new	\N	\N	\N	Plots: Do contact	t	\N	\N	manual	shyam:contact:184	\N	\N
1473	Elisa Brown	yalermhkm@piqfmoo.com	\N	website	2017-04-20 07:09:43	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://tdil.co/3p	t	\N	\N	manual	shyam:contact:186	\N	\N
1474	apnarera	go@apnarera.com	7676763319	website	2017-05-05 15:10:58	\N	new	\N	\N	\N	enquiry: Kind Attention, \r\nManagement and staff members.\r\nWe are really excited to introduce apnarera.com to you. \r\nwww.apnarera.com is an initiative to help realtors know about the Indian Real Estate (Regulation and development) Act, 2016 also known as RERA. The Act came into force on 1st May 2016 and will be implemented soon in all Indian states. Already, nine states and six Union Territories have notified the RERA rules on 1st May 2017. \r\nThis Act will regulate the real estate sector of India and will enhance the accountability to place greater emphasis on planning and implementing unambiguous deeds of doing business in the sector.\r\nAt Apna Rera, we provide you latest RERA updates and information on various government reforms related to the Indian real estate sector.  Here, you can download state-wise RERA notification and RERA related forms for developers, agents & buyers.\r\nEnroll for Apna RERA membership today, interact with potential consumers, know about RERA approved projects & RERA registered agents in major Indian cities. \r\nShare this message with your co-workers and make them aware of the Real Estate (Regulation & development) Act, RERA.\r\nWith regards\r\nApna Rera Team	t	\N	\N	manual	shyam:contact:187	\N	\N
1475	Elisa Brown	bxtbhyqaaav@pppgxsr.com	\N	website	2017-05-07 23:26:29	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://shorturl.van.ee/h	t	\N	\N	manual	shyam:contact:188	\N	\N
1476	Subhash kanchan	indiasubhash.kanchan@gmail.com	7855001735	website	2017-05-08 19:52:35	\N	new	\N	\N	\N	Want to buy plot.: I am interested...	t	\N	\N	manual	shyam:contact:189	\N	\N
1477	Chelsea Wallace	ylfgiusq@egltssaynjo.com	\N	website	2017-05-12 13:59:50	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://priscilarodrigues.com.br/url/v\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://www.arvut.org/1/eCV	t	\N	\N	manual	shyam:contact:190	\N	\N
1478	Mr.  Mehram	mehram@gmail.com	8826781481	website	2017-05-13 12:45:47	\N	new	\N	\N	\N	Want to visit.: I want to book 3plots.	t	\N	\N	manual	shyam:contact:191	\N	\N
1479	Chelsea Wallace	yrjppsernx@otzgmvi.com	\N	website	2017-05-17 18:12:49	\N	new	\N	\N	\N	This is a comment to the Shyam Group | Best Residential Plots at Dholera SIR admin. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your website: http://trucri.me/u5za1 - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :)\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://acortarurl.es/97	t	\N	\N	manual	shyam:contact:192	\N	\N
1480	JimmiXzSq	jimos45812rt1@hotmail.com	49647471516	website	2017-05-18 06:55:01	\N	new	\N	\N	\N	D8rFqO http://www.LnAJ7K8QSpkiStk3sLL0hQP6MO2wQ8gO.com	t	\N	\N	manual	shyam:contact:193	\N	\N
1481	Chelsea Wallace	ouhkzjqrsvd@yituocwagm.com	\N	website	2017-05-21 10:20:27	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://tdil.co/3p\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://acortarurl.es/97	t	\N	\N	manual	shyam:contact:200	\N	\N
1482	Ravi Bharadia	bharadiaravi@gmail.com	9983019584	website	2017-05-25 11:28:35	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:205	\N	\N
1483	Chelsea Wallace	cqhyjdstxcx@hutxiwi.com	\N	website	2017-05-28 13:20:53	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://magc.co/7fe\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://acortarurl.es/97	t	\N	\N	manual	shyam:contact:206	\N	\N
1484	Chelsea Wallace	illabvlil@laryrtmlybk.com	\N	website	2017-06-01 09:35:58	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://magc.co/7fe\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://acortarurl.es/97	t	\N	\N	manual	shyam:contact:207	\N	\N
1485	Sarah Hughes	fhhsdjt@kjfkcgglpdq.com	\N	website	2017-06-06 01:03:00	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://magc.co/7fe\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://acortarurl.es/97	t	\N	\N	manual	shyam:contact:208	\N	\N
1486	Sarah Hughes	kbxuuvju@vgremi.com	\N	website	2017-06-10 09:48:57	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://magc.co/7fe\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://acortarurl.es/97	t	\N	\N	manual	shyam:contact:209	\N	\N
1487	Mayur	mayurparmar695@gmail.com	8160441253	website	2017-06-14 14:48:20	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:213	\N	\N
1488	Ann Weaver	aybvpilfvi@nzavxfaizky.com	\N	website	2017-06-18 19:56:05	\N	new	\N	\N	\N	I discovered your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://magc.co/7fe\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:214	\N	\N
1489	Ann Weaver	hpxcikcg@znyisrtapwv.com	\N	website	2017-06-21 13:35:05	\N	new	\N	\N	\N	This is a comment to the Shyam Group | Best Residential Plots at Dholera SIR admin. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your site: http://magc.co/7fe - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :)\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:215	\N	\N
1490	Ann Weaver	dymapkgcnk@cgqlier.com	\N	website	2017-06-25 15:18:41	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://rofel.me/1\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:216	\N	\N
1491	Laurel Wu	natalamuraveva2@gmail.com	\N	website	2017-06-30 11:40:24	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:217	\N	\N
1492	yogesh srivastava	epsilonyogesh@gmail.com	8619319516	website	2017-07-02 16:05:48	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:218	\N	\N
1493	Vijay ahuja	vijaymama375@gmai.com	9928585043	website	2017-07-05 15:32:34	\N	new	\N	\N	\N	What is return in/year in percentage\r\nAnd  when project finally complete	t	\N	\N	manual	shyam:contact:219	\N	\N
1494	Ann Weaver	ngvlatuuazv@aihmzi.com	\N	website	2017-07-06 16:36:51	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Check it out here: http://v-doc.co/nm/jkfq0\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:221	\N	\N
1495	Barnypok	ecrev22vtv@hotmail.com	32832557918	website	2017-07-07 01:40:02	\N	new	\N	\N	\N	4Y9bWS http://www.LnAJ7K8QSpkiStk3sLL0hQP6MO2wQ8gO.com	t	\N	\N	manual	shyam:contact:222	\N	\N
1496	Ann Weaver	egflcd@dadueobkib.com	\N	website	2017-07-10 07:58:06	\N	new	\N	\N	\N	This is a message to the Shyam Group | Best Residential Plots at Dholera SIR admin. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your site: http://priscilarodrigues.com.br/url/v - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :)\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:225	\N	\N
1497	Ann Weaver	fwsjnmmr@lczdiqopmx.com	\N	website	2017-07-12 19:55:49	\N	new	\N	\N	\N	I discovered your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://tdil.co/3p\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:226	\N	\N
1498	Ann Weaver	grhhxluewzl@lzvqckita.com	\N	website	2017-07-16 06:39:33	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://stpicks.com/27\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:227	\N	\N
1499	James	jparsons@blogpros.com	\N	website	2017-07-19 02:48:57	\N	new	\N	\N	\N	Hey guys!\n\nI found you through one of your blog articles on Google.\n\nI'm reaching out because your blog looks like a good candidate for a service of ours. We help you get more real human social shares on every new blog post you publish, automatically.\n\nIf you want to get more traction on your blog posts after publishing, check out our service, Blogpros: https://blogpros.com\n\nWe have a free trial, so you can try it for free for 30 days:\nhttps://blogpros.com/pricing\n\nDoes this sound like something you'd like to test out?\n\nCheers,\nJames	t	\N	\N	manual	shyam:contact:228	\N	\N
1500	Ann Weaver	vqczwmtwem@xoeicmbd.com	\N	website	2017-07-21 01:23:09	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://pcgroup.com.uy/15\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:229	\N	\N
1501	S P Gupta	guptacoke24@yahoo.in	9429339216	website	2017-07-23 20:52:00	\N	new	\N	\N	\N	Want to know your own completed projects	t	\N	\N	manual	shyam:contact:230	\N	\N
1683	breri	msccomruvl@gmail.com	88457294834	website	2021-07-26 07:38:14	\N	new	\N	\N	\N	????? ? ???????? ?????? ?? ?????: <a href=https://images.google.com.et/url?q=http://msc.com.ru>????????????? ?????? ?? ????????????</a> 89644431130 (whatsapp, viber, wechat, telegram)	t	\N	\N	manual	shyam:contact:481	\N	\N
1502	Ann Weaver	duywyhernv@ohvrlwvuta.com	\N	website	2017-07-31 16:56:06	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://priscilarodrigues.com.br/url/v\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:233	\N	\N
1503	Govind	govindchaudhari404@gmail.com	9723442999	website	2017-08-05 08:24:54	\N	new	\N	\N	\N	Please send me project information .	t	\N	\N	manual	shyam:contact:234	\N	\N
1504	Ann Weaver	rmbqmq@noeneauhmrh.com	\N	website	2017-08-05 20:45:51	\N	new	\N	\N	\N	I discovered your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://pcgroup.com.uy/15\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:235	\N	\N
1505	Lelandmog	laelebeidiorg@mail.ru	88587735199	website	2017-08-09 14:54:00	\N	new	\N	\N	\N	301 Moved Permanently \r\n<a href=https://www.viagrapascherfr.com/>More info!..</a>	t	\N	\N	manual	shyam:contact:237	\N	\N
1506	Ann Weaver	hsitdj@gwzlcf.com	\N	website	2017-08-12 09:17:55	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://stpicks.com/27\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:238	\N	\N
1507	Sarah Carlson	ompapdxbtuc@iskkbyojl.com	\N	website	2017-08-17 00:21:17	\N	new	\N	\N	\N	This is a comment to the Shyam Group | Best Residential Plots at Dholera SIR webmaster. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your website: http://pcgroup.com.uy/15 - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :) \t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:239	\N	\N
1508	ApedeBeady	quonahquee@bestmailonline.com	88114699599	website	2017-08-19 19:33:09	\N	new	\N	\N	\N	Others is capable of doing a hardon but cannot maintain it during sexual intercourse.  Thus, when the muscles within the penile area are relaxed, more blood will enter the penis and a bigger harder erection will occur.	t	\N	\N	manual	shyam:contact:240	\N	\N
1509	dineshkumar	dk133134.com@gmail.com	9050860650	website	2017-08-23 19:34:04	\N	new	\N	\N	\N	investment.rgg: please callme	t	\N	\N	manual	shyam:contact:241	\N	\N
1510	Sarah Carlson	jnuliaa@plmsyxh.com	\N	website	2017-08-27 04:24:27	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://v-doc.co/nm/jkfq0\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:242	\N	\N
1511	VAJUBHAI Patel	vajubhai.patel53@gmail.com	9737166909	website	2017-08-28 18:26:55	\N	new	\N	\N	\N	Buy a Plot in Pipali.: I want to buy a plot in Pipali	t	\N	\N	manual	shyam:contact:243	\N	\N
1512	Sarah Carlson	nnivchjwqh@aqwmiyafagu.com	\N	website	2017-09-01 04:04:19	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Check it out here: http://url.euqueroserummacaco.com/ifa \t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:245	\N	\N
1513	xoxitaae	sample@email.tst	5556660606	website	2017-09-04 23:23:47	\N	new	\N	\N	\N	1	t	\N	\N	manual	shyam:contact:247	\N	\N
1514	JimmiNu	ec12342vtv@hotmail.com	39343340681	website	2017-09-09 10:16:56	\N	new	\N	\N	\N	DnDj0Q http://www.FyLitCl7Pf7ojQdDUOLQOuaxTXbj5iNG.com	t	\N	\N	manual	shyam:contact:249	\N	\N
1515	Shantanu	shantanu.ece.jiet@gmail.com	8320899384	website	2017-09-16 13:39:12	\N	new	\N	\N	\N	Pls call	t	\N	\N	manual	shyam:contact:252	\N	\N
1516	Sarah Carlson	llkripwup@qlzoumjs.com	\N	website	2017-09-20 06:01:07	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: https://flxv.tk/6\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:253	\N	\N
1517	rajveersinh	tch.aadharravi@gmailcom	7016543595	website	2017-09-25 13:27:37	\N	new	\N	\N	\N	that was amezing side	t	\N	\N	manual	shyam:contact:257	\N	\N
1518	Sarah Carlson	sahbxdif@ammymmctk.com	\N	website	2017-09-27 10:42:16	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://segundaibc.com.br/go/1i \t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:258	\N	\N
1519	Sarah Carlson	fraqyaoez@kuznut.com	\N	website	2017-10-04 04:59:28	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://segundaibc.com.br/go/1i\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://pcgroup.com.uy/2a	t	\N	\N	manual	shyam:contact:259	\N	\N
1520	Andrea Gibson	ouwhpkegsnw@fzhmcqj.com	\N	website	2017-10-12 20:15:43	\N	new	\N	\N	\N	This is a message to the Shyam Group | Best Residential Plots at Dholera SIR webmaster. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your website: https://flxv.tk/6 - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :) \t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://priscilarodrigues.com.br/url/11	t	\N	\N	manual	shyam:contact:261	\N	\N
1522	Andrea Gibson	hkdhds@srtgsozpz.com	\N	website	2017-11-04 20:30:10	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Check it out here: http://segundaibc.com.br/go/1i \t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://corta.co/f5m	t	\N	\N	manual	shyam:contact:269	\N	\N
1523	Abhijeet Das	abhijit1261985@gmail.com	9033850779	website	2017-11-11 23:43:05	\N	new	\N	\N	\N	Wish to Invest: I want to Invest in Open Plots.	t	\N	\N	manual	shyam:contact:270	\N	\N
1524	Prahlad Das Gupta	pdgvin@rediffmail.com	9625607173	website	2017-11-12 07:53:52	\N	new	\N	\N	\N	Pl  Send detailed brochure of your Cholera Dreamcity project	t	\N	\N	manual	shyam:contact:272	\N	\N
1525	Erma Bowman	uummbzrp@pulswxhuiu.com	\N	website	2017-11-14 18:37:13	\N	new	\N	\N	\N	I am reaching out since we saw a link to your website and thought you would be a good candidate for our traffic service. We provide targeted website traffic to virtually any type of website. We target our visitors by both country and keywords that you either submit to us or we can do keyword research for you. We offer a seven day FREE trial period with free traffic so that you can try our service to make sure it will work for you. Which of your websites needs the most growth? Find out more here:http://segundaibc.com.br/go/1i\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://corta.co/f5m\r\nErma Bowman https://flxv.tk/6	t	\N	\N	manual	shyam:contact:273	\N	\N
1526	Virginia Williams	ziahyhptza@vpwyzvhmid.com	\N	website	2017-11-20 16:37:37	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://0nulu.com/opx\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://0nulu.com/mvx	t	\N	\N	manual	shyam:contact:274	\N	\N
1527	Alesia Abraham	abrahamalesias@gmail.com	9958453032	website	2017-11-21 14:52:37	\N	new	\N	\N	\N	Hi\r\n\r\nWe can help your website to get on first page of Google and increase the number of leads and sales you are getting from your website. Please email us back for full proposal.\r\n\r\nBest Regards\r\nAlesia Abraham	t	\N	\N	manual	shyam:contact:275	\N	\N
1528	Virginia Williams	lausvsm@gmail.com	\N	website	2017-11-30 18:25:05	\N	new	\N	\N	\N	This is a message to the Shyam Group | Best Residential Plots at Dholera SIR webmaster. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your website: http://0nulu.com/opx - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :)\t\t\t\t\t\t\t\t\t\t\t \t\t\t\t\tUnsubscribe here: http://0nulu.com/mvx	t	\N	\N	manual	shyam:contact:276	\N	\N
1529	Kathleen D	adi@ndmails.com	8106005493	website	2017-12-02 13:47:55	\N	new	\N	\N	\N	Just wanted to ask if you would be interested in getting external help with graphic design? We do all design work like banners, advertisements, photo edits, logos, flyers, etc. for a fixed monthly fee.\r\n\r\nWe don't charge for each task. What kind of work do you need on a regular basis? Let me know and I'll share my portfolio with you.	t	\N	\N	manual	shyam:contact:277	\N	\N
1530	DebrahSnife	auerdfv@bazavashdom.info	82733976548	website	2017-12-02 14:35:25	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:278	\N	\N
1531	Virginia Williams	kordtpo@gmail.com	\N	website	2017-12-05 13:49:12	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://0nulu.com/rjv\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://0nulu.com/mvx	t	\N	\N	manual	shyam:contact:279	\N	\N
1532	FrancesFex	uhuktvw@bazavashdom.info	87259914414	website	2017-12-05 16:46:45	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:280	\N	\N
1533	Virginia Williams	mjvsvukv@gmail.com	\N	website	2017-12-09 08:00:10	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE web traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://0nulu.com/csy\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://0nulu.com/mvx	t	\N	\N	manual	shyam:contact:282	\N	\N
1534	Heidi Reynolds	fgwqpdqffk@gmail.com	\N	website	2017-12-15 16:56:52	\N	new	\N	\N	\N	I discovered your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Start your free trial: http://0nulu.com/sdq\t\t \t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://0nulu.com/nbz	t	\N	\N	manual	shyam:contact:283	\N	\N
1535	Abrokpromb	vetrovoys@mister-vig.ru	86864784645	website	2017-12-20 05:22:46	\N	new	\N	\N	\N	Ð§ÐµÑÑ‚Ð½Ñ‹Ðµ Ð¾Ñ‚Ð·Ñ‹Ð²Ñ‹ Ð¾ Ð½Ð°Ð¸Ð±Ð¾Ð»ÐµÐµ Ð²Ð¾ÑÑ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ… Ñ‚Ð¾Ð²Ð°Ñ€Ð°Ñ… Ð² 2017 Ð³Ð¾Ð´Ñƒ \r\n \r\nÐ’ Ð´Ð°Ð½Ð½Ð¾Ð¼ Ð³Ð¾Ð´Ñƒ Ð² ÑÐµÑ‚Ð¸ Ð¿Ñ€Ð¾Ð´Ð°ÐµÑ‚ÑÑ ÐºÑƒÑ‡Ð° Ñ‚Ð¾Ð²Ð°Ñ€Ð¾Ð² Ð¸Ð· Ð³Ñ€ÑƒÐ¿Ð¿Ñ‹ Â«ÐšÑ€Ð°ÑÐ¾Ñ‚Ð° Ð¸ Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÐµÂ», Ñ‡Ð°ÑÑ‚Ð¾ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ð¿Ñ€ÐµÐ´ÑÑ‚Ð°Ð²Ð»ÑÑŽÑ‚ ÑÐ¾Ð±Ð¾Ð¹ Ð³ÐµÐ»Ð¸ Ð¸Ð»Ð¸ Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÑÐµÐ¼Ñ‹Ðµ Ð²Ð½ÑƒÑ‚Ñ€ÑŒ Ð±Ð¸Ð¾Ð»Ð¾Ð³Ð¸Ñ‡ÐµÑÐºÐ¸ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ Ð²ÐµÑ‰ÐµÑÑ‚Ð²Ð°. \r\n \r\nÐ•ÑÑ‚ÐµÑÑ‚Ð²ÐµÐ½Ð½Ð¾, Ñ‡Ñ‚Ð¾ Ð¿ÐµÑ€ÐµÐ´ Ð¿Ñ€Ð¸Ð¾Ð±Ñ€ÐµÑ‚ÐµÐ½Ð¸ÐµÐ¼ Ð¸ Ð½Ð°Ñ‡Ð°Ð»Ð¾Ð¼ Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÐµÐ½Ð¸Ñ Ñ‚Ð°ÐºÐ¸Ñ… Ð²ÐµÑ‰ÐµÐ¹ ÑÑ‚Ð¾Ð¸Ñ‚ Ð·Ð°Ð¹Ñ‚Ð¸ Ð½Ð° ÑÐ°Ð¹Ñ‚ Ñ Ð¾Ñ‚Ð·Ñ‹Ð²Ð°Ð¼Ð¸ Ð¸ Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ñ‚ÑŒ Ð¾Ð¿Ñ‹Ñ‚ Ð´Ñ€ÑƒÐ³Ð¸Ñ… Ð¿Ð¾ÐºÑƒÐ¿Ð°Ñ‚ÐµÐ»ÐµÐ¹, Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ð¹ Ð¿Ñ€Ð¸Ð¼ÐµÑ€ Ñ€Ð°Ð·Ð²ÐµÑ€Ð½ÑƒÑ‚Ð¾Ð³Ð¾ Ð¾Ñ‚Ð·Ñ‹Ð²Ð° Ð²Ñ‹ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ ÑƒÐ²Ð¸Ð´ÐµÑ‚ÑŒ Ð½Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ‡ÐºÐµ <a href=https://otzavik.ru/molot-tora-otzuvu/>Ð¼Ð¾Ð»Ð¾Ñ‚ Ñ‚Ð¾Ñ€Ð° ÑÐ°Ð¹Ñ‚</a>  \r\n \r\nÐ˜ Ð¿Ð¾Ð¼Ð½Ð¸Ñ‚Ðµ Ð¿Ñ€Ð¾ Ñ‚Ð¾, Ñ‡Ñ‚Ð¾ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð»ÑŽÐ±Ñ‹Ñ… Ñ‚Ð¾Ð²Ð°Ñ€Ð¾Ð² Ð¼ÐµÐ´Ð¸Ñ†Ð¸Ð½ÑÐºÐ¾Ð³Ð¾ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ñ ÑÐ»ÐµÐ´ÑƒÐµÑ‚ Ð¾Ð±ÑÑƒÐ¶Ð´Ð°Ñ‚ÑŒ Ñ Ð´Ð¾ÐºÑ‚Ð¾Ñ€Ð¾Ð¼, Ð° Ð½Ð° Ð·Ð°Ð½Ð¸Ð¼Ð°Ñ‚ÑŒÑÑ ÑÐ°Ð¼Ð¾Ð»ÐµÑ‡ÐµÐ½Ð¸ÐµÐ¼.	t	\N	\N	manual	shyam:contact:284	\N	\N
1536	Heidi Reynolds	zrbcjprzahl@gmail.com	\N	website	2017-12-24 02:40:04	\N	new	\N	\N	\N	I came across your Shyam Group | Best Residential Plots at Dholera SIR website and wanted to let you know that we have decided to open our POWERFUL and PRIVATE website traffic system to the public for a limited time! You can sign up for our targeted traffic network with a free trial as we make this offer available again. If you need targeted traffic that is interested in your subject matter or products start your free trial today: http://0nulu.com/rjv\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://0nulu.com/mvx	t	\N	\N	manual	shyam:contact:288	\N	\N
1680	Zaviereagef	intimidades@viawithoutdct.com	89423629275	website	2021-06-26 08:20:14	\N	new	\N	\N	\N	Get with knock off broken-hearted price dispensary: cialis commercial 2012 in descending order\r\n cialis softtabs\r\n <a href="https://walmartcialispharm.com/#">cialis walmart\r\n</a> - cheap generic cialis 10mg\r\n https://walmartcialispharm.com - walmart cialis\r\n genuine viagra cialis gel tabs best price	t	\N	\N	manual	shyam:contact:478	\N	\N
1537	Nexloorery	mexlopes@mister-vig.ru	86929348675	website	2017-12-30 15:36:05	\N	new	\N	\N	\N	Ð’Ñ‹ Ñ€ÐµÑˆÐ¸Ð»Ð¸ ÐºÑƒÐ¿Ð¸Ñ‚ÑŒ Ð²ÐµÑ‰Ð¸ Ð´Ð»Ñ Ð·Ð¸Ð¼Ñ‹? Ð¥Ð¾Ñ‚Ð¸Ñ‚Ðµ Ð½Ð°Ð¹Ñ‚Ð¸ Ð¾Ð±ÑƒÐ²ÑŒ? ÐÐµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð½Ð°Ð¹Ñ‚Ð¸ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð½Ñ‹Ð¹ Ð¸Ð½Ñ‚ÐµÑ€Ð½ÐµÑ‚-Ð¼Ð°Ð³Ð°Ð·Ð¸Ð½? \r\n \r\nÐ¡Ð¾Ð²ÐµÑ‚ÑƒÐµÐ¼ Ð·Ð°Ð¹Ñ‚Ð¸ Ð½Ð° Ð¿Ð¾Ñ€Ñ‚Ð°Ð» <a href=http://ugg.msk.ru/>ugg.msk.ru</a> \r\n \r\nÐ˜Ð¼ÐµÐ½Ð½Ð¾ Ð½Ð° Ð²ÐµÐ±-ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ðµ ugg.msk.ru Ð¼Ð¾Ð¶Ð½Ð¾ Ð½Ð°Ð¹Ñ‚Ð¸ <a href=http://ugg.msk.ru/>Ð¼Ð°Ð³Ð°Ð·Ð¸Ð½Ñ‹ Ð² Ð¼Ð¾ÑÐºÐ²Ðµ ÑƒÐ³Ð³Ð¸</a>  Ð¿Ñ€Ð¾Ð¸Ð·Ð²Ð¾Ð´Ð¸Ñ‚ÐµÐ»Ñ UGG Ð² Ð³Ð¾ÑÑÑƒÐ´Ð°Ñ€ÑÑ‚Ð²Ðµ, ÐºÐ¾Ñ‚Ð¾Ñ€Ð°Ñ Ð·Ð°Ð²ÐµÐ·ÐµÐ½Ð° Ð¾Ñ„Ð¸Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð¾, Ð²Ñ‹ Ð¸Ð¼ÐµÐµÑ‚Ðµ ÑˆÐ°Ð½Ñ Ð¿Ð¾Ð´Ð¾Ð±Ñ€Ð°Ñ‚ÑŒ Ð»ÑŽÐ±Ñ‹Ðµ Ð²ÐµÑ‰Ð¸. \r\n \r\nÐ’ Ð°ÑÑÐ¾Ñ€Ñ‚Ð¸Ð¼ÐµÐ½Ñ‚Ðµ Ð¸Ð´ÑƒÑ‚ ÑƒÐ³Ð³Ð¸ Ñ€Ð°Ð·Ð½Ð¾Ð¹ Ñ†Ð²ÐµÑ‚Ð¾Ð²Ð¾Ð¹ Ð³Ð°Ð¼Ð¼Ñ‹. Ð•ÑÑ‚ÑŒ ÑÐ°Ð¿Ð¾Ð³Ð¸, Ð° ÐµÑÑ‚ÑŒ Ð¸ ÑƒÐ³Ð³Ð¸ ÑÐ¾ ÑÑ‚Ñ€Ð°Ð·Ð°Ð¼Ð¸. Ð¢Ð°ÐºÐ¶Ðµ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚ Ð¸ Ð¼Ð½Ð¾Ð³Ð¾ Ð´Ñ€ÑƒÐ³Ð¸Ñ… Ð¿Ñ€ÐµÐ´Ð»Ð¾Ð¶ÐµÐ½Ð¸Ð¹. \r\n \r\nÐ•ÑÐ»Ð¸ Ð²Ð°Ñ Ð¸Ð½Ñ‚ÐµÑ€ÐµÑÑƒÐµÑ‚ ÐºÐ°ÐºÐ°Ñ-Ñ‚Ð¾ Ñ‚Ð¾Ñ‡Ð½Ð°Ñ Ð¼Ð¾Ð´ÐµÐ»ÑŒ, Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´ÑƒÐµÐ¼ Ð²Ñ‹Ð±Ñ€Ð°Ñ‚ÑŒ ÐµÑ‘ Ð² Ð¼ÐµÐ½ÑŽ Â«Ð¿Ð¾Ð¸ÑÐº Ñ‚Ð¾Ð²Ð°Ñ€Ð¾Ð²Â». \r\n \r\nÐ’Ñ‹ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ñ‚Ð°ÐºÐ¶Ðµ Ð²Ð¾ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒÑÑ Ð¸ Ñ€Ð°ÑÑˆÐ¸Ñ€ÐµÐ½Ð½Ñ‹Ð¼ Ð¿Ð¾Ð¸ÑÐºÐ¾Ð¼. Ð¢Ð°Ð¼ Ð´Ð¾ÑÑ‚Ð°Ñ‚Ð¾Ñ‡Ð½Ð¾ Ð±ÑƒÐ´ÐµÑ‚ Ð²Ñ‹Ð±Ñ€Ð°Ñ‚ÑŒ Ð½Ð°Ð·Ð²Ð°Ð½Ð¸Ðµ (ÐµÑÐ»Ð¸ Ð²Ñ‹ Ð·Ð½Ð°ÐµÑ‚Ðµ), ÑƒÐºÐ°Ð·Ð°Ñ‚ÑŒ Ñ†ÐµÐ½Ñƒ. \r\n \r\nÐ•ÑÐ»Ð¸ Ð²Ñ‹ Ð·Ð½Ð°ÐµÑ‚Ðµ serial number, Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´ÑƒÐµÑ‚ÑÑ ÐµÐ³Ð¾ Ñ‚Ð°ÐºÐ¶Ðµ Ð²Ð²ÐµÑÑ‚Ð¸. \r\n \r\nÐÐ° Ñ€ÐµÑÑƒÑ€ÑÐµ ÐµÑÑ‚ÑŒ Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ð¼ÐµÐ½ÑŽ, Ð² ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ñ… ÐµÑÑ‚ÑŒ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ Ð²Ñ‹Ð±Ñ€Ð°Ñ‚ÑŒ Ð¼ÐµÐ¶Ð´Ñƒ Ð¶ÐµÐ½ÑÐºÐ¸Ð¼Ð¸ ÑƒÐ³Ð³Ð°Ð¼Ð¸, Ð¼ÑƒÐ¶ÑÐºÐ¸Ð¼Ð¸ Ð¸ Ð´ÐµÑ‚ÑÐºÐ¸Ð¼Ð¸ ÑƒÐ³Ð³Ð°Ð¼Ð¸. \r\n \r\nÐ’ÐµÐ±-ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ð° Ñ‡Ð°ÑÑ‚Ð¾ Ð¿Ñ€Ð¾Ð²Ð¾Ð´Ð¸Ñ‚ Ñ€Ð°ÑÐ¿Ñ€Ð¾Ð´Ð°Ð¶Ð¸, Ð¸ Ð²Ñ‹ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð½Ð°Ð±Ð»ÑŽÐ´Ð°Ñ‚ÑŒ Ð·Ð° Ð²ÑÐµÐ¼Ð¸ Ð½Ð¾Ð²Ð¾ÑÑ‚ÑÐ¼Ð¸ Ð² Ð¸Ð½Ñ‚ÐµÑ€Ð½ÐµÑ‚-ÑÐ°Ð¹Ñ‚Ðµ.	t	\N	\N	manual	shyam:contact:289	\N	\N
1538	Heidi Reynolds	lhjngdl@gmail.com	\N	website	2017-12-30 19:56:45	\N	new	\N	\N	\N	This is a message to the Shyam Group | Best Residential Plots at Dholera SIR admin. Your website is missing out on at least 300 visitors per day. Our traffic system will  dramatically increase your traffic to your website: http://0nulu.com/sdq - We offer 500 free targeted visitors during our free trial period and we offer up to 30,000 targeted visitors per month. Hope this helps :)\t\t\t\t\t\t\t\t\t\t\t \t\t\t\t\tUnsubscribe here: http://0nulu.com/nbz	t	\N	\N	manual	shyam:contact:290	\N	\N
1539	Mahesh Punde	pundemahesh@gmail.com	9823622426	website	2018-01-02 15:11:19	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:291	\N	\N
1540	Malikero	malikerolsa@mister-vig.ru	88114712227	website	2018-01-05 11:09:00	\N	new	\N	\N	\N	Ð’ÑÐµÐ¼ Ð¿Ñ€Ð¸Ð²ÐµÑ‚! Ð¡ Ð½Ð¾Ð²Ñ‹Ð¼ Ð³Ð¾Ð´Ð¾Ð¼, Ð¶ÐµÐ»Ð°ÑŽ Ð²ÑÐµÐ¼ ÑÑ‡Ð°ÑÑ‚ÑŒÑ, Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÑ Ð¸ ÑƒÐ´Ð°Ñ‡Ð¸ Ð² ÑÑ‚Ð¾Ð¼ Ð³Ð¾Ð´Ñƒ! \r\n \r\nÐžÑ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹ Ñƒ Ð²Ð°Ñ ÑÐ°Ð¹Ñ‚, Ð¼Ð½Ð¾Ð³Ð¸Ðµ Ð·Ð°Ð¿Ð¸ÑÐ¸ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ð¿Ð¾Ð»ÐµÐ·Ð½Ñ‹Ðµ. \r\n \r\nP.S ÐµÑÐ»Ð¸ Ñƒ Ð²Ð°Ñ ÐµÑÑ‚ÑŒ Ð½ÐµÐ¿Ñ€ÑÑ‚Ð½Ð¾ÑÑ‚Ð¸ Ñ Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸ÐµÐ¹, Ñ‚Ð¾ Ñ…Ð¾Ñ‡Ñƒ Ð¿Ð¾ÑÐ¾Ð²ÐµÑ‚Ð¾Ð²Ð°Ñ‚ÑŒ Ð¿Ð¾ÑÐ¼Ð¾Ñ‚Ñ€ÐµÑ‚ÑŒ ÑÑ‚Ð¾Ñ‚ Ð¸Ð½Ñ‚ÐµÐ½ÐµÑ‚ ÑÐ°Ð¹Ñ‚ - <a href=http://m16-poten.ru/kapli-m16-otzyvy/kupity-preparat-m16-v-apteke-goroda-belovo.html>ÐšÑƒÐ¿Ð¸Ñ‚ÑŒ Ð¿Ñ€ÐµÐ¿Ð°Ñ€Ð°Ñ‚ Ð¼16 Ð² Ð°Ð¿Ñ‚ÐµÐºÐµ Ð³Ð¾Ñ€Ð¾Ð´Ð° Ð±ÐµÐ»Ð¾Ð²Ð¾</a>	t	\N	\N	manual	shyam:contact:292	\N	\N
1541	Heidi Reynolds	jrzzmvdfsr@gmail.com	\N	website	2018-01-05 18:25:04	\N	new	\N	\N	\N	I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Check it out here: http://0nulu.com/sdq\t\t \t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://0nulu.com/mvx	t	\N	\N	manual	shyam:contact:293	\N	\N
1542	GoldenTabs	support@goldentabs.com	53783467459	website	2018-01-06 22:00:27	\N	new	\N	\N	\N	r0ngnQ https://goldentabs.com/	t	\N	\N	manual	shyam:contact:294	\N	\N
1543	Bhavna Pravin Bhatt	bhavnabhatt37@gmail.com	9879005114	website	2018-01-10 07:59:12	\N	new	\N	\N	\N	Plot: Plot	t	\N	\N	manual	shyam:contact:300	\N	\N
1544	Arun Salvi	arunvsalvi958@gmail.com	8424873672	website	2018-01-12 17:04:55	\N	new	\N	\N	\N	Very nice.	t	\N	\N	manual	shyam:contact:301	\N	\N
1545	Kashyap	patelkashyap3190@yahoo.com	9898373949	website	2018-01-13 20:56:46	\N	new	\N	\N	\N	Please send me details about this...	t	\N	\N	manual	shyam:contact:304	\N	\N
1546	Pradeep	pnautiyal500@gmail.com	9265761782	website	2018-01-16 06:06:38	\N	new	\N	\N	\N	I wanna know rates of your residential projects	t	\N	\N	manual	shyam:contact:305	\N	\N
1547	Ranjay Dwivedi	ranjay.dwivedi@gmail.com	9850892443	website	2018-01-16 10:30:53	\N	new	\N	\N	\N	I am interested in plot in Dholera Global city.	t	\N	\N	manual	shyam:contact:306	\N	\N
1548	Apoorvbhai	info@badboys.co.in	9825017157	website	2018-01-17 10:42:38	\N	new	\N	\N	\N	Resident project	t	\N	\N	manual	shyam:contact:307	\N	\N
1549	Dr.  Narendra  bhalgamdiya	\N	8238234662	website	2018-01-17 12:39:29	\N	new	\N	\N	\N	I m intresteded	t	\N	\N	manual	shyam:contact:308	\N	\N
1550	Prem prakash mishra	pp.mishra999@gmail.com	9879258798	website	2018-01-28 20:43:35	\N	new	\N	\N	\N	\N	t	\N	\N	manual	shyam:contact:309	\N	\N
1551	andy marrie	andy.marrie@gmail.com	2063095272	website	2018-02-01 17:31:58	\N	new	\N	\N	\N	Hi\r\nWe can help your website to get on first page of Google and increase the number of leads and sales you are getting from your website. Please email us back for full proposal.\r\n\r\nBest Regards\r\nAndy	t	\N	\N	manual	shyam:contact:310	\N	\N
1552	Barneyxcq	jimosa4xf2@hotmail.com	40148194186	website	2018-02-17 05:29:54	\N	new	\N	\N	\N	jdWzgc http://www.LnAJ7K8QSpfMO2wQ8gO.com	t	\N	\N	manual	shyam:contact:311	\N	\N
1553	ABrurgyWraky	raihooveiy@bestmailonline.com	87678233139	website	2018-03-05 04:24:40	\N	new	\N	\N	\N	The ED resulting from that surgery could be either temporary or permanent.  However, it is important to get the doctor's opinion first before taking these oral medications because they might have pessimistic effects about the body. \r\nhttps://www.cialissansordonnancefr24.com/cialis-prix-conseille-2/	t	\N	\N	manual	shyam:contact:316	\N	\N
1554	Laytrikcot	layurtriks@poreglot.ru	86775965555	website	2018-03-08 14:12:30	\N	new	\N	\N	\N	Subrogacion es muy renombrado en todo el mundo. La  motivo principal de eso es que una mujer se hace mami para  neonato despues su  alubramiento.  Un monton de  esposas  quiere ser una mama, pero  cualquiera de ellas  no tiene la posibilidad. Por eso  en los ultimos anos un  dato nuevo aparecio â€“ gestacion subrogada. \r\n \r\nCuando  gestacion es medicamente imposible, hay solo una  manera para ser una mami. Esto es gestacion subrogada.  En principio, en estos  eventos  se utiliza  compensacion monetaria.  Realmente, para  buscar una  chica sana hay que encontrar  centro que proporciona este tipo de servicio. \r\n \r\nRecomendamos  utilizar estea <a href=https://maternidad-subrogada-centro.es/>madres de alquiler</a>   organizacion. En estea  centro ucranianoa  muchas de las mujeres de  EE.UU., R.U y otras paises se hacen  mamas de alquiler. Segun la ley  maternidad subrogada es  juridico. La legalidad y  precio de gestacion subrogada son muy  variables. Depende de  region,  religion,  color de pelo, etc. En nuestrosas  hospitales puedes tomar una  seleccion sobre un tipo de vientre de alquiler. \r\n \r\nRecomendamos a todos nuestros  miembros usar subrogacion  habitual. Pero nuestro servicio incluye tambien la gestacion subrogada. En loslas  agencias de Feskov son  designaciones por la subrogacion. Cuando  ingresa a nuestrosas  organizaciones  basadosas en Ucrania â€“ una parte de Feskov Human Reproduction Group,  tiene un  consultor. El  administrador  se aconsejara sobre  cosas diferentes desde el  inicio hasta el final. Por lo general vientre de alquiler dura  7 meses. \r\n \r\n Entonces el consultor prepara todos los  actos necesarios y Usted puede aceptar al nino. Tambien, el  consultor  obtiene la informacion su familia  proximos 3 meses. Si quiere  recibir un nino, recomendamos ir alli mother-surrogate.com. Gerentes que  pueden ayudar alli son muy  importantes. \r\n \r\nEllos responderan a todas las  cuestiones. Si necesita algun  apoyo, ellos se ayudaran. Tambien ellos  adjuntaran  documentos antes este proceso. En el sitio web Usted puede  observar contactos.  Por lo general puede  descubrir  costas y servicios. \r\n \r\n Soporte tecnico pueden  contestar en  Ingles. Usted puede tomar  eleccion por eso. Si quiere  recibir consultacion sobre gestacion subrogada como un proceso,  Alexander Feskov  ofrecera asesoramiento para Usted.	t	\N	\N	manual	shyam:contact:317	\N	\N
1555	Gunjan kumar	gunjansinha1980@gmail.com	9971707842	website	2018-03-12 02:57:02	\N	new	\N	\N	\N	Investment purpose	t	\N	\N	manual	shyam:contact:318	\N	\N
1558	DOOLIDOT	doolidot@sengi.top	84123589157	website	2018-03-27 22:48:28	\N	new	\N	\N	\N	Wacker, dieser Gedanke fÐ“Â¤llt gerade Ð“Ñ˜brigens \r\nhttp://megionschool3.edu.ru/go?http://xxx.hordo.win/\r\nhttp://jane.hordo.win/\r\nhttp://bbw.buron.pw/\r\nhttp://www.sexfg.pw/\r\n\r\nhttp://ojkum.ru/links.php?go=http%3A%2F%2Flnx.ramblo.gdn%2Ffather-seleoing-sexaustralia-porno\r\nhttp://33Z.de/suchen/jump.php?sid=134&url=http%3A%2F%2Flno.ramblo.gdn%2Ffap-video\r\nhttp://Www.opentrad.com/margen.php?direccion=gl-pt&inurl=http%3A%2F%2Flnu.ramblo.gdn%2Fxxxxxnxxxx\r\nhttp://www.gxroll.com/link.php?url=http%3A%2F%2Flnu.ramblo.gdn%2Fsister-bed-sharing-with-brother\r\nhttp://transyuga.ru/redirect.aspx?url=http%3A%2F%2Flno.ramblo.gdn%2Fcodi-lewis\r\n\r\nhttp://euroisol.ru/out.php?link=http%3A%2F%2Fbk.pornbreeze.com%2Fchudai-phatapt\r\nhttp://aquafind.com/newads/phpAdsNew-2.0.5/adclick.php?bannerid=134&zoneid=67&source=frontpage&dest=http%3A%2F%2Flnp.ramblo.gdn%2Fforced-rape-wake-up-daughters-porn\r\nhttp://Album.Levalloistriathlon.fr/main.php?g2_view=core.UserAdmin&g2_subView=core.UserLogin&g2_return=http%3A%2F%2Flnu.ramblo.gdn%2Fsriti-jha-porn-videos	t	\N	\N	manual	shyam:contact:324	\N	\N
1559	Rani Chachad	rani.chachad@gmail.com	447711027685	website	2018-03-28 16:47:09	\N	new	\N	\N	\N	Hi there, this is Rani here and I am very much keen to your proposed Dholera global city project and would like to know more about it. I would prefer to receive an email first.\r\nKind regards,\r\nRani	t	\N	\N	manual	shyam:contact:325	\N	\N
1560	Hamid khan	hamk909@yahoo.com	8879461197	website	2018-04-04 20:55:19	\N	new	\N	\N	\N	Please forward the rates and emi option	t	\N	\N	manual	shyam:contact:327	\N	\N
1561	Ashish s Patel	ashishpatelap@hotmail.com	9714978900	website	2018-04-06 15:52:55	\N	new	\N	\N	\N	I am looking for budget home in Dholera. Let me know if you have any good option.	t	\N	\N	manual	shyam:contact:328	\N	\N
1562	varun pandya	pandyavs@gmail.com	9925236450	website	2018-04-10 16:29:57	\N	new	\N	\N	\N	Re : Potential sites for retail/commercial/residential/industrial development projects at prime locations in Vadodara, Ahmedabad, Surat, Dholera, Mumbai: Dear Concerned,\r\n\r\nWould like to present potential sites for retail/commercial/residential/industrial development projects at prime locations in Vadodara, Ahmedabad, Surat, Dholera, Mumbai either for outright purchase or co-development with land owners/local reputed developers.\r\n\r\n-- \r\nBest Regards\r\n\r\nVarun Pandya\r\n\r\nReal Estate Consultant\r\n\r\n09925236450	t	\N	\N	manual	shyam:contact:329	\N	\N
1563	Prakashbhai	prakashgohil7276@gmail.com	9924756977	website	2018-04-17 14:35:02	\N	new	\N	\N	\N	I interest in Dholerasir	t	\N	\N	manual	shyam:contact:330	\N	\N
1564	GIRJA SHANKAR JANGIR	jangidg91@gmail.com	802917433010591	website	2018-04-21 17:01:57	\N	new	\N	\N	\N	For job	t	\N	\N	manual	shyam:contact:332	\N	\N
1565	Kisniketup	kiskanike@creditseq.ru	85758938512	website	2018-05-02 13:11:34	\N	new	\N	\N	\N	Ð¡ÐµÑ€Ñ‚Ð¸Ñ„Ð¸Ñ†Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹ Ð´Ð¸ÑÐºÐ¾Ð½Ñ‚ online Ð¼Ð°Ð³Ð°Ð·Ð¸Ð½ Ð¾Ð±ÑƒÐ²Ð¸ Nike Ð² Ð Ð¾ÑÑÐ¸Ð¹ÑÐºÐ¾Ð¹ ÑÑ‚Ð¾Ð»Ð¸Ñ†Ðµ \r\n \r\nÐ’ ÑÑ‚Ð¾Ð»Ð¸Ñ†Ñƒ Ð½Ð°ÐºÐ¾Ð½ÐµÑ† Ð¿Ñ€Ð¸ÑˆÐ»Ð° Ð½Ð°ÑÑ‚Ð¾ÑÑ‰Ð°Ñ Ð²ÐµÑÐ½Ð°, Ð° ÑÑ‚Ð¾ Ð·Ð½Ð°Ñ‡Ð¸Ñ‚ Ñ‡Ñ‚Ð¾ Ð½Ð°ÑÑ‚Ð°Ð»Ð° Ð¿Ð¾Ñ€Ð° ÑƒÐ±Ð¸Ñ€Ð°Ñ‚ÑŒ Ð³Ñ€Ð¾Ð¼Ð¾Ð·Ð´ÐºÐ¸Ðµ ÑÐ°Ð¿Ð¾Ð³Ð¸ Ð¸ Ð¿ÐµÑ€ÐµÐ¾Ð±ÑƒÐ²Ð°Ñ‚ÑŒÑÑ Ð² Ð±Ð¾Ð»ÐµÐµ ÑƒÐ´Ð¾Ð±Ð½ÑƒÑŽ Ð²ÐµÑÐµÐ½Ð½ÑŽÑŽ Ð¾Ð±ÑƒÐ²ÑŒ. ÐžÑ„Ð¸Ñ†Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ð¹ Ð´Ð¸Ð»ÐµÑ€ Nike Ð² Ð Ð¾ÑÑÐ¸Ð¹ÑÐºÐ¾Ð¹ Ð¤ÐµÐ´ÐµÑ€Ð°Ñ†Ð¸Ð¸ <a href=https://justnike.ru/>https://justnike.ru/</a> Ð¿Ñ€ÐµÐ´Ð»Ð°Ð³Ð°ÐµÑ‚ Ð¶Ð¸Ñ‚ÐµÐ»ÑÐ¼ ÐœÐ¾ÑÐºÐ²Ñ‹ Ð¸ Ð¾Ð±Ð»Ð°ÑÑ‚Ð¸ ÐºÑƒÐ¿Ð¸Ñ‚ÑŒ ÑÐµÐ±Ðµ Ð¿Ñ€Ð¾Ñ‡Ð½Ñ‹Ðµ Ð¸ ÐºÑ€Ð°ÑÐ¸Ð²Ñ‹Ðµ ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ¸ Ð´Ð»Ñ Ð¿Ð¾Ñ€Ñ‚Ð° Ð¸Ð»Ð¸ Ð¿Ð¾Ð²ÑÐµÐ´Ð½ÐµÐ²Ð½Ð¾Ð¹ Ð½Ð¾ÑÐºÐ¸ Ð¸Ð· Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð½Ð¾Ð¹ ÐºÐ¾Ð»Ð»ÐµÐºÑ†Ð¸Ð¸ Ñ‚ÐµÐ¿Ð»Ð¾Ð³Ð¾ ÑÐµÐ·Ð¾Ð½Ð° 2018 Ð³Ð¾Ð´Ð°. \r\n \r\nÐ’ Ð½Ð°ÑÑ‚Ð¾ÑÑ‰ÐµÐµ Ð²Ñ€ÐµÐ¼Ñ Nike Ð·Ð°ÑÐ»ÑƒÐ¶ÐµÐ½Ð½Ð¾ ÑÑ‡Ð¸Ñ‚Ð°ÐµÑ‚ÑÑ Ð»Ð¸Ð´ÐµÑ€Ð¾Ð¼ Ñ€Ñ‹Ð½ÐºÐ° Ñ…Ð¾Ñ€Ð¾ÑˆÐµÐ¹ ÑÐ¿Ð¾Ñ€Ñ‚Ð¸Ð²Ð½Ð¾Ð¹ Ð¾Ð±ÑƒÐ²Ð¸ Ð½Ð° Ð²ÑÐµÐ¹ Ð¿Ð»Ð°Ð½ÐµÑ‚Ðµ: Ð¸Ñ… ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ¸ Ð½Ð¾ÑÑÑ‚ Ð´Ð»Ñ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²Ð¾Ðº ÑÐ°Ð¼Ñ‹Ðµ Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ðµ ÑÐ¿Ð¾Ñ€Ñ‚ÑÐ¼ÐµÐ½Ñ‹; Ð¿Ñ€ÐµÐ¼ÑŒÐµÑ€-Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ñ‹ Ð¸ Ð¿Ñ€ÐµÐ·Ð¸Ð´ÐµÐ½Ñ‚Ñ‹, Ð·Ð²ÐµÐ·Ð´Ñ‹ Ð¼ÐµÐ´Ð¸Ð¹Ð½Ð¾Ð¹ ÑÑ„ÐµÑ€Ñ‹ Ð¸ Ð¸Ð½Ñ‹Ðµ Ð»Ð¸Ð´ÐµÑ€Ñ‹ Ð¼Ð½ÐµÐ½Ð¸Ð¹ Ð½Ðµ ÑÑ‚ÐµÑÐ½ÑÑŽÑ‚ÑÑ Ð¿Ð¾ÑÐ²Ð»ÑÑ‚ÑŒÑÑ Ð½Ð° ÑƒÐ»Ð¸Ñ†Ðµ Ð¸Ð¼ÐµÐ½Ð½Ð¾ Ð² ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ°Ñ… Nike. \r\n \r\nÐ•ÑÐ»Ð¸ Ð²Ð°Ð¼ Ð½Ð°Ð´Ð¾ <a href=https://justnike.ru/muzhchiny/>nike ÐºÑƒÐ¿Ð¸Ñ‚ÑŒ ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ¸ Ð¼ÑƒÐ¶ÑÐºÐ¸Ðµ</a> , Ñ‚Ð¾ Ð²Ð°Ð¼ ÑÑ‚Ð¾Ð¸Ñ‚ Ð²Ð¾ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒÑÑ ÑƒÑÐ»ÑƒÐ³Ð°Ð¼Ð¸ Ð´Ð¾Ð²ÐµÑ€ÐµÐ½Ð½Ð¾Ð³Ð¾ Ñ€ÐµÑÐµÐ»Ð»ÐµÑ€Ð° Nike Ð² Ð Ð¾ÑÑÐ¸Ð¹ÑÐºÐ¾Ð¹ Ð¤ÐµÐ´ÐµÑ€Ð°Ñ†Ð¸Ð¸, Ð° Ð½Ðµ Ð¸ÑÐºÐ°Ñ‚ÑŒ ÑÑ‡Ð°ÑÑ‚ÑŒÑ Ð² Ð±ÑƒÑ‚Ð¸ÐºÐ°Ñ…. ÐšÐ¸Ñ‚Ð°Ð¹ÑÐºÐ¸Ðµ Ð¿Ð¾Ð´Ð¿Ð¾Ð»ÑŒÐ½Ñ‹Ðµ Ð·Ð°Ð²Ð¾Ð´Ñ‹ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¾ Ð¿Ð¾Ð´Ð´ÐµÐ»Ñ‹Ð²Ð°ÑŽÑ‚ Ð½Ð°ÑˆÐ¸ ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ¸, Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÑÑ Ð´Ð»Ñ ÑÑ‚Ð¾Ð³Ð¾ Ð½Ð¸Ð·ÐºÐ¾ÐºÐ°Ñ‡ÐµÑÑ‚Ð²ÐµÐ½Ð½Ñ‹Ðµ Ð¸ Ð´Ð°Ð¶Ðµ Ð¾Ð¿Ð°ÑÐ½Ñ‹Ðµ Ð´Ð»Ñ Ñ‡ÐµÐ»Ð¾Ð²ÐµÐºÐ° Ð¼Ð°Ñ‚ÐµÑ€Ð¸Ð°Ð»Ñ‹. ÐšÐ¾Ð½Ñ‚Ñ€Ð°Ñ„Ð°ÐºÑ‚Ð½Ð°Ñ Ð¾Ð±ÑƒÐ²ÑŒ Ð½Ðµ Ð¿Ñ€Ð¾ÑÐ»ÑƒÐ¶Ð¸Ñ‚ Ð²Ð°Ð¼ Ð¸ Ñ‡ÐµÑ‚Ñ‹Ñ€ÐµÑ… Ð½ÐµÐ´ÐµÐ»ÑŒ, Ð² Ñ‚Ð¾ Ð²Ñ€ÐµÐ¼Ñ ÐºÐ°Ðº Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ðµ ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ¸ Nike, Ð¿Ñ€Ð¸ Ñ€ÐµÐ³ÑƒÐ»ÑÑ€Ð½Ð¾Ð¼ ÑƒÑ…Ð¾Ð´Ðµ, Ð±ÐµÐ· Ñ‚Ñ€ÑƒÐ´Ð° Ð¿Ð¾ÑÐ»ÑƒÐ¶Ð°Ñ‚ Ð²Ð°Ð¼ Ð¿Ð°Ñ€Ñƒ Ð»ÐµÑ‚. \r\n \r\nÐ Ð°Ð±Ð¾Ñ‚Ð°Ñ‚ÑŒ Ñ ÑÐµÑ€Ñ‚Ð¸Ñ„Ð¸Ñ†Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¼ Ð´Ð¸Ð»ÐµÑ€Ð¾Ð¼ ÐÐ°Ð¹Ðº Ð² ÑÑ‚Ð¾Ð»Ð¸Ñ†Ðµ  - ÑÑ‚Ð¾ ÐµÑ‰Ñ‘ Ð¸ Ð½ÐµÐ²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÑƒÐ´Ð¾Ð±Ð½Ð¾: Ð´Ð»Ñ Ð¿Ð¾ÐºÑƒÐ¿ÐºÐ¸ Ð¾Ð±ÑƒÐ²Ð¸ ÑÐµÐ¹Ñ‡Ð°Ñ Ð½Ðµ Ð½ÑƒÐ¶Ð½Ð¾ Ð´Ð°Ð¶Ðµ Ð²Ñ‹Ñ…Ð¾Ð´Ð¸Ñ‚ÑŒ Ð½Ð° ÑƒÐ»Ð¸Ñ†Ñƒ. Ð’Ñ‹ Ð²ÑÐµÐ³Ð¾-Ð½Ð°Ð²ÑÐµÐ³Ð¾ ÑÐ´ÐµÐ»Ð°ÐµÑ‚Ðµ Ð·Ð°ÐºÐ°Ð· Ð½Ð° Ñ‚Ðµ ÐºÑ€Ð¾ÑÑÐ¾Ð²ÐºÐ¸ ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ Ð²Ð°Ð¼ Ð¿Ð¾Ð½Ñ€Ð°Ð²Ð¸Ð»Ð¸ÑÑŒ Ñ‡ÐµÑ€ÐµÐ· ÐºÐ¾Ñ€Ð·Ð¸Ð½Ñƒ ÑÐ°Ð¹Ñ‚Ð° Ð¸ Ð¶Ð´ÐµÑ‚Ðµ ÐºÑƒÑ€ÑŒÐµÑ€ÑÐºÐ¾Ð¹ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸. Ð”Ð»Ñ Ð¿Ñ€Ð¸Ð¼ÐµÑ€ÐºÐ¸ Ð½Ð° Ð´Ð¾Ð¼Ñƒ, Ð¿Ñ€Ð¸ ÑƒÑÐ»Ð¾Ð²Ð¸Ð¸ Ð±ÐµÑÐ¿Ð»Ð°Ñ‚Ð½Ð¾Ð¹ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸, Ð²Ñ‹ ÑÐ¼Ð¾Ð¶ÐµÑ‚Ðµ Ð²Ñ‹Ð±Ñ€Ð°Ñ‚ÑŒ 3 Ð¿Ð°Ñ€Ñ‹ ÐºÑ€Ð¾ÑÑÐ¾Ð²Ð¾Ðº, Ð¿Ñ€Ð¸ Ð½ÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð¾ÑÑ‚Ð¸ Ð¿ÐµÑ€ÐµÑ‡ÐµÐ½ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ñ€Ð°ÑÑˆÐ¸Ñ€ÐµÐ½, Ð½Ð¾ Ð² ÑÑ‚Ð¾Ð¼ ÑÐ»ÑƒÑ‡Ð°Ðµ Ð·Ð° Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÑƒ Ð½ÑƒÐ¶Ð½Ð¾ Ð±ÑƒÐ´ÐµÑ‚ Ð´Ð¾Ð¿Ð»Ð°Ñ‚Ð¸Ñ‚ÑŒ. ÐŸÐ¾ÑÐ»Ðµ Ð¿Ñ€Ð¸Ð¼ÐµÑ€ÐºÐ¸ Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ñ… ÐºÑ€Ð¾ÑÑÐ¾Ð²Ð¾Ðº Ð¸ Ð¿Ð¾Ð¸ÑÐºÐ¾Ð² Ð½ÐµÐ´Ð¾Ñ‡ÐµÑ‚Ð¾Ð² Ð½Ð° Ð½Ð¸Ñ…, Ð²Ñ‹ Ð¾Ð¿Ð»Ð°Ñ‡Ð¸Ð²Ð°ÐµÑ‚Ðµ Ð·Ð°ÐºÐ°Ð· ÐºÑƒÑ€ÑŒÐµÑ€Ñƒ Ð¸ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚Ðµ Ð½Ðµ Ð¿Ð¾Ð´Ð¾ÑˆÐµÐ´ÑˆÐ¸Ðµ Ð²Ð°Ð¼ Ð¿Ð°Ñ€Ñ‹. \r\n \r\nÐ’ Ð¾Ð½Ð»Ð°Ð¹Ð½ Ð¼Ð°Ð³Ð°Ð·Ð¸Ð½Ðµ ÑÐµÑ€Ñ‚Ð¸Ñ„Ð¸Ñ†Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾Ð³Ð¾ Ð´Ð¸Ð»ÐµÑ€Ð° Ð»ÐµÐ³ÐµÐ½Ð´Ð°Ñ€Ð½Ð¾Ð¹ Ð°Ð¼ÐµÑ€Ð¸ÐºÐ°Ð½ÑÐºÐ¾Ð¹ ÐºÐ¾Ñ€Ð¿Ð¾Ñ€Ð°Ñ†Ð¸Ð¸ Ð² ÐœÐ¾ÑÐºÐ²Ðµ Ð²Ñ‹ Ð½Ð°Ð¹Ð´ÐµÑ‚Ðµ Ð²Ð¾ÑÑ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ Ð½Ð° Ñ€Ñ‹Ð½ÐºÐµ Ð¸Ð·Ð´ÐµÐ»Ð¸Ñ, Ð² Ñ‚Ð¾Ð¼ Ñ‡Ð¸ÑÐ»Ðµ Ð»ÐµÐ³ÐµÐ½Ð´Ð°Ñ€Ð½Ñ‹Ðµ AirMax Ð¸ <a href=https://justnike.ru/>Ð¾Ñ„Ð¸Ñ†Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ð¹ ÑÐ°Ð¹Ñ‚ Ð´Ð¸ÑÐºÐ¾Ð½Ñ‚ nike</a> . \r\n \r\nÐžÐ±ÑƒÐ²ÑŒ Ð² ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ðµ ÑÐ°Ð¹Ñ‚Ð° ÑƒÐ´Ð¾Ð±Ð½Ð¾ ÑÐ¾Ñ€Ñ‚Ð¸Ñ€ÑƒÐµÑ‚ÑÑ Ð¿Ð¾ Ð²Ð¸Ð´Ð°Ð¼ ÑÐ¿Ð¾Ñ€Ñ‚Ð°, Ð»Ð¸Ð½ÐµÐ¹ÐºÐµ Ñ€Ð°Ð·Ð¼ÐµÑ€Ð¾Ð², ÑÑ‚Ð¾Ð¸Ð¼Ð¾ÑÑ‚Ð¸ Ð¸ Ñ†Ð²ÐµÑ‚Ð°Ð¼. Ð•ÑÐ»Ð¸ Ð² Ñ…Ð¾Ð´Ðµ Ð²Ñ‹Ð±Ð¾Ñ€Ð° Ñ‚Ð¾Ð²Ð°Ñ€Ð° Ð¸ ÑÐ¾Ð³Ð»Ð°ÑÐ¾Ð²Ð°Ð½Ð¸Ñ Ð¿Ñ€Ð¸Ð¼ÐµÑ€ÐºÐ¸ Ñƒ Ð²Ð°Ñ Ð²Ð¾Ð·Ð½Ð¸ÐºÐ½ÑƒÑ‚ ÐºÐ°ÐºÐ¸Ðµ-Ñ‚Ð¾ ÑÐ»Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸, Ñ‚Ð¾ ÑÐ¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒÑÑ Ñ Ð½Ð¸Ð¼Ð¸ Ð²Ð°Ð¼ Ð¿Ð¾Ð¼Ð¾Ð¶ÐµÑ‚ ÐºÐ¾Ð½ÑÑƒÐ»ÑŒÑ‚Ð°Ð½Ñ‚ Ð² ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÑŒÐ½Ð¾Ð¼ Ð¾Ð½Ð»Ð°Ð¹Ð½ Ñ‡Ð°Ñ‚Ðµ. \r\n \r\n \r\nÐ’Ð°Ð¶Ð½Ñ‹Ðµ Ð¼Ð¾Ð¼ÐµÐ½Ñ‚Ñ‹ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸ Ð²Ñ‹ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð¾Ð·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¿Ð¾ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½Ñƒ Ð¸Ð»Ð¸ ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÑŒÐ½Ð¾Ð¼ Ð¿Ð¾Ð»Ðµ Ð¿ÐµÑ€ÐµÐ´ Ð¾Ñ„Ð¾Ñ€Ð¼Ð»ÐµÐ½Ð¸ÐµÐ¼ Ð·Ð°ÐºÐ°Ð·Ð°. ÐŸÐ¾ÐºÑƒÐ¿Ð°Ð¹Ñ‚Ðµ Ñ„Ð¸Ñ€Ð¼ÐµÐ½Ð½ÑƒÑŽ ÑÐ¿Ð¾Ñ€Ñ‚Ð¸Ð²Ð½ÑƒÑŽ Ð¾Ð±ÑƒÐ²ÑŒ Nike Ð² ÐœÐ¾ÑÐºÐ²Ðµ, Ð²ÐµÐ´Ð¸Ñ‚Ðµ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ð¹ Ð¾Ð±Ñ€Ð°Ð· Ð¶Ð¸Ð·Ð½Ð¸ Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡Ð°Ð¹Ñ‚Ðµ Ð½ÐµÐ²ÐµÑ€Ð¾ÑÑ‚Ð½Ñ‹Ð¹ Ð·Ð°Ñ€ÑÐ´ Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÑ Ð½Ð° ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð´ÐµÐ½ÑŒ!	t	\N	\N	manual	shyam:contact:333	\N	\N
1566	Judi	support@genericpharmacydrug.com	38782478955	website	2018-05-11 20:28:54	\N	new	\N	\N	\N	M19Gx2 https://www.genericpharmacydrug.com	t	\N	\N	manual	shyam:contact:334	\N	\N
1567	test	test@test.com	1234567890	website	2018-05-14 18:32:45	\N	new	\N	\N	\N	fdfdafadfdasf	t	\N	\N	manual	shyam:contact:338	\N	\N
1568	SEOFup	miekisimpna2013@seocdvig.ru	85842457799	website	2018-05-26 08:54:41	\N	new	\N	\N	\N	<a href=http://seorussian.ru>Ð·Ð°ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð´Ð²Ð¸Ð¶ÐµÐ½Ð¸Ðµ ÑÐ°Ð¹Ñ‚Ð°</a>   - <a href=http://seorussian.ru>seorussian.ru</a>	t	\N	\N	manual	shyam:contact:340	\N	\N
1569	Rahul Shah	hyrahul64@gmail.com	9029745453	website	2018-05-28 12:33:50	\N	new	\N	\N	\N	Invstment Plot	t	\N	\N	manual	shyam:contact:342	\N	\N
1570	Rebecadoola	qobnxnv@matchtv.pw	84414923855	website	2018-07-02 21:29:56	\N	new	\N	\N	\N	Inquery	t	\N	\N	manual	shyam:contact:348	\N	\N
1571	AbakbakiNof	aricesphia@gmx.com	81369413773	website	2018-07-03 05:40:49	\N	new	\N	\N	\N	Inquery: free penny slots - <a href="https://slots777usa.com/">free slot machines</a> \r\nfree slots games  <a href=" https://slots777usa.com/ ">free slot games</a> \r\nhttps://slots777usa.com/	t	\N	\N	manual	shyam:contact:349	\N	\N
1572	APARTMENTsag	bankcredit7@gmail.com	83349911359	website	2018-07-03 06:15:44	\N	new	\N	\N	\N	Inquery: politics We n we publish all of them current and global facts World, analytics experts. All evil in the world happens with the quiet tacit consent of the indifferent. No one provides us with incentives. We are Enthusiasts. We are building a civil society. The people are the bearer of sovereignty and the only source of power. No one can usurp power. Useful topics - Vot <a href=http://apartment.remmont.com>Arlington Finance</a> \r\n \r\n<img src="http://apartment.remmont.com/wp-admin/images/1.png"> \r\n<a href=https://twitter.com/remontkvartir> TWITTER </a> \r\n<a href=https://www.facebook.com/Anchorage-Business-1282742715160962/> FACEBOOK </a> \r\n<a href=https://plus.google.com/u/0/communities/114510462834849373161> GOOGLE+ </a> \r\n<a href=https://vk.com/public150748727>maine</a>	t	\N	\N	manual	shyam:contact:350	\N	\N
1573	Rebecadoola	kujgecn@matchtv.pw	83937551354	website	2018-07-03 06:25:01	\N	new	\N	\N	\N	Inquery	t	\N	\N	manual	shyam:contact:351	\N	\N
1574	Rebecadoola	jzixhot@matchtv.pw	81879571373	website	2018-07-04 23:38:09	\N	new	\N	\N	\N	Inquery: <b>???????? ?????? 2018 ???????? ??????  h e a</b>\r\n\r\n<a href=http://bit.ly/2y6DqQt><img src="http://i104.fastpic.ru/big/2018/0613/41/9b723f25fe3d6bf8b3bd92d5e9f2e041.jpg"></a>\r\n\r\n<a href=http://bit.ly/2y6DqQt><b>???????? ????? ????????</b></a>\r\n<a href=http://bit.ly/2y6DqQt><b><font color=red>???????? ????? ????????</font></b></a>\r\n<a href=http://bit.ly/2y6DqQt><b><font color=green>???????? ????? ????????</font></b></a>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n???????? ?????? ?????? ?????????, ??? ?????? ???????????? ?????? ? ??????? ???????? ? ???????? ???? ??? ???????????.????????: HD ????: ??????????????? ???????-????: ??????????? ????? ?????? ????????. ???????? ?????? ????????? ??? ??????????? ? ???????, ? HD ????????.\r\n?????; ??????; ????????; ??????; ?????? ??????! ???????? ???????? ?????? ???????? (2018) ?? ??????????:26 ??? 201801:41. Majj-s.\r\n???????, ?? ?????????. ???????? ????? ???????? ?????? ????????? 22 ??? 2018 ???.Delete of DMCA ????? ??????? ?? ??????? ???????????????.\r\n???????? ?????????? ?????? ?? ?????? ? ????? 2018-??. ?????? 13 ??? ????? ?????? ????? ????????? ?? ?????? ?????????? 2018 (RUS). Info. Shopping??????? ??-?, ?????????? ???????, 2, ?????? ?.\r\nThor: Ragnarok) — ???????????? ?????????????? ????? 2017 ???? ? ?????????? ????????? ????? ??? 2: ??????? ???? ? ??????? 2013 ????, ????? ???????? ???????? ???????? ??????????? ?????? ????????? ????????.??????, ?????????? ?? ???????? ????, ??????? ???? ???????????????\r\n???????? ??????:???????? — ?????-??????? (2018)? 14:15 ??? "??????????" - ???????????? ????? "??? ??????? ??????? 2" ??? ???????\r\n?????????? (AAC, ALAC) ??????? ????? ??????? ?????????.???????? ????-3: ?????????? ?????? ????????? ???????, 2017, ??????????? ?????, 64 kbps"????????" + "????????" ??? ???????: 2006 ?????: ?????? ??????????\r\n?????? (2018) 4 ????? 2018 ??????? ??????? ??????? ? ??????? HD ????????. ????? ??????? ???????? (2018)??????????? 1-6 ?? 8 2018, ?????, ?????????, HDTVRip,??, 66, 91, ??????? ???????.\r\n? ????????? ??????? ? ????????????, ??????? ?????? ??????? ?? ????????. ??? ??????. ?????? 2. ??? ??? ??????????. ????????? ?????.\r\n???????? ?????? ???????? ? ????????. ????? ??????? ???? ? ???? - ?????? ? ?????? ???????? ??????? 1 ???? 2018 ? 15:54 10.\r\n???????? ? ?????. ??? ?????? ?? ????????? ???? ??????????? ?????? ?? ??? ????????? ??????? ????? ????????. ?????????\r\n????????: ??????????? ??????????. ?? ????? ?? ?? ???????? ???:?????????, ????????, ????????. ?????: ?????????? ??????? + ??????????\r\n???????? ????? ??????? ????? "????????"???????? ????? 2018 ???????? ?????? HD 720p ??????? ????? ????????????? ?????? ????? ????? ? ??????? ??????? ???????? hd. 0 ?????????. 02:15\r\n.2018, 20:20:00. ????? ??????, ?? ????? ???????? ?????????? ?? ?????.?????? ????????(???????????) .2018, 19:45:47.\r\n\r\n\r\n?????? ???????? epub ??????? ??????? ??????? LAN 04-05 (??????-???) (2018) PDF.MB. 0 0. 09 ??? 18. ????????????? ?????? 23 (2018) PDF. 29.61 MB. 0 0. 09 ??? 18 ??? ?? ??????? - ???????? ????????? (2018) MP3. 458.61 MB. 0 0. 07 ??? 18.\r\n??????? ?????? ????????????? ??????. ???????? ???????? (2018). ??????? ??????, ?????? 2018, ??????? ???????????, ??????????? ? ??????????. ????????: ?????? ????????? ???????? ???? ??????????? ?? ????????? ?????? ????????????? ?????? ???????? ??? ?? ???????? ???????? (2018) ??????, ? ??? ? ???? ??????? ??????? ???. ????? ????????????: 2. ??????? ?????? ????????????\r\n???????? ?????? ???????? (2018) ? HD 720. ???????? ?????? ?????? ????? ???????. ???????? ????? ???????? (2018) ?????? ?? ??????? ????????, ????????, i Phone ? iPad ??? ??????????? iOS ? ??????? ???????? hd 720 ????????? ? ??? ???????, ??? ????? ???????????? ??? ????????? ????????? ??????????. ?????????? ??????: ?????? ??????? (2017) ??????? 11, 12 ?????. ???????, ??????, ??????????? ???????????, ?????????????? ???????????, ???????? ???????? ?????, ? ???????, ?? ??????, ?? ???? ??. ????????: ????? ????????????? (2018).\r\n???????? ???????? (2018) ??????. ?????????: malexv ????????????: 0 ??????????: 4 836. , 21:15 22. 23. 24.\r\n??????? ??????? ????????? ??????, ???????, ????, ??????, ?????, ?????????, ????????? ??????? ???????(Rock) ???????? - ????? ????? - 2011, MP3, 320 kbps ??????? ??????? ?????????. ??????? Rockchernovik-novoevremya.torrent. (Rock) ???????? - ????? ????? - 2011, MP3, 320 kbps ??????? ??????? ?????????. ???????????: ????? ????: 3-06-2018, 10:06.torrent ???????: 0. ????: Rock ??????: ?????? ??? ???????: 2011 ??????????: MP3 ??? ????: tracks ??????? ?????: 320 kbps ?????????????????: 00:49:21. ????????. 01. ???????? - ????? ????? (3:44) 02 ???????? - ??????? (4:19) 11. ???????? - ?????? (4:47) 12. ???????? - ????????? (4:17). (Rock) ???????? - ????? ????? - 2011, MP3, 320 kbps.\r\n???????? ???????? (2018) ??????? ???????. -4 6. ????? ??????: ???????? (2018) ?????? ????? ?????????? ?????? ????? ?????????????? ???????????? ???. ?? ????? ??????????? ???????? ????????, ??? ?????????? ?????? ?????. ?????? ????? ????????? ?????, ?? ???????????? ? ???????????? ?????????.\r\n???????? ?????? ???????? (2018) ??????? ??????? ??????? ??????? ?????? — ??????????? ???????? ???????????? ???. ? ???? ?????????? ???? ?? ??????????? ??????? ??????? ?? ?????? ????, ???? ?? ???? ? ?????. ?????? ??????, ??? ?????? ??? ???? ? ????? ?? ???? ???????? ? ?????????????. ?? ? ???? ????? ???? ???? ?????? ?? ?????. ?? ????? ?????? ???????? ??? ?????? ??? ????? ??????. ????? ??????? ?????? ?????? ??????? ????, ? ??????? ????? ??????????. ??????????. sergej86. id 3. ???? - 28-05-2018 13:25. ?????? ?????? -. Wigorus , 2 ????? ??????!\r\n?? ?????????? ????? ??????? ?? ???????? 15 ????? ? ??????????. ???????? — ??????? (2018). ?????? ?????-??????? ?????? ???????? 2018 ???? ??????? ???????? ? ???????, ???????? ? ?????! ?????????? ?????? ? ??????? ? ?? ???????! ????????? ?? 2018-05-24. ???? ???????? ???????? ???????????? ???. 2018-05-23.\r\n?? ??????????? ????????? ????????????? ???? ???????, ????? ? ??????? ????????, ???????? ??????? ?????? ?? ??????. ??? ?????? ??????? ????????? ???, ??? ??????? ????? ?????? ??? ??, ? ??? ?? ??? ?????-?? ?????? ? ?????. ??? ?? ?????? ?? ????????????, ?? ???????, ?? ???? ?????? ?????????????? ??????. ????????: HDRip. ??????:GB. ???????? 2018 ??????? ???????. ??????. ???? ???????? ? ??? ??? ?????? ?????? ???????? ???, ????? ?????? "??????"! 1.\r\n????????? ???????. ???????? ?????????.?????? ???. 1 000. ?????????? ??? ????? ???????? ? ???, ??? ??? ???? ?????. ??? ?????????? ? ???????? ??????????? ?????? ??????? ?????. ?????????? ????????? ??????? ??????, ??????????????? ??? ??????????? ?????????????? ?????? ????? ???????? ?????????? ??????????? ?? ???? ???????? ??????? ???????? ???????? ????????? ?????. 1. 192. ????????? ???????. 14. 195. ??????? ?????????.\r\n??????? ???????? (2018) ????? ??????? ????????? ? ??? ??????????? ?? ??????? ????????! ?????? ?????? ?????? ??????? ???????? ??????? ????????????????????????????????? (2018). ???????? (2018). 1. 2. 3. 4.\r\n\r\n\r\n??????? ?????:\r\n???????? ????? ?????\r\n???????? ?????? ????????\r\n???????? ????????\r\n???????? ?????? 2018 ???????? ??????\r\n???????? ????? 2018 ????????\r\n???????? ??????? 2018\r\n?????? ?????? ???????? 2018\r\n?????????? ????? ????????\r\n???????? ????? ???????? ??? ???????????\r\n???????? ????? 2012 ???????? ??????\r\n???????? 2018 ???????? ?????? ??? ???????????\r\n\r\n\r\n???? ???????:\r\n<a href=http://www.dreamsyssoft.com/forum/viewtopic.php?p=257188#257188>???? ????? ??????  e a c</a>\r\n<a href=http://www.alkhaleej-highschool.com/vb/showthread.php?p=201742#post201742>???????? ??????? 2018  h m e</a>\r\n<a href=http://phps.801sg.com/showthread.php?tid=6424>??? ????????????? ? ????????? ?? ?????????? ???? ??????  f i i</a>\r\n<a href=http://minertop.net/viewtopic.php?f=15&t=32971>????? ?????? ????  y b h</a>\r\n<a href=http://cryptobac.com/showthread.php?tid=94&pid=60265#pid60265>??? ????????????? ? ????????? ?? ?????????? ????? 2018 ???????  h c e</a>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n.	t	\N	\N	manual	shyam:contact:352	\N	\N
1575	Deepak	dm.intelliworkz@gmail.com	8000158605	website	2018-07-06 16:25:58	\N	new	\N	\N	\N	Buy Plot in Dholera Global City: I want to purchase Plot in Dholera Global City.\r\nPlease send me price for plot	t	\N	\N	manual	shyam:contact:353	\N	\N
1576	SuzanneMix	utpmdoh@matchtv.pw	85459945449	website	2018-07-07 22:34:52	\N	new	\N	\N	\N	Inquery	t	\N	\N	manual	shyam:contact:354	\N	\N
1577	wp54y5w4	2kd7zxwt@outlook.com	83981328734	website	2018-07-08 07:35:51	\N	new	\N	\N	\N	Inquery: play roulette - <a href="https://roulettecas.com/">free roulette game</a> \r\nroulette free play  <a href=" https://roulettecas.com/ ">roulette simulator</a> \r\nhttps://roulettecas.com/	t	\N	\N	manual	shyam:contact:355	\N	\N
1578	Avouxquesy	xandltweseapidwignikele@moramail.bid	82327234731	website	2018-07-08 10:13:45	\N	new	\N	\N	\N	Inquery: casino play <a href="https://onlinecasinoplay.us.org/">online casinos</a> online casinos <a href=" https://onlinecasinoplay.us.org/">online casino games</a> | <a href=https://onlinecasinoplay.us.org/>best online casinos</a> <a href=https://onlinecasinoplay.us.org/>online casinos for us players</a>	t	\N	\N	manual	shyam:contact:356	\N	\N
1579	Loan Cash	jbmowery@rainmail.win	83428843957	website	2018-07-08 19:40:23	\N	new	\N	\N	\N	Inquery: cash america payday advance <a href="http://aloan.cars">same day payday loan</a> loans <a href=http://aloan.cars>loans with bad credit</a>	t	\N	\N	manual	shyam:contact:357	\N	\N
1580	SuzanneMix	srgcyko@matchtv.pw	84889979753	website	2018-07-09 06:58:13	\N	new	\N	\N	\N	Inquery: <b>?????????? ????? ????????  h x v</b>\r\n\r\n<a href=http://bit.ly/2J9cfVs><img src="http://i105.fastpic.ru/big/2018/0707/63/b22ba0b737403c2ab92fe7b29d5c4d63.jpg"></a>\r\n\r\n<a href=http://bit.ly/2J9cfVs><b>???????? ????? ????????</b></a>\r\n<a href=http://bit.ly/2J9cfVs><b><font color=red>???????? ????? ????????</font></b></a>\r\n<a href=http://bit.ly/2J9cfVs><b><font color=green>???????? ????? ????????</font></b></a>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n?????? 2018 ? ??????? ???????? ? ?????? ??????? ???? 2018 ???? ?? ?????? ???????? ?????? ???? ?? ?????? ??????? ? ?????? ??????????? ? ??? ????????, ?? ?? ?????????? ???? ?????.? ???? ??? ????????? ????????? ? ??????????? ??????? ????????, ??????? ?????????? - ???????? (67).\r\nlogo. avatar. ??????? ???? ??????? ?????? ????????????? ??????? ??????? ????? ????????????? ?? ????? ????????20 ????????.\r\n????? ???? ??????????: ??????????? ???????? ????????? ?????????url???????? b?????????????? ????? ?????b ?????, ???????,85-??????? ????? ????????? ?? ?????????? ( Cure For Insomnia, ???, 1987),\r\n?????? ???????? ??????, ??????? 2018, ????? ?? ????? ????? ?? ?????? ???????? ????? ?????? 2018???????: 18??????????? (1)\r\n?????, ???????? ???????. ??? ??? ????? ?????? ????? ???? ?????????, ??????? ????? ??????????? ????????? ??? ???.? 15:28. ????????\r\n???????? ???????? ?????? ?????? 2017?????? ?????????. ????????????? ?????? ?????? ?????????. ????? 2 2017 ? ???????\r\n????????, ???? ? ??, ??????, ??????. ???????? ?????? ??????1:58:13. ?????????? Insomnia, 2002 HD. 2 807 ??????????????? 04:49. ????. .\r\nb ?????????, ????? 3: ?? ?????? ???????? ?????? 2016 ? ??????? ???????? 0lmb2016 9:34 am. ??????? ????? ??????? ????? ??? ?????? ? ??? ?????? 2016 ? Mar 08, 2016 9:3325 mg sominex insomnia quizurl.50 vs 64. ?????? ??????????????????? ????????? Marvel(15: 15 ?.)\r\n???????? ?????????? 2018 ???? ? ??????? ???????? HD ?? ???? ?????. ?????? ???? ??? ??????????.???????? (2018) No dormirs. IMDB . CamRip.\r\n?????? ???????? ???????? ??????.??????? ????: ? ??????? ???????? Gong fu yu jia (2017) HD 720?????, ?????; ?????? : 65 000 000: K???????? :(6832); IMDB :(6230)????????No dormirs (2018) HD 720.\r\n????? 2018. ?. ??? ???????. ??. ??????? ?? ???? 2018. ?3. ? ?????? ? ??????????? ????? ????????????? ??????: ? ?????? ??????, - ????2. 4.\r\n???? ?????? ?????? ????????? ??????, ??????? ??? ???????? ?????? ?????? ?????????? 1 ????? (2014) ??? ????? ?????????.\r\nHD ??????? ??????, ????????? ????????? ???????? ???? ???. 34.(2018); ???????? No dormirs (2018); ????????????? ?????Charming (2018)? ????? ?????????? ?? ?????? ??????????? ???????? ????????????\r\n???????????? ???????? ??????? ? ????? ?????, ??????? ?? ?????? ??????? ?????? ?????? ?????? ??????? ???????????? ???????? ???????? ??? ??????????? ?????.???????? 2-07-2018?????????????: 86 ???.\r\n??? ???, ??? ????????? ?????, ?? ?? ??????? ?????? ?????,??? 2018 ????? ???????? ?????? ? ??????? ???????? ??????6 ??? 2018 ?? ????? ????? ?? ?????? ???????? ?????? . ??? ?????? ?????? ????? ????? ?????? . ??? ???????? ?????? ????? ????????? ????? ??????.\r\n\r\n\r\n\r\n\r\n??? ????????? ??? ????? torrent (???????). ???? ?? ?????????????? ? ?? ?????? ??????????? ?????? ????????????, ? ???? ????????????? ?????? ? ???????????? ?????????????? ???????? ?????? ?? ???????-?????, ??????? ???????? ?????? ?????? ???-????. ??????? ??. Nitey J. T.29-???-10 21:42 (?????? 2 ???.) ??????????. ?????.\r\n??? Insomnia, ??????, ??????. ??????? ?? ???? ??? ?????????????????, ????? ????????? ? ???? Insomnia ??? ????? ?????? ????? ??????.\r\nVideo search results for ????????-?-???????-????????-???????? 10:51. ???-5 ?????? ????????? 2017 ????, ??? ???????? ? ??????? ????????. ???? ?? ????????? ???????? ??? ?????????? ??????????? ????????? , ?? ??? ??? 5 ????? ?????? ? ????? ?????????? ????????? 2017 ????. nn ??? ?????????????? ? ???? ???? ?????? ????? ????? ??????? ? ????????? ? ??????? ???????? (??????????? ???. ??????? Rodion. 1807 ?????????. 9 ???. ?????. 1:43:24. ????????No dormirs (2018) TS ??????????? ???????? ????????? ? ???? ??? 1?3?- ???????? ??????!\r\n???? ????? 17. ??? ????? ?????? ?? ??? ????????????. ??????? ?? ???????? ???????? ??????????? ? ?????????? ? ????? ????? (??? ?????????? ????) ? ?????? ?????? ???????? ????? ?????? 2018. ?? ????? ??? ????? ????????????. ?? ????? ????? ?? ?????? ???????? ?????????, ??? ????? ??????? megaline ? beeline ? ??????? ???????? ?? ????? ??????? . ????? ???????????? : 0. ???\r\nInsomnia 100% Geometry dash. Evil Time. ???????? ???????? ???????? ?? ????? "Evil Time"? ???. ?????????? ?? ????????. ????????? The Seven Ocean 100% (all coins) Geometry dash - ?????????????????: 1:52 Evil Time 30 ??????????. 1:52. ????? ???? "Minecraft". - ?????????????????: 1:37:09 Evil Time 38 ??????????. 1:37:09. ????? ???? "Terraria". - ?????????????????: 1:05:57 Evil Time 6 ??????????.\r\n????? ??????? ?????? ?????? ?????? 2018 ???? — ???????? . ? ???? ?????? ?? ????????? ??????? ? ??????? ???????????? ? ? ?????? ???? ?????????, ? ????? ?????? ???? ???????? ? ??????????? ? ??????????? ??????? ????????? ?????? ????????admin 2018-05-20T15:56:22+00:00. ?????? ????? ???????? 2018.admin 2018-05-06T20:26:58+00:00. ?????? ????? ??????? 2018.admin 2018-05-05T14:11:19+00:00. ?????? ????? ??????????? 2018. ??? ????????????. ??????? ????????.\r\n???????? ?????? ?????? 2018????????. ???????? (2018) ????? ???????? ??????. ???????????? ????????: No dormirs ????????: TS ??????: ???????, ?????????, ??????? ???: 2018 ????: ?????, ???????, ???????? ????????: ??????? ???????? ?????????????????: 106 ???.01:46. ????? ?? ??????: ?????????? ???????: ???? ?????? ???????? ????? ???????? (2018) ?????? ?????????.\r\nDecember 16th, 2017. reposted by imagoinsomnia. ??????????? ??? ?????. ?????? ? ?????????? ????? ????????, ??? ??? ???? ?? ????? ? ??????, ??????? 18. 19. 20.\r\n??????? ??????? ?????? ???????? 2018 ????.???? ?????? ? ??28 ???? 2018.???????????? ????????: No dormirs ??????: ?????????, ???????, ???????????????????: ???? ????????????: ??????? ????????????: ?????, ???????, ????????.? ??????? ?????: ??? ??????????, ??????? ?? ??????, ???? ??????? ??????, ?????? ?????, ?????? ????????, ????? ?????, ??????? ??????.? ??????: ? ??????????? ??????????????? ????????? ??????????? ?????? ???????????????? ? ???????????, ???????? ? ????? ?????????? 02:21. ???????? — ??????? ??????? (2018). 5 ????????? ????????? ??? ???????????. ???????? ???????.\r\n?? ???? ????????, ?? ??????? ??????? ????? ??????? ???????? (2018) TS ????????? ? ??? ???????????. ??????????? ??????? ??????. ???????? ?? ?????? (2016) BDRip 720p. 287 51. ????????? (2017) WEB-DL 720p. 329 52. ????????? ???? (2016) HDRip. 338 58. ????? (2015) BDRip 720p. 411 71. ??????? ??????? (2017) BD-Remux. 649 81.\r\n?????? ???????? ??????. ???????. ??????? ?????? ????????? ??? ???? ??????? ??????????? ??????????? ???????? ??????, ???????? ???????? ?????????? ? ???? ???. ?????? ??? ?? ????? ?? ??????? ?????????? ?????????? ??????. ????????, ????? ????????????, ? ????????????? ??????? ????????? ?????????? ????????, ???????? ????? ?????????? ? ???????????????.\r\n????? ????? ????? ?????? ????? ??????. ????? ???????? HD ????????. ??????? ???????. ??? ?????? Luc Besson. ???????: ????????, ?????????, ????????, ?????, ????????, ???????? ??? ?????? ? ??????? ?? ???????? ??? ?????? ???????? ?????? ????????? ? ??????? ???????? HD 720.????? 5Taxi 5.???????????Renegades.\r\n19-06-2018, 17:19. ???????? (2018). ??????????? ??????????????? ?????????? ????? ?????? ????? ??? ???????? ?????? ?????????. ?? ??????? ??????? ?????? ?????? ????? ?????????, ????? ???????? ??????? ????. ?? ???? ???? ???????? ?????????? ?????? ?? ?????? ????? ????????? ????. ???????? ?????? ???????? ?? ????????? ? ????????? ??????? ??????. ??? ?????? ?????? ?????? ???? ???????? ??????, ??? ????????? ????????? ?? ???????? ?????????? ??????? ?? ?? ?????????? ???????? ?????? ???????? (2018) ? ??????? ????????. ???????? ??????. ??????? ????? ?????????, ??? ????? ????????? ??????????? ?? ???????? ???????? HD 720p, ??? ?????? ?????????? ? ????.\r\n????? ?? 8)Insomnia (2018WEBRip) ????? ?????????? ????????? ??? ????????, ?? ???????? ???????????? ???????? ??? ?????? ????? ? ?????????? ???????! ???????? ?? ????????? ? ?????????? ???? ??? ??? ??? ?????! ????????: ????? ????? ??????, ?? ???? ????? ?????? ????? ?????? (????? + ??????). ??? ??????? ???????? My Pet Dinosaur (2017BDRipHDRip) ??????? ? ?????? ?????. ?????????: ????? ???????, ???????????: d0lbyDigital22-01-2018, 16:16. 0.\r\n?????? ?????????? ??????CAMRIPTS???????? (2018). ???????? (2018). No dormirs. -3 ??????????: InsOmnia.2O18. (3 Gb). InsOmnia.2O18 ????????: Robocot-pirat (1 ???? 2018 13:53). ??????????: ???????? ??????? - ?????!!! ????????? ? ????? ????! ????????? ????????? ???????????!\r\n\r\n\r\n??????? ?????:\r\n????? ?????? ????????\r\n???????? ???????? ?????? hd\r\n???????? ????? ??????\r\n???????? ???? ????????\r\n???????? ???????? ????? ??????\r\n???????? ????? ????????\r\n???? ???????? 2018\r\n?????????? ????? ????????\r\n???????? ???????? ?????? 2018 ? ??????? ????????\r\n???????? ??????? ???????\r\n\r\n\r\n????? ??????????? ? ?????????:\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n.	t	\N	\N	manual	shyam:contact:358	\N	\N
1581	Payday Express	tessie@rainmail.win	86313628446	website	2018-07-09 15:00:38	\N	new	\N	\N	\N	Inquery: loans <a href="http://aloan.cars">loan with bad credit</a> loans <a href=http://aloan.cars>consolidate debt loan</a>	t	\N	\N	manual	shyam:contact:359	\N	\N
1582	KozhaApore	prout@livesilk.info	86989592213	website	2018-07-09 15:30:04	\N	new	\N	\N	\N	Inquery: ???????????????? ??????? ????? ?? ????? ???? ?? ?????? ? ????? <a href=https://kozha-lica.ru/problemnaya/krasnoe-pyatno.html>??????? ??????? ????? ?? ????</a> ? ??? ?????? ?????? 1 ?.	t	\N	\N	manual	shyam:contact:360	\N	\N
1583	Online Loans	lukekelly78@regiopost.trade	89684817296	website	2018-07-09 18:57:14	\N	new	\N	\N	\N	Inquery: bad credit installment loan <a href="http://aloan.cars">loans</a> loan with bad credit <a href=http://aloan.cars>loans</a>	t	\N	\N	manual	shyam:contact:361	\N	\N
1586	Targeted website visitors	winaaxc@dnkgizt.com	\N	website	2018-07-10 09:00:26	\N	new	\N	\N	\N	Inquery: I came to your Shyam Group | Best Residential Plots at Dholera SIR page and noticed you could have a lot more traffic. I have found that the key to running a website is making sure the visitors you are getting are interested in your subject matter. We can send you targeted traffic and we let you try it for free. Get over 1,000 targeted visitors per day to your website. Check it out here: http://stpicks.com/2rusd\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tUnsubscribe here: http://stpicks.com/2ruse	t	\N	\N	manual	shyam:contact:364	\N	\N
1587	Best Online Loans	gjjfk@regiopost.trade	88561551566	website	2018-07-10 17:14:01	\N	new	\N	\N	\N	Inquery: loans <a href="http://aloan.cars">loans</a> bad credit payday loans <a href=http://aloan.cars>personal payday loans</a>	t	\N	\N	manual	shyam:contact:365	\N	\N
1588	Quick Loan	honeytn8@regiopost.trade	83923542373	website	2018-07-10 20:28:37	\N	new	\N	\N	\N	Inquery: loan bad credit <a href="http://aloan.cars">direct lender tribal</a> loans <a href=http://aloan.cars>loans</a>	t	\N	\N	manual	shyam:contact:366	\N	\N
1589	Fastest Payday Loan	april@pochtar.men	82338577642	website	2018-07-11 00:47:13	\N	new	\N	\N	\N	Inquery: loans <a href="http://aloan.cars">bad credit payday loans</a> bad credit loan <a href=http://aloan.cars>loans</a>	t	\N	\N	manual	shyam:contact:367	\N	\N
1590	Best Online Loans	t4bix@rainmail.win	87833545663	website	2018-07-11 10:07:29	\N	new	\N	\N	\N	Inquery: loans <a href="http://aloan.cars">loans</a> loans <a href=http://aloan.cars>stafford loans</a>	t	\N	\N	manual	shyam:contact:368	\N	\N
1591	Payday	mrperry0817@pochtar.men	84136349746	website	2018-07-11 13:18:45	\N	new	\N	\N	\N	Inquery: loans bad credit <a href="http://aloan.cars">loans for bad credit guaranteed</a> loans for people with bad credit <a href=http://aloan.cars>loans</a>	t	\N	\N	manual	shyam:contact:369	\N	\N
1592	test	intelliworkzbusiness@gmail.com	9427801299	website	2018-07-11 17:17:23	\N	new	\N	\N	\N	esjoerjte4iort: werwert	t	\N	\N	manual	shyam:contact:370	\N	\N
1593	Online Lenders	shamika@regiopost.trade	85135276416	website	2018-07-11 21:25:52	\N	new	\N	\N	\N	Inquery: no teletrack payday loans <a href="http://aloan.cars">loans with bad credit</a> cash loans with monthly payments <a href=http://aloan.cars>money fast online</a>	t	\N	\N	manual	shyam:contact:371	\N	\N
1594	CARsag	aaw1swq@gmail.com	84384426838	website	2018-07-12 11:48:52	\N	new	\N	\N	\N	Inquery: ??USA political news. We n we publish all of them current and global news Russia, estimates experts. All negative on earth is created with the quiet tacit consent of the indifferent. No one provides us with incentives. We are People. We are building a civil society. The people are the bearer of sovereignty and the only source of power. No one can usurp power. Useful topics - Crimea <a href=http://www.car.remmont.com>Trading News</a> \r\n \r\n<img src="http://car.remmont.com/wp-admin/images/3.jpg"> \r\n<a href=https://twitter.com/remontkvartir> TWITTER </a> \r\n<a href=https://www.facebook.com/New-Business-1834218536897721/> FACEBOOK </a> \r\n<a href=https://plus.google.com/u/0/communities/104816810263547310735> GOOGLE+ </a> \r\n<a href=https://vk.com/public152372263>corpus-christi</a>	t	\N	\N	manual	shyam:contact:372	\N	\N
1595	DoveScefs	newkidboy@yahoo.com	74996854313	website	2018-07-15 01:47:19	\N	new	\N	\N	\N	Important question: So you like something startup new? Look at this website. Only here the choice of horny for every taste and completely free! They are good slaves, they will and want implement everything you say ! \nhttp://gov.shortcm.li/kings1#N73	t	\N	\N	manual	shyam:contact:373	\N	\N
1596	dfg	vicky@gmail.comdfg	\N	website	2018-07-17 17:55:17	\N	new	\N	\N	\N	dgdf: hjhgh	t	\N	\N	manual	shyam:contact:377	\N	\N
1597	sas	palak@gmail.com	908465665656	website	2018-07-18 18:22:43	\N	new	\N	\N	\N	asas: asas	t	\N	\N	manual	shyam:contact:382	\N	\N
1598	fsdafds	fdasf@fdf.com	\N	website	2018-08-08 18:53:19	\N	new	\N	\N	\N	fadfd: fdaf	t	\N	\N	manual	shyam:contact:384	\N	\N
1599	Ashutosh	ashutosh4v@gmail.com	8451064600	website	2018-08-12 13:31:03	\N	new	\N	\N	\N	Details of residential project: Kindly share the details of the residential project such as flats, row houses and NA plots  via email or telephone	t	\N	\N	manual	shyam:contact:385	\N	\N
1600	Dhaval bhai	dvyas1411@gmail.com	9925087096	website	2018-08-15 23:01:23	\N	new	\N	\N	\N	Dholera: Dholera	t	\N	\N	manual	shyam:contact:386	\N	\N
1601	MOHAN BANOOTH	mohan.banooth@gmail.com	9427504710	website	2018-08-16 19:29:38	\N	new	\N	\N	\N	Searching for plots in Dhilera sir: Share the project details, payment terms, rates., Registration value etc.	t	\N	\N	manual	shyam:contact:387	\N	\N
1602	Chandan Kumar	websitecompany55@gmail.com	8860729408	website	2018-08-21 16:42:52	\N	new	\N	\N	\N	Increase your website Traffic: We will optimize your website to increase its rankings with major search engines. This will drive targeted online users to your site, as well as attract new users through the use of relevant keywords and phrases. Not only will we help you gain those higher rankings, but maintain your status through continual management and support. Please reply to this email so we can send you more details\r\n\r\nThanks & Regards\r\nBusiness Development Executive\r\nChandan Kumar\r\nContact no: 08860729408\r\n\r\n405-C, 4th Floor, Jaina Tower-1, District Centre,\r\nJanakpuri, New Delhi -110058, (INDIA)\r\nLandmark: Opp. Satyam Cinema\r\n\r\nCOMPLETE INTERNET MARKETING SOLUTION\r\nSEO - PPC - SMO - Link Building - Copyright - Designing - PHP	t	\N	\N	manual	shyam:contact:389	\N	\N
1603	Harinath Yadav	harinath.project@gmail.com	229967188811	website	2018-09-03 19:22:52	\N	new	\N	\N	\N	plots required: we are interested in plot in dholera	t	\N	\N	manual	shyam:contact:390	\N	\N
1604	Rajeev kshatriya	rajeevkshatriya26@gmail.com	9773125689	website	2018-10-16 14:32:35	\N	new	\N	\N	\N	Applying for job: I am rajeev Kshatriya . I want to apply for the post of site engineer in residential construction.Exp - 2 years in residential construction.I see my bright future with this company as it has a good name in the construction market .	t	\N	\N	manual	shyam:contact:391	\N	\N
1605	Vishal Karia	vbkariya@gmail.com	9727732229	website	2018-11-01 00:37:39	\N	new	\N	\N	\N	Interested: Interested	t	\N	\N	manual	shyam:contact:392	\N	\N
1606	Ashok sharma	ujjwalsharma78@gmail.com	9476369222	website	2018-11-11 18:48:33	\N	new	\N	\N	\N	Dholera sir: I wanted to know about the residential plots available and it's cost.	t	\N	\N	manual	shyam:contact:393	\N	\N
1607	Aditya Ranjan Pathak	a.pathak@tecnimont.in	390263137084	website	2018-11-15 21:38:00	\N	new	\N	\N	\N	Interested in booking a residential plot: Kindly send me the status of plot booking (marking the sold out and available projects distinctly) with price list and payment plans.\r\nI am currently out of India. Therefore respond to me by e-mail.\r\nThank you	t	\N	\N	manual	shyam:contact:394	\N	\N
1608	XYZ	xyz@gmail.com	000000000	website	2019-02-08 13:39:01	\N	new	\N	\N	\N	XYZ: XYZ	t	\N	\N	manual	shyam:contact:395	\N	\N
1642	Natik	natiksharma39@gmail.com	9810739701	website	2020-09-02 16:19:47	\N	new	\N	\N	\N	Improve Your Website Traffic: Hi,\r\n\r\nHope you are doing well & staying safe,\r\n \r\nIn this pandemic period we all want to stay our home safely but also want to run of business or want to grow it more and there is only one option to do it that is online marketing, we are one of the growing digital marketing service provider in India, which improve website traffic, business generation keywords ranking & social presence.\r\n \r\nSo if you want to grow your online business or social presence then please revert us back with your contact number, name and let us know when we can call you back.\r\n \r\nThanks\r\nRegards\r\nNatik Sharma\r\nDigital Marketing Expert	t	\N	\N	manual	shyam:contact:432	\N	\N
1609	Storm Koch	stormkochao2@gmail.com	8016862141	website	2019-03-30 12:37:24	\N	new	\N	\N	\N	Website Promotional Services: Hello,\r\n \r\nHow are you? Hope you are fine.\r\n \r\nI have been checking your website quite often. It has seen that the main keywords are still not in top 10 rank. You know things of working;  I mean the procedure of working has changed a lot.\r\n \r\nSo I would like to have opportunity to work for you and this time we will bring the keywords to the top 10 spot with guaranteed period.\r\n \r\nThere is no wondering that it is possible now cause, I have found out that there are few things need to be done for better performances (Some we Discuss, in this email). Let me tell you some of them -\r\n \r\n1. Title Tag Optimization\r\n2. Meta Tag Optimization (Description, keyword and etc)\r\n3. Heading Tags Optimization\r\n4. Targeted keywords are not placed into tags\r\n5. Alt / Image tags Optimization\r\n6. Google Publisher is missing\r\n7. Custom 404 Page is missing\r\n8. The Products are not following Structured markup data\r\n9.  Website Speed Development (Both Mobile and Desktop)\r\n10. Off –Page SEO work\r\n \r\nLots are pending……………..\r\n \r\nYou can see these are the things that need to be done properly to make the keywords others to get into the top 10 spot in Google Search & your sales Increase.\r\n \r\nAlso there is one more thing to mention that you did thousands of links that time for your website, which are considered as spam after Google roll outs several updates of Panda and penguin. We need to remove them too.\r\n \r\nSir/Madam, please give us a chance to fix these errors and we will give you rank on these keywords.\r\n \r\nPlease let me know if you encounter any problems or if there is anything you need. If this email has reached you by mistake or if you do not wish to take advantage of this advertising opportunity, please accept my apology for any inconvenience caused and rest assured that you will not be contacted again.\r\n \r\nMany thanks for your time and consideration,\r\n \r\nLooking forward\r\n             \r\nRegards\r\n \r\nStorm Koch\r\n \r\nIf you did not wish to receive this, please reply with "unsubscribe" in the subject line.\r\n \r\nDisclaimer: This is an advertisement and a promotional mail strictly on the guidelines of CAN-SPAM Act of 2003. We have clearly mentioned the source mail-id of this mail and the subject lines and they are in no way misleading in any form. We have found your mail address through our own efforts on the web search and not through any illegal way. If you find this mail unsolicited, please reply with "unsubscribe" in the subject line and we will take care that you do not receive any further promotional mail.	t	\N	\N	manual	shyam:contact:396	\N	\N
1610	Deepak Rao	ddrb2011@gmail.com	9448378909	website	2019-05-27 04:46:54	\N	new	\N	\N	\N	Plots: Please send me details on plots in Pune or Mumbai	t	\N	\N	manual	shyam:contact:398	\N	\N
1611	Sarah Clark	sarah.clarkpro@gmail.com	8040990002	website	2019-06-06 11:46:21	\N	new	\N	\N	\N	Business Development: Hi, \r\n\r\nGet more leads for your business. Pay us per lead. We generate leads for all types of business. Just reply us with your needs and business details. We will give the best leads.\r\n\r\nStart growing your business today.\r\n\r\nRegards,\r\nSarah Clark | Demand Generation Specialist\r\nEmail: sarah.clarkpro@gmail.com	t	\N	\N	manual	shyam:contact:399	\N	\N
1612	Manish Kumar	mkr.manishkumar@gmail.com	9557844348	website	2019-06-07 11:42:10	\N	new	\N	\N	\N	Enquiry for job of Site/Project Engineer: Greetings ! \r\nGood Morning !\r\n\r\nI’m looking here for the job of Site/Project Engineer. I’ve 4 years of experience in interiors and holding project with documentation and design parameters. \r\n\r\nKindly revert me mail for further information.	t	\N	\N	manual	shyam:contact:400	\N	\N
1613	Niket soni	niketsoni86@gmail.com	8097306906	website	2019-06-10 20:42:10	\N	new	\N	\N	\N	Investment: Residential projrcts	t	\N	\N	manual	shyam:contact:401	\N	\N
1614	dinesh kamra	dinesh@karnigroups.com	9999669333	website	2019-06-19 14:47:26	\N	new	\N	\N	\N	Investors: Hi\r\n\r\nWe are a real estate consultant based in Gurgaon for the last 18 years. We have seen the Gurgaon getting develop with our own eyes and we have worked with many builders like DLF, Unitech, Ansal, SS Group, BPTP, Vatika Etc. \r\n\r\nSo, we have a huge client base, We can convert them to Dholera if we get and our clients get a good proposal. So kindly send your project details for the same.\r\n\r\nRegards\r\nDinesh Kamra (Director)\r\nKarni Group, Gurugram\r\n+91 9999669333	t	\N	\N	manual	shyam:contact:402	\N	\N
1615	Prabhat NAYAK	bombayinvestors@gmail.com	8108243670	website	2019-06-19 17:09:53	\N	new	\N	\N	\N	Project details: Send me details	t	\N	\N	manual	shyam:contact:403	\N	\N
1616	Roshan Patil	shivsuman299@rediffmail.com	7972282232	website	2019-06-23 20:27:18	\N	new	\N	\N	\N	Plot flat in Dholera: I would like to buy residencial plot flat in or near dholera sir project	t	\N	\N	manual	shyam:contact:404	\N	\N
1617	Dharmendra Chaudhary	dharmendrathanuan@gmail.com	9033634530	website	2019-06-29 23:38:50	\N	new	\N	\N	\N	Plot	t	\N	\N	manual	shyam:contact:405	\N	\N
1618	Pradeepkumar D Gupta	guptapradeep544@gmail.com	9909988607	website	2019-07-23 09:30:20	\N	new	\N	\N	\N	Interested in Dholera projects: Real estate agent in Vadodara.\r\nRegards\r\nPradeep Gupta\r\nVadodara Realty\r\nvadodararealty1@gmail.com\r\n9909988607.	t	\N	\N	manual	shyam:contact:406	\N	\N
1619	RAHUL MISHRA	sales@dpenterprise.com	9898988353	website	2019-07-30 18:34:46	\N	new	\N	\N	\N	Electrical and Elv System Intregator: Dear  Sir,            \r\n\r\nWe are one of the leading Electrical and ELV (Extra Low Voltage) Systems integrators of Gujarat. \r\n\r\nFollowing is summary of our Solution Portfolio\r\n\r\nElectrical Solutions\t\r\n•\tHT Installation \r\n•\tArea Lighting \r\n•\tInternal Electrification \r\n•\tRoad Infrastructure \r\n•\tPumping Station \r\n•\tFabrication \r\nELV Solutions\r\n•\tIP Surveillance-CCTV System\r\n•\tAccess Control Systems\r\n•\tFire Detection, Suppression Alarm System\r\n•\tPublic Address & Evacuation System\r\n•\tVoice & Data Networking\r\n•\tAudio Video Solutions\r\n•\tSmart Building Management Systems\r\n\r\n\r\nPlease let me know if any additional information is required from our side.	t	\N	\N	manual	shyam:contact:407	\N	\N
1620	Dhruvil Patel	dhruvil2000.dp05@gmail.com	2368662105	website	2019-08-05 14:46:49	\N	new	\N	\N	\N	About investment in your scheme of Shyam Villa: Hello, \r\n\r\nI am interested in your properties at Shyam villa. I want to invest in housing there. so, my question was what are the rates for the properties. I am a Indian living in Canada. Please contact me with mail.\r\n\r\nThank you	t	\N	\N	manual	shyam:contact:408	\N	\N
1621	Travis Cole	traviscole@30secondexplainervideos.com	3478095956	website	2019-08-29 11:04:18	\N	new	\N	\N	\N	Partnership: I came across your website after searching for real estate agents on smallbizpages.ca.\r\n\r\nAnd I was wondering if you would like to partner up? \r\n\r\nBasically what we do is make animated videos that are designed to promote your service online and help you attract new customers via your website.\r\n\r\nSo I wanted to offer you a 30 second explainer video for your service for just $197. (including script-creation/voiceover)\r\n\r\nAll I ask in return is a quick testimonial if you like the video!\r\n\r\nIf you are interested in this offer, you can find out more and get started at www.30secondexplainervideos.com/explainer-promo\r\n\r\nOr can you shoot me a quick email for a brief discussion!\r\n\r\nCheers, \r\nTravis\r\nwww.30secondexplainervideos.com/explainer-promo	t	\N	\N	manual	shyam:contact:409	\N	\N
1622	hzNimbcync	myusime@houzzilla.com	88514861544	website	2019-09-15 02:49:03	\N	new	\N	\N	\N	Houzz brainstorming plan: With Houzz controling the search engine outcomes of your essential key words, it is crucial that when web website traffic mosts likely to Houzz that you will reveal on top of their directory site. We can aid - Houzz reviews New-York :  \r\n<a href=https://houzzilla.com/marketing-how-to-benefit-from-your-presence-at-houzz/>houzz banner advertising</a> \r\n \r\nRight Below at HouZzilla we have an assigned group of marketer that specifically solution Houzz monitoring as well as optimization. We are all "Certified Houzz Marketing And Advertising Professionals"- a Houzz advertising and marketing training program with a credentials examination. \r\n \r\nAs professionals in Houzz account administration along with optimization, Client HouZzilla regularly acquires clients leading natural Houzz placements including in Chattanooga, in addition to in endless towns across the nation.	t	\N	\N	manual	shyam:contact:411	\N	\N
1623	9999999999	anvita@shah	\N	website	2019-10-03 15:08:20	\N	new	\N	\N	\N	Welcome!	t	\N	\N	manual	shyam:contact:412	\N	\N
1624	vishal	vishal@ecivilization.com	8850575505	website	2019-10-24 17:35:22	\N	new	\N	\N	\N	enquiry  call me urgent: enquiry  call me urgent	t	\N	\N	manual	shyam:contact:413	\N	\N
1625	Gauri Saha	gaurisaha.infozzle@gmail.com	9372727088	website	2019-12-06 17:32:05	\N	new	\N	\N	\N	Low Cost SEO Services!: Hi,\r\n\r\nI hope you are well.\r\n\r\nI was doing some research on your industry and I had landed on your website. The thing is, it was beyond Page 4 of Google! I had a look at some of the other businesses who are currently ranked on Page 1 and I truly believe you have a better website and a better brand than some of them. The stats show that only 4% of people go beyond page 2! In other words, this is no man's land.\r\n\r\nYou can get in touch with any digital marketing agency and start your SEO today.\r\n\r\nLong story short, we’re a Mumbai based Digital Marketing Company Specializing in low-cost SEO - special prices from 15000/month for 30 search phrases (keywords) and can help your website get to page 1 of Google.\r\n\r\nI am happy to do a FREE SEO keyword report for you which can give you an idea of a target audience for your website.\r\n\r\nWhat do you think? \r\n\r\nThanks & Regards,\r\nGauri Saha - Head of Marketing.\r\ngaurisaha.infozzle@gmail.com\r\nwww.infozzle.com\r\nTel:+91 9372727088	t	\N	\N	manual	shyam:contact:414	\N	\N
1626	KennethSeary	s.z.y.m.a.n.skiashley5@gmail.com	88257798551	website	2020-02-22 23:38:13	\N	new	\N	\N	\N	dextroamphetamine online pharmacy: gnats home remedies  <a href= http://www.studiomerliniortodonzia.it/cgi-bin/avanafil.htm >studiomerliniortodonzia.it/cgi-bin/avanafil.htm</a>  automatic pill dispensers	t	\N	\N	manual	shyam:contact:416	\N	\N
1627	Anthonycok	raphaepeap@gmail.com	85258551757	website	2020-02-26 23:54:02	\N	new	\N	\N	\N	A new way of advertising.: Good day!  shyamgroups.co.in \r\n \r\nDo you know the best way to talk about your products or services? Sending messages through feedback forms will allow you to simply enter the markets of any country (full geographical coverage for all countries of the world).  The advantage of such a mailing  is that the emails which will be sent through it will find yourself within the mailbox that's meant for such messages. Sending messages using Contact forms isn't blocked by mail systems, which suggests it's sure to reach the client. You may be ready to send your offer to potential customers who were previously inaccessible due to spam filters. \r\nWe offer you to test our service at no cost. We'll send up to fifty thousand message for you. \r\nThe cost of sending one million messages is us $ 49. \r\n \r\nThis letter is created automatically. Please use the contact details below to contact us. \r\n \r\nContact us. \r\nTelegram - @FeedbackMessages \r\nSkype  live:contactform_18 \r\nEmail - make-success@mail.ru	t	\N	\N	manual	shyam:contact:417	\N	\N
1628	Abhishek choudhury	shubhabhi98@gmail.com	07974509843	website	2020-03-09 20:47:31	\N	new	\N	\N	\N	looking fot plots in dholera: i want plots in a good prime location in dholera if do you have revert back to me	t	\N	\N	manual	shyam:contact:418	\N	\N
1629	VINOY THOMAS	vinoythomas@yahoo.com	0096567008517	website	2020-03-13 08:47:59	\N	new	\N	\N	\N	Residential Plot Investment Opportunities in DHOLERA SIR: Dears\r\n\r\nI am interested in getting detailed information about your Residential Plot Investment Opportunities in DHOLERA SIR. \r\n\r\nAlso provide details of cost, payment plan, discount, estimated date of completion, details of government approvals received, etc\r\n\r\nI am a NRI from Vadodara, working in Kuwait. I will India in end of May 2020 and wish to explore the investment opportunities in DHOLERA SIR. \r\n\r\nLooking forward to your reply. \r\n\r\nBest Regards \r\nVinoy Thomas	t	\N	\N	manual	shyam:contact:419	\N	\N
1630	Mohammed Quirk	quirk.mohammed0@gmail.com	666530071	website	2020-04-09 07:19:16	\N	new	\N	\N	\N	Our News: Hello\r\nSee our big offer for all products: computers.\r\nThe best offer on the market. Best price and fast delivery.\r\nhttps://tinyurl.com/rcpuf89	t	\N	\N	manual	shyam:contact:420	\N	\N
1631	Everest Transports	yuthish8358@gmail.com	9445777289	website	2020-04-15 22:24:56	\N	new	\N	\N	\N	Inquiry about Transportation Business: This letter is intended to offer our transport services to your Company \r\n\r\nWe are a small business that caters to the needs of safe transport to and from the location. We have a fleet of 5 trucks & trailers with around 80 tonnes cargo carrying capacity.\r\n\r\nName : Everest Transports \r\nOrigin : Namakkal,Tamilnadu\r\nVehicle \r\nType : Ashok Leyland Double Axle truck + 40 feet Lowbed trailers.(16 wheels)\r\n\r\nWe've worked with companies like\r\n    JSW Steel plant,\r\n    Caterpillar Truck & Machinery,\r\n    Cranes Transportation,\r\n    Transformers,Boilers \r\n\r\nWe hope you will consider our proposal , and we look forward to serving you in the best manner possible. \r\n\r\nContact Details\r\nMobile No:9445777289\r\nWhatsapp:9445777289\r\nName: Yuthish \r\n\r\nThanks & Regards	t	\N	\N	manual	shyam:contact:421	\N	\N
1632	Chetan Patel	chetanp9876@gmail.com	9825880478	website	2020-04-26 10:11:22	\N	new	\N	\N	\N	Alluminum and glass company: Alluminum and glass work same villa nu seting karo\r\nSai alluminum and glass company \r\nLaxmi chuna ground,sola gam Ahmedabad \r\nChetan patel  9825880478	t	\N	\N	manual	shyam:contact:422	\N	\N
1633	Bennyjakly	na.dya._.o.k.olev.a.@mail.ru	82751364319	website	2020-05-02 18:02:30	\N	new	\N	\N	\N	????????? ????? ?? ????? 2018-2019 Filmek: ?????? ??????: ????????? ??????? ????? ????????? ?? 2-3 ??????! \r\n???? ??? ? ?????! ??? ? ????????! ?????? ???... https://txxzdxru.diarymaria.com/	t	\N	\N	manual	shyam:contact:423	\N	\N
1634	Ravi Kumar Rastogi	rastogiravi1@gmail.com	97466515568	website	2020-05-08 01:45:57	\N	new	\N	\N	\N	Plots in Dholera Global city or Dholera Smart city 2: I am interested in booking plots on above projects. Can you please confirm availability and rates for each of them along with their respective brochures.	t	\N	\N	manual	shyam:contact:424	\N	\N
1635	Sachin Kadam	kadam1402@gmail.com	9145599821	website	2020-05-24 14:47:04	\N	new	\N	\N	\N	Plots enquiry: Hi\r\n\r\nI am looking for plot in Dholera SIR for investment purpose, can you share me more details	t	\N	\N	manual	shyam:contact:425	\N	\N
1636	Moses joseph	moses.joseph302@gmail.com	9987020677	website	2020-06-16 10:03:37	\N	new	\N	\N	\N	smart city project, residential plot: I  am interested In investing in residential plot at smart city need more information	t	\N	\N	manual	shyam:contact:426	\N	\N
1637	Gabrielamusa	petrovichmiroslav@yandex.com	84936477587	website	2020-07-04 12:27:46	\N	new	\N	\N	\N	??? ???????? ??????????? ??????????\r\n ?: <a href=https://studiomedia.ru/>?????????????</a> \r\n?????? ???? ? ??????????? - https://studiomedia.ru/	t	\N	\N	manual	shyam:contact:427	\N	\N
1638	nipun	niopatel86@gmail.com	9974943971	website	2020-07-08 11:18:08	\N	new	\N	\N	\N	investment plot	t	\N	\N	manual	shyam:contact:428	\N	\N
1639	PARTH	parthhingrajia62@gmail.com	9773178322	website	2020-07-17 18:33:09	\N	new	\N	\N	\N	MANUFACTURING OF CONSTRUCTION SCAFFOLDING EQUIPMENTS: Respected sir / madam,\r\n\r\n              We are pleased to introduce our company as leading manufacturers of scaffolding equipment. we are making U JACK ,U PIPE JACK , BASE PLATE JACK , PROP JACK, COUPLER, CUBE MOLD AND OTHER CONSTRUCTION SCAFFOLDING EQUIPMENT. \r\n\r\nPlease let us know your present & future requirement. We know our product is a perfect match for your needs. so, attach my catalog .\r\n\r\nPlease feel free to contact me or mail me if you need any further information.\r\nlooking forward to establish long-term and mutually beneficial relationship.\r\nthank you.\r\n\r\n\r\n\r\nMARSHAL ENGINEERS\r\nManufacturers of construction scaffolding equipment\r\nHasmukhbhai patel : 9099037256 , 97731 78322\r\nE-mail: marshal_mukesh@yahoo.co.in\r\n Web. : http://www.marshalengineers.com	t	\N	\N	manual	shyam:contact:429	\N	\N
1640	pervindersingh rawat	thakur_pervinder@yahoo.com	9265977570	website	2020-07-21 10:53:23	\N	new	\N	\N	\N	share plot rate in Dholera: Dear sir,\r\n\r\nplz share current updates and rate by mail only\r\n\r\n\r\nregards\r\n\r\nPervindersingh	t	\N	\N	manual	shyam:contact:430	\N	\N
1644	JimmyTax	no-replypeap@gmail.com	81272122212	website	2020-09-25 22:53:41	\N	new	\N	\N	\N	Delivery of your email messages.: G??d d?y!  shyamgroups.co.in \r\n \r\nDid y?u kn?w th?t it is p?ssibl? t? s?nd r?qu?st ?bs?lut?ly l?g?l? \r\nW? s?ll ? n?w uniqu? w?y ?f s?nding l?tt?r thr?ugh ??nt??t f?rms. Su?h f?rms ?r? l???t?d ?n m?ny sit?s. \r\nWh?n su?h busin?ss pr?p?s?ls ?r? s?nt, n? p?rs?n?l d?t? is us?d, ?nd m?ss?g?s ?r? s?nt t? f?rms sp??ifi??lly d?sign?d t? r???iv? m?ss?g?s ?nd ?pp??ls. \r\n?ls?, m?ss?g?s s?nt thr?ugh f??db??k F?rms d? n?t g?t int? sp?m b???us? su?h m?ss?g?s ?r? ??nsid?r?d imp?rt?nt. \r\nW? ?ff?r y?u t? t?st ?ur s?rvi?? f?r fr??. W? will s?nd up t? 50,000 m?ss?g?s f?r y?u. \r\nTh? ??st ?f s?nding ?n? milli?n m?ss?g?s is 49 USD. \r\n \r\nThis l?tt?r is ?r??t?d ?ut?m?ti??lly. Pl??s? us? th? ??nt??t d?t?ils b?l?w t? ??nt??t us. \r\n \r\nContact us. \r\nTelegram - @FeedbackMessages \r\nSkype  live:contactform_18 \r\nWhatsApp - +375259112693	t	\N	\N	manual	shyam:contact:434	\N	\N
1645	Maike Reine-Berg	maikereine.mmr@gmail.com	83725112523	website	2020-09-30 22:08:02	\N	new	\N	\N	\N	We Can Help.: My name is Maike Reine-Berg, Customer Service Representative for AAA Structured Finance Ltd, thank you for your time, my company offers project financing and lending services, do you have any project that requires funding at the moment? You need a business or personal loan? We are ready to work with you on a more transparent approach. Contact Us for more information via email:  Reine.berg@outlook.com.	t	\N	\N	manual	shyam:contact:435	\N	\N
1646	deepika gupta	dgupta1616st@gmail.com	9816535510	website	2020-10-03 23:29:21	\N	new	\N	\N	\N	urgent property required: hi\r\n2 bhk banglow required urgently.kindly let me know . 9816535510, 9882179273 (alternate contact). cheers	t	\N	\N	manual	shyam:contact:436	\N	\N
1647	Zohandamege	diepen@vgsnake.com	81921711965	website	2020-10-07 23:59:30	\N	new	\N	\N	\N	Go out with knock off broken-hearted payment dispensary: trackback lascia un commento viagra\r\n where can i buy viagra tadalafil in ipswich town\r\n <a href="https://viagrasld.com/#">viagra coupons free trial\r\n</a> - viagra information side effects last post\r\n https://viagrasld.com/# - viagra vs cialis\r\n viagra dosage for bph location	t	\N	\N	manual	shyam:contact:437	\N	\N
1648	Zedriczex	desmitiem@viapowerhq.com	82367271729	website	2020-10-16 16:18:46	\N	new	\N	\N	\N	Go out with lower low valuation drugstore: viagra, pharmacology\r\n viagra 5mg cost location\r\n <a href="https://viapowerhq.com/#">real viagra for sale online\r\n</a> - canadian pharmacy viagra 20mg posts per day\r\n https://viapowerhq.com/# - viagra for sale\r\n viagra cost with insurance tag search	t	\N	\N	manual	shyam:contact:438	\N	\N
1649	SUBHADAS MAJI	subhadasmaji1995@gmail.com	7585056955	website	2020-10-17 09:31:57	\N	new	\N	\N	\N	JOB VACANCIE: My name Subhadas Maji\r\nFrom Purulia\r\nQualification- H.S PASS, ITI IN ELECTRICIAN	t	\N	\N	manual	shyam:contact:439	\N	\N
1650	Bhavesh Dave	bhavesh.dave99999@gmail.com	7567560340	website	2020-10-21 17:31:28	\N	new	\N	\N	\N	inquiry: inquiry	t	\N	\N	manual	shyam:contact:440	\N	\N
1651	FazesOrato	sportplayboy@viagenpwr.com	82957444222	website	2020-10-28 07:25:36	\N	new	\N	\N	\N	Get with disregard vulgar amount pharmacopoeia: buy generic viagra pills online\r\n viagra 20mg side effects new posts\r\n <a href="https://viagenpwr.com/#">viagra cost per pill\r\n</a> - cheapest discount viagra\r\n https://viagenpwr.com/# - viagra generic name\r\n viagra 20mg side effects faq	t	\N	\N	manual	shyam:contact:441	\N	\N
1652	Haliddox	copies@viasldnfl.com	81156613126	website	2020-10-31 09:28:10	\N	new	\N	\N	\N	Nag with disregard broken-hearted payment dispensary: viagra 20mg tablets jump to\r\n erection problems viagra\r\n <a href="https://viasldnfl.com/#">sale viagra\r\n</a> - cialis 20mg review register\r\n https://viasldnfl.com/# - generic viagra for sale\r\n cialis pills cheap user name	t	\N	\N	manual	shyam:contact:442	\N	\N
1653	Ajay Kishor singh	ajaykishore5276@gmail.com	9472806185	website	2020-12-21 20:49:36	\N	new	\N	\N	\N	To enquire about plot: To know the rates of the plot.	t	\N	\N	manual	shyam:contact:443	\N	\N
1654	Zillieovaby	educhange@nwlionstore.com	83539747893	website	2020-12-23 09:23:44	\N	new	\N	\N	\N	Nag with disregard offensive payment pharmacy: cialis commercial 2012 in descending order\r\n where can i buy cialis hong kong\r\n <a href="https://cialisbin.com/#">buy viagra cialis without a doctor\r\n</a> - taking asprin and cialis together\r\n https://cialisbin.com - #???????\r\n about cialis 20mg	t	\N	\N	manual	shyam:contact:444	\N	\N
1655	akshay	akshangel1231@gmail.com	8368165191	website	2020-12-24 19:03:47	\N	new	\N	\N	\N	about the concept of city: would like to buy land.	t	\N	\N	manual	shyam:contact:445	\N	\N
1656	JahesGluby	markkola@levtr20mg.com	81917613176	website	2021-01-15 04:55:22	\N	new	\N	\N	\N	Nag with lower offensive price drugstore: jual obat kuat viagra cialis levitra maximum perangsang\r\n cialis impotenza penale\r\n <a href="https://cialisboss.com/#">viagra vs cialis vs levitra\r\n</a> - high street prescription cialis prices in uk\r\n https://cialisboss.com/# - buy generic cialis\r\n order pills online no prescription	t	\N	\N	manual	shyam:contact:446	\N	\N
1657	Arzhurken	dereceden@tadalafilz.com	82221984399	website	2021-01-18 18:47:22	\N	new	\N	\N	\N	Get with lower offensive price pharmacy: cialis 5 mg online total members\r\n cialis pills online\r\n <a href="https://mtadalafil.com/#">cialis generic tadalafil\r\n</a> - does cialis work for women\r\n https://mtadalafil.com/# - tadalafil\r\n canadian pharmacy cialis 20mg name	t	\N	\N	manual	shyam:contact:447	\N	\N
1658	ZavidSeern	goers@ciagorilla.com	89134723588	website	2021-01-20 06:56:18	\N	new	\N	\N	\N	Arouse with knock off offensive valuation drugstore: cialis 20mg find all posts by\r\n 5mg cialis online\r\n <a href="https://viawithoutdc.com/#">online viagra without subscription\r\n</a> - cialis spam filter misspelled confugure\r\n https://viawithoutdc.com/# - cheap viagra without doctor prescription\r\n can cialis show up in urine test	t	\N	\N	manual	shyam:contact:448	\N	\N
1659	MSCEdike	business@msc.com.ru	87499455447	website	2021-01-30 03:48:36	\N	new	\N	\N	\N	?????? ??????????: ?? ?????? ???????? ??? ??????????? ???????? ?????? ?? ?????, ?????? ? ?????. ?? ???????? ??? ???? ? ?????????? ?????, ??? ????????????? ??????? ? ???????? ?????????? ? ?????? ?????? ??????????? ?????????? ?? ????????????.	t	\N	\N	manual	shyam:contact:449	\N	\N
1660	WilGeOre	neviditelna@xsildenafil.com	86763142456	website	2021-02-03 01:06:25	\N	new	\N	\N	\N	Nag with lower vulgar valuation dispensary: effectiveness viagra\r\n soft viagra\r\n <a href="https://viagwithoutdct.com/#">viagra without prescription\r\n</a> - viagra effect starts working within\r\n https://viagwithoutdct.com/# - viagra without doctors prescription\r\n viagra acif reflux	t	\N	\N	manual	shyam:contact:450	\N	\N
1661	Vinod Hingoo	vn_hings13@yahoo.com	9727162422	website	2021-02-07 16:54:10	\N	new	\N	\N	\N	Looking for working platform.: I am BECivil, Quantity surveyor cum Billing engineer above 10 years of experience, looking for working platform.	t	\N	\N	manual	shyam:contact:451	\N	\N
1662	TOM	gotrendyindia@gmail.com	9825042240	website	2021-02-09 16:21:39	\N	new	\N	\N	\N	Wanted to meet.: Hello, This is to arrange a meeting.	t	\N	\N	manual	shyam:contact:452	\N	\N
1681	Arlene Westcott	arlenewestcott66@gmail.com	0462257181	website	2021-07-12 21:56:34	\N	new	\N	\N	\N	Query for Guest Post: Hi,\r\n\r\nI want to contribute high-quality content to your website in form of a guest post through a simple 3 step process.\r\n\r\n1. I will send three amazing topic ideas that are up to the trend and your readers' interest\r\n2. You need to choose one topic out of those.\r\n3. I will then send a high-quality, plagiarism-free article on that topic.\r\n\r\nYou will just have to publish it with one do-follow backlink to my website. It will be a win-win.\r\n\r\nPlease let me know if we shall start with step 1?\r\n\r\nBest,\r\n\r\nArlene Westcott	t	\N	\N	manual	shyam:contact:479	\N	\N
1663	Eric Jones	eric.jones.z.mail@gmail.com	5555551212	website	2021-02-21 05:48:49	\N	new	\N	\N	\N	Who needs eyeballs, you need BUSINESS: My name’s Eric and I just came across your website - shyamgroups.co.in - in the search results.\r\n\r\nHere’s what that means to me…\r\n\r\nYour SEO’s working.\r\n\r\nYou’re getting eyeballs – mine at least.\r\n\r\nYour content’s pretty good, wouldn’t change a thing.\r\n\r\nBUT…\r\n\r\nEyeballs don’t pay the bills.\r\n\r\nCUSTOMERS do.\r\n\r\nAnd studies show that 7 out of 10 visitors to a site like shyamgroups.co.in will drop by, take a gander, and then head for the hills without doing anything else.\r\n\r\nIt’s like they never were even there.\r\n\r\nYou can fix this.\r\n\r\nYou can make it super-simple for them to raise their hand, say, “okay, let’s talk” without requiring them to even pull their cell phone from their pocket… thanks to Talk With Web Visitor.\r\n\r\nTalk With Web Visitor is a software widget that sits on your site, ready and waiting to capture any visitor’s Name, Email address and Phone Number.  It lets you know immediately – so you can talk to that lead immediately… without delay… BEFORE they head for those hills.\r\n  \r\nCLICK HERE https://talkwithwebvisitors.com to try out a Live Demo with Talk With Web Visitor now to see exactly how it works.\r\n\r\nNow it’s also true that when reaching out to hot leads, you MUST act fast – the difference between contacting someone within 5 minutes versus 30 minutes later is huge – like 100 times better!\r\n\r\nThat’s what makes our new SMS Text With Lead feature so powerful… you’ve got their phone number, so now you can start a text message (SMS) conversation with them… so even if they don’t take you up on your offer right away, you continue to text them new offers, new content, and new reasons to do business with you.\r\n\r\nThis could change everything for you and your business.\r\n\r\nCLICK HERE https://talkwithwebvisitors.com to learn more about everything Talk With Web Visitor can do and start turing eyeballs into money.\r\n\r\nEric\r\nPS: Talk With Web Visitor offers a FREE 14 days trial – you could be converting up to 100x more leads immediately!   \r\nIt even includes International Long Distance Calling. \r\nPaying customers are out there waiting. \r\nStarting connecting today by CLICKING HERE https://talkwithwebvisitors.com to try Talk With Web Visitor now.\r\n\r\nIf you'd like to unsubscribe click here http://talkwithwebvisitors.com/unsubscribe.aspx?d=shyamgroups.co.in	t	\N	\N	manual	shyam:contact:453	\N	\N
1664	viagra pills	begeleiden@viagenpwr.com	83944763154	website	2021-02-26 22:45:30	\N	new	\N	\N	\N	Arouse with lower offensive price pharmacopoeia: viagra 10mg or 20mg memberlist\r\n viagra pills cheap help\r\n <a href="https://sildenaflpro.com/#">sildenafil 20 mg tablet vs viagra\r\n</a> - viagra 20mg usergroups\r\n https://sildenaflpro.com/# - viagra samples\r\n viagra free trial	t	\N	\N	manual	shyam:contact:454	\N	\N
1665	ElenkaBem	elenkabem@menot.xyz	12890334567	website	2021-03-17 10:10:44	\N	new	\N	\N	\N	Should you have sex on the first date?: Yes\r\nhttp://geabremadis.ml/chk/21	t	\N	\N	manual	shyam:contact:456	\N	\N
1666	Poick	sus@china-trade.su	88006005854	website	2021-03-18 12:41:39	\N	new	\N	\N	\N	?????????? ?????????? ? ???: ?????? ???? - ??? ???? ???????, ?, ???????, ??? ?? ??????????? ?? ????????? ??????? ??????????. ???? ?????? ?????? ??????? ????????? ?? ????? ????????? ??? ????? ??????. ???????????????? ??????? ?????? ?? ????????? ? ??????? ?????? ???????????????. \r\n??? ???????: 8 800 600 58 54	t	\N	\N	manual	shyam:contact:458	\N	\N
1667	Vinay	dubey1814@gmail.com	8511287640	website	2021-04-28 11:28:13	\N	new	\N	\N	\N	Projects in Dholera	t	\N	\N	manual	shyam:contact:461	\N	\N
1668	Zasonunomb	conclusiehet@kamagradct.com	87339496852	website	2021-05-06 13:53:09	\N	new	\N	\N	\N	Go out with lower low valuation pharmacopoeia: levitra how much to take\r\n levitra from canada free samples replies\r\n <a href="https://kamagradct.com/#">kamagra - contents\r\n</a> - levitra costa rica itrader\r\n https://kamagradct.com/# - kamagra oral jelly\r\n levitra 10mg or 20mg memberlist	t	\N	\N	manual	shyam:contact:462	\N	\N
1669	ZenethsWeld	goked@levitpharm.com	81186789466	website	2021-05-06 14:53:08	\N	new	\N	\N	\N	Base satisfactory rather no remedy: levitra 10 mg 4 tablet total posts\r\n levitra 20mg website\r\n <a href="https://levitpharm.com/#">pharmacy sales generic levitra ordering\r\n</a> - levitra 20mg pills interests\r\n https://levitpharm.com/# - levitra stomach supplement\r\n levitra, pharmacology	t	\N	\N	manual	shyam:contact:463	\N	\N
1670	ZustMeert	zehavi@stromectoldc.com	89777163316	website	2021-05-08 01:45:35	\N	new	\N	\N	\N	Go out with lower broken-hearted price pharmacy: can you buy stromectol over the counter\r\n stromectol adult dosing\r\n <a href="https://ivermectindc.com/#">ivermectin dose\r\n</a> - stromectol (ivermectin)\r\n https://ivermectindc.com/# - dosage of ivermectin for dogs\r\n tell me about stromectol and how to order it.	t	\N	\N	manual	shyam:contact:464	\N	\N
1671	ZougSmusY	anticipons@fildena-us.com	85953526834	website	2021-05-09 08:45:30	\N	new	\N	\N	\N	Arouse with disregard broken-hearted payment dispensary: fildena offer\r\n information about fildena for women\r\n <a href="https://fildena-us.com/#">fildena 100\r\n</a> - delta fildena\r\n https://fildena-us.com/# - fildena for sale\r\n inurl:propecia fildena soft tabs online	t	\N	\N	manual	shyam:contact:465	\N	\N
1672	FaelAcuts	schatting@viawithoutdct.com	81787361281	website	2021-05-09 20:01:41	\N	new	\N	\N	\N	Arouse with lower low valuation drugstore: purchase viagra online\r\n nebenwirkungen viagra 5 mg tableten\r\n <a href="https://nodoctrprescript.com/#">how much is viagra with a prescription\r\n</a> - viagra 20mg review views\r\n https://nodoctrprescript.com/# - cheapest viagra without a prescription\r\n viagra for women seconds with	t	\N	\N	manual	shyam:contact:466	\N	\N
1673	Manasvi Prajapati	info@svmsms.com	9033339353	website	2021-05-11 20:58:44	\N	new	\N	\N	\N	SVM Security & Management Services: Respected Sir/Madam,\r\nGreetings From SVM Security & Management Services..!!!!\r\nIf you are plan to change Security Agency for your organization so please contact us, we have good Security Guard and Supervisor. \r\nPlease contact us on below details;\r\n\r\nThank You,\r\nManasvi Prajapati,\r\nSVM Security & Management Services,\r\n9033339353,\r\n9099020411,\r\ninfo@svmsms.com; \r\nahmedabad@svmsms.com	t	\N	\N	manual	shyam:contact:467	\N	\N
1674	Azidcesse	beledigend@cannabis7oil.com	83593538775	website	2021-05-14 04:05:18	\N	new	\N	\N	\N	Find fault with cheap pharmacist's order now: medical bph cialis\r\n planomovie  popolazioni\r\n <a href="https://qtadalafil.com/#">cialis generic tadalafil\r\n</a> - beribu  nervously\r\n https://qtadalafil.com/# - which is more efective viagra, cialis oot levitra,\r\n nakapa	t	\N	\N	manual	shyam:contact:468	\N	\N
1675	NezabudkaBem	nezabudkabem@drstranst.xyz	84769823959	website	2021-05-15 00:07:59	\N	new	\N	\N	\N	Nezabudka WOW!: ??????: Dropped index http://schema.org/Movie	t	\N	\N	manual	shyam:contact:470	\N	\N
1676	WezhewMigue	vijftien@ciapharmshark.com	86785966985	website	2021-05-16 08:34:25	\N	new	\N	\N	\N	Lower in return order druggist's pills: viagra viagra canadian pharmacy joyfulyy.cgi\r\n  compare viagra and levitra\r\n <a href="http://approvalprescription.com/#">couponnon prescription cialis online\r\n</a> - cure ed\r\n http://approvalprescription.com/# - prescription cialis\r\n buying viagra in saudi arabia	t	\N	\N	manual	shyam:contact:471	\N	\N
1677	AnnBem	annbem@allsets.xyz	12371234567	website	2021-05-16 22:19:10	\N	new	\N	\N	\N	Sex on the first date is the perfect dating filter: Go ahead, have sex on the first date\r\nhttp://theocentknokarzihy.tk/chk/59	t	\N	\N	manual	shyam:contact:472	\N	\N
1678	Zoe Ramzy	zoeramzy06@gmail.com	4442471	website	2021-05-27 12:33:13	\N	new	\N	\N	\N	Query: Hi,\r\n\r\nHow are you doing? I will make it simple and short. I want to contribute an amazing guest post to your website. \r\n\r\nFor that we just need to go with 3 steps:\r\n\r\n1. I will send you some new topic ideas that will be tech-oriented and in trend too\r\n2. You'll have to choose one out of those\r\n3. I will then send a high-quality article on that chosen topic for you to publish on your website with one do-follow link to my site.\r\n\r\nLet me know how this sounds to you? Shall we start with step 1?\r\n\r\nBest,\r\n\r\nZoe Ramzy	t	\N	\N	manual	shyam:contact:475	\N	\N
1679	LusyBem	lusybem@allsets.xyz	12273934567	website	2021-06-25 08:58:56	\N	new	\N	\N	\N	What do you think, is it possible to have serious relationships after having sex on a first date: or better not to think about it ))\r\nhttp://sigzenttiharsunb.tk/chk/3	t	\N	\N	manual	shyam:contact:477	\N	\N
1684	Nikunj Pandya	niks4work@gmail.com	7621824226	website	2021-08-20 13:03:29	\N	new	\N	\N	\N	investment: need some info to invest in DSIR	t	\N	\N	manual	shyam:contact:482	\N	\N
1685	Milan k Raval	milankraval1986@gmail.com	09016982199	website	2021-08-21 16:58:59	\N	new	\N	\N	\N	part time work: Is there a part time work or job? I am govt. employee.(M.A.B.ED).I live in Bhavnagar	t	\N	\N	manual	shyam:contact:483	\N	\N
1686	Pervez	azampervez@gmail.com	33270055	website	2021-09-07 23:10:36	\N	new	\N	\N	\N	Getting no response: No reply from Pramod, Priyanka and Pramod to my emails and messages.\r\nI need update on my registration.	t	\N	\N	manual	shyam:contact:485	\N	\N
1687	Ishita Soni	lageniusinfocom@gmail.com	9825745569	website	2021-09-21 15:24:56	\N	new	\N	\N	\N	Digital Marketing: Hello, \r\n\r\nWe are support for below Digital marketing services \r\n\r\nBULK WHATSAPP\r\nSMS\r\nWEBSITE DESIGN\r\nPAN INDIA DATABASE \r\n\r\ncontact  \r\nIshita soni\r\nBusiness Development Manager\r\nAhmedabad\r\nwww.lageniusinfo.com\r\n9825745569	t	\N	\N	manual	shyam:contact:487	\N	\N
1688	SHAHNAWAZ	hussainshahnawaz487@gmail.com	7982886894	website	2021-11-14 15:08:57	\N	new	\N	\N	\N	dholera  sir: i want to buy plot in dholera	t	\N	\N	manual	shyam:contact:488	\N	\N
1689	Sunita Chirag Visha	sunitavisha@rediffmail.com	7600170084	website	2021-12-17 14:44:26	\N	new	\N	\N	\N	For Job: I Have 5 Years Experience customer care executive in real estate company. my company name is aamani group.  in Dholera SIR.	t	\N	\N	manual	shyam:contact:489	\N	\N
1690	mops	lved90118@gmail.com	85463493111	website	2021-12-24 16:23:02	\N	new	\N	\N	\N	Lanvigator: ??????? ??????? ????????? ??? 315 80 R22.5 ??? ???????? ??????? ?? ????? ????????????? <a href=https://ved-line.ru/supply/article_post/gruzovye-shiny-315-80-r22-5>APLUS</a>	t	\N	\N	manual	shyam:contact:490	\N	\N
1691	sarita	peekay00973@yahoo.com	9627196960	website	2021-12-27 17:26:53	\N	new	\N	\N	\N	Price for the plot: please can you provide the price for the plots in smart city Dholera 2	t	\N	\N	manual	shyam:contact:491	\N	\N
1692	pinupcasino777	pinupcasino7777@gmail.com	88695423241	website	2021-12-27 17:57:52	\N	new	\N	\N	\N	Pin Up Casino: ??????? ???????? https://pin-up-casino.cyou/ ?????? ????? ??????????? ???????? ? ????????? ??????????? ??????? ?? ????????!	t	\N	\N	manual	shyam:contact:492	\N	\N
1693	LFKT1U3O www.telegra.ph/Your-Win-01-14#	muscotamik1982@mail.ru	130114	website	2022-01-15 16:17:59	\N	new	\N	\N	\N	LFKT1U3O www.telegra.ph/Your-Win-01-14#: LFKT1U3O www.telegra.ph/Your-Win-01-14#	t	\N	\N	manual	shyam:contact:493	\N	\N
1694	KaymotdPax	bruk.epetweson543@gmail.com	81242823864	website	2022-03-04 09:46:16	\N	new	\N	\N	\N	Unmarried girls are ready to meet close to you: Hi Brain. My new naked video, I enlarged my tits and ass, as you asked https://funny-dating.top/yotube/?u=wh5kd06&o=qxpp80k	t	\N	\N	manual	shyam:contact:501	\N	\N
1695	akhil bhardwaj	akhil.bhardwaj22@gmail.com	9974578566	website	2022-07-26 23:26:36	\N	new	\N	\N	\N	residential plot: want to enquire about residential plots	t	\N	\N	manual	shyam:contact:505	\N	\N
1696	jane	jane.g@chemetalloys.com	8618386264047	website	2022-08-01 07:28:54	\N	new	\N	\N	\N	FeP&SiC: Dear sir or madam,\r\n\r\n \r\n\r\nWe, Guizhou Huachang Industries Co., Ltd, as a specialized manufacturer and exporter for Ferro Phosphorus,Silicon Carbide and other products in China, sincerely hope to establish business relations with your esteemed corporation.\r\n\r\n \r\n\r\nHerewith pls find our products information as follows:\r\n\r\n \r\n\r\nProduct: Ferro Phosphorus\r\n\r\nSpecification: P25%min ,Mn2%max,SI1.0%max ,S0.05%max,C0.5%max(specially low Ti and low Mn)\r\n\r\nPacking: 1 MT big bags\r\n\r\nSize: 10-50mm 90%min\r\n\r\nQuantity: as per your requirement\r\n\r\nPayment term: after discussed\r\n\r\nShipment: prompt\r\n\r\n \r\n\r\nProduct: Silicon Carbide\r\n\r\nSpecification: SIC75-99%min\r\n\r\nPacking: 1 MT big bags\r\n\r\nSize: 1-10mm/0-10mm 90%min\r\n\r\nQuantity: as per your requirement\r\n\r\nPayment: after discussed\r\n\r\nShipment: prompt\r\n\r\n \r\n\r\nIf the above products are different from what you require actually, kindly inform us in detail, we will be pleased to offer you as per your actual requirements asap. You may also visit our website www.Chemetalloys.com . Should any of these items be of interest to you, please let us know. We will be pleased to give you the most competitive price and good quality.\r\n\r\n\r\nWe are looking forward to receiving your reply soon.\r\n\r\n\r\nBest Wishes\r\nJane\r\nMail: jane.g@chemetalloys.com  \r\nMobile: +86 18386264047\r\nTel/Fax: +86 857 423 9000\r\nAdd: No. 201-203, A9 Building, Tongxin Trade Center,Qianxi City, Guizhou P.R.C\r\nChemetalloys Ltd?trading office?\r\nGuizhou Huachang Industries Co., Ltd(factory)\r\nhttp://www.chemetalloys.com	t	\N	\N	manual	shyam:contact:506	\N	\N
1697	NORTH INDIA TRANSPORT CO	northindia3@gmail.com	7043851792	website	2022-08-29 12:11:54	\N	new	\N	\N	\N	transportation: SEE ALSO TRANSPOTATION IN ALL GUJRAT TO  ALL MEDHYA P[RADESH , HARYANA - PUNJAB ,   ETC. IN ALL OVER INDIA \r\n\r\nSPECIAL MOVEMENT FOR -: F.P COTTON BALES	t	\N	\N	manual	shyam:contact:507	\N	\N
1698	JAY SINGHANIA	jay1997singhania@gmail.com	6353526294	website	2022-09-15 15:55:18	\N	new	\N	\N	\N	Application as a Civil Engineer in your Prestigious Firm: Hereby, I'm Enquiring/ Applying as a Civil Engineer in your Prestigious Firm. I assure you to work sincerely and dedicatedly and will provide my best level services for the growth and progress of the Company and the Project that I'm allocated to.	t	\N	\N	manual	shyam:contact:508	\N	\N
1699	dsfsdfdsfds	sdfsdfsdsfsdf@gmail.com	212121212112	website	2022-09-30 16:00:38	\N	new	\N	\N	\N	fsdffd: sdfsdfdsf	t	\N	\N	manual	shyam:contact:509	\N	\N
1700	vikas	patelvikas300@gmail.com	8460884647	website	2022-10-31 17:53:15	\N	new	\N	\N	\N	dholera sir project	t	\N	\N	manual	shyam:contact:512	\N	\N
1701	mehul baviskar	mehulbaviskar@gmail.com	9316569298	website	2022-11-26 12:59:53	\N	new	\N	\N	\N	investment: sand me our project details	t	\N	\N	manual	shyam:contact:513	\N	\N
1702	Nitin	nkvaghela@gmail.com	9537020989	website	2022-11-26 17:38:33	\N	new	\N	\N	\N	Inquiry for Commercial Land: Dear Sir,\r\n\r\nWe are having requirement of purchasing commercial land like 1,00,000 sqft in Dholera for investment purpose.\r\n\r\nPlease provide the details for the same.\r\n\r\nBest Rgds\r\nNitin\r\n9537020989	t	\N	\N	manual	shyam:contact:514	\N	\N
1703	Viral	viral.mandaliya89@gmail.com	971504191691	website	2023-04-25 03:19:03	\N	new	\N	\N	\N	Residential plot: Hi, i am planing to buy residencial plot in Dholera near shella. Please connect. Whatsapp +971504191691	t	\N	\N	manual	shyam:contact:517	\N	\N
1704	Pravin Nehete	pravin.nehete@yahoo.co.in	97450556012	website	2023-05-26 02:32:00	\N	new	\N	\N	\N	Enquiry for Plots inside Dholera Global City: Dear Team,\r\n\r\nI am existing customer of Shyam Group holding Plot 60 in Dholera smart City-2.\r\n\r\nI am looking for bigger size plot inside Dholera Global City Plotting Project, Please share me details of size in between 4500-5000 square Foot.\r\n\r\nI am looking for better discounting for existing client base.\r\n\r\nRegards,\r\nPravin Nehete.	t	\N	\N	manual	shyam:contact:519	\N	\N
1705	SUSHIL kumar	naturalhealthclub@gmail.com	9013805437	website	2023-06-17 13:18:16	\N	new	\N	\N	\N	Site visit: Send details of project and need site visit of your project as I came Ahmedabad today for personal work	t	\N	\N	manual	shyam:contact:520	\N	\N
1706	ather hussain	bonddubai@gmail.com	9867465254	website	2023-07-04 07:09:59	\N	new	\N	\N	\N	CHANNEL PARTNER: GOOD MORNING, I WOULD LIKE TO BECOME CHANNEL PARTNER	t	\N	\N	manual	shyam:contact:521	\N	\N
1707	HardevSinh	zala.hardev27@gmail.com	7990056118	website	2023-07-31 16:05:34	\N	new	\N	\N	\N	Dholera plot: .	t	\N	\N	manual	shyam:contact:522	\N	\N
1708	dipak	dave123@gmail.com	9925709837	website	2023-09-11 15:41:58	\N	new	\N	\N	\N	investment	t	\N	\N	manual	shyam:contact:523	\N	\N
1709	Nidhi	nidhi24@gmail.com	8758877106	website	2023-09-13 18:39:45	\N	new	\N	\N	\N	Plot: Plot	t	\N	\N	manual	shyam:contact:524	\N	\N
1711	monu	monu2611@gmail.com	9638447561	website	2023-09-14 16:48:51	\N	new	\N	\N	\N	proparty in dholera: I am interested in Dholera property	t	\N	\N	manual	shyam:contact:527	\N	\N
1712	Ashok kumar	ashk55011@gmail.com	8852897041	website	2023-10-01 09:13:00	\N	new	\N	\N	\N	I want to book some resident villas and plots .: I want to book resident plots and villas.please send me detail about their size and price(rate) my gmail-  ashk55011@gmail.com.      My contact number-  8852897041.	t	\N	\N	manual	shyam:contact:528	\N	\N
1713	Ankit Kumar	maabhagwaticonstbgs@gmail.com	8709113949	website	2023-10-18 19:49:53	\N	new	\N	\N	\N	Sub-contract: I'm interested to work with you as a vendor or subcontractor for civil work	t	\N	\N	manual	shyam:contact:529	\N	\N
1714	hardik	hardiksavaliya1001@gmail.com	6354565924	website	2023-12-14 12:35:08	\N	new	\N	\N	\N	na: for dholera	t	\N	\N	manual	shyam:contact:530	\N	\N
1715	Ankit Patel	ankitpatel22@gmail.com	9725688213	website	2023-12-14 14:04:31	\N	new	\N	\N	\N	NA: NA	t	\N	\N	manual	shyam:contact:531	\N	\N
1716	ramesh vagadiya	vagadiyaramesh125@gmail.com	9428030648	website	2023-12-31 10:51:30	\N	new	\N	\N	\N	want to invest in dholera: please call me once..i want to invest in dholera	t	\N	\N	manual	shyam:contact:534	\N	\N
1717	darshit mori	darshitrajput38350@gmail.com	8128384350	website	2024-01-05 14:55:31	\N	new	\N	\N	\N	property: i want to buy a property in dholera	t	\N	\N	manual	shyam:contact:535	\N	\N
1718	Siddhartha Tiwari	realtyvisors@gmail.com	8160136084	website	2024-01-13 16:35:44	\N	new	\N	\N	\N	Dholera plots investment: Hello, \r\nI am interested for the info on dholera investments for clients.	t	\N	\N	manual	shyam:contact:536	\N	\N
1719	Aniruddha	at7374@hotmail.com	9899240234	website	2024-01-21 13:06:49	\N	new	\N	\N	\N	Dholera: Proprty	t	\N	\N	manual	shyam:contact:537	\N	\N
1720	Kapil	sonikapil0411@gmail.com	9810181814	website	2024-02-03 03:42:28	\N	new	\N	\N	\N	Residential plot: Please do send the residential plot detaols	t	\N	\N	manual	shyam:contact:538	\N	\N
1721	Sumit Basu	sumitbasu1993@gmail.com	9547542637	website	2024-02-15 22:03:48	\N	new	\N	\N	\N	Apply for civil engineer job as a assistant manager position: Dear sir\r\nI have a 10 years of experience in building construction work, right now I'm looking for a job opportunity	t	\N	\N	manual	shyam:contact:539	\N	\N
1722	Deep Shikha	cfpdeepshikha@gmail.com	9996455055	website	2024-03-02 16:08:29	\N	new	\N	\N	\N	Want to know about villas: I am interested in villas, please share complete details	t	\N	\N	manual	shyam:contact:540	\N	\N
1723	Pradyuman Mishra	pradyumanmishra@gmail.com	9650477164	website	2024-03-08 21:21:22	\N	new	\N	\N	\N	Industrial & residential plot: Please share prices and details asap.	t	\N	\N	manual	shyam:contact:544	\N	\N
1724	hiral Patel	sales@epicelevators.com	8141550125	website	2024-03-09 16:07:48	\N	new	\N	\N	\N	elevators Regards: Greeting of the day.\r\nWe are Ahmedabad based well known lift supplier and are pleased to attach herewith our company profile, catalogues etc. for your ready reference.    Please inform capacity of lift require and number of floors lift has to serve.   If possible, also inform what maximum lift shaft width and depth can be provided at site.   Alternatively, you can send lift plan and section to enable us to get details from it.    We will submit detailed offer after studying your requirement.                                                                                                                    \r\n\r\nFor more details contact us :- \r\nAhmedabad - 96386 50125\r\n                        96873 50125\r\nBaroda - 96381  50125\r\nSurat - 81417  50125\r\nwebsite - www.epicelevators.com\r\nfor email - info@epicelevators.com	t	\N	\N	manual	shyam:contact:545	\N	\N
1725	Bhupesh Singh	bhupesh19872004@yahoo.com	9930477750	website	2024-03-14 17:46:51	\N	new	\N	\N	\N	Dholera project details: Kindly share dholera project details	t	\N	\N	manual	shyam:contact:546	\N	\N
1726	Monika Tiwary	monikatiwary88@gmail.com	9999813881	website	2024-03-22 13:01:37	\N	new	\N	\N	\N	Interested in Residential Plot: Need details	t	\N	\N	manual	shyam:contact:548	\N	\N
1727	bharat panchal	bharatpanchal1678@gmail.com	9909388777	website	2024-04-02 17:12:02	\N	new	\N	\N	\N	Dholera sir investment: we are in to lands and we have our own NA/NOC land in Dholera , we are looking fwd to have investors and we offers assured return concept.	t	\N	\N	manual	shyam:contact:549	\N	\N
1728	Yogesh	ygupta126@gmail.com	9205031016	website	2024-04-04 14:17:30	\N	new	\N	\N	\N	Plots: Need projects info	t	\N	\N	manual	shyam:contact:550	\N	\N
1729	Bibhu	2bibhu@gmail.com	9777423919	website	2024-04-07 14:59:02	\N	new	\N	\N	\N	property investement: Hi, \r\nI am looking for investment property around Dholera. Kindly share details if you have anything good.\r\n\r\nThank you	t	\N	\N	manual	shyam:contact:551	\N	\N
1730	Hemant Agarwal	rianlubetech@gmail.com	8200722780	website	2024-04-15 18:53:56	\N	new	\N	\N	\N	Inquiry for residential plot: We are looking for residential plot in dholera and dholerasir	t	\N	\N	manual	shyam:contact:552	\N	\N
1731	Mansi Pathak	mansipathak3333@gmail.com	9879448833	website	2024-04-22 13:07:14	\N	new	\N	\N	\N	For Job: Inquiry For Job as a Sales Person.	t	\N	\N	manual	shyam:contact:553	\N	\N
1732	chetan	deorachetan999@gmail.com	7340148542	website	2024-05-24 16:51:23	\N	new	\N	\N	\N	invetment plan	t	\N	\N	manual	shyam:contact:554	\N	\N
1733	Brijesh	brij0101@gmail.com	9106322498	website	2024-06-06 08:39:18	\N	new	\N	\N	\N	Send Residential project info: Possible to email me at brij0101@gmail.com - Dholera Residential projects scheme and hardcopy to my in laws. \r\nPls call 9106322498 to send info of their residential address.	t	\N	\N	manual	shyam:contact:555	\N	\N
1734	Rakeah	jain.rakesh003@gmail.com	7023718212	website	2024-07-12 12:56:22	\N	new	\N	\N	\N	Plot in dholera: Please WhatsApp me on 8130386056	t	\N	\N	manual	shyam:contact:556	\N	\N
1735	Tapan ray	raytapan62@gmail.com	7058042427	website	2024-08-06 09:22:19	\N	new	\N	\N	\N	Information about Dholara Project	t	\N	\N	manual	shyam:contact:557	\N	\N
1736	Bambhaniya Shraddha Rameshbhai	shraddhabambhaniya871@gmail.com	9586762998	website	2024-08-09 11:21:54	\N	new	\N	\N	\N	Job Regarding: Job vacancy...??	t	\N	\N	manual	shyam:contact:558	\N	\N
1737	Arpan Behl	behl.2308@gmail.com	7589901558	website	2024-08-10 14:51:55	\N	new	\N	\N	\N	investment: what was your project, location & price	t	\N	\N	manual	shyam:contact:559	\N	\N
1738	Shaurya Kajaria	shauryak1408@gmail.com	7980037656	website	2024-08-12 21:19:30	\N	new	\N	\N	\N	Dholera Investment	t	\N	\N	manual	shyam:contact:560	\N	\N
1739	ggsrarf	dgfafaf2@gmail.com	0351953495	website	2024-08-25 23:54:46	\N	new	\N	\N	\N	<script>alert("AwsB50")</script>: <script>alert("AwsB50")</script>	t	\N	\N	manual	shyam:contact:561	\N	\N
1740	Bhavesh Lakhani	b.lakhani9@gmail.com	9930839783	website	2024-09-26 14:52:26	\N	new	\N	\N	\N	dholera Bunglow: sale of bunglow	t	\N	\N	manual	shyam:contact:562	\N	\N
1741	CHARUSHILA BHALERAO	cbhalerao@yahoo.com	9881199152	website	2024-11-12 18:10:33	\N	new	\N	\N	\N	Status of Dholera Global City Project as on 12 nov 2024: Hi\r\n  Kindly send the status of the project as there is no single communication from builders side regarding the plotting Scheme and current development of this project. We had booked this plot no 279 in 2018.. kindly reply with photos and current development and also the possession of the plot. Are the plots demarcation done? Are the amenities ready? When can we visit to see the exact location of our plots in the project.\r\n \r\nRegards \r\nCharushila Bhalerao	t	\N	\N	manual	shyam:contact:563	\N	\N
1777	WhatsApp Lead	\N	897767676767676	website	2026-02-20 12:05:47	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:14	\N	\N
1778	WhatsApp Lead	\N	8976676767	website	2026-02-20 12:10:31	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:15	\N	\N
1742	Parth Patel	info@pvjdigitech.com	7048252308	website	2024-11-25 11:47:44	\N	new	\N	\N	\N	Services: Welcome to PVJ DIGITECH, where innovation meets digital excellence! We are a cutting-edge digital agency on a mission to help your business stand out in a crowded online world. Whether you're looking to build a stunning website, streamline operations with CRM solutions, or create impactful digital cards, we've got you covered.\r\n\r\nOur services don’t stop there – from high-impact SEO, SMO, and Google Ads to WhatsApp bots and custom marketing strategies, we craft tailored solutions that drive real results. As a full-service social media marketing agency, we amplify your brand’s voice, turning likes into loyalty and clicks into conversions.\r\n\r\nAt PVJ DIGITECH, we don’t just follow trends, we create them. Let’s transform your digital vision into reality – together. Ready to elevate your business? Let’s get started!\r\nCall Us:07048252308\r\nEmail: info@pvjdigitech.com\r\nWebsite : www.pvjdigitech.com	t	\N	\N	manual	shyam:contact:564	\N	\N
1743	Narendra Kumar	nkumar@yahoo.com	9099995768	website	2024-11-25 12:47:08	\N	new	\N	\N	\N	Residential plot: I need to buy a residential plot.	t	\N	\N	manual	shyam:contact:565	\N	\N
1744	Rutvik Jaiswal	rutvikjaiswal.mba21@gmail.com	7623079137	website	2024-12-22 12:44:52	\N	new	\N	\N	\N	Inquiry for Outdoor Advertising: Dear Sir/Madam\r\n\r\nWe are Advice Media, an outdoor advertising company and we are into outdoor advertising and other types of advertising and promotional activity as well, we saw your advertisement near AKHBARNAGAR circle so we are pleased to inform you that if there is any other query related to outdoor advertising please let us know.\r\n\r\nYours sincerely\r\nRutvik Jaiswal\r\n+91 7623079137\r\nAdvice Media.	t	\N	\N	manual	shyam:contact:566	\N	\N
1745	Devender	dyadav2010@gmail.com	9711523000	website	2025-01-11 21:52:53	\N	new	\N	\N	\N	Plot	t	\N	\N	manual	shyam:contact:567	\N	\N
1746	B S Chaurasia	bhanuchaurasia60@gmail.com	9981658691	website	2025-01-15 20:37:11	\N	new	\N	\N	\N	Need plots	t	\N	\N	manual	shyam:contact:568	\N	\N
1747	Himanshu	himanshu.chopra@yahoo.co.in	9650381747	website	2025-01-17 04:07:44	\N	new	\N	\N	\N	Dholera plots: Need more details about Dholera plots	t	\N	\N	manual	shyam:contact:569	\N	\N
1748	Vivek	vevekkumarr@hotmail.com	9971900065	website	2025-02-14 20:49:26	\N	new	\N	\N	\N	Investment: I am a property consultant from Noida.\r\nJust want to know how can I connect with the company for selling the project to my clients	t	\N	\N	manual	shyam:contact:570	\N	\N
1749	Twinkle Shrimali	shrimalitiku5@gmail.com	9558114684	website	2025-03-07 16:56:27	\N	new	\N	\N	\N	inquiry	t	\N	\N	manual	shyam:contact:571	\N	\N
1750	Aditya Tiwari	aditya.x.tiwari@gmail.com	8767957927	website	2025-03-11 19:08:56	\N	new	\N	\N	\N	Price Details of Plotted Development in Dholera: Looking for a residential plot for investment purpose. Please share the price details of all your ongoing residential plot projects.	t	\N	\N	manual	shyam:contact:572	\N	\N
1751	DHEERAJ	dheeraj.cool31@gmail.com	9873170079	website	2025-03-22 13:37:57	\N	new	\N	\N	\N	DHOLERA PROJECT: I WANT TO KNOW ABOUT DHOLERA PROJECT  AND PLOT PRICE	t	\N	\N	manual	shyam:contact:573	\N	\N
1752	Manmeet	manmeetsinghsahni25@gmail.com	9818283313	website	2025-03-23 12:47:35	\N	new	\N	\N	\N	Investment in Dholera: Hi, I am looking for Franchise partner and investment in Dholera. living in Gurgaon	t	\N	\N	manual	shyam:contact:574	\N	\N
1753	deevanki	crm@bookmyassets.com	9717161297	website	2025-03-26 16:06:32	\N	new	\N	\N	\N	we want to meet the MD: We are a channel partner working in Delhi & NCR\r\nwe want to work for dholera	t	\N	\N	manual	shyam:contact:575	\N	\N
1754	Mukesh Sarda	mukesh.sarda@gmail.com	9646833400	website	2025-03-31 15:52:01	\N	new	\N	\N	\N	Want to invest in a plot: I want to invest in a plot, please give some alternative	t	\N	\N	manual	shyam:contact:576	\N	\N
1755	Madhur	madhur2105@gmail.com	3682990990	website	2025-04-02 11:02:22	\N	new	\N	\N	\N	plot purchase in dholera smart city tp1	t	\N	\N	manual	shyam:contact:577	\N	\N
1756	Ravi	ravi23545gmail@gmail.com	9227109026	website	2025-04-05 17:19:59	\N	new	\N	\N	\N	investment: Near airport residentail plot	t	\N	\N	manual	shyam:contact:578	\N	\N
1757	Kalpesh Pandya	kalpeshpandya@hotmail.co.uk	07590362757	website	2025-04-21 14:24:57	\N	new	\N	\N	\N	Residential plot: I am\r\nInterested in plot investment. \r\n\r\nMy WhatsApp number is +91 70 4191 4297\r\n\r\nUK mobile : +447590362757	t	\N	\N	manual	shyam:contact:579	\N	\N
1758	Darshan Sanghavi	darshan@hofficecrm.com	9327058088	website	2025-04-30 14:50:25	\N	new	\N	\N	\N	Automate Your Real Estate Sales, Purchase & Project Workflow with H-Office: Dear Team,\r\n\r\nLooking to simplify your sales-to-purchase communication, track follow-ups, and streamline project workflows?\r\n\r\n*H-Office CRM + ERP* is purpose-built for *real estate developers* — enabling:\r\n\r\n? Sales team to create *BOMs* and request purchase estimates effortlessly  \r\n? Commercials handled smoothly *without revealing buyer identity* to purchase team  \r\n? Multiple units/projects with *individual follow-ups & auto alerts*  \r\n? Smooth site-to-HO coordination, deal tracking, and booking management  \r\n? Detailed real estate workflow — from inquiry to possession, fully integrated  \r\n\r\nAll of this — on a secure cloud platform trusted by 1500+ companies.\r\n\r\nLet’s connect fo…	t	\N	\N	manual	shyam:contact:580	\N	\N
1759	rahul	ru24rahul@gmail.com	9910044529	website	2025-05-08 10:18:43	\N	new	\N	\N	\N	investment: looking for investment in property.	t	\N	\N	manual	shyam:contact:582	\N	\N
1760	Shashvat Mehta	shashvat.mehta@gmail.com	9974092997	website	2025-05-15 11:38:50	\N	new	\N	\N	\N	residential plot: planning to buy a residential plot in Dholera	t	\N	\N	manual	shyam:contact:584	\N	\N
1761	Rathod aahir bhai	aahirrathod1091998@gmail.com	9687912234	website	2025-05-15 22:52:31	\N	new	\N	\N	\N	Broker: I have land in near dholera .you have buy a land call us	t	\N	\N	manual	shyam:contact:585	\N	\N
1762	Sudarshan	sudarshan15890@gmail.com	9891532913	website	2025-05-23 21:00:10	\N	new	\N	\N	\N	Dholera	t	\N	\N	manual	shyam:contact:586	\N	\N
1763	ETRRT	raghu@gmail.com	7383100773	website	2025-11-19 11:41:34	\N	new	\N	\N	\N	dsaf: fsg	t	\N	\N	manual	shyam:contact:589	\N	\N
1764	Raghu yadav	yadav@gmai.com	9909542354	website	2025-12-23 19:35:44	\N	new	\N	\N	\N	Testing: Hii I'm in	t	\N	\N	manual	shyam:contact:634	\N	\N
1765	test	htmldesigner7.intelliworkz@gmail.com	8283323232	website	2026-04-08 11:39:27	\N	new	\N	\N	\N	aDSSD: ad	t	\N	\N	manual	shyam:contact:727	\N	\N
1766	Siddharth	siddharth@gmail.com	9274714520	website	2026-05-03 16:58:19	\N	new	\N	\N	\N	Dholera: Cp Work	t	\N	\N	manual	shyam:contact:771	\N	\N
1767	WhatsApp Lead	\N	7976229960	website	2026-02-19 12:21:57	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:1	\N	\N
1768	WhatsApp Lead	\N	7854798756	website	2026-02-19 12:26:55	\N	new	\N	\N	\N	ignore this	t	\N	\N	manual	shyam:whatsapp:2	\N	\N
1769	WhatsApp Lead	\N	9316426895	website	2026-02-20 06:31:15	\N	new	\N	\N	\N	name	t	\N	\N	manual	shyam:whatsapp:3	\N	\N
1770	WhatsApp Lead	\N	9313243546	website	2026-02-20 06:32:17	\N	new	\N	\N	\N	gdhjkh	t	\N	\N	manual	shyam:whatsapp:4	\N	\N
1771	WhatsApp Lead	\N	93701234567	website	2026-02-20 06:36:21	\N	new	\N	\N	\N	sfg	t	\N	\N	manual	shyam:whatsapp:6	\N	\N
1772	WhatsApp Lead	\N	98765345678	website	2026-02-20 11:23:24	\N	new	\N	\N	\N	test	t	\N	\N	manual	shyam:whatsapp:9	\N	\N
1773	WhatsApp Lead	\N	97189899889999	website	2026-02-20 11:26:37	\N	new	\N	\N	\N	tet	t	\N	\N	manual	shyam:whatsapp:10	\N	\N
1774	WhatsApp Lead	\N	91878787888	website	2026-02-20 11:41:52	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:11	\N	\N
1775	WhatsApp Lead	\N	9198765434567	website	2026-02-20 11:42:11	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:12	\N	\N
1780	WhatsApp Lead	\N	9818885338	website	2026-03-31 06:05:56	\N	new	\N	\N	\N	For purchase of residential plot	t	\N	\N	manual	shyam:whatsapp:23	\N	\N
1781	WhatsApp Lead	\N	9913307931	website	2026-04-02 15:46:27	\N	new	\N	\N	\N	Job vacancy for	t	\N	\N	manual	shyam:whatsapp:25	\N	\N
1782	WhatsApp Lead	\N	9879105825	website	2026-04-03 07:26:00	\N	new	\N	\N	\N	I’m interest invest	t	\N	\N	manual	shyam:whatsapp:26	\N	\N
1783	WhatsApp Lead	\N	8511089577	website	2026-04-09 00:06:22	\N	new	\N	\N	\N	Want info. About plots & price	t	\N	\N	manual	shyam:whatsapp:27	\N	\N
1784	WhatsApp Lead	\N	911234567	website	2026-04-10 02:24:30	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:33	\N	\N
1785	WhatsApp Lead	\N	1917984117183	website	2026-04-10 15:01:20	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:36	\N	\N
1786	WhatsApp Lead	\N	7984117183	website	2026-04-10 15:01:57	\N	new	\N	\N	\N	Location	t	\N	\N	manual	shyam:whatsapp:37	\N	\N
1787	WhatsApp Lead	\N	7890654321	website	2026-04-11 01:51:08	\N	new	\N	\N	\N	seo testing	t	\N	\N	manual	shyam:whatsapp:38	\N	\N
1788	WhatsApp Lead	\N	9454443066	website	2026-04-12 02:38:19	\N	new	\N	\N	\N	Im interested about residential plots	t	\N	\N	manual	shyam:whatsapp:39	\N	\N
1789	WhatsApp Lead	\N	7834567892	website	2026-04-13 06:31:22	\N	new	\N	\N	\N	seo testing	t	\N	\N	manual	shyam:whatsapp:40	\N	\N
1790	WhatsApp Lead	\N	9415340927	website	2026-04-18 10:45:28	\N	new	\N	\N	\N	Commercial & residential plots rates	t	\N	\N	manual	shyam:whatsapp:47	\N	\N
1791	WhatsApp Lead	\N	9601260700	website	2026-04-20 02:16:13	\N	new	\N	\N	\N	Planning on Buying plot in TP1/TP2	t	\N	\N	manual	shyam:whatsapp:48	\N	\N
1792	WhatsApp Lead	\N	8860767715	website	2026-04-20 06:07:48	\N	new	\N	\N	\N	Iinterested for investment in dholera	t	\N	\N	manual	shyam:whatsapp:49	\N	\N
1793	WhatsApp Lead	\N	7558215670	website	2026-04-20 17:09:37	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:50	\N	\N
1794	WhatsApp Lead	\N	9779766516	website	2026-04-21 13:31:33	\N	new	\N	\N	\N	Dholera Project	t	\N	\N	manual	shyam:whatsapp:51	\N	\N
1795	WhatsApp Lead	\N	9537379187	website	2026-04-22 00:46:35	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:52	\N	\N
1796	WhatsApp Lead	\N	9831504808	website	2026-04-22 00:52:50	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:53	\N	\N
1797	WhatsApp Lead	\N	8105406369	website	2026-04-22 06:59:47	\N	new	\N	\N	\N	Dholera investment	t	\N	\N	manual	shyam:whatsapp:55	\N	\N
1798	WhatsApp Lead	\N	9537379183	website	2026-04-25 01:00:10	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:58	\N	\N
1799	WhatsApp Lead	\N	9170179570009	website	2026-04-27 01:57:08	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:60	\N	\N
1800	WhatsApp Lead	\N	9537379199	website	2026-05-05 02:00:57	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:67	\N	\N
1801	WhatsApp Lead	\N	9807654321	website	2026-05-07 07:16:06	\N	new	\N	\N	\N	SEO testing	t	\N	\N	manual	shyam:whatsapp:71	\N	\N
1802	WhatsApp Lead	\N	9198456732104	website	2026-05-07 07:19:59	\N	new	\N	\N	\N	seo test	t	\N	\N	manual	shyam:whatsapp:72	\N	\N
1803	WhatsApp Lead	\N	8130048931	website	2026-05-11 05:56:37	\N	new	\N	\N	\N	Hello	t	\N	\N	manual	shyam:whatsapp:75	\N	\N
1804	WhatsApp Lead	\N	9940242743	website	2026-05-16 01:38:37	\N	new	\N	\N	\N	Is office open on Saturdays?	t	\N	\N	manual	shyam:whatsapp:81	\N	\N
1805	WhatsApp Lead	\N	9730160500	website	2026-05-18 02:59:17	\N	new	\N	\N	\N	I'm interested in plot	t	\N	\N	manual	shyam:whatsapp:83	\N	\N
1806	WhatsApp Lead	\N	9825582113	website	2026-05-20 01:07:24	\N	new	\N	\N	\N	Plot Size and prise?	t	\N	\N	manual	shyam:whatsapp:87	\N	\N
1807	WhatsApp Lead	\N	9869651376	website	2026-05-21 01:10:08	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:91	\N	\N
1808	WhatsApp Lead	\N	7796755576	website	2026-05-21 07:26:15	\N	new	\N	\N	\N	We r consultant fir we r looking big land chunks plz contact	t	\N	\N	manual	shyam:whatsapp:92	\N	\N
1809	WhatsApp Lead	\N	9574484801	website	2026-05-23 09:58:29	\N	new	\N	\N	\N	All Details real states	t	\N	\N	manual	shyam:whatsapp:95	\N	\N
1810	WhatsApp Lead	\N	9213330562	website	2026-05-25 03:05:21	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:97	\N	\N
1811	WhatsApp Lead	\N	9313966455	website	2026-05-25 05:44:16	\N	new	\N	\N	\N	Sir/Madam, agar aapko investment property chahiye ho to mujhe bata sakte ho	t	\N	\N	manual	shyam:whatsapp:99	\N	\N
1812	WhatsApp Lead	\N	9195373739187	website	2026-05-26 00:01:22	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:100	\N	\N
1813	WhatsApp Lead	\N	7042443095	website	2026-05-26 23:28:51	\N	new	\N	\N	\N	I am interested in residential plot	t	\N	\N	manual	shyam:whatsapp:101	\N	\N
1814	WhatsApp Lead	\N	8238001755	website	2026-05-27 08:39:18	\N	new	\N	\N	\N	Price	t	\N	\N	manual	shyam:whatsapp:103	\N	\N
1815	Kajal Paswan	paswankajal128@gmail.com	9265007404	housing	2026-06-02 09:40:40.19739	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1819	Manjit Gulani	manjitgulani1112@gmail.com	9727990320	housing	2026-06-02 09:50:01.164447	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
3653	Pooja jar	jar.pooja@gmail.com	08412012255	website	2026-06-14 12:48:07	\N	new	Pune	\N	\N	\N	t	\N	\N	manual	shyam:modal:210	\N	\N
3654	WhatsApp Lead	\N	8595170384	website	2026-06-13 05:22:38	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:123	\N	\N
2807	WhatsApp Lead	\N	9195373791787	website	2026-06-04 22:53:42	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:110	\N	\N
2895	Megha prajapati	meghaprajapati1360@gmail.com	9811524553	housing	2026-06-05 14:30:01.690518	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
1860	WhatsApp Lead	\N	9537371978	website	2026-06-01 23:02:11	\N	new	\N	\N	\N	This is a test mail.	t	\N	\N	manual	shyam:whatsapp:107	\N	\N
1881	Harshad	harsadatusavada@gmail.com	7984107015	housing	2026-06-02 11:50:01.538311	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
3216	Rohit Kumar	krohit19346@gmail.com	9523065942	housing	2026-06-11 10:30:00.620742	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
3606	Vinayak	101010.marvel@gmail.com	9687185830	housing	2026-06-12 15:10:00.527083	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
2409	WhatsApp Lead	\N	9810895400	website	2026-06-04 02:25:34	\N	new	\N	\N	\N	[04/06, 12:26] Manoj Jain: Budget 40 & further 30 for villa \r\nFor me the best location will be where i can make a villa & can get the rental income asap apart from capital appreciation	t	\N	\N	manual	shyam:whatsapp:109	\N	\N
2965	Chandan	chandanrajput72@yahoo.com	9722773557	housing	2026-06-06 11:00:01.035305	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
2966	Nigesh Kumar	papaammu@gmail.com	9419162407	housing	2026-06-06 11:00:01.061106	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
2967	Muljibhai L Parmar	mlkordiya.lic@gmail.com	8780510436	housing	2026-06-06 11:00:01.067531	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3089	prakash rathod	pr73873@gmail.com	7096287637	housing	2026-06-08 09:00:02.296092	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
3090	Neetu Choudhary	neetu1996neeraj@gmail.com	8770819884	housing	2026-06-08 09:00:02.343059	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 6800000 - 20100000	t	\N	\N	manual	\N	\N	\N
3091	Raina Hasrajani	raina.hasrajani@gmail.com	6352938986	housing	2026-06-08 09:00:02.352012	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
3092	Ketan Patel	kp0168115@gmail.com	7600719790	housing	2026-06-08 09:00:02.364271	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
3093	Arjun Khatik (Broker)	arjunkhatik635529@gmail.com	9662141894	housing	2026-06-08 09:00:02.379731	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3094	Rathod Vijaysinh	rvijaysinh081@gmail.com	9913528383	housing	2026-06-08 09:00:02.389354	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
2299	Soham	soham.bhavsar@yahoo.com	7990966917	housing	2026-06-04 09:20:03.664147	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
2300	Bhavini Parmar	bhavini1727@gmail.com	8320674883	housing	2026-06-04 09:20:03.713556	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
2301	Shambhu Kumar (Broker)	kumar12enterprise@gmail.com	9687939636	housing	2026-06-04 09:20:03.722196	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3021	Shantilal Vinaykia	svthpn@gmail.com	9448450263	housing	2026-06-06 13:50:01.40788	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
2987	Ramesh c  vaghela (Broker)	vaghelarc19@gmail.com	8401257129	housing	2026-06-06 12:00:00.932231	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
1997	Roshni Sharma (Owner)	sharmaroshani103@gmail.com	7990947770	housing	2026-06-02 15:50:00.921827	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
2971	WhatsApp Lead	\N	7567026613	website	2026-06-05 19:09:03	\N	new	\N	\N	\N	Please send me the details of the residencial project send me the details.	t	\N	\N	manual	shyam:whatsapp:111	\N	\N
3058	Keyur	solankikeyur30@gmail.com	0470270906	website	2026-06-06 15:58:56	\N	new	Ahmedabad	\N	\N	Hi, what's minimum investment price for your upcoming dholera iconic project.	t	\N	\N	manual	shyam:modal:202	\N	\N
3167	Makbul Makbul	makbulbhaimghori@gmail.com	9408298348	housing	2026-06-10 13:00:00.727919	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
3185	WhatsApp Lead	\N	9602502806	website	2026-06-10 04:12:50	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:117	\N	\N
2068	rangaamrat	rangaamrat@gmail.com	7041503009	housing	2026-06-03 09:30:00.950877	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
2069	Harshita  Rao (Owner)	harshita230578@gmail.com	7984033790	housing	2026-06-03 09:30:00.994272	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3147	Nikunj Choudhary	nikunjchaudhary962056@gmail.com	7777962056	housing	2026-06-08 15:10:01.533718	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
2100	Jayesh Solanki	jayeshsolannki09@gmail.com	7041194987	housing	2026-06-03 10:20:01.011212	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3099	RobertAppex	zekisuquc419@gmail.com	85626167574	website	2026-06-07 15:47:27	\N	new	\N	\N	\N	Aloha  i am wrote about your   prices: Kaixo, zure prezioa jakin nahi nuen.	t	\N	\N	manual	shyam:contact:813	\N	\N
3100	WhatsApp Lead	\N	8486248251	website	2026-06-07 14:10:07	\N	new	\N	\N	\N	Interested in Dholera Iconic	t	\N	\N	manual	shyam:whatsapp:112	\N	\N
3148	vaghela2912jagruti	vaghela2912jagruti@gmail.com	6352172738	housing	2026-06-08 15:50:01.10215	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3888	Navin Kumar	gamankayialgamankayial@gmail.com	8980089162	housing	2026-06-16 09:50:03.414794	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
3889	Sejal Shah	sejalshah43528@gmail.com	7016588589	housing	2026-06-16 09:50:03.495578	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
2157	Manthan Panchal	manthan12@gmail.com	9697156562	meta	2026-06-03 12:07:26.487031	2026-06-08 12:53:19.791284	new	Ahmedabad	\N	\N	Hello	t	\N	\N	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
3803	राजू डामोर	damorar722@gmail.com	9106242354	housing	2026-06-15 15:50:00.647803	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
2836	Suraj Prajapat	surajprajapat143t@gmail.com	8849036953	housing	2026-06-05 11:00:02.109576	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
3904	Richa Mishra	mishraricha2343@gmail.com	9016592670	99acres	2026-06-16 15:00:02.023806	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
3905	Alim	alimquraishi8097299756@gmail.com	8097299756	99acres	2026-06-16 15:00:02.062795	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
3906	Khushboo Surati	suratikhushboo2@gmail.com	9662549709	99acres	2026-06-16 15:00:02.089271	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
3907	USER	not mentioned	6263750284	99acres	2026-06-16 15:00:02.109386	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
4589	Jeet N Panda	jeet.aks@gmail.com	9998118023	99acres	2026-06-20 15:40:00.970828	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
3942	chandan agrawal	chandanagrawal4555@gmail.com	9512800871	housing	2026-06-16 16:20:01.495839	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
3952	Wasim Shaikh	wasimshaikh.ws877@gmail.com	8421092444	99acres	2026-06-16 16:40:02.088495	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 2BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
3968	Shailesh Patel	7777snp@gmail.com	7777977754	99acres	2026-06-16 17:10:01.336274	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
4623	ajay prajapati	prajapatia2930@gmail.com	9825500166	housing	2026-06-22 12:40:00.537541	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
4624	Bhathibhai Rabari	bhathibhairabari196@gmail.com	7016561920	housing	2026-06-22 12:40:00.748001	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
4625	Arvind Solanki	arvindsolankidahyabhaisolanki@gmail.com	7069814074	housing	2026-06-22 12:40:00.819834	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
3985	sonali	sonalibhosale21997@gmail.com	8200772270	website	2026-06-16 17:58:21	\N	new	\N	\N	\N	investment in dholera: nobody is answering my calls, please call	t	\N	\N	manual	shyam:contact:823	\N	\N
3990	Ami Reya	reyaami9@gmail.com	9023030293	housing	2026-06-17 10:20:00.374212	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
3998	Aditya Sindhwani	sindhwaniaditya29@gmail.com	6263336537	99acres	2026-06-17 10:20:00.929007	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
3999	Maulika Solanki	jmaulika@gmail.com	8320523780	99acres	2026-06-17 10:20:00.934713	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
4627	Bakul Bapu Thakar	bakul8182@gmail.com	9998199600	99acres	2026-06-22 12:40:01.167602	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
4628	Divya Patel	dixitakikani0609@gmail.com	9327072882	99acres	2026-06-22 12:40:01.175156	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 2BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
4629	Ramesh	rameshpatel315@yahoo.com	9978538788	99acres	2026-06-22 12:40:01.211154	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp,	t	\N	\N	manual	\N	\N	Medium
4630	Inndresh Badolal	inndresh9@yahoo.co.in	9829445111	99acres	2026-06-22 12:40:01.224026	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in 4BHK Independent House/Villa Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
5467	Vikas Tomar	tmrvikas2000@gmail.com	9601141058	99acres	2026-06-26 09:40:00.997844	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
4533	Yash Lathiya	yashlathiya003@gmail.com	9601566485	housing	2026-06-20 09:50:00.281353	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
4534	Barot Jaydeep	barot.jaydeep.86@gmail.com	9510027934	housing	2026-06-20 09:50:00.301946	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 2500000 - 5000000	t	\N	\N	manual	\N	\N	\N
4632	WhatsApp Lead	\N	9729677247	website	2026-06-20 08:17:07	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:134	\N	\N
4633	WhatsApp Lead	\N	7004845967	website	2026-06-20 12:36:58	\N	new	\N	\N	\N	My budget is under 1000000 so you can send project details	t	\N	\N	manual	shyam:whatsapp:135	\N	\N
4634	WhatsApp Lead	\N	8091447077	website	2026-06-20 16:08:44	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:136	\N	\N
4635	WhatsApp Lead	\N	9758442888	website	2026-06-21 00:25:50	\N	new	\N	\N	\N	Shyam villa project detail	t	\N	\N	manual	shyam:whatsapp:137	\N	\N
4078	rahul	solankirahul1923@gmail.com	9913050212	housing	2026-06-18 16:40:00.636664	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
4077	Jitesh	jiteshukani@yahoo.in	9638917067	99acres	2026-06-18 16:40:00.631365	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	Medium
4080	ASHWIN RAVAL	8799478195@99acres.deo.com	8799478195	99acres	2026-06-18 16:40:00.658027	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
4079	dheeraj kushwah	dheerajkush10@gmail.com	9660770334	housing	2026-06-18 16:40:00.657818	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
4081	Kirtan Shah	kaydishah@gmail.com	9909196758	99acres	2026-06-18 16:40:00.661538	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 2BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
4082	Manisha Patel	vaibhavidevi@gamil.com	9274180602	housing	2026-06-18 16:40:00.66358	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 5000000 - 10000000	t	\N	\N	manual	\N	\N	\N
4083	Yogesh Vaghela	yoguvaghela@gmail.com	8141782064	99acres	2026-06-18 16:40:00.664834	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
4084	Baldev Makwana	mbaldev535@gmail.com	9909656912	housing	2026-06-18 16:40:00.66807	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
4089	Tejas Chaudhari	chaudharitejas302@gmail.com	8830669835	website	2026-06-18 16:40:01.751	\N	new	Vadali	\N	\N	Looking for best location plots in Dholera sir	t	\N	\N	manual	\N	\N	\N
4091	WhatsApp Lead	\N	9955991065	website	2026-06-17 10:42:48	\N	new	\N	\N	\N	Residential plot detall	t	\N	\N	manual	shyam:whatsapp:129	\N	\N
4658	Hardik Chauhan	hardik.chauhan82012@gmail.com	8200657197	housing	2026-06-23 12:30:00.402673	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 6800000 - 20100000	t	\N	\N	manual	\N	\N	\N
4659	cenaram choudhary	cenaramc132@gmail.com	7600026666	housing	2026-06-23 12:30:00.439137	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK, 3+ BHK at Bavla, Ahmedabad. Budget: 4600000 - 20100000	t	\N	\N	manual	\N	\N	\N
4124	Biren shah	biren21077@gmail.com	7016449431	housing	2026-06-18 18:30:00.527132	2026-06-19 10:02:03.079118	new	Bavla, Ahmedabad	Villa	4000000.00	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	\N	manual	\N	\N	\N
4090	📻 Transaction to you.NEXT > graph.org/BALANCE-36824-US-DOLLARS-04-24-2?hs=42a2233ec02e182fb8fbea6b993d4bd7& <<< 📻	138rlhwaznumfi@web-library.net	448686752427	website	2026-06-18 16:40:01.758	2026-06-19 09:40:45.217954	qualified	\N	\N	\N	lnhsgy: n7l83x	t	\N	\N	manual	\N	\N	\N
4219	yogesh . B	yogeshbijalbhai55555@gmail.com	9924263961	housing	2026-06-19 10:40:01.373331	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
4539	Beyondsoft Consulting	chandekarsanjana1020@gmail.com	6352819913	99acres	2026-06-20 09:50:00.86108	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
4662	risheet	risheetr@gmail.com	9825415213	99acres	2026-06-23 12:30:00.723435	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am Interested in this property.	t	\N	\N	manual	\N	\N	Medium
4663	Patel Dinesh Kesha Bhai	dineshkpatel9554@gmail.com	8487938518	99acres	2026-06-23 12:30:00.731231	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
4540	Anand	neetaanand1968@gmail.com	8318922347	99acres	2026-06-20 09:50:00.865594	2026-06-20 14:09:18.982463	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	t	\N	79	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Medium
4664	USER	not mentioned	9913771379	99acres	2026-06-23 12:30:00.742842	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 4BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
4665	Anil	vaza.anil@gmail.com	9687503538	99acres	2026-06-23 12:30:00.753327	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 4BHK, Reach out to customer via Whatsapp,	t	\N	\N	manual	\N	\N	Medium
4666	KAMALKANT NINAMA	kamalkantninama@gmail.com	9016640754	99acres	2026-06-23 12:30:00.759894	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
4830	WhatsApp Lead	\N	8305970096	website	2026-06-23 08:13:54	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:140	\N	\N
4496	WhatsApp Lead	\N	6357977195	website	2026-06-19 06:07:45	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:132	\N	\N
4853	WhatsApp Lead	\N	9357628661	website	2026-06-23 12:47:35	\N	new	\N	\N	\N	WhatsApp inquiry from website	t	\N	\N	manual	shyam:whatsapp:141	\N	\N
4796	Upadhyay satendra Kumar	satendrau108@gmail.com	9173741959	99acres	2026-06-23 17:10:00.741566	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
4815	Cma Manish	vachheta_manish@yahoo.com	9016356690	99acres	2026-06-23 18:10:00.586909	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead, Interested in 3BHK, Reach out to customer via Whatsapp	t	\N	\N	manual	\N	\N	Medium
4845	USER	not mentioned	9182025493	99acres	2026-06-24 09:40:01.171116	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	\N	manual	\N	\N	Medium
4846	Parmar Vijaykumar Maheshbhai	parmarvijay@ymail.com	9099760700	99acres	2026-06-24 09:40:01.196703	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Interested in  Bellevue Vieraaa by Davda Infra Bavla	t	\N	\N	manual	\N	\N	Medium
5398	Abhishek Raj	abhi.raj.nitjsr@gmail.com	7033095049	website	2026-06-25 16:00:01.97	2026-06-25 16:15:41.844379	new	\N	\N	\N	Commercial: Inquiry about iconic	t	\N	\N	manual	\N	\N	\N
5698	Akanksha Singh	akanksha166@gmail.com	8320784262	99acres	2026-06-26 14:50:00.57324	2026-06-26 17:50:17.152296	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project. Please call back.	t	\N	\N	manual	\N	\N	warm
5086	Prem Solanki	premsoalnki974@gmail.com	9328412117	housing	2026-06-24 14:40:00.365409	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3+ BHK at Bavla, Ahmedabad. Budget: 9700000 - 20100000	t	\N	\N	manual	\N	\N	\N
5121	Shruti Hathi	shrutihathi509@gmail.com	7874014109	99acres	2026-06-24 15:20:00.989252	2026-06-24 15:40:36.073535	contacted	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this Project.	t	\N	79	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	Warm
5407	Nandini Patel	nandini.nayak3599@gmail.com	9157363599	99acres	2026-06-25 16:20:00.839463	\N	new	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	Hot Lead	f	2026-06-25 16:51:49.526764	\N	manual	\N	\N	Medium
5256	VirendraPanchal (Owner)	virendrapanchal@yahoo.com	8141332232	housing	2026-06-25 12:40:00.347179	2026-06-25 16:14:29.797832	working	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK at Bavla, Ahmedabad. Budget: 4600000 - 6200000	t	\N	76	manual	\N	955fb036-8a5f-494a-ba3f-20c7622318db	\N
5254	Thakur Satyam	satyam123thakur.st@gmail.com	8905320412	housing	2026-06-25 12:40:00.302253	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 3 BHK at Bavla, Ahmedabad. Budget: 6800000 - 11800000	t	\N	\N	manual	\N	\N	\N
5255	Amit Thakkar	amitthakkar1030@gmail.com	8511251030	housing	2026-06-25 12:40:00.343433	\N	new	Bavla, Ahmedabad	Villa	\N	Interested in 2 BHK, 3 BHK at Bavla, Ahmedabad. Budget: 4600000 - 11800000	t	\N	\N	manual	\N	\N	\N
5258	PUJA BANG	pujabang22@gmail.com	8697579929	99acres	2026-06-25 12:40:00.850533	2026-06-25 16:15:43.170021	qualified	Ahmedabad South - Bellevue Vieraaa by Davda Infra	Residential	\N	I am interested in this project.	t	\N	\N	manual	\N	\N	Medium
\.


--
-- Data for Name: message_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_reads (message_id, user_id, read_at) FROM stdin;
66d46334-317f-4c32-85f2-2c6d1651d89d	1c46541d-18ed-40fa-ad80-6c900111e816	2025-12-17 14:30:58.681642+05:30
9b96fcdd-cd0d-49d0-8376-4a09b269fbf5	1c46541d-18ed-40fa-ad80-6c900111e816	2025-12-17 14:31:08.651179+05:30
b41ebe7f-e204-4180-8cb3-8607bc107499	047cbd62-bd78-4e42-be1c-72395edaf057	2025-12-17 14:32:25.233111+05:30
942e93b3-27aa-4844-bcfb-9490286d4556	1c46541d-18ed-40fa-ad80-6c900111e816	2025-12-17 14:33:11.699705+05:30
d0cf6332-4d64-4765-beb5-11aea2d7463a	047cbd62-bd78-4e42-be1c-72395edaf057	2025-12-17 14:41:36.572262+05:30
bfec620f-f91b-4416-a4e1-e4ab4e95fb34	1c46541d-18ed-40fa-ad80-6c900111e816	2025-12-17 15:16:22.635497+05:30
5c877084-25f4-4ed0-8082-2196792cf12b	1c46541d-18ed-40fa-ad80-6c900111e816	2025-12-17 15:20:44.38234+05:30
01de6658-7c8f-4dda-9ba2-5702a1060231	047cbd62-bd78-4e42-be1c-72395edaf057	2025-12-17 15:20:55.960799+05:30
5d03e83a-b7d4-4236-ad7e-8dfce1be61e2	047cbd62-bd78-4e42-be1c-72395edaf057	2025-12-17 16:23:35.08301+05:30
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, text, image_url, video_url, created_at) FROM stdin;
66d46334-317f-4c32-85f2-2c6d1651d89d	9169a5df-ecfe-4013-95d0-2c52c762fcf5	1c46541d-18ed-40fa-ad80-6c900111e816	Hello			2025-12-17 14:30:58.676691+05:30
9b96fcdd-cd0d-49d0-8376-4a09b269fbf5	9169a5df-ecfe-4013-95d0-2c52c762fcf5	1c46541d-18ed-40fa-ad80-6c900111e816	Kya haal chaal			2025-12-17 14:31:08.646106+05:30
b41ebe7f-e204-4180-8cb3-8607bc107499	9169a5df-ecfe-4013-95d0-2c52c762fcf5	047cbd62-bd78-4e42-be1c-72395edaf057	Aree sir mein toh mast hu			2025-12-17 14:32:25.220322+05:30
942e93b3-27aa-4844-bcfb-9490286d4556	9169a5df-ecfe-4013-95d0-2c52c762fcf5	1c46541d-18ed-40fa-ad80-6c900111e816	aao kabhi hawelipe			2025-12-17 14:33:11.688158+05:30
d0cf6332-4d64-4765-beb5-11aea2d7463a	9169a5df-ecfe-4013-95d0-2c52c762fcf5	047cbd62-bd78-4e42-be1c-72395edaf057	OK			2025-12-17 14:41:36.536464+05:30
bfec620f-f91b-4416-a4e1-e4ab4e95fb34	9169a5df-ecfe-4013-95d0-2c52c762fcf5	1c46541d-18ed-40fa-ad80-6c900111e816	hELLO			2025-12-17 15:16:22.597154+05:30
5c877084-25f4-4ed0-8082-2196792cf12b	9169a5df-ecfe-4013-95d0-2c52c762fcf5	1c46541d-18ed-40fa-ad80-6c900111e816	hello sunnno			2025-12-17 15:20:44.345014+05:30
01de6658-7c8f-4dda-9ba2-5702a1060231	9169a5df-ecfe-4013-95d0-2c52c762fcf5	047cbd62-bd78-4e42-be1c-72395edaf057	haan sir			2025-12-17 15:20:55.948692+05:30
5d03e83a-b7d4-4236-ad7e-8dfce1be61e2	9169a5df-ecfe-4013-95d0-2c52c762fcf5	047cbd62-bd78-4e42-be1c-72395edaf057	ok			2025-12-17 16:23:35.041175+05:30
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, message, entity_id, entity_type, is_read, created_at, updated_at, deleted_at, status) FROM stdin;
3	\N	project_created	New project "Kim Tam" has been created	60	project	t	2025-09-02 15:37:58.075424	2025-09-02 16:11:59.165364	\N	user_not_found
4	\N	project_updated	Project "Amos England" has been updated	10	project	t	2025-09-02 16:38:21.4918	2025-09-03 10:45:09.501686	\N	user_not_found
5	\N	project_updated	Project "Amos England" has been updated	10	project	t	2025-09-02 16:38:25.981453	2025-09-03 13:52:02.592756	\N	user_not_found
2	\N	project_updated	Project "Courtney Langley" has been updated	12	project	t	2025-09-02 12:00:23.833811	2025-09-03 13:52:02.642097	\N	user_not_found
1	\N	project_updated	Project "Rhea Ballards" has been updated	4	project	t	2025-09-02 10:58:13.806817	2025-09-03 13:52:02.65674	\N	user_not_found
6	\N	project_updated	Project "Kim Tam" has been updated	60	project	t	2025-09-24 10:26:09.267279	2025-09-25 15:29:29.842079	\N	user_not_found
\.


--
-- Data for Name: otp_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_records (id, email, otp, created_at, expires_at) FROM stdin;
17	aryanpandey.ce@gmail.com	6436	2025-12-11 10:31:06.636625	2025-12-11 10:36:06.668
10	arvind@intelliworkz.tech	5805	2025-12-11 10:31:48.498261	2025-12-11 10:36:48.501
21	developer12.intelliworkz@gmail.com	7643	2026-06-25 14:39:05.453502	2026-06-25 14:44:05.462
\.


--
-- Data for Name: project_amenities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_amenities (id, project_id, amenity_id, created_at) FROM stdin;
15	76	6	2026-06-15 15:37:31.837486+05:30
16	76	2	2026-06-15 15:37:32.838419+05:30
17	76	4	2026-06-15 15:37:34.698095+05:30
18	76	3	2026-06-15 15:37:35.939497+05:30
19	76	5	2026-06-15 15:37:36.986361+05:30
23	77	3	2026-06-15 16:22:15.837494+05:30
25	77	8	2026-06-15 16:25:09.367702+05:30
27	77	4	2026-06-15 17:58:20.334217+05:30
28	77	5	2026-06-15 17:58:21.670291+05:30
29	77	2	2026-06-15 17:58:22.634736+05:30
30	77	6	2026-06-15 17:58:23.253938+05:30
31	80	6	2026-06-15 19:14:51.413083+05:30
32	80	2	2026-06-15 19:14:52.688044+05:30
35	80	5	2026-06-15 19:14:55.594714+05:30
36	80	8	2026-06-15 19:14:57.052103+05:30
37	80	3	2026-06-15 19:15:23.062654+05:30
41	80	12	2026-06-15 19:21:28.142365+05:30
\.


--
-- Data for Name: project_brochure_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_brochure_files (id, brochure_id, filename, original_name, mime_type, size_bytes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: project_brochures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_brochures (id, project_id, name, active, subject, content, created_at) FROM stdin;
6	9	Velit laboris explic	t	Fugiat est obcaecat	<p>Ut laboris ducimus, .</p>	2025-07-25 12:49:34.179252
14	1	Incidunt quisquam q	t	Est sint dignissim	<p>Laudantium, enim sit.</p>	2025-07-26 16:36:31.27265
27	13	In accusamus volupta	t	Laudantium sapiente	<p>Sunt et eos, at plac.</p>	2025-07-30 12:05:27.412876
33	3	Qui doloribus except	t	Voluptatem alias vol	<p>Dolor voluptatem, as.</p>	2025-08-08 16:20:46.720573
34	11	Magna ut quia ea qui	t	Dicta et occaecat qu	<p>Enim eu molestiae qu.</p>	2025-08-21 14:47:19.328272
53	49	aishi	t	iauhsi	<p>ais</p>	2025-09-02 12:00:30.621164
57	10	Id optio nulla Nam	t	Adipisci fugit dolo	<p>In nisi facilis cumq.</p>	2025-09-02 16:38:25.981453
63	61	hello	t	hello	<p>ello</p>	2025-09-24 15:39:48.773397
\.


--
-- Data for Name: project_floors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_floors (id, project_id, tower_id, floor_number, floor_type, total_units, floor_area_sqft, description, created_at, updated_at, deleted_at) FROM stdin;
1	72	1	10	residential	50	\N	Helloqojq	2026-01-10 14:22:53.312729+05:30	2026-01-10 14:22:53.312729+05:30	\N
2	72	2	120	residential	511	\N	ewfnq	2026-01-10 15:22:04.303448+05:30	2026-01-10 15:22:04.303448+05:30	\N
3	72	2	29	residential	1293	\N	owef 	2026-01-10 15:22:18.039618+05:30	2026-01-10 15:22:18.039618+05:30	\N
4	72	1	100	residential	20	\N	weho	2026-01-10 17:28:06.819505+05:30	2026-01-10 17:28:06.819505+05:30	\N
5	72	1	12	residential	12	\N	23wrgfh	2026-01-10 17:32:34.050553+05:30	2026-01-10 17:32:34.050553+05:30	\N
6	72	1	2	residential	10	\N	Hello2 	2026-01-10 17:38:13.029027+05:30	2026-01-10 17:38:13.029027+05:30	\N
7	72	1	14	commercial	20	\N	Commercial ka hai ye 	2026-01-12 12:02:00.831788+05:30	2026-01-12 12:02:00.831788+05:30	\N
8	75	4	a	residential	\N	\N	\N	2026-05-27 12:58:58.670008+05:30	2026-05-27 12:58:58.670008+05:30	\N
9	74	5	A	residential	\N	\N	\N	2026-05-27 17:32:59.568662+05:30	2026-05-27 17:32:59.568662+05:30	\N
10	75	6	B	residential	\N	\N	\N	2026-05-27 17:44:39.317099+05:30	2026-05-27 17:44:39.317099+05:30	\N
11	73	7	A101	residential	\N	\N	\N	2026-05-28 15:12:06.13875+05:30	2026-05-28 15:12:06.13875+05:30	\N
12	75	8	C	residential	\N	\N	\N	2026-05-29 17:19:13.160273+05:30	2026-05-29 17:19:13.160273+05:30	\N
14	75	10	Inventory	residential	\N	\N	\N	2026-06-11 17:23:03.833858+05:30	2026-06-11 17:23:03.833858+05:30	\N
17	76	13	Floor 10	residential	\N	\N	\N	2026-06-15 15:46:15.123152+05:30	2026-06-15 15:46:15.123152+05:30	\N
18	76	13	Floor 9	residential	\N	\N	\N	2026-06-15 15:46:18.560653+05:30	2026-06-15 15:46:18.560653+05:30	\N
19	77	14	Floor 1	residential	\N	\N	\N	2026-06-15 16:41:33.819459+05:30	2026-06-15 16:41:33.819459+05:30	\N
20	77	14	Floor 2	residential	\N	\N	\N	2026-06-15 16:41:37.045594+05:30	2026-06-15 16:41:37.045594+05:30	\N
21	77	14	Floor 3	residential	\N	\N	\N	2026-06-15 16:41:43.004478+05:30	2026-06-15 16:41:43.004478+05:30	\N
25	80	16	Floor 6	residential	\N	\N	\N	2026-06-20 09:46:40.472499+05:30	2026-06-20 09:46:40.472499+05:30	\N
26	80	16	Floor 5	residential	\N	\N	\N	2026-06-20 09:46:40.566996+05:30	2026-06-20 09:46:40.566996+05:30	\N
27	80	16	Floor 4	residential	\N	\N	\N	2026-06-20 09:46:40.631943+05:30	2026-06-20 09:46:40.631943+05:30	\N
28	80	16	Floor 3	residential	\N	\N	\N	2026-06-20 09:46:40.692979+05:30	2026-06-20 09:46:40.692979+05:30	\N
29	80	16	Floor 2	residential	\N	\N	\N	2026-06-20 09:46:40.745906+05:30	2026-06-20 09:46:40.745906+05:30	\N
30	80	16	Floor 1	residential	\N	\N	\N	2026-06-20 09:46:40.79763+05:30	2026-06-20 09:46:40.79763+05:30	\N
42	79	19	Floor 10	residential	\N	\N	\N	2026-06-26 16:08:07.114748+05:30	2026-06-26 16:08:07.114748+05:30	\N
43	79	19	Floor 9	residential	\N	\N	\N	2026-06-26 16:08:09.937862+05:30	2026-06-26 16:08:09.937862+05:30	\N
44	79	19	Floor 8	residential	\N	\N	\N	2026-06-26 16:08:12.158426+05:30	2026-06-26 16:08:12.158426+05:30	\N
\.


--
-- Data for Name: project_hierarchy_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_hierarchy_nodes (id, project_id, parent_id, type_code, name, description, created_at, updated_at, deleted_at) FROM stdin;
1	72	\N	TOWER	Tower H	Main residential tower	2026-02-26 14:31:03.508432+05:30	2026-02-26 14:31:03.508432+05:30	\N
3	74	\N	TOWER	A	\N	2026-05-25 15:46:56.170829+05:30	2026-05-25 15:46:56.170829+05:30	\N
4	75	\N	TOWER	a	\N	2026-05-27 09:46:57.517095+05:30	2026-05-27 09:46:57.517095+05:30	\N
5	75	\N	TOWER	B	\N	2026-05-27 17:43:09.236356+05:30	2026-05-27 17:43:09.236356+05:30	\N
6	73	\N	TOWER	A101	\N	2026-05-28 15:10:30.390327+05:30	2026-05-28 15:10:30.390327+05:30	\N
7	75	\N	TOWER	C	\N	2026-05-29 17:15:50.036059+05:30	2026-05-29 17:15:50.036059+05:30	\N
8	69	\N	TOWER	Tower A	\N	2026-06-10 16:39:55.618737+05:30	2026-06-10 16:39:55.618737+05:30	\N
9	69	8	FLOOR	Floor 15	\N	2026-06-10 16:39:55.647451+05:30	2026-06-10 16:39:55.647451+05:30	\N
10	69	8	FLOOR	Floor 14	\N	2026-06-10 16:39:55.698097+05:30	2026-06-10 16:39:55.698097+05:30	\N
11	69	8	FLOOR	Floor 13	\N	2026-06-10 16:39:55.704795+05:30	2026-06-10 16:39:55.704795+05:30	\N
12	69	8	FLOOR	Floor 12	\N	2026-06-10 16:39:55.713776+05:30	2026-06-10 16:39:55.713776+05:30	\N
13	69	8	FLOOR	Floor 11	\N	2026-06-10 16:39:55.750904+05:30	2026-06-10 16:39:55.750904+05:30	\N
14	69	8	FLOOR	Floor 10	\N	2026-06-10 16:39:55.801391+05:30	2026-06-10 16:39:55.801391+05:30	\N
15	69	8	FLOOR	Floor 9	\N	2026-06-10 16:39:55.871796+05:30	2026-06-10 16:39:55.871796+05:30	\N
16	69	8	FLOOR	Floor 8	\N	2026-06-10 16:39:55.879027+05:30	2026-06-10 16:39:55.879027+05:30	\N
17	69	8	FLOOR	Floor 7	\N	2026-06-10 16:39:55.884804+05:30	2026-06-10 16:39:55.884804+05:30	\N
18	69	8	FLOOR	Floor 6	\N	2026-06-10 16:39:55.892292+05:30	2026-06-10 16:39:55.892292+05:30	\N
19	69	8	FLOOR	Floor 5	\N	2026-06-10 16:39:55.898595+05:30	2026-06-10 16:39:55.898595+05:30	\N
20	69	8	FLOOR	Floor 4	\N	2026-06-10 16:39:55.904431+05:30	2026-06-10 16:39:55.904431+05:30	\N
21	69	8	FLOOR	Floor 3	\N	2026-06-10 16:39:55.911632+05:30	2026-06-10 16:39:55.911632+05:30	\N
22	69	8	FLOOR	Floor 2	\N	2026-06-10 16:39:55.917004+05:30	2026-06-10 16:39:55.917004+05:30	\N
23	69	8	FLOOR	Floor 1	\N	2026-06-10 16:39:55.922448+05:30	2026-06-10 16:39:55.922448+05:30	\N
24	69	\N	TOWER	Tower B	\N	2026-06-10 16:39:55.927881+05:30	2026-06-10 16:39:55.927881+05:30	\N
25	69	\N	TOWER	Tower C	\N	2026-06-10 16:39:55.933405+05:30	2026-06-10 16:39:55.933405+05:30	\N
26	69	\N	TOWER	Tower D	\N	2026-06-10 16:39:55.938589+05:30	2026-06-10 16:39:55.938589+05:30	\N
27	75	\N	TOWER	Tower A	\N	2026-06-10 17:05:08.096685+05:30	2026-06-10 17:05:08.096685+05:30	\N
28	75	27	FLOOR	Floor 4	\N	2026-06-10 17:05:08.109587+05:30	2026-06-10 17:05:08.109587+05:30	\N
29	75	27	FLOOR	Floor 3	\N	2026-06-10 17:05:08.117839+05:30	2026-06-10 17:05:08.117839+05:30	\N
30	75	27	FLOOR	Floor 2	\N	2026-06-10 17:05:08.127424+05:30	2026-06-10 17:05:08.127424+05:30	\N
31	75	27	FLOOR	Floor 1	\N	2026-06-10 17:05:08.134742+05:30	2026-06-10 17:05:08.134742+05:30	\N
32	75	\N	TOWER	Tower B	\N	2026-06-10 17:05:08.144145+05:30	2026-06-10 17:05:08.144145+05:30	\N
33	75	\N	TOWER	Tower C	\N	2026-06-10 17:05:08.151092+05:30	2026-06-10 17:05:08.151092+05:30	\N
47	75	\N	CLUSTER	Inventory	\N	2026-06-11 17:23:03.771074+05:30	2026-06-11 17:23:03.771074+05:30	\N
57	76	\N	TOWER	Tower A	\N	2026-06-15 15:38:33.567181+05:30	2026-06-15 15:38:33.567181+05:30	\N
58	76	\N	TOWER	Tower B	\N	2026-06-15 15:38:33.579984+05:30	2026-06-15 15:38:33.579984+05:30	\N
59	76	\N	TOWER	Tower C	\N	2026-06-15 15:38:33.585435+05:30	2026-06-15 15:38:33.585435+05:30	\N
60	76	57	FLOOR	Floor 10	\N	2026-06-15 15:38:50.705847+05:30	2026-06-15 15:38:50.705847+05:30	\N
61	76	57	FLOOR	Floor 9	\N	2026-06-15 15:38:50.712889+05:30	2026-06-15 15:38:50.712889+05:30	\N
62	76	57	FLOOR	Floor 8	\N	2026-06-15 15:38:50.729527+05:30	2026-06-15 15:38:50.729527+05:30	\N
63	76	57	FLOOR	Floor 7	\N	2026-06-15 15:38:50.742939+05:30	2026-06-15 15:38:50.742939+05:30	\N
64	76	57	FLOOR	Floor 6	\N	2026-06-15 15:38:50.750577+05:30	2026-06-15 15:38:50.750577+05:30	\N
65	76	57	FLOOR	Floor 5	\N	2026-06-15 15:38:50.757057+05:30	2026-06-15 15:38:50.757057+05:30	\N
66	76	57	FLOOR	Floor 4	\N	2026-06-15 15:38:50.76327+05:30	2026-06-15 15:38:50.76327+05:30	\N
67	76	57	FLOOR	Floor 3	\N	2026-06-15 15:38:50.768974+05:30	2026-06-15 15:38:50.768974+05:30	\N
68	76	57	FLOOR	Floor 2	\N	2026-06-15 15:38:50.775272+05:30	2026-06-15 15:38:50.775272+05:30	\N
69	76	57	FLOOR	Floor 1	\N	2026-06-15 15:38:50.781082+05:30	2026-06-15 15:38:50.781082+05:30	\N
70	76	57	FLOOR	Floor 0	\N	2026-06-15 15:38:50.787063+05:30	2026-06-15 15:38:50.787063+05:30	\N
71	77	\N	TOWER	Tower A	\N	2026-06-15 16:41:05.31432+05:30	2026-06-15 16:41:05.31432+05:30	\N
72	77	\N	TOWER	Tower B	\N	2026-06-15 16:41:05.329883+05:30	2026-06-15 16:41:05.329883+05:30	\N
73	77	\N	TOWER	Tower C	\N	2026-06-15 16:41:05.335691+05:30	2026-06-15 16:41:05.335691+05:30	\N
74	77	71	FLOOR	Floor 3	\N	2026-06-15 16:41:28.931768+05:30	2026-06-15 16:41:28.931768+05:30	\N
75	77	71	FLOOR	Floor 2	\N	2026-06-15 16:41:28.938791+05:30	2026-06-15 16:41:28.938791+05:30	\N
76	77	71	FLOOR	Floor 1	\N	2026-06-15 16:41:28.945868+05:30	2026-06-15 16:41:28.945868+05:30	\N
77	77	71	FLOOR	Floor 0	\N	2026-06-15 16:41:28.951622+05:30	2026-06-15 16:41:28.951622+05:30	\N
549	80	546	FLOOR	Floor 6	\N	2026-06-20 09:43:18.225203+05:30	2026-06-20 09:43:18.225203+05:30	\N
550	80	546	FLOOR	Floor 5	\N	2026-06-20 09:43:18.256019+05:30	2026-06-20 09:43:18.256019+05:30	\N
551	80	546	FLOOR	Floor 4	\N	2026-06-20 09:43:18.26249+05:30	2026-06-20 09:43:18.26249+05:30	\N
552	80	546	FLOOR	Floor 3	\N	2026-06-20 09:43:18.269609+05:30	2026-06-20 09:43:18.269609+05:30	\N
553	80	546	FLOOR	Floor 2	\N	2026-06-20 09:43:18.276418+05:30	2026-06-20 09:43:18.276418+05:30	\N
554	80	546	FLOOR	Floor 1	\N	2026-06-20 09:43:18.282559+05:30	2026-06-20 09:43:18.282559+05:30	\N
555	80	546	FLOOR	Floor 0	\N	2026-06-20 09:43:18.289772+05:30	2026-06-20 09:43:18.289772+05:30	\N
556	80	546	FLOOR	Floor -1	\N	2026-06-20 09:43:18.29581+05:30	2026-06-20 09:43:18.29581+05:30	\N
557	80	546	FLOOR	Floor -2	\N	2026-06-20 09:43:18.30216+05:30	2026-06-20 09:43:18.30216+05:30	\N
637	79	\N	TOWER	Tower A	\N	2026-06-26 12:40:23.475845+05:30	2026-06-26 12:40:23.475845+05:30	\N
638	79	\N	TOWER	Tower B	\N	2026-06-26 12:40:23.515783+05:30	2026-06-26 12:40:23.515783+05:30	\N
639	79	\N	TOWER	Tower C	\N	2026-06-26 12:40:23.522973+05:30	2026-06-26 12:40:23.522973+05:30	\N
641	79	637	FLOOR	Floor 4	\N	2026-06-26 15:13:46.158419+05:30	2026-06-26 15:13:46.158419+05:30	\N
642	79	637	FLOOR	Floor 3	\N	2026-06-26 15:13:46.166593+05:30	2026-06-26 15:13:46.166593+05:30	\N
643	79	637	FLOOR	Floor 2	\N	2026-06-26 15:13:46.173829+05:30	2026-06-26 15:13:46.173829+05:30	\N
644	79	637	FLOOR	Floor 1	\N	2026-06-26 15:13:46.183122+05:30	2026-06-26 15:13:46.183122+05:30	\N
645	79	637	FLOOR	Ground Floor	\N	2026-06-26 15:13:46.191323+05:30	2026-06-26 15:13:46.191323+05:30	\N
646	79	637	FLOOR	Basement 1	\N	2026-06-26 15:13:46.198923+05:30	2026-06-26 15:13:46.198923+05:30	\N
647	79	637	FLOOR	Basement 2	\N	2026-06-26 15:13:46.207199+05:30	2026-06-26 15:13:46.207199+05:30	\N
640	79	637	FLOOR	Floor 5	\N	2026-06-26 15:13:46.131276+05:30	2026-06-26 15:13:46.131276+05:30	2026-06-26 15:16:06.209829+05:30
648	79	637	FLOOR	Floor 5	\N	2026-06-26 15:16:09.324709+05:30	2026-06-26 15:16:09.324709+05:30	\N
649	79	637	FLOOR	Floor 10	\N	2026-06-26 15:25:05.963541+05:30	2026-06-26 15:25:05.963541+05:30	\N
650	79	637	FLOOR	Floor 9	\N	2026-06-26 15:25:06.028261+05:30	2026-06-26 15:25:06.028261+05:30	\N
651	79	637	FLOOR	Floor 8	\N	2026-06-26 15:25:06.035798+05:30	2026-06-26 15:25:06.035798+05:30	\N
652	79	637	FLOOR	Floor 7	\N	2026-06-26 15:25:06.04176+05:30	2026-06-26 15:25:06.04176+05:30	\N
653	79	637	FLOOR	Floor 6	\N	2026-06-26 15:25:06.052864+05:30	2026-06-26 15:25:06.052864+05:30	\N
546	80	\N	TOWER	Tower A	\N	2026-06-20 09:42:46.028696+05:30	2026-06-20 09:42:46.028696+05:30	\N
547	80	\N	TOWER	Tower B	\N	2026-06-20 09:42:46.049974+05:30	2026-06-20 09:42:46.049974+05:30	\N
548	80	\N	TOWER	Tower C	\N	2026-06-20 09:42:46.055645+05:30	2026-06-20 09:42:46.055645+05:30	\N
\.


--
-- Data for Name: project_price_quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_price_quotes (id, project_id, active, subject, content, created_at) FROM stdin;
6	9	t	Modi ullam aut tempo	<p>Harum quis nisi plac.</p>	2025-07-25 12:49:34.179252
14	1	t	Nam animi ipsum au	<p>Voluptas veniam, mol.</p>	2025-07-26 16:36:31.27265
27	13	t	Labore et rerum inve	<p>Architecto laudantiu.</p>	2025-07-30 12:05:27.412876
33	3	t	Consequatur sit do	<p>Quasi necessitatibus.</p>	2025-08-08 16:20:46.720573
34	11	t	Similique commodi fu	<p>Aliquid voluptatem. .</p>	2025-08-21 14:47:19.328272
53	49	t	asuc	<p>aisd</p>	2025-09-02 12:00:30.621164
57	10	t	Suscipit ad maxime l	<p>In perferendis dolor.</p>	2025-09-02 16:38:25.981453
63	61	t	hello	<p>hello</p>	2025-09-24 15:39:48.773397
\.


--
-- Data for Name: project_specifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_specifications (id, project_id, title, description, created_at) FROM stdin;
9	9	Magnam magni ipsam e	Consectetur ipsa d	2025-07-25 12:49:34.179252
18	1	Quia quaerat est ut	Sint voluptatem nob	2025-07-26 16:36:31.27265
32	13	test	test	2025-07-30 12:05:27.412876
38	3	test	test	2025-08-08 16:20:46.720573
39	11	Omnis dolor culpa q	Aliquip perferendis	2025-08-21 14:47:19.328272
40	23	test	test	2025-08-21 14:51:18.179513
57	24	132456789	adsf	2025-09-01 15:55:29.896429
65	49	Avc	hello	2025-09-02 12:00:30.621164
70	10	Et nihil adipisci su	Dolores itaque venia	2025-09-02 16:38:25.981453
76	61	Hello	hiwh	2025-09-24 15:39:48.773397
77	56	asdfg	asdfg	2025-09-24 15:43:25.519066
\.


--
-- Data for Name: project_towers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_towers (id, project_id, tower_name, total_floors, total_units, tower_type, lift_count, parking_type, description, created_at, updated_at, deleted_at) FROM stdin;
1	72	A wing	10	\N	residential	\N	\N	21i0	2026-01-10 14:22:05.412425+05:30	2026-01-10 14:22:05.412425+05:30	\N
2	72	B wing	10	\N	residential	\N	\N	efowj	2026-01-10 15:21:28.488773+05:30	2026-01-10 15:21:28.488773+05:30	\N
3	72	C wing	12	\N	residential	\N	\N	Hello	2026-01-10 17:37:20.373713+05:30	2026-01-10 17:37:20.373713+05:30	\N
4	75	a	1	\N	residential	\N	\N	\N	2026-05-27 12:58:58.641236+05:30	2026-05-27 12:58:58.641236+05:30	\N
5	74	A	1	\N	residential	\N	\N	\N	2026-05-27 17:32:59.556901+05:30	2026-05-27 17:32:59.556901+05:30	\N
6	75	B	1	\N	residential	\N	\N	\N	2026-05-27 17:44:39.30948+05:30	2026-05-27 17:44:39.30948+05:30	\N
7	73	A101	1	\N	residential	\N	\N	\N	2026-05-28 15:12:06.13002+05:30	2026-05-28 15:12:06.13002+05:30	\N
8	75	C	1	\N	residential	\N	\N	\N	2026-05-29 17:19:13.112251+05:30	2026-05-29 17:19:13.112251+05:30	\N
10	75	Inventory	1	\N	residential	\N	\N	\N	2026-06-11 17:23:03.826534+05:30	2026-06-11 17:23:03.826534+05:30	\N
13	76	Tower A	1	\N	residential	\N	\N	\N	2026-06-15 15:46:15.114174+05:30	2026-06-15 15:46:15.114174+05:30	\N
14	77	Tower A	1	\N	residential	\N	\N	\N	2026-06-15 16:41:33.811307+05:30	2026-06-15 16:41:33.811307+05:30	\N
16	80	Tower A	1	\N	residential	\N	\N	\N	2026-06-20 09:46:40.451772+05:30	2026-06-20 09:46:40.451772+05:30	\N
19	79	Tower A	1	\N	residential	\N	\N	\N	2026-06-26 16:08:07.103826+05:30	2026-06-26 16:08:07.103826+05:30	\N
\.


--
-- Data for Name: project_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_units (id, project_id, tower_id, floor_id, unit_type_id, unit_number, facing, is_corner, plc_applicable, floor_rise_applicable, status, remarks, created_at, updated_at, deleted_at, hierarchy_node_id, carpet_area_sqft, super_builtup_area_sqft, lead_id, price, amenities, carpet_area_unit, super_builtup_area_unit, base_rate, total_price, has_parking, parking_count) FROM stdin;
9	74	5	9	6	A101	North	f	f	t	available	\N	2026-05-27 17:32:59.569838+05:30	2026-05-27 17:32:59.569838+05:30	\N	3	8999.00	8999.00	\N	1890.00	["Balcony", "Parking", "Garden View", "Corner", "Modular Kitchen"]	sqft	sqft	\N	\N	f	\N
12	73	7	11	8	A101	North	f	f	t	available	\N	2026-05-28 15:12:06.143503+05:30	2026-05-28 15:12:06.143503+05:30	\N	6	100.00	84.93	\N	8500.00	["Balcony", "Parking", "Garden View"]	sqft	sqft	\N	\N	f	\N
122	75	10	14	23	103	\N	f	f	t	available	\N	2026-06-11 17:23:36.200753+05:30	2026-06-26 12:56:36.453866+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
123	75	10	14	23	104	\N	f	f	t	available	\N	2026-06-11 17:23:36.213693+05:30	2026-06-26 12:56:36.46978+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
124	75	10	14	23	105	\N	f	f	t	available	\N	2026-06-11 17:23:36.227212+05:30	2026-06-26 12:56:36.487473+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
125	75	10	14	23	106	\N	f	f	t	available	\N	2026-06-11 17:23:36.242797+05:30	2026-06-26 12:56:36.505158+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
126	75	10	14	23	107	\N	f	f	t	available	\N	2026-06-11 17:23:36.255929+05:30	2026-06-26 12:56:36.52256+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
127	75	10	14	23	108	\N	f	f	t	available	\N	2026-06-11 17:23:36.266784+05:30	2026-06-26 12:56:36.541444+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
128	75	10	14	23	109	\N	f	f	t	available	\N	2026-06-11 17:23:36.278102+05:30	2026-06-26 12:56:36.557921+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
30	75	10	14	23	11	\N	f	f	t	available	\N	2026-06-11 17:23:34.498795+05:30	2026-06-26 12:56:36.574101+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
31	75	10	14	23	12	\N	f	f	t	available	\N	2026-06-11 17:23:34.515513+05:30	2026-06-26 12:56:36.738433+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
32	75	10	14	23	13	\N	f	f	t	available	\N	2026-06-11 17:23:34.529217+05:30	2026-06-26 12:56:36.907523+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
34	75	10	14	23	15	\N	f	f	t	available	\N	2026-06-11 17:23:34.566826+05:30	2026-06-26 12:56:37.268918+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
35	75	10	14	23	16	\N	f	f	t	available	\N	2026-06-11 17:23:34.581649+05:30	2026-06-26 12:56:37.453985+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
36	75	10	14	23	17	\N	f	f	t	available	\N	2026-06-11 17:23:34.595837+05:30	2026-06-26 12:56:37.61532+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
37	75	10	14	23	18	\N	f	f	t	available	\N	2026-06-11 17:23:34.611941+05:30	2026-06-26 12:56:37.797035+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
38	75	10	14	23	19	\N	f	f	t	available	\N	2026-06-11 17:23:34.632845+05:30	2026-06-26 12:56:38.007993+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
21	75	10	14	23	2	\N	f	f	t	available	\N	2026-06-11 17:23:34.265015+05:30	2026-06-26 12:56:38.152563+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
39	75	10	14	23	20	\N	f	f	t	available	\N	2026-06-11 17:23:34.66148+05:30	2026-06-26 12:56:38.166837+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
40	75	10	14	23	21	\N	f	f	t	available	\N	2026-06-11 17:23:34.679088+05:30	2026-06-26 12:56:38.338256+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
41	75	10	14	23	22	\N	f	f	t	available	\N	2026-06-11 17:23:34.707088+05:30	2026-06-26 12:56:38.556031+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
42	75	10	14	23	23	\N	f	f	t	available	\N	2026-06-11 17:23:34.730734+05:30	2026-06-26 12:56:38.759072+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
43	75	10	14	23	24	\N	f	f	t	available	\N	2026-06-11 17:23:34.748023+05:30	2026-06-26 12:56:38.938927+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
44	75	10	14	23	25	\N	f	f	t	available	\N	2026-06-11 17:23:34.766627+05:30	2026-06-26 12:56:39.155167+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
45	75	10	14	23	26	\N	f	f	t	available	\N	2026-06-11 17:23:34.782704+05:30	2026-06-26 12:56:39.365002+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
46	75	10	14	23	27	\N	f	f	t	available	\N	2026-06-11 17:23:34.798889+05:30	2026-06-26 12:56:39.577125+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
47	75	10	14	23	28	\N	f	f	t	available	\N	2026-06-11 17:23:34.821577+05:30	2026-06-26 12:56:39.758146+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
48	75	10	14	23	29	\N	f	f	t	available	\N	2026-06-11 17:23:34.843802+05:30	2026-06-26 12:56:39.992022+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
22	75	10	14	23	3	\N	f	f	t	available	\N	2026-06-11 17:23:34.293546+05:30	2026-06-26 12:56:40.155676+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
49	75	10	14	23	30	\N	f	f	t	available	\N	2026-06-11 17:23:34.875852+05:30	2026-06-26 12:56:40.169854+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
50	75	10	14	23	31	\N	f	f	t	available	\N	2026-06-11 17:23:34.904303+05:30	2026-06-26 12:56:40.374716+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
51	75	10	14	23	32	\N	f	f	t	available	\N	2026-06-11 17:23:34.928453+05:30	2026-06-26 12:56:40.761856+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
53	75	10	14	23	34	\N	f	f	t	available	\N	2026-06-11 17:23:34.961678+05:30	2026-06-26 12:56:41.102561+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
54	75	10	14	23	35	\N	f	f	t	available	\N	2026-06-11 17:23:34.976914+05:30	2026-06-26 12:56:41.260682+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
55	75	10	14	23	36	\N	f	f	t	available	\N	2026-06-11 17:23:35.007502+05:30	2026-06-26 12:56:41.431624+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
56	75	10	14	23	37	\N	f	f	t	available	\N	2026-06-11 17:23:35.027561+05:30	2026-06-26 12:56:41.609826+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
57	75	10	14	23	38	\N	f	f	t	available	\N	2026-06-11 17:23:35.063783+05:30	2026-06-26 12:56:41.758933+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
58	75	10	14	23	39	\N	f	f	t	available	\N	2026-06-11 17:23:35.08646+05:30	2026-06-26 12:56:41.895925+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
23	75	10	14	23	4	\N	f	f	t	available	\N	2026-06-11 17:23:34.324653+05:30	2026-06-26 12:56:42.419189+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
59	75	10	14	23	40	\N	f	f	t	available	\N	2026-06-11 17:23:35.129171+05:30	2026-06-26 12:56:42.4353+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
60	75	10	14	23	41	\N	f	f	t	available	\N	2026-06-11 17:23:35.16819+05:30	2026-06-26 12:56:42.593081+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
61	75	10	14	23	42	\N	f	f	t	available	\N	2026-06-11 17:23:35.189507+05:30	2026-06-26 12:56:42.768836+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
62	75	10	14	23	43	\N	f	f	t	available	\N	2026-06-11 17:23:35.211322+05:30	2026-06-26 12:56:42.912708+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
63	75	10	14	23	44	\N	f	f	t	available	\N	2026-06-11 17:23:35.23319+05:30	2026-06-26 12:56:43.049905+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
65	75	10	14	23	46	\N	f	f	t	available	\N	2026-06-11 17:23:35.281533+05:30	2026-06-26 12:56:43.331758+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
66	75	10	14	23	47	\N	f	f	t	available	\N	2026-06-11 17:23:35.301726+05:30	2026-06-26 12:56:43.470232+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
67	75	10	14	23	48	\N	f	f	t	available	\N	2026-06-11 17:23:35.325794+05:30	2026-06-26 12:56:43.613318+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
68	75	10	14	23	49	\N	f	f	t	available	\N	2026-06-11 17:23:35.344447+05:30	2026-06-26 12:56:43.755156+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
24	75	10	14	23	5	\N	f	f	t	available	\N	2026-06-11 17:23:34.346803+05:30	2026-06-26 12:56:44.16684+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
69	75	10	14	23	50	\N	f	f	t	available	\N	2026-06-11 17:23:35.362364+05:30	2026-06-26 12:56:44.183499+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
70	75	10	14	23	51	\N	f	f	t	available	\N	2026-06-11 17:23:35.380498+05:30	2026-06-26 12:56:44.267323+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
25	75	10	14	23	6	\N	f	f	t	available	\N	2026-06-11 17:23:34.368015+05:30	2026-06-26 12:56:44.505424+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
26	75	10	14	23	7	\N	f	f	t	available	\N	2026-06-11 17:23:34.400997+05:30	2026-06-26 12:56:44.73889+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
27	75	10	14	23	8	\N	f	f	t	available	\N	2026-06-11 17:23:34.423314+05:30	2026-06-26 12:56:44.956116+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
28	75	10	14	23	9	\N	f	f	t	available	\N	2026-06-11 17:23:34.441437+05:30	2026-06-26 12:56:45.124674+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
8	75	10	14	5	A101	north	f	f	t	available	\N	2026-05-27 14:25:57.271084+05:30	2026-06-26 12:56:45.269253+05:30	\N	47	8999.00	8999.00	\N	1890.00	[]	sqft	sqft	\N	\N	f	\N
11	75	10	14	5	A102	north	f	f	t	available	\N	2026-05-28 10:49:47.730764+05:30	2026-06-26 12:56:45.282072+05:30	\N	47	1955.00	1955.00	\N	1800.00	[]	sqft	sqft	\N	\N	f	\N
14	75	10	14	5	A103	north	f	f	t	available	\N	2026-06-01 14:38:47.313899+05:30	2026-06-26 12:56:45.297296+05:30	\N	47	189.00	255.00	\N	1800.00	[]	sqft	sqft	\N	\N	f	\N
10	75	10	14	7	B-903	east	f	f	t	available	\N	2026-05-27 17:44:39.318697+05:30	2026-06-26 12:56:45.328752+05:30	\N	47	210.00	90.00	\N	33000.00	[]	sqft	sqft	\N	\N	f	\N
13	75	10	14	5	C101	north	f	f	t	available	\N	2026-05-29 17:19:13.177344+05:30	2026-06-26 12:56:45.34127+05:30	\N	47	189.00	230.00	\N	8500.00	[]	sqft	sqft	\N	\N	f	\N
129	75	10	14	23	110	\N	f	f	t	available	\N	2026-06-11 17:23:36.290555+05:30	2026-06-26 12:56:36.592194+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
130	75	10	14	23	111	\N	f	f	t	available	\N	2026-06-11 17:23:36.301907+05:30	2026-06-26 12:56:36.612237+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
131	75	10	14	23	112	\N	f	f	t	available	\N	2026-06-11 17:23:36.314645+05:30	2026-06-26 12:56:36.629228+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
132	75	10	14	23	113	\N	f	f	t	available	\N	2026-06-11 17:23:36.328351+05:30	2026-06-26 12:56:36.645816+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
133	75	10	14	23	114	\N	f	f	t	available	\N	2026-06-11 17:23:36.345099+05:30	2026-06-26 12:56:36.660429+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
134	75	10	14	23	115	\N	f	f	t	available	\N	2026-06-11 17:23:36.362025+05:30	2026-06-26 12:56:36.6751+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
135	75	10	14	23	116	\N	f	f	t	available	\N	2026-06-11 17:23:36.377672+05:30	2026-06-26 12:56:36.689857+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
138	75	10	14	23	119	\N	f	f	t	available	\N	2026-06-11 17:23:36.419474+05:30	2026-06-26 12:56:36.726033+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
139	75	10	14	23	120	\N	f	f	t	available	\N	2026-06-11 17:23:36.433093+05:30	2026-06-26 12:56:36.752368+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
140	75	10	14	23	121	\N	f	f	t	available	\N	2026-06-11 17:23:36.446654+05:30	2026-06-26 12:56:36.765992+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
141	75	10	14	23	122	\N	f	f	t	available	\N	2026-06-11 17:23:36.469578+05:30	2026-06-26 12:56:36.779649+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
142	75	10	14	23	123	\N	f	f	t	available	\N	2026-06-11 17:23:36.485207+05:30	2026-06-26 12:56:36.79839+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
143	75	10	14	23	124	\N	f	f	t	available	\N	2026-06-11 17:23:36.501329+05:30	2026-06-26 12:56:36.813655+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
144	75	10	14	23	125	\N	f	f	t	available	\N	2026-06-11 17:23:36.5168+05:30	2026-06-26 12:56:36.829163+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
145	75	10	14	23	126	\N	f	f	t	available	\N	2026-06-11 17:23:36.529472+05:30	2026-06-26 12:56:36.844543+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
146	75	10	14	23	127	\N	f	f	t	available	\N	2026-06-11 17:23:36.541804+05:30	2026-06-26 12:56:36.858607+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
147	75	10	14	23	128	\N	f	f	t	available	\N	2026-06-11 17:23:36.553043+05:30	2026-06-26 12:56:36.875103+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
148	75	10	14	23	129	\N	f	f	t	available	\N	2026-06-11 17:23:36.565464+05:30	2026-06-26 12:56:36.890552+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
71	75	10	14	23	52	\N	f	f	t	available	\N	2026-06-11 17:23:35.399188+05:30	2026-06-26 12:56:44.285529+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
72	75	10	14	23	53	\N	f	f	t	available	\N	2026-06-11 17:23:35.419757+05:30	2026-06-26 12:56:44.305183+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
73	75	10	14	23	54	\N	f	f	t	available	\N	2026-06-11 17:23:35.434613+05:30	2026-06-26 12:56:44.322332+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
74	75	10	14	23	55	\N	f	f	t	available	\N	2026-06-11 17:23:35.450485+05:30	2026-06-26 12:56:44.394528+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
75	75	10	14	23	56	\N	f	f	t	available	\N	2026-06-11 17:23:35.464365+05:30	2026-06-26 12:56:44.420427+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
76	75	10	14	23	57	\N	f	f	t	available	\N	2026-06-11 17:23:35.479841+05:30	2026-06-26 12:56:44.440591+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
77	75	10	14	23	58	\N	f	f	t	available	\N	2026-06-11 17:23:35.496553+05:30	2026-06-26 12:56:44.46861+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
78	75	10	14	23	59	\N	f	f	t	available	\N	2026-06-11 17:23:35.51033+05:30	2026-06-26 12:56:44.48684+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
79	75	10	14	23	60	\N	f	f	t	available	\N	2026-06-11 17:23:35.524948+05:30	2026-06-26 12:56:44.535114+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
81	75	10	14	23	62	\N	f	f	t	available	\N	2026-06-11 17:23:35.552113+05:30	2026-06-26 12:56:44.569808+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
83	75	10	14	23	64	\N	f	f	t	available	\N	2026-06-11 17:23:35.577413+05:30	2026-06-26 12:56:44.621882+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
84	75	10	14	23	65	\N	f	f	t	available	\N	2026-06-11 17:23:35.590776+05:30	2026-06-26 12:56:44.64137+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
85	75	10	14	23	66	\N	f	f	t	available	\N	2026-06-11 17:23:35.60161+05:30	2026-06-26 12:56:44.665511+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
86	75	10	14	23	67	\N	f	f	t	available	\N	2026-06-11 17:23:35.615213+05:30	2026-06-26 12:56:44.682923+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
87	75	10	14	23	68	\N	f	f	t	available	\N	2026-06-11 17:23:35.642802+05:30	2026-06-26 12:56:44.701185+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
88	75	10	14	23	69	\N	f	f	t	available	\N	2026-06-11 17:23:35.660309+05:30	2026-06-26 12:56:44.719755+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
89	75	10	14	23	70	\N	f	f	t	available	\N	2026-06-11 17:23:35.680503+05:30	2026-06-26 12:56:44.756202+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
90	75	10	14	23	71	\N	f	f	t	available	\N	2026-06-11 17:23:35.697432+05:30	2026-06-26 12:56:44.778549+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
91	75	10	14	23	72	\N	f	f	t	available	\N	2026-06-11 17:23:35.72311+05:30	2026-06-26 12:56:44.802706+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
92	75	10	14	23	73	\N	f	f	t	available	\N	2026-06-11 17:23:35.740334+05:30	2026-06-26 12:56:44.822945+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
93	75	10	14	23	74	\N	f	f	t	available	\N	2026-06-11 17:23:35.757072+05:30	2026-06-26 12:56:44.847882+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
94	75	10	14	23	75	\N	f	f	t	available	\N	2026-06-11 17:23:35.774063+05:30	2026-06-26 12:56:44.866978+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
95	75	10	14	23	76	\N	f	f	t	available	\N	2026-06-11 17:23:35.789396+05:30	2026-06-26 12:56:44.886719+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
96	75	10	14	23	77	\N	f	f	t	available	\N	2026-06-11 17:23:35.804461+05:30	2026-06-26 12:56:44.904483+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
97	75	10	14	23	78	\N	f	f	t	available	\N	2026-06-11 17:23:35.815978+05:30	2026-06-26 12:56:44.922419+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
98	75	10	14	23	79	\N	f	f	t	available	\N	2026-06-11 17:23:35.828504+05:30	2026-06-26 12:56:44.940165+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
99	75	10	14	23	80	\N	f	f	t	available	\N	2026-06-11 17:23:35.84111+05:30	2026-06-26 12:56:44.975948+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
100	75	10	14	23	81	\N	f	f	t	available	\N	2026-06-11 17:23:35.85201+05:30	2026-06-26 12:56:44.988837+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
101	75	10	14	23	82	\N	f	f	t	available	\N	2026-06-11 17:23:35.864505+05:30	2026-06-26 12:56:45.005637+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
102	75	10	14	23	83	\N	f	f	t	available	\N	2026-06-11 17:23:35.875934+05:30	2026-06-26 12:56:45.022135+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
103	75	10	14	23	84	\N	f	f	t	available	\N	2026-06-11 17:23:35.888479+05:30	2026-06-26 12:56:45.038152+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
104	75	10	14	23	85	\N	f	f	t	available	\N	2026-06-11 17:23:35.899216+05:30	2026-06-26 12:56:45.052186+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
105	75	10	14	23	86	\N	f	f	t	available	\N	2026-06-11 17:23:35.912114+05:30	2026-06-26 12:56:45.066421+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
106	75	10	14	23	87	\N	f	f	t	available	\N	2026-06-11 17:23:35.925806+05:30	2026-06-26 12:56:45.080652+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
107	75	10	14	23	88	\N	f	f	t	available	\N	2026-06-11 17:23:35.945888+05:30	2026-06-26 12:56:45.096241+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
108	75	10	14	23	89	\N	f	f	t	available	\N	2026-06-11 17:23:35.958444+05:30	2026-06-26 12:56:45.110924+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
109	75	10	14	23	90	\N	f	f	t	available	\N	2026-06-11 17:23:35.973078+05:30	2026-06-26 12:56:45.139394+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
110	75	10	14	23	91	\N	f	f	t	available	\N	2026-06-11 17:23:35.994464+05:30	2026-06-26 12:56:45.15412+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
111	75	10	14	23	92	\N	f	f	t	available	\N	2026-06-11 17:23:36.011649+05:30	2026-06-26 12:56:45.166909+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
114	75	10	14	23	95	\N	f	f	t	available	\N	2026-06-11 17:23:36.066053+05:30	2026-06-26 12:56:45.20477+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
115	75	10	14	23	96	\N	f	f	t	available	\N	2026-06-11 17:23:36.089489+05:30	2026-06-26 12:56:45.218314+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
116	75	10	14	23	97	\N	f	f	t	available	\N	2026-06-11 17:23:36.106613+05:30	2026-06-26 12:56:45.231054+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
117	75	10	14	23	98	\N	f	f	t	available	\N	2026-06-11 17:23:36.123772+05:30	2026-06-26 12:56:45.243744+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
118	75	10	14	23	99	\N	f	f	t	available	\N	2026-06-11 17:23:36.1483+05:30	2026-06-26 12:56:45.256483+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
149	75	10	14	23	130	\N	f	f	t	available	\N	2026-06-11 17:23:36.57754+05:30	2026-06-26 12:56:36.927329+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
150	75	10	14	23	131	\N	f	f	t	available	\N	2026-06-11 17:23:36.589521+05:30	2026-06-26 12:56:36.942995+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
151	75	10	14	23	132	\N	f	f	t	available	\N	2026-06-11 17:23:36.600231+05:30	2026-06-26 12:56:36.958606+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
152	75	10	14	23	133	\N	f	f	t	available	\N	2026-06-11 17:23:36.612342+05:30	2026-06-26 12:56:36.973928+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
153	75	10	14	23	134	\N	f	f	t	available	\N	2026-06-11 17:23:36.625449+05:30	2026-06-26 12:56:36.987426+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
154	75	10	14	23	135	\N	f	f	t	available	\N	2026-06-11 17:23:36.637318+05:30	2026-06-26 12:56:37.0001+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
155	75	10	14	23	136	\N	f	f	t	available	\N	2026-06-11 17:23:36.649626+05:30	2026-06-26 12:56:37.01233+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
156	75	10	14	23	137	\N	f	f	t	available	\N	2026-06-11 17:23:36.66177+05:30	2026-06-26 12:56:37.023952+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
157	75	10	14	23	138	\N	f	f	t	available	\N	2026-06-11 17:23:36.67263+05:30	2026-06-26 12:56:37.035597+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
158	75	10	14	23	139	\N	f	f	t	available	\N	2026-06-11 17:23:36.681622+05:30	2026-06-26 12:56:37.050397+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
159	75	10	14	23	140	\N	f	f	t	available	\N	2026-06-11 17:23:36.692919+05:30	2026-06-26 12:56:37.078949+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
160	75	10	14	23	141	\N	f	f	t	available	\N	2026-06-11 17:23:36.704863+05:30	2026-06-26 12:56:37.09456+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
161	75	10	14	23	142	\N	f	f	t	available	\N	2026-06-11 17:23:36.721373+05:30	2026-06-26 12:56:37.110036+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
162	75	10	14	23	143	\N	f	f	t	available	\N	2026-06-11 17:23:36.742191+05:30	2026-06-26 12:56:37.126792+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
163	75	10	14	23	144	\N	f	f	t	available	\N	2026-06-11 17:23:36.759718+05:30	2026-06-26 12:56:37.144206+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
165	75	10	14	23	146	\N	f	f	t	available	\N	2026-06-11 17:23:36.790756+05:30	2026-06-26 12:56:37.178841+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
166	75	10	14	23	147	\N	f	f	t	available	\N	2026-06-11 17:23:36.81307+05:30	2026-06-26 12:56:37.196882+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
167	75	10	14	23	148	\N	f	f	t	available	\N	2026-06-11 17:23:36.825749+05:30	2026-06-26 12:56:37.218134+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
168	75	10	14	23	149	\N	f	f	t	available	\N	2026-06-11 17:23:36.858481+05:30	2026-06-26 12:56:37.248311+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
169	75	10	14	23	150	\N	f	f	t	available	\N	2026-06-11 17:23:36.876392+05:30	2026-06-26 12:56:37.285267+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
170	75	10	14	23	151	\N	f	f	t	available	\N	2026-06-11 17:23:36.896883+05:30	2026-06-26 12:56:37.301866+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
171	75	10	14	23	152	\N	f	f	t	available	\N	2026-06-11 17:23:36.913632+05:30	2026-06-26 12:56:37.315409+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
172	75	10	14	23	153	\N	f	f	t	available	\N	2026-06-11 17:23:36.93002+05:30	2026-06-26 12:56:37.337231+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
173	75	10	14	23	154	\N	f	f	t	available	\N	2026-06-11 17:23:36.94408+05:30	2026-06-26 12:56:37.354873+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
174	75	10	14	23	155	\N	f	f	t	available	\N	2026-06-11 17:23:36.955981+05:30	2026-06-26 12:56:37.370445+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
175	75	10	14	23	156	\N	f	f	t	available	\N	2026-06-11 17:23:36.975993+05:30	2026-06-26 12:56:37.388447+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
176	75	10	14	23	157	\N	f	f	t	available	\N	2026-06-11 17:23:36.989499+05:30	2026-06-26 12:56:37.406735+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
178	75	10	14	23	159	\N	f	f	t	available	\N	2026-06-11 17:23:37.01417+05:30	2026-06-26 12:56:37.437456+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
179	75	10	14	23	160	\N	f	f	t	available	\N	2026-06-11 17:23:37.025938+05:30	2026-06-26 12:56:37.468915+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
180	75	10	14	23	161	\N	f	f	t	available	\N	2026-06-11 17:23:37.035819+05:30	2026-06-26 12:56:37.481922+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
181	75	10	14	23	162	\N	f	f	t	available	\N	2026-06-11 17:23:37.047925+05:30	2026-06-26 12:56:37.50837+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
182	75	10	14	23	163	\N	f	f	t	available	\N	2026-06-11 17:23:37.059833+05:30	2026-06-26 12:56:37.524229+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
183	75	10	14	23	164	\N	f	f	t	available	\N	2026-06-11 17:23:37.072522+05:30	2026-06-26 12:56:37.539443+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
184	75	10	14	23	165	\N	f	f	t	available	\N	2026-06-11 17:23:37.083166+05:30	2026-06-26 12:56:37.551883+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
185	75	10	14	23	166	\N	f	f	t	available	\N	2026-06-11 17:23:37.095279+05:30	2026-06-26 12:56:37.563969+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
186	75	10	14	23	167	\N	f	f	t	available	\N	2026-06-11 17:23:37.108733+05:30	2026-06-26 12:56:37.576942+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
187	75	10	14	23	168	\N	f	f	t	available	\N	2026-06-11 17:23:37.118478+05:30	2026-06-26 12:56:37.590724+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
188	75	10	14	23	169	\N	f	f	t	available	\N	2026-06-11 17:23:37.131521+05:30	2026-06-26 12:56:37.602104+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
189	75	10	14	23	170	\N	f	f	t	available	\N	2026-06-11 17:23:37.14925+05:30	2026-06-26 12:56:37.629295+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
190	75	10	14	23	171	\N	f	f	t	available	\N	2026-06-11 17:23:37.165489+05:30	2026-06-26 12:56:37.644732+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
191	75	10	14	23	172	\N	f	f	t	available	\N	2026-06-11 17:23:37.181821+05:30	2026-06-26 12:56:37.661895+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
192	75	10	14	23	173	\N	f	f	t	available	\N	2026-06-11 17:23:37.196367+05:30	2026-06-26 12:56:37.675533+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
193	75	10	14	23	174	\N	f	f	t	available	\N	2026-06-11 17:23:37.208507+05:30	2026-06-26 12:56:37.690835+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
194	75	10	14	23	175	\N	f	f	t	available	\N	2026-06-11 17:23:37.229588+05:30	2026-06-26 12:56:37.705315+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
196	75	10	14	23	177	\N	f	f	t	available	\N	2026-06-11 17:23:37.268494+05:30	2026-06-26 12:56:37.73939+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
197	75	10	14	23	178	\N	f	f	t	available	\N	2026-06-11 17:23:37.284752+05:30	2026-06-26 12:56:37.756109+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
198	75	10	14	23	179	\N	f	f	t	available	\N	2026-06-11 17:23:37.300563+05:30	2026-06-26 12:56:37.777243+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
199	75	10	14	23	180	\N	f	f	t	available	\N	2026-06-11 17:23:37.314185+05:30	2026-06-26 12:56:37.814572+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
200	75	10	14	23	181	\N	f	f	t	available	\N	2026-06-11 17:23:37.328207+05:30	2026-06-26 12:56:37.832819+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
203	75	10	14	23	184	\N	f	f	t	available	\N	2026-06-11 17:23:37.372953+05:30	2026-06-26 12:56:37.884507+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
204	75	10	14	23	185	\N	f	f	t	available	\N	2026-06-11 17:23:37.384312+05:30	2026-06-26 12:56:37.903952+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
205	75	10	14	23	186	\N	f	f	t	available	\N	2026-06-11 17:23:37.396112+05:30	2026-06-26 12:56:37.925668+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
206	75	10	14	23	187	\N	f	f	t	available	\N	2026-06-11 17:23:37.408551+05:30	2026-06-26 12:56:37.948832+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
207	75	10	14	23	188	\N	f	f	t	available	\N	2026-06-11 17:23:37.419482+05:30	2026-06-26 12:56:37.967031+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
208	75	10	14	23	189	\N	f	f	t	available	\N	2026-06-11 17:23:37.431516+05:30	2026-06-26 12:56:37.985346+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
209	75	10	14	23	190	\N	f	f	t	available	\N	2026-06-11 17:23:37.443676+05:30	2026-06-26 12:56:38.023036+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
210	75	10	14	23	191	\N	f	f	t	available	\N	2026-06-11 17:23:37.456236+05:30	2026-06-26 12:56:38.038012+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
212	75	10	14	23	193	\N	f	f	t	available	\N	2026-06-11 17:23:37.477278+05:30	2026-06-26 12:56:38.063797+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
213	75	10	14	23	194	\N	f	f	t	available	\N	2026-06-11 17:23:37.488574+05:30	2026-06-26 12:56:38.075215+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
214	75	10	14	23	195	\N	f	f	t	available	\N	2026-06-11 17:23:37.499079+05:30	2026-06-26 12:56:38.087409+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
215	75	10	14	23	196	\N	f	f	t	available	\N	2026-06-11 17:23:37.511392+05:30	2026-06-26 12:56:38.098447+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
216	75	10	14	23	197	\N	f	f	t	available	\N	2026-06-11 17:23:37.536426+05:30	2026-06-26 12:56:38.109858+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
217	75	10	14	23	198	\N	f	f	t	available	\N	2026-06-11 17:23:37.55988+05:30	2026-06-26 12:56:38.121304+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
218	75	10	14	23	199	\N	f	f	t	available	\N	2026-06-11 17:23:37.575508+05:30	2026-06-26 12:56:38.137575+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
219	75	10	14	23	200	\N	f	f	t	available	\N	2026-06-11 17:23:37.58896+05:30	2026-06-26 12:56:38.186514+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
220	75	10	14	23	201	\N	f	f	t	available	\N	2026-06-11 17:23:37.601499+05:30	2026-06-26 12:56:38.201403+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
221	75	10	14	23	202	\N	f	f	t	available	\N	2026-06-11 17:23:37.615647+05:30	2026-06-26 12:56:38.218022+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
222	75	10	14	23	203	\N	f	f	t	available	\N	2026-06-11 17:23:37.629006+05:30	2026-06-26 12:56:38.233771+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
223	75	10	14	23	204	\N	f	f	t	available	\N	2026-06-11 17:23:37.652439+05:30	2026-06-26 12:56:38.252243+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
224	75	10	14	23	205	\N	f	f	t	available	\N	2026-06-11 17:23:37.66649+05:30	2026-06-26 12:56:38.269857+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
225	75	10	14	23	206	\N	f	f	t	available	\N	2026-06-11 17:23:37.678168+05:30	2026-06-26 12:56:38.285432+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
226	75	10	14	23	207	\N	f	f	t	available	\N	2026-06-11 17:23:37.695952+05:30	2026-06-26 12:56:38.298135+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
227	75	10	14	23	208	\N	f	f	t	available	\N	2026-06-11 17:23:37.708457+05:30	2026-06-26 12:56:38.31368+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
228	75	10	14	23	209	\N	f	f	t	available	\N	2026-06-11 17:23:37.720233+05:30	2026-06-26 12:56:38.326513+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
230	75	10	14	23	211	\N	f	f	t	available	\N	2026-06-11 17:23:37.743656+05:30	2026-06-26 12:56:38.362454+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
231	75	10	14	23	212	\N	f	f	t	available	\N	2026-06-11 17:23:37.755723+05:30	2026-06-26 12:56:38.373631+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
232	75	10	14	23	213	\N	f	f	t	available	\N	2026-06-11 17:23:37.766912+05:30	2026-06-26 12:56:38.391321+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
233	75	10	14	23	214	\N	f	f	t	available	\N	2026-06-11 17:23:37.779128+05:30	2026-06-26 12:56:38.409743+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
234	75	10	14	23	215	\N	f	f	t	available	\N	2026-06-11 17:23:37.791173+05:30	2026-06-26 12:56:38.42994+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
235	75	10	14	23	216	\N	f	f	t	available	\N	2026-06-11 17:23:37.802565+05:30	2026-06-26 12:56:38.455601+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
236	75	10	14	23	217	\N	f	f	t	available	\N	2026-06-11 17:23:37.815205+05:30	2026-06-26 12:56:38.487169+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
237	75	10	14	23	218	\N	f	f	t	available	\N	2026-06-11 17:23:37.827752+05:30	2026-06-26 12:56:38.511458+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
238	75	10	14	23	219	\N	f	f	t	available	\N	2026-06-11 17:23:37.839838+05:30	2026-06-26 12:56:38.532151+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
239	75	10	14	23	220	\N	f	f	t	available	\N	2026-06-11 17:23:37.850222+05:30	2026-06-26 12:56:38.569835+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
240	75	10	14	23	221	\N	f	f	t	available	\N	2026-06-11 17:23:37.863807+05:30	2026-06-26 12:56:38.583335+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
241	75	10	14	23	222	\N	f	f	t	available	\N	2026-06-11 17:23:37.877241+05:30	2026-06-26 12:56:38.599283+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
242	75	10	14	23	223	\N	f	f	t	available	\N	2026-06-11 17:23:37.89319+05:30	2026-06-26 12:56:38.616532+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
243	75	10	14	23	224	\N	f	f	t	available	\N	2026-06-11 17:23:37.905832+05:30	2026-06-26 12:56:38.633174+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
244	75	10	14	23	225	\N	f	f	t	available	\N	2026-06-11 17:23:37.916802+05:30	2026-06-26 12:56:38.646377+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
246	75	10	14	23	227	\N	f	f	t	available	\N	2026-06-11 17:23:37.949062+05:30	2026-06-26 12:56:38.675913+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
247	75	10	14	23	228	\N	f	f	t	available	\N	2026-06-11 17:23:37.963538+05:30	2026-06-26 12:56:38.70534+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
248	75	10	14	23	229	\N	f	f	t	available	\N	2026-06-11 17:23:37.982614+05:30	2026-06-26 12:56:38.737428+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
249	75	10	14	23	230	\N	f	f	t	available	\N	2026-06-11 17:23:37.998998+05:30	2026-06-26 12:56:38.777299+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
250	75	10	14	23	231	\N	f	f	t	available	\N	2026-06-11 17:23:38.014342+05:30	2026-06-26 12:56:38.792818+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
251	75	10	14	23	232	\N	f	f	t	available	\N	2026-06-11 17:23:38.030765+05:30	2026-06-26 12:56:38.809041+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
252	75	10	14	23	233	\N	f	f	t	available	\N	2026-06-11 17:23:38.046322+05:30	2026-06-26 12:56:38.823194+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
253	75	10	14	23	234	\N	f	f	t	available	\N	2026-06-11 17:23:38.061843+05:30	2026-06-26 12:56:38.837674+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
254	75	10	14	23	235	\N	f	f	t	available	\N	2026-06-11 17:23:38.079018+05:30	2026-06-26 12:56:38.854558+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
255	75	10	14	23	236	\N	f	f	t	available	\N	2026-06-11 17:23:38.091393+05:30	2026-06-26 12:56:38.867587+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
256	75	10	14	23	237	\N	f	f	t	available	\N	2026-06-11 17:23:38.110873+05:30	2026-06-26 12:56:38.881425+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
257	75	10	14	23	238	\N	f	f	t	available	\N	2026-06-11 17:23:38.145509+05:30	2026-06-26 12:56:38.90604+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
258	75	10	14	23	239	\N	f	f	t	available	\N	2026-06-11 17:23:38.160762+05:30	2026-06-26 12:56:38.922725+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
259	75	10	14	23	240	\N	f	f	t	available	\N	2026-06-11 17:23:38.180579+05:30	2026-06-26 12:56:38.963271+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
261	75	10	14	23	242	\N	f	f	t	available	\N	2026-06-11 17:23:38.204186+05:30	2026-06-26 12:56:39.013386+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
262	75	10	14	23	243	\N	f	f	t	available	\N	2026-06-11 17:23:38.223386+05:30	2026-06-26 12:56:39.03608+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
263	75	10	14	23	244	\N	f	f	t	available	\N	2026-06-11 17:23:38.235824+05:30	2026-06-26 12:56:39.058729+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
264	75	10	14	23	245	\N	f	f	t	available	\N	2026-06-11 17:23:38.257261+05:30	2026-06-26 12:56:39.074299+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
265	75	10	14	23	246	\N	f	f	t	available	\N	2026-06-11 17:23:38.269622+05:30	2026-06-26 12:56:39.09029+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
268	75	10	14	23	249	\N	f	f	t	available	\N	2026-06-11 17:23:38.307891+05:30	2026-06-26 12:56:39.137416+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
269	75	10	14	23	250	\N	f	f	t	available	\N	2026-06-11 17:23:38.322885+05:30	2026-06-26 12:56:39.171766+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
270	75	10	14	23	251	\N	f	f	t	available	\N	2026-06-11 17:23:38.335714+05:30	2026-06-26 12:56:39.188305+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
271	75	10	14	23	252	\N	f	f	t	available	\N	2026-06-11 17:23:38.356079+05:30	2026-06-26 12:56:39.212282+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
272	75	10	14	23	253	\N	f	f	t	available	\N	2026-06-11 17:23:38.369876+05:30	2026-06-26 12:56:39.232877+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
273	75	10	14	23	254	\N	f	f	t	available	\N	2026-06-11 17:23:38.3892+05:30	2026-06-26 12:56:39.256752+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
274	75	10	14	23	255	\N	f	f	t	available	\N	2026-06-11 17:23:38.405892+05:30	2026-06-26 12:56:39.279705+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
275	75	10	14	23	256	\N	f	f	t	available	\N	2026-06-11 17:23:38.419947+05:30	2026-06-26 12:56:39.297394+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
276	75	10	14	23	257	\N	f	f	t	available	\N	2026-06-11 17:23:38.435984+05:30	2026-06-26 12:56:39.31603+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
277	75	10	14	23	258	\N	f	f	t	available	\N	2026-06-11 17:23:38.450582+05:30	2026-06-26 12:56:39.335289+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
278	75	10	14	23	259	\N	f	f	t	available	\N	2026-06-11 17:23:38.470497+05:30	2026-06-26 12:56:39.348568+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
280	75	10	14	23	261	\N	f	f	t	available	\N	2026-06-11 17:23:38.500583+05:30	2026-06-26 12:56:39.407892+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
281	75	10	14	23	262	\N	f	f	t	available	\N	2026-06-11 17:23:38.51429+05:30	2026-06-26 12:56:39.429858+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
282	75	10	14	23	263	\N	f	f	t	available	\N	2026-06-11 17:23:38.526316+05:30	2026-06-26 12:56:39.453334+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
283	75	10	14	23	264	\N	f	f	t	available	\N	2026-06-11 17:23:38.538653+05:30	2026-06-26 12:56:39.468382+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
284	75	10	14	23	265	\N	f	f	t	available	\N	2026-06-11 17:23:38.548538+05:30	2026-06-26 12:56:39.481777+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
285	75	10	14	23	266	\N	f	f	t	available	\N	2026-06-11 17:23:38.5616+05:30	2026-06-26 12:56:39.498059+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
286	75	10	14	23	267	\N	f	f	t	available	\N	2026-06-11 17:23:38.572951+05:30	2026-06-26 12:56:39.527768+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
287	75	10	14	23	268	\N	f	f	t	available	\N	2026-06-11 17:23:38.584085+05:30	2026-06-26 12:56:39.541976+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
288	75	10	14	23	269	\N	f	f	t	available	\N	2026-06-11 17:23:38.595972+05:30	2026-06-26 12:56:39.556594+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
289	75	10	14	23	270	\N	f	f	t	available	\N	2026-06-11 17:23:38.606962+05:30	2026-06-26 12:56:39.590289+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
290	75	10	14	23	271	\N	f	f	t	available	\N	2026-06-11 17:23:38.618201+05:30	2026-06-26 12:56:39.607775+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
291	75	10	14	23	272	\N	f	f	t	available	\N	2026-06-11 17:23:38.62953+05:30	2026-06-26 12:56:39.62542+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
292	75	10	14	23	273	\N	f	f	t	available	\N	2026-06-11 17:23:38.641953+05:30	2026-06-26 12:56:39.640164+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
293	75	10	14	23	274	\N	f	f	t	available	\N	2026-06-11 17:23:38.653441+05:30	2026-06-26 12:56:39.655238+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
295	75	10	14	23	276	\N	f	f	t	available	\N	2026-06-11 17:23:38.689681+05:30	2026-06-26 12:56:39.686847+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
296	75	10	14	23	277	\N	f	f	t	available	\N	2026-06-11 17:23:38.706512+05:30	2026-06-26 12:56:39.707256+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
297	75	10	14	23	278	\N	f	f	t	available	\N	2026-06-11 17:23:38.722866+05:30	2026-06-26 12:56:39.725741+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
298	75	10	14	23	279	\N	f	f	t	available	\N	2026-06-11 17:23:38.740504+05:30	2026-06-26 12:56:39.742155+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
299	75	10	14	23	280	\N	f	f	t	available	\N	2026-06-11 17:23:38.765649+05:30	2026-06-26 12:56:39.774125+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
300	75	10	14	23	281	\N	f	f	t	available	\N	2026-06-11 17:23:38.793986+05:30	2026-06-26 12:56:39.795725+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
301	75	10	14	23	282	\N	f	f	t	available	\N	2026-06-11 17:23:38.823253+05:30	2026-06-26 12:56:39.819118+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
302	75	10	14	23	283	\N	f	f	t	available	\N	2026-06-11 17:23:38.837673+05:30	2026-06-26 12:56:39.846358+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
303	75	10	14	23	284	\N	f	f	t	available	\N	2026-06-11 17:23:38.849336+05:30	2026-06-26 12:56:39.8658+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
304	75	10	14	23	285	\N	f	f	t	available	\N	2026-06-11 17:23:38.861853+05:30	2026-06-26 12:56:39.890633+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
305	75	10	14	23	286	\N	f	f	t	available	\N	2026-06-11 17:23:38.874186+05:30	2026-06-26 12:56:39.913058+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
306	75	10	14	23	287	\N	f	f	t	available	\N	2026-06-11 17:23:38.885588+05:30	2026-06-26 12:56:39.935576+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
307	75	10	14	23	288	\N	f	f	t	available	\N	2026-06-11 17:23:38.89975+05:30	2026-06-26 12:56:39.95749+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
308	75	10	14	23	289	\N	f	f	t	available	\N	2026-06-11 17:23:38.913224+05:30	2026-06-26 12:56:39.978621+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
309	75	10	14	23	290	\N	f	f	t	available	\N	2026-06-11 17:23:38.92681+05:30	2026-06-26 12:56:40.006273+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
310	75	10	14	23	291	\N	f	f	t	available	\N	2026-06-11 17:23:38.940684+05:30	2026-06-26 12:56:40.019399+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
311	75	10	14	23	292	\N	f	f	t	available	\N	2026-06-11 17:23:38.959485+05:30	2026-06-26 12:56:40.032606+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
312	75	10	14	23	293	\N	f	f	t	available	\N	2026-06-11 17:23:38.993684+05:30	2026-06-26 12:56:40.046616+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
314	75	10	14	23	295	\N	f	f	t	available	\N	2026-06-11 17:23:39.026809+05:30	2026-06-26 12:56:40.075498+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
315	75	10	14	23	296	\N	f	f	t	available	\N	2026-06-11 17:23:39.046358+05:30	2026-06-26 12:56:40.090203+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
316	75	10	14	23	297	\N	f	f	t	available	\N	2026-06-11 17:23:39.063718+05:30	2026-06-26 12:56:40.104737+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
317	75	10	14	23	298	\N	f	f	t	available	\N	2026-06-11 17:23:39.091487+05:30	2026-06-26 12:56:40.120668+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
318	75	10	14	23	299	\N	f	f	t	available	\N	2026-06-11 17:23:39.117267+05:30	2026-06-26 12:56:40.135766+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
319	75	10	14	23	300	\N	f	f	t	available	\N	2026-06-11 17:23:39.136502+05:30	2026-06-26 12:56:40.187395+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
320	75	10	14	23	301	\N	f	f	t	available	\N	2026-06-11 17:23:39.149969+05:30	2026-06-26 12:56:40.205584+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
321	75	10	14	23	302	\N	f	f	t	available	\N	2026-06-11 17:23:39.164087+05:30	2026-06-26 12:56:40.224996+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
322	75	10	14	23	303	\N	f	f	t	available	\N	2026-06-11 17:23:39.177532+05:30	2026-06-26 12:56:40.246962+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
323	75	10	14	23	304	\N	f	f	t	available	\N	2026-06-11 17:23:39.190906+05:30	2026-06-26 12:56:40.266109+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
324	75	10	14	23	305	\N	f	f	t	available	\N	2026-06-11 17:23:39.210265+05:30	2026-06-26 12:56:40.285412+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
326	75	10	14	23	307	\N	f	f	t	available	\N	2026-06-11 17:23:39.237473+05:30	2026-06-26 12:56:40.329313+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
327	75	10	14	23	308	\N	f	f	t	available	\N	2026-06-11 17:23:39.248734+05:30	2026-06-26 12:56:40.345864+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
328	75	10	14	23	309	\N	f	f	t	available	\N	2026-06-11 17:23:39.261137+05:30	2026-06-26 12:56:40.360534+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
329	75	10	14	23	310	\N	f	f	t	available	\N	2026-06-11 17:23:39.272695+05:30	2026-06-26 12:56:40.390298+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
330	75	10	14	23	311	\N	f	f	t	available	\N	2026-06-11 17:23:39.289983+05:30	2026-06-26 12:56:40.40576+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
333	75	10	14	23	314	\N	f	f	t	available	\N	2026-06-11 17:23:39.346097+05:30	2026-06-26 12:56:40.664593+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
334	75	10	14	23	315	\N	f	f	t	available	\N	2026-06-11 17:23:39.37489+05:30	2026-06-26 12:56:40.682294+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
335	75	10	14	23	316	\N	f	f	t	available	\N	2026-06-11 17:23:39.40544+05:30	2026-06-26 12:56:40.698014+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
336	75	10	14	23	317	\N	f	f	t	available	\N	2026-06-11 17:23:39.425365+05:30	2026-06-26 12:56:40.712691+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
337	75	10	14	23	318	\N	f	f	t	available	\N	2026-06-11 17:23:39.447844+05:30	2026-06-26 12:56:40.73086+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
338	75	10	14	23	319	\N	f	f	t	available	\N	2026-06-11 17:23:39.467258+05:30	2026-06-26 12:56:40.746235+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
339	75	10	14	23	320	\N	f	f	t	available	\N	2026-06-11 17:23:39.48525+05:30	2026-06-26 12:56:40.778316+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
340	75	10	14	23	321	\N	f	f	t	available	\N	2026-06-11 17:23:39.498839+05:30	2026-06-26 12:56:40.803023+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
341	75	10	14	23	322	\N	f	f	t	available	\N	2026-06-11 17:23:39.511446+05:30	2026-06-26 12:56:40.820763+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
342	75	10	14	23	323	\N	f	f	t	available	\N	2026-06-11 17:23:39.523825+05:30	2026-06-26 12:56:40.836884+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
343	75	10	14	23	324	\N	f	f	t	available	\N	2026-06-11 17:23:39.535105+05:30	2026-06-26 12:56:40.853582+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
344	75	10	14	23	325	\N	f	f	t	available	\N	2026-06-11 17:23:39.547107+05:30	2026-06-26 12:56:40.87028+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
345	75	10	14	23	326	\N	f	f	t	available	\N	2026-06-11 17:23:39.560381+05:30	2026-06-26 12:56:40.886861+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
346	75	10	14	23	327	\N	f	f	t	available	\N	2026-06-11 17:23:39.581406+05:30	2026-06-26 12:56:40.904345+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
348	75	10	14	23	329	\N	f	f	t	available	\N	2026-06-11 17:23:39.62314+05:30	2026-06-26 12:56:40.935072+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
349	75	10	14	23	330	\N	f	f	t	available	\N	2026-06-11 17:23:39.636254+05:30	2026-06-26 12:56:40.967325+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
350	75	10	14	23	331	\N	f	f	t	available	\N	2026-06-11 17:23:39.655699+05:30	2026-06-26 12:56:40.980351+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
351	75	10	14	23	332	\N	f	f	t	available	\N	2026-06-11 17:23:39.676986+05:30	2026-06-26 12:56:40.993365+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
352	75	10	14	23	333	\N	f	f	t	available	\N	2026-06-11 17:23:39.6953+05:30	2026-06-26 12:56:41.005491+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
353	75	10	14	23	334	\N	f	f	t	available	\N	2026-06-11 17:23:39.716719+05:30	2026-06-26 12:56:41.017954+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
354	75	10	14	23	335	\N	f	f	t	available	\N	2026-06-11 17:23:39.730091+05:30	2026-06-26 12:56:41.032537+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
355	75	10	14	23	336	\N	f	f	t	available	\N	2026-06-11 17:23:39.743925+05:30	2026-06-26 12:56:41.046177+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
356	75	10	14	23	337	\N	f	f	t	available	\N	2026-06-11 17:23:39.757544+05:30	2026-06-26 12:56:41.058969+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
357	75	10	14	23	338	\N	f	f	t	available	\N	2026-06-11 17:23:39.770855+05:30	2026-06-26 12:56:41.073017+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
358	75	10	14	23	339	\N	f	f	t	available	\N	2026-06-11 17:23:39.784394+05:30	2026-06-26 12:56:41.088654+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
360	75	10	14	23	341	\N	f	f	t	available	\N	2026-06-11 17:23:39.820741+05:30	2026-06-26 12:56:41.130142+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
361	75	10	14	23	342	\N	f	f	t	available	\N	2026-06-11 17:23:39.831186+05:30	2026-06-26 12:56:41.142818+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
362	75	10	14	23	343	\N	f	f	t	available	\N	2026-06-11 17:23:39.842712+05:30	2026-06-26 12:56:41.155998+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
363	75	10	14	23	344	\N	f	f	t	available	\N	2026-06-11 17:23:39.875374+05:30	2026-06-26 12:56:41.170829+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
364	75	10	14	23	345	\N	f	f	t	available	\N	2026-06-11 17:23:39.891361+05:30	2026-06-26 12:56:41.186027+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
365	75	10	14	23	346	\N	f	f	t	available	\N	2026-06-11 17:23:39.906479+05:30	2026-06-26 12:56:41.2014+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
366	75	10	14	23	347	\N	f	f	t	available	\N	2026-06-11 17:23:39.921361+05:30	2026-06-26 12:56:41.21616+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
367	75	10	14	23	348	\N	f	f	t	available	\N	2026-06-11 17:23:39.940472+05:30	2026-06-26 12:56:41.23042+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
368	75	10	14	23	349	\N	f	f	t	available	\N	2026-06-11 17:23:39.958707+05:30	2026-06-26 12:56:41.245621+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
369	75	10	14	23	350	\N	f	f	t	available	\N	2026-06-11 17:23:39.975443+05:30	2026-06-26 12:56:41.27706+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
370	75	10	14	23	351	\N	f	f	t	available	\N	2026-06-11 17:23:39.996775+05:30	2026-06-26 12:56:41.292692+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
371	75	10	14	23	352	\N	f	f	t	available	\N	2026-06-11 17:23:40.012321+05:30	2026-06-26 12:56:41.309094+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
372	75	10	14	23	353	\N	f	f	t	available	\N	2026-06-11 17:23:40.02648+05:30	2026-06-26 12:56:41.327318+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
373	75	10	14	23	354	\N	f	f	t	available	\N	2026-06-11 17:23:40.040029+05:30	2026-06-26 12:56:41.341122+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
374	75	10	14	23	355	\N	f	f	t	available	\N	2026-06-11 17:23:40.0509+05:30	2026-06-26 12:56:41.35656+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
375	75	10	14	23	356	\N	f	f	t	available	\N	2026-06-11 17:23:40.062562+05:30	2026-06-26 12:56:41.374217+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
376	75	10	14	23	357	\N	f	f	t	available	\N	2026-06-11 17:23:40.074953+05:30	2026-06-26 12:56:41.390982+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
377	75	10	14	23	358	\N	f	f	t	available	\N	2026-06-11 17:23:40.084892+05:30	2026-06-26 12:56:41.404186+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
378	75	10	14	23	359	\N	f	f	t	available	\N	2026-06-11 17:23:40.097428+05:30	2026-06-26 12:56:41.417184+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
379	75	10	14	23	360	\N	f	f	t	available	\N	2026-06-11 17:23:40.109989+05:30	2026-06-26 12:56:41.445057+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
380	75	10	14	23	361	\N	f	f	t	available	\N	2026-06-11 17:23:40.124975+05:30	2026-06-26 12:56:41.45744+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
382	75	10	14	23	363	\N	f	f	t	available	\N	2026-06-11 17:23:40.155695+05:30	2026-06-26 12:56:41.499072+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
383	75	10	14	23	364	\N	f	f	t	available	\N	2026-06-11 17:23:40.177778+05:30	2026-06-26 12:56:41.513543+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
384	75	10	14	23	365	\N	f	f	t	available	\N	2026-06-11 17:23:40.192066+05:30	2026-06-26 12:56:41.528363+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
385	75	10	14	23	366	\N	f	f	t	available	\N	2026-06-11 17:23:40.210275+05:30	2026-06-26 12:56:41.542697+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
386	75	10	14	23	367	\N	f	f	t	available	\N	2026-06-11 17:23:40.226062+05:30	2026-06-26 12:56:41.557601+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
387	75	10	14	23	368	\N	f	f	t	available	\N	2026-06-11 17:23:40.239971+05:30	2026-06-26 12:56:41.576077+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
388	75	10	14	23	369	\N	f	f	t	available	\N	2026-06-11 17:23:40.264807+05:30	2026-06-26 12:56:41.589774+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
389	75	10	14	23	370	\N	f	f	t	available	\N	2026-06-11 17:23:40.288055+05:30	2026-06-26 12:56:41.625721+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
391	75	10	14	23	372	\N	f	f	t	available	\N	2026-06-11 17:23:40.335124+05:30	2026-06-26 12:56:41.654965+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
392	75	10	14	23	373	\N	f	f	t	available	\N	2026-06-11 17:23:40.348726+05:30	2026-06-26 12:56:41.668273+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
393	75	10	14	23	374	\N	f	f	t	available	\N	2026-06-11 17:23:40.361841+05:30	2026-06-26 12:56:41.682558+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
394	75	10	14	23	375	\N	f	f	t	available	\N	2026-06-11 17:23:40.375722+05:30	2026-06-26 12:56:41.696261+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
395	75	10	14	23	376	\N	f	f	t	available	\N	2026-06-11 17:23:40.390821+05:30	2026-06-26 12:56:41.708755+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
398	75	10	14	23	379	\N	f	f	t	available	\N	2026-06-11 17:23:40.428403+05:30	2026-06-26 12:56:41.747385+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
399	75	10	14	23	380	\N	f	f	t	available	\N	2026-06-11 17:23:40.441925+05:30	2026-06-26 12:56:41.770128+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
400	75	10	14	23	381	\N	f	f	t	available	\N	2026-06-11 17:23:40.457755+05:30	2026-06-26 12:56:41.782466+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
401	75	10	14	23	382	\N	f	f	t	available	\N	2026-06-11 17:23:40.473248+05:30	2026-06-26 12:56:41.794579+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
402	75	10	14	23	383	\N	f	f	t	available	\N	2026-06-11 17:23:40.492753+05:30	2026-06-26 12:56:41.805775+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
403	75	10	14	23	384	\N	f	f	t	available	\N	2026-06-11 17:23:40.507059+05:30	2026-06-26 12:56:41.819418+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
404	75	10	14	23	385	\N	f	f	t	available	\N	2026-06-11 17:23:40.524904+05:30	2026-06-26 12:56:41.834966+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
405	75	10	14	23	386	\N	f	f	t	available	\N	2026-06-11 17:23:40.551825+05:30	2026-06-26 12:56:41.847344+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
406	75	10	14	23	387	\N	f	f	t	available	\N	2026-06-11 17:23:40.567606+05:30	2026-06-26 12:56:41.858872+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
407	75	10	14	23	388	\N	f	f	t	available	\N	2026-06-11 17:23:40.584944+05:30	2026-06-26 12:56:41.870311+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
408	75	10	14	23	389	\N	f	f	t	available	\N	2026-06-11 17:23:40.60119+05:30	2026-06-26 12:56:41.882594+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
409	75	10	14	23	390	\N	f	f	t	available	\N	2026-06-11 17:23:40.621668+05:30	2026-06-26 12:56:41.909561+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
410	75	10	14	23	391	\N	f	f	t	available	\N	2026-06-11 17:23:40.637402+05:30	2026-06-26 12:56:41.923301+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
411	75	10	14	23	392	\N	f	f	t	available	\N	2026-06-11 17:23:40.650282+05:30	2026-06-26 12:56:42.242257+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
412	75	10	14	23	393	\N	f	f	t	available	\N	2026-06-11 17:23:40.662557+05:30	2026-06-26 12:56:42.270011+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
413	75	10	14	23	394	\N	f	f	t	available	\N	2026-06-11 17:23:40.679893+05:30	2026-06-26 12:56:42.317306+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
414	75	10	14	23	395	\N	f	f	t	available	\N	2026-06-11 17:23:40.692744+05:30	2026-06-26 12:56:42.336497+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
416	75	10	14	23	397	\N	f	f	t	available	\N	2026-06-11 17:23:40.717535+05:30	2026-06-26 12:56:42.372055+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
417	75	10	14	23	398	\N	f	f	t	available	\N	2026-06-11 17:23:40.740944+05:30	2026-06-26 12:56:42.387784+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
418	75	10	14	23	399	\N	f	f	t	available	\N	2026-06-11 17:23:40.756514+05:30	2026-06-26 12:56:42.404779+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
419	75	10	14	23	400	\N	f	f	t	available	\N	2026-06-11 17:23:40.77176+05:30	2026-06-26 12:56:42.448933+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
420	75	10	14	23	401	\N	f	f	t	available	\N	2026-06-11 17:23:40.784388+05:30	2026-06-26 12:56:42.462902+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
164	75	10	14	23	145	\N	f	f	t	available	\N	2026-06-11 17:23:36.775153+05:30	2026-06-26 12:56:37.161344+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
397	75	10	14	23	378	\N	f	f	t	available	\N	2026-06-11 17:23:40.416308+05:30	2026-06-26 12:56:41.734181+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
421	75	10	14	23	402	\N	f	f	t	available	\N	2026-06-11 17:23:40.805713+05:30	2026-06-26 12:56:42.479776+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
422	75	10	14	23	403	\N	f	f	t	available	\N	2026-06-11 17:23:40.821474+05:30	2026-06-26 12:56:42.494699+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
423	75	10	14	23	404	\N	f	f	t	available	\N	2026-06-11 17:23:40.840172+05:30	2026-06-26 12:56:42.508196+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
425	75	10	14	23	406	\N	f	f	t	available	\N	2026-06-11 17:23:40.889468+05:30	2026-06-26 12:56:42.536741+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
426	75	10	14	23	407	\N	f	f	t	available	\N	2026-06-11 17:23:40.908514+05:30	2026-06-26 12:56:42.550358+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
427	75	10	14	23	408	\N	f	f	t	available	\N	2026-06-11 17:23:40.940931+05:30	2026-06-26 12:56:42.564942+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
428	75	10	14	23	409	\N	f	f	t	available	\N	2026-06-11 17:23:40.968491+05:30	2026-06-26 12:56:42.579204+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
429	75	10	14	23	410	\N	f	f	t	available	\N	2026-06-11 17:23:40.98913+05:30	2026-06-26 12:56:42.606797+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
430	75	10	14	23	411	\N	f	f	t	available	\N	2026-06-11 17:23:41.008106+05:30	2026-06-26 12:56:42.625676+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
431	75	10	14	23	412	\N	f	f	t	available	\N	2026-06-11 17:23:41.025294+05:30	2026-06-26 12:56:42.642039+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
432	75	10	14	23	413	\N	f	f	t	available	\N	2026-06-11 17:23:41.042033+05:30	2026-06-26 12:56:42.66154+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
433	75	10	14	23	414	\N	f	f	t	available	\N	2026-06-11 17:23:41.061372+05:30	2026-06-26 12:56:42.676985+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
434	75	10	14	23	415	\N	f	f	t	available	\N	2026-06-11 17:23:41.084686+05:30	2026-06-26 12:56:42.693379+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
435	75	10	14	23	416	\N	f	f	t	available	\N	2026-06-11 17:23:41.106851+05:30	2026-06-26 12:56:42.715699+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
436	75	10	14	23	417	\N	f	f	t	available	\N	2026-06-11 17:23:41.126795+05:30	2026-06-26 12:56:42.728893+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
437	75	10	14	23	418	\N	f	f	t	available	\N	2026-06-11 17:23:41.147216+05:30	2026-06-26 12:56:42.742295+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
438	75	10	14	23	419	\N	f	f	t	available	\N	2026-06-11 17:23:41.164178+05:30	2026-06-26 12:56:42.755577+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
439	75	10	14	23	420	\N	f	f	t	available	\N	2026-06-11 17:23:41.183519+05:30	2026-06-26 12:56:42.781805+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
440	75	10	14	23	421	\N	f	f	t	available	\N	2026-06-11 17:23:41.198025+05:30	2026-06-26 12:56:42.795602+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
441	75	10	14	23	422	\N	f	f	t	available	\N	2026-06-11 17:23:41.215654+05:30	2026-06-26 12:56:42.808628+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
442	75	10	14	23	423	\N	f	f	t	available	\N	2026-06-11 17:23:41.228671+05:30	2026-06-26 12:56:42.822201+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
443	75	10	14	23	424	\N	f	f	t	available	\N	2026-06-11 17:23:41.24162+05:30	2026-06-26 12:56:42.834336+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
444	75	10	14	23	425	\N	f	f	t	available	\N	2026-06-11 17:23:41.251968+05:30	2026-06-26 12:56:42.847611+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
445	75	10	14	23	426	\N	f	f	t	available	\N	2026-06-11 17:23:41.263051+05:30	2026-06-26 12:56:42.860824+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
446	75	10	14	23	427	\N	f	f	t	available	\N	2026-06-11 17:23:41.275443+05:30	2026-06-26 12:56:42.87264+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
448	75	10	14	23	429	\N	f	f	t	available	\N	2026-06-11 17:23:41.32211+05:30	2026-06-26 12:56:42.899703+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
449	75	10	14	23	430	\N	f	f	t	available	\N	2026-06-11 17:23:41.345783+05:30	2026-06-26 12:56:42.924315+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
450	75	10	14	23	431	\N	f	f	t	available	\N	2026-06-11 17:23:41.364765+05:30	2026-06-26 12:56:42.937206+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
451	75	10	14	23	432	\N	f	f	t	available	\N	2026-06-11 17:23:41.388626+05:30	2026-06-26 12:56:42.951494+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
452	75	10	14	23	433	\N	f	f	t	available	\N	2026-06-11 17:23:41.410949+05:30	2026-06-26 12:56:42.964493+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
453	75	10	14	23	434	\N	f	f	t	available	\N	2026-06-11 17:23:41.431477+05:30	2026-06-26 12:56:42.977476+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
454	75	10	14	23	435	\N	f	f	t	available	\N	2026-06-11 17:23:41.449583+05:30	2026-06-26 12:56:42.988959+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
456	75	10	14	23	437	\N	f	f	t	available	\N	2026-06-11 17:23:41.506609+05:30	2026-06-26 12:56:43.01414+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
457	75	10	14	23	438	\N	f	f	t	available	\N	2026-06-11 17:23:41.521661+05:30	2026-06-26 12:56:43.02653+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
458	75	10	14	23	439	\N	f	f	t	available	\N	2026-06-11 17:23:41.535183+05:30	2026-06-26 12:56:43.037867+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
459	75	10	14	23	440	\N	f	f	t	available	\N	2026-06-11 17:23:41.548515+05:30	2026-06-26 12:56:43.06208+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
460	75	10	14	23	441	\N	f	f	t	available	\N	2026-06-11 17:23:41.567175+05:30	2026-06-26 12:56:43.073426+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
463	75	10	14	23	444	\N	f	f	t	available	\N	2026-06-11 17:23:41.611051+05:30	2026-06-26 12:56:43.111895+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
464	75	10	14	23	445	\N	f	f	t	available	\N	2026-06-11 17:23:41.626303+05:30	2026-06-26 12:56:43.123192+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
465	75	10	14	23	446	\N	f	f	t	available	\N	2026-06-11 17:23:41.644145+05:30	2026-06-26 12:56:43.138323+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
466	75	10	14	23	447	\N	f	f	t	available	\N	2026-06-11 17:23:41.662947+05:30	2026-06-26 12:56:43.150827+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
467	75	10	14	23	448	\N	f	f	t	available	\N	2026-06-11 17:23:41.676216+05:30	2026-06-26 12:56:43.163567+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
468	75	10	14	23	449	\N	f	f	t	available	\N	2026-06-11 17:23:41.696203+05:30	2026-06-26 12:56:43.176864+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
64	75	10	14	23	45	\N	f	f	t	available	\N	2026-06-11 17:23:35.256006+05:30	2026-06-26 12:56:43.188419+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
469	75	10	14	23	450	\N	f	f	t	available	\N	2026-06-11 17:23:41.71495+05:30	2026-06-26 12:56:43.200509+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
470	75	10	14	23	451	\N	f	f	t	available	\N	2026-06-11 17:23:41.72895+05:30	2026-06-26 12:56:43.212973+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
471	75	10	14	23	452	\N	f	f	t	available	\N	2026-06-11 17:23:41.743986+05:30	2026-06-26 12:56:43.224733+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
472	75	10	14	23	453	\N	f	f	t	available	\N	2026-06-11 17:23:41.763995+05:30	2026-06-26 12:56:43.23636+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
473	75	10	14	23	454	\N	f	f	t	available	\N	2026-06-11 17:23:41.779578+05:30	2026-06-26 12:56:43.248872+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
474	75	10	14	23	455	\N	f	f	t	available	\N	2026-06-11 17:23:41.792708+05:30	2026-06-26 12:56:43.262876+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
475	75	10	14	23	456	\N	f	f	t	available	\N	2026-06-11 17:23:41.805056+05:30	2026-06-26 12:56:43.275397+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
476	75	10	14	23	457	\N	f	f	t	available	\N	2026-06-11 17:23:41.81581+05:30	2026-06-26 12:56:43.2875+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
477	75	10	14	23	458	\N	f	f	t	available	\N	2026-06-11 17:23:41.827721+05:30	2026-06-26 12:56:43.302947+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
478	75	10	14	23	459	\N	f	f	t	available	\N	2026-06-11 17:23:41.839284+05:30	2026-06-26 12:56:43.318219+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
479	75	10	14	23	460	\N	f	f	t	available	\N	2026-06-11 17:23:41.861551+05:30	2026-06-26 12:56:43.343944+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
481	75	10	14	23	462	\N	f	f	t	available	\N	2026-06-11 17:23:41.905739+05:30	2026-06-26 12:56:43.369567+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
482	75	10	14	23	463	\N	f	f	t	available	\N	2026-06-11 17:23:41.981003+05:30	2026-06-26 12:56:43.38214+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
483	75	10	14	23	464	\N	f	f	t	available	\N	2026-06-11 17:23:42.009614+05:30	2026-06-26 12:56:43.393531+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
484	75	10	14	23	465	\N	f	f	t	available	\N	2026-06-11 17:23:42.036454+05:30	2026-06-26 12:56:43.404962+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
485	75	10	14	23	466	\N	f	f	t	available	\N	2026-06-11 17:23:42.052526+05:30	2026-06-26 12:56:43.417403+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
542	77	14	19	36	A103	\N	f	f	t	available	\N	2026-06-15 16:41:33.851979+05:30	2026-06-26 16:04:31.725396+05:30	\N	76	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
20	75	10	14	23	1	\N	f	f	t	available	\N	2026-06-11 17:23:34.235012+05:30	2026-06-26 12:56:36.370107+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
136	75	10	14	23	117	\N	f	f	t	available	\N	2026-06-11 17:23:36.391749+05:30	2026-06-26 12:56:36.702062+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
33	75	10	14	23	14	\N	f	f	t	available	\N	2026-06-11 17:23:34.543449+05:30	2026-06-26 12:56:37.06356+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
533	76	13	18	32	A902	\N	f	f	t	available	\N	2026-06-15 15:46:18.572063+05:30	2026-06-24 14:08:13.832336+05:30	\N	61	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
534	76	13	18	32	A903	\N	f	f	t	available	\N	2026-06-15 15:46:18.584253+05:30	2026-06-24 14:08:13.847277+05:30	\N	61	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
535	76	13	18	32	A904	east	f	f	t	available	\N	2026-06-15 15:46:18.596926+05:30	2026-06-24 14:08:13.861255+05:30	\N	61	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
536	76	13	18	32	A905	east	f	f	t	available	\N	2026-06-15 15:46:18.60875+05:30	2026-06-24 14:08:13.87519+05:30	\N	61	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
537	76	13	18	32	A906	\N	f	f	t	available	\N	2026-06-15 15:46:18.620479+05:30	2026-06-24 14:08:13.888578+05:30	\N	61	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
195	75	10	14	23	176	\N	f	f	t	available	\N	2026-06-11 17:23:37.251016+05:30	2026-06-26 12:56:37.722518+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
201	75	10	14	23	182	\N	f	f	t	available	\N	2026-06-11 17:23:37.342138+05:30	2026-06-26 12:56:37.848528+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
229	75	10	14	23	210	\N	f	f	t	available	\N	2026-06-11 17:23:37.731879+05:30	2026-06-26 12:56:38.35073+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
260	75	10	14	23	241	\N	f	f	t	available	\N	2026-06-11 17:23:38.191658+05:30	2026-06-26 12:56:38.986247+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
266	75	10	14	23	247	\N	f	f	t	available	\N	2026-06-11 17:23:38.281295+05:30	2026-06-26 12:56:39.107158+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
294	75	10	14	23	275	\N	f	f	t	available	\N	2026-06-11 17:23:38.672996+05:30	2026-06-26 12:56:39.671391+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
325	75	10	14	23	306	\N	f	f	t	available	\N	2026-06-11 17:23:39.223701+05:30	2026-06-26 12:56:40.312051+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
331	75	10	14	23	312	\N	f	f	t	available	\N	2026-06-11 17:23:39.305549+05:30	2026-06-26 12:56:40.62274+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
359	75	10	14	23	340	\N	f	f	t	available	\N	2026-06-11 17:23:39.809107+05:30	2026-06-26 12:56:41.116412+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
390	75	10	14	23	371	\N	f	f	t	available	\N	2026-06-11 17:23:40.307266+05:30	2026-06-26 12:56:41.640925+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
396	75	10	14	23	377	\N	f	f	t	available	\N	2026-06-11 17:23:40.405048+05:30	2026-06-26 12:56:41.720012+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
424	75	10	14	23	405	\N	f	f	t	available	\N	2026-06-11 17:23:40.866216+05:30	2026-06-26 12:56:42.521603+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
455	75	10	14	23	436	\N	f	f	t	available	\N	2026-06-11 17:23:41.477717+05:30	2026-06-26 12:56:43.001021+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
461	75	10	14	23	442	\N	f	f	t	available	\N	2026-06-11 17:23:41.58131+05:30	2026-06-26 12:56:43.087623+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
462	75	10	14	23	443	\N	f	f	t	available	\N	2026-06-11 17:23:41.596593+05:30	2026-06-26 12:56:43.099545+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
486	75	10	14	23	467	\N	f	f	t	available	\N	2026-06-11 17:23:42.06751+05:30	2026-06-26 12:56:43.430377+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
487	75	10	14	23	468	\N	f	f	t	available	\N	2026-06-11 17:23:42.082901+05:30	2026-06-26 12:56:43.444093+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
488	75	10	14	23	469	\N	f	f	t	available	\N	2026-06-11 17:23:42.096748+05:30	2026-06-26 12:56:43.458581+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
489	75	10	14	23	470	\N	f	f	t	available	\N	2026-06-11 17:23:42.114438+05:30	2026-06-26 12:56:43.482865+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
490	75	10	14	23	471	\N	f	f	t	available	\N	2026-06-11 17:23:42.129106+05:30	2026-06-26 12:56:43.495088+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
491	75	10	14	23	472	\N	f	f	t	available	\N	2026-06-11 17:23:42.146016+05:30	2026-06-26 12:56:43.506466+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
492	75	10	14	23	473	\N	f	f	t	available	\N	2026-06-11 17:23:42.163939+05:30	2026-06-26 12:56:43.519722+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
493	75	10	14	23	474	\N	f	f	t	available	\N	2026-06-11 17:23:42.180327+05:30	2026-06-26 12:56:43.533027+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
494	75	10	14	23	475	\N	f	f	t	available	\N	2026-06-11 17:23:42.198586+05:30	2026-06-26 12:56:43.545901+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
495	75	10	14	23	476	\N	f	f	t	available	\N	2026-06-11 17:23:42.210157+05:30	2026-06-26 12:56:43.55796+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
496	75	10	14	23	477	\N	f	f	t	available	\N	2026-06-11 17:23:42.223957+05:30	2026-06-26 12:56:43.570171+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
497	75	10	14	23	478	\N	f	f	t	available	\N	2026-06-11 17:23:42.237061+05:30	2026-06-26 12:56:43.584396+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
498	75	10	14	23	479	\N	f	f	t	available	\N	2026-06-11 17:23:42.249383+05:30	2026-06-26 12:56:43.598578+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
499	75	10	14	23	480	\N	f	f	t	available	\N	2026-06-11 17:23:42.264329+05:30	2026-06-26 12:56:43.627205+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
500	75	10	14	23	481	\N	f	f	t	available	\N	2026-06-11 17:23:42.278712+05:30	2026-06-26 12:56:43.639236+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
501	75	10	14	23	482	\N	f	f	t	available	\N	2026-06-11 17:23:42.293225+05:30	2026-06-26 12:56:43.651491+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
502	75	10	14	23	483	\N	f	f	t	available	\N	2026-06-11 17:23:42.305794+05:30	2026-06-26 12:56:43.665503+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
503	75	10	14	23	484	\N	f	f	t	available	\N	2026-06-11 17:23:42.317664+05:30	2026-06-26 12:56:43.679739+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
504	75	10	14	23	485	\N	f	f	t	available	\N	2026-06-11 17:23:42.330879+05:30	2026-06-26 12:56:43.694063+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
505	75	10	14	23	486	\N	f	f	t	available	\N	2026-06-11 17:23:42.34578+05:30	2026-06-26 12:56:43.705501+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
506	75	10	14	23	487	\N	f	f	t	available	\N	2026-06-11 17:23:42.359922+05:30	2026-06-26 12:56:43.717708+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
507	75	10	14	23	488	\N	f	f	t	available	\N	2026-06-11 17:23:42.373031+05:30	2026-06-26 12:56:43.731566+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
508	75	10	14	23	489	\N	f	f	t	available	\N	2026-06-11 17:23:42.383155+05:30	2026-06-26 12:56:43.743847+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
509	75	10	14	23	490	\N	f	f	t	available	\N	2026-06-11 17:23:42.3964+05:30	2026-06-26 12:56:43.775612+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
510	75	10	14	23	491	\N	f	f	t	available	\N	2026-06-11 17:23:42.409741+05:30	2026-06-26 12:56:43.787714+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
511	75	10	14	23	492	\N	f	f	t	available	\N	2026-06-11 17:23:42.422758+05:30	2026-06-26 12:56:43.802445+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
512	75	10	14	23	493	\N	f	f	t	available	\N	2026-06-11 17:23:42.435247+05:30	2026-06-26 12:56:43.817777+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
513	75	10	14	23	494	\N	f	f	t	available	\N	2026-06-11 17:23:42.447775+05:30	2026-06-26 12:56:43.832436+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
514	75	10	14	23	495	\N	f	f	t	available	\N	2026-06-11 17:23:42.460893+05:30	2026-06-26 12:56:43.846368+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
515	75	10	14	23	496	\N	f	f	t	available	\N	2026-06-11 17:23:42.472634+05:30	2026-06-26 12:56:43.861598+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
516	75	10	14	23	497	\N	f	f	t	available	\N	2026-06-11 17:23:42.483202+05:30	2026-06-26 12:56:44.035695+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
517	75	10	14	23	498	\N	f	f	t	available	\N	2026-06-11 17:23:42.494952+05:30	2026-06-26 12:56:44.101528+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
518	75	10	14	23	499	\N	f	f	t	available	\N	2026-06-11 17:23:42.507707+05:30	2026-06-26 12:56:44.144685+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
519	75	10	14	23	500	\N	f	f	t	available	\N	2026-06-11 17:23:42.521838+05:30	2026-06-26 12:56:44.242425+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
82	75	10	14	23	63	\N	f	f	t	available	\N	2026-06-11 17:23:35.56537+05:30	2026-06-26 12:56:44.589759+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
113	75	10	14	23	94	\N	f	f	t	available	\N	2026-06-11 17:23:36.049129+05:30	2026-06-26 12:56:45.192473+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
679	79	19	42	47	A1004	north	f	f	t	available	\N	2026-06-26 16:08:07.179399+05:30	2026-06-26 16:09:25.578993+05:30	\N	649	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
541	77	14	19	36	A102	\N	f	f	t	available	\N	2026-06-15 16:41:33.84006+05:30	2026-06-26 16:04:31.712469+05:30	\N	76	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
543	77	14	19	36	A104	west	f	f	t	available	\N	2026-06-15 16:41:33.863653+05:30	2026-06-26 16:04:31.738281+05:30	\N	76	180.00	150.00	\N	285000.00	["Garden", "Gym", "Park", "Terrace"]	sqft	sqft	1900	285000	f	\N
682	79	19	43	49	A903	north	f	f	t	available	\N	2026-06-26 16:08:09.960984+05:30	2026-06-26 16:09:25.678067+05:30	\N	650	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
683	79	19	43	49	A904	north	f	f	t	available	\N	2026-06-26 16:08:09.97298+05:30	2026-06-26 16:09:25.695486+05:30	\N	650	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
684	79	19	44	49	A801	north	f	f	t	available	\N	2026-06-26 16:08:12.159372+05:30	2026-06-26 16:09:25.710488+05:30	\N	651	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
685	79	19	44	49	A802	north	f	f	t	available	\N	2026-06-26 16:08:12.172336+05:30	2026-06-26 16:09:25.724766+05:30	\N	651	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
686	79	19	44	49	A803	north	f	f	t	available	\N	2026-06-26 16:08:12.18325+05:30	2026-06-26 16:09:25.738445+05:30	\N	651	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
687	79	19	44	49	A804	north	f	f	t	available	\N	2026-06-26 16:08:12.193606+05:30	2026-06-26 16:09:25.75267+05:30	\N	651	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
548	77	14	21	36	A301	west	f	f	t	available	\N	2026-06-15 16:41:43.005585+05:30	2026-06-26 16:04:31.61914+05:30	\N	74	180.00	150.00	\N	285000.00	["Garden", "Gym", "Park", "Terrace"]	sqft	sqft	1900	285000	f	\N
549	77	14	21	36	A302	\N	f	f	t	available	\N	2026-06-15 16:41:43.018488+05:30	2026-06-26 16:04:31.63469+05:30	\N	74	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
544	77	14	20	36	A201	west	f	f	t	available	\N	2026-06-15 16:41:37.046589+05:30	2026-06-26 16:04:31.64828+05:30	\N	75	180.00	150.00	\N	285000.00	["Garden", "Gym", "Park", "Terrace"]	sqft	sqft	1900	285000	f	\N
545	77	14	20	36	A202	\N	f	f	t	available	\N	2026-06-15 16:41:37.060963+05:30	2026-06-26 16:04:31.661562+05:30	\N	75	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
546	77	14	20	36	A203	north	f	f	t	available	\N	2026-06-15 16:41:37.076422+05:30	2026-06-26 16:04:31.674133+05:30	\N	75	180.00	150.00	\N	285000.00	["Garden", "Gym", "Park", "Terrace"]	sqft	sqft	1900	285000	f	\N
547	77	14	20	36	A204	\N	f	f	t	available	\N	2026-06-15 16:41:37.09084+05:30	2026-06-26 16:04:31.686229+05:30	\N	75	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
540	77	14	19	36	A101	north_east	f	f	t	available	\N	2026-06-15 16:41:33.822383+05:30	2026-06-26 16:04:31.699075+05:30	\N	76	180.00	150.00	\N	285000.00	["Garden", "Gym", "Park", "Terrace"]	sqft	sqft	1900	285000	f	\N
676	79	19	42	47	A1001	north	f	f	t	available	\N	2026-06-26 16:08:07.119968+05:30	2026-06-26 16:09:25.529237+05:30	\N	649	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
677	79	19	42	47	A1002	north	f	f	t	available	\N	2026-06-26 16:08:07.151892+05:30	2026-06-26 16:09:25.544701+05:30	\N	649	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
678	79	19	42	47	A1003	north	f	f	t	available	\N	2026-06-26 16:08:07.165066+05:30	2026-06-26 16:09:25.560337+05:30	\N	649	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
680	79	19	43	49	A901	north	f	f	t	available	\N	2026-06-26 16:08:09.938765+05:30	2026-06-26 16:09:25.595455+05:30	\N	650	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
681	79	19	43	49	A902	north	f	f	t	available	\N	2026-06-26 16:08:09.949549+05:30	2026-06-26 16:09:25.638486+05:30	\N	650	1231.00	1231.00	\N	151561951.00	[]	sqft	sqft	123121	151561951	f	\N
525	76	13	17	32	A1002	south_east	f	f	t	available	\N	2026-06-15 15:46:15.146834+05:30	2026-06-24 14:08:13.719663+05:30	\N	60	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
526	76	13	17	32	A1003	east	f	f	t	available	\N	2026-06-15 15:46:15.159918+05:30	2026-06-24 14:08:13.733676+05:30	\N	60	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
527	76	13	17	32	A1004	\N	f	f	t	available	\N	2026-06-15 15:46:15.177188+05:30	2026-06-24 14:08:13.748122+05:30	\N	60	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
528	76	13	17	32	A1005	east	f	f	t	available	\N	2026-06-15 15:46:15.193402+05:30	2026-06-24 14:08:13.76213+05:30	\N	60	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
529	76	13	17	32	A1006	\N	f	f	t	available	\N	2026-06-15 15:46:15.208373+05:30	2026-06-24 14:08:13.77607+05:30	\N	60	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
530	76	13	17	32	A1007	west	f	f	t	available	\N	2026-06-15 15:46:15.22372+05:30	2026-06-24 14:08:13.789565+05:30	\N	60	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
531	76	13	17	32	A1008	east	f	f	t	available	\N	2026-06-15 15:46:15.236082+05:30	2026-06-24 14:08:13.803191+05:30	\N	60	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
538	76	13	18	32	A907	east	f	f	t	available	\N	2026-06-15 15:46:18.631884+05:30	2026-06-24 14:08:13.901127+05:30	\N	61	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
539	76	13	18	32	A908	\N	f	f	t	available	\N	2026-06-15 15:46:18.644268+05:30	2026-06-24 14:08:13.915203+05:30	\N	61	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
626	80	16	29	44	A203	\N	f	f	t	available	\N	2026-06-20 09:46:40.772944+05:30	2026-06-20 09:52:32.399576+05:30	\N	553	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
627	80	16	29	44	A204	\N	f	f	t	available	\N	2026-06-20 09:46:40.785458+05:30	2026-06-20 09:52:32.411239+05:30	\N	553	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
628	80	16	30	44	A101	\N	f	f	t	available	\N	2026-06-20 09:46:40.798677+05:30	2026-06-20 09:52:32.422731+05:30	\N	554	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
629	80	16	30	44	A102	north	f	f	t	available	\N	2026-06-20 09:46:40.81162+05:30	2026-06-20 09:52:32.434301+05:30	\N	554	1231.00	1231.00	\N	3030722.00	[]	sqft	sqft	1231	3030722	t	2
630	80	16	30	44	A103	\N	f	f	t	available	\N	2026-06-20 09:46:40.823955+05:30	2026-06-20 09:52:32.447584+05:30	\N	554	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
631	80	16	30	44	A104	\N	f	f	t	available	\N	2026-06-20 09:46:40.837089+05:30	2026-06-20 09:52:32.462656+05:30	\N	554	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
608	80	16	25	46	A601	north_east	f	f	t	available	\N	2026-06-20 09:46:40.477071+05:30	2026-06-20 09:52:32.116324+05:30	\N	549	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	t	2
609	80	16	25	44	A602	north	f	f	t	available	\N	2026-06-20 09:46:40.516055+05:30	2026-06-20 09:52:32.17428+05:30	\N	549	12311.00	1231.00	\N	16670202.00	[]	sqft	sqft	1231	16670202	t	2
610	80	16	25	44	A603	\N	f	f	t	available	\N	2026-06-20 09:46:40.533036+05:30	2026-06-20 09:52:32.189849+05:30	\N	549	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
611	80	16	25	44	A604	\N	f	f	t	available	\N	2026-06-20 09:46:40.550864+05:30	2026-06-20 09:52:32.202623+05:30	\N	549	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
612	80	16	26	44	A501	\N	f	f	t	available	\N	2026-06-20 09:46:40.569355+05:30	2026-06-20 09:52:32.214093+05:30	\N	550	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
613	80	16	26	44	A502	north	f	f	t	available	\N	2026-06-20 09:46:40.585612+05:30	2026-06-20 09:52:32.227275+05:30	\N	550	1231.00	1231.00	\N	3030722.00	[]	sqft	sqft	1231	3030722	t	2
614	80	16	26	44	A503	\N	f	f	t	available	\N	2026-06-20 09:46:40.600625+05:30	2026-06-20 09:52:32.241549+05:30	\N	550	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
615	80	16	26	44	A504	\N	f	f	t	available	\N	2026-06-20 09:46:40.616022+05:30	2026-06-20 09:52:32.255399+05:30	\N	550	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
616	80	16	27	44	A401	\N	f	f	t	available	\N	2026-06-20 09:46:40.633061+05:30	2026-06-20 09:52:32.271036+05:30	\N	551	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
617	80	16	27	44	A402	north	f	f	t	available	\N	2026-06-20 09:46:40.65066+05:30	2026-06-20 09:52:32.284134+05:30	\N	551	12311.00	1231.00	\N	16670202.00	[]	sqft	sqft	1231	16670202	t	2
618	80	16	27	44	A403	\N	f	f	t	available	\N	2026-06-20 09:46:40.665719+05:30	2026-06-20 09:52:32.29648+05:30	\N	551	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
619	80	16	27	44	A404	\N	f	f	t	available	\N	2026-06-20 09:46:40.679943+05:30	2026-06-20 09:52:32.310212+05:30	\N	551	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
620	80	16	28	44	A301	\N	f	f	t	available	\N	2026-06-20 09:46:40.694125+05:30	2026-06-20 09:52:32.322865+05:30	\N	552	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
621	80	16	28	44	A302	north	f	f	t	available	\N	2026-06-20 09:46:40.70721+05:30	2026-06-20 09:52:32.335882+05:30	\N	552	1231.00	1231.00	\N	3030722.00	[]	sqft	sqft	1231	3030722	t	2
622	80	16	28	44	A303	\N	f	f	t	available	\N	2026-06-20 09:46:40.720207+05:30	2026-06-20 09:52:32.348695+05:30	\N	552	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
623	80	16	28	44	A304	\N	f	f	t	available	\N	2026-06-20 09:46:40.73223+05:30	2026-06-20 09:52:32.361218+05:30	\N	552	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
624	80	16	29	44	A201	\N	f	f	t	available	\N	2026-06-20 09:46:40.746918+05:30	2026-06-20 09:52:32.373891+05:30	\N	553	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
625	80	16	29	44	A202	north	f	f	t	available	\N	2026-06-20 09:46:40.760258+05:30	2026-06-20 09:52:32.386929+05:30	\N	553	1231.00	1231.00	\N	3030722.00	[]	sqft	sqft	1231	3030722	t	2
29	75	10	14	23	10	\N	f	f	t	available	\N	2026-06-11 17:23:34.468822+05:30	2026-06-26 12:56:36.396359+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
119	75	10	14	23	100	\N	f	f	t	available	\N	2026-06-11 17:23:36.162363+05:30	2026-06-26 12:56:36.411178+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
120	75	10	14	23	101	\N	f	f	t	available	\N	2026-06-11 17:23:36.17674+05:30	2026-06-26 12:56:36.425508+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
121	75	10	14	23	102	\N	f	f	t	available	\N	2026-06-11 17:23:36.189047+05:30	2026-06-26 12:56:36.439781+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
137	75	10	14	23	118	\N	f	f	t	available	\N	2026-06-11 17:23:36.406835+05:30	2026-06-26 12:56:36.714529+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
177	75	10	14	23	158	\N	f	f	t	available	\N	2026-06-11 17:23:37.001797+05:30	2026-06-26 12:56:37.421462+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
202	75	10	14	23	183	\N	f	f	t	available	\N	2026-06-11 17:23:37.359557+05:30	2026-06-26 12:56:37.867959+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
211	75	10	14	23	192	\N	f	f	t	available	\N	2026-06-11 17:23:37.46664+05:30	2026-06-26 12:56:38.051107+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
524	76	13	17	32	A1001	east	f	f	t	available	\N	2026-06-15 15:46:15.125994+05:30	2026-06-24 14:08:13.699534+05:30	\N	60	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
532	76	13	18	32	A901	east	f	f	t	available	\N	2026-06-15 15:46:18.562027+05:30	2026-06-24 14:08:13.817053+05:30	\N	61	180.00	190.00	\N	740000.00	["club house", "Garden", "Gym", "Park", "Tempel"]	sqft	sqft	2000	740000	f	\N
245	75	10	14	23	226	\N	f	f	t	available	\N	2026-06-11 17:23:37.931992+05:30	2026-06-26 12:56:38.661262+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
267	75	10	14	23	248	\N	f	f	t	available	\N	2026-06-11 17:23:38.293774+05:30	2026-06-26 12:56:39.122571+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
279	75	10	14	23	260	\N	f	f	t	available	\N	2026-06-11 17:23:38.487058+05:30	2026-06-26 12:56:39.381455+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
313	75	10	14	23	294	\N	f	f	t	available	\N	2026-06-11 17:23:39.010874+05:30	2026-06-26 12:56:40.061899+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
332	75	10	14	23	313	\N	f	f	t	available	\N	2026-06-11 17:23:39.325714+05:30	2026-06-26 12:56:40.646274+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
347	75	10	14	23	328	\N	f	f	t	available	\N	2026-06-11 17:23:39.609809+05:30	2026-06-26 12:56:40.920475+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
52	75	10	14	23	33	\N	f	f	t	available	\N	2026-06-11 17:23:34.944715+05:30	2026-06-26 12:56:40.951519+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
381	75	10	14	23	362	\N	f	f	t	available	\N	2026-06-11 17:23:40.139173+05:30	2026-06-26 12:56:41.483882+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
415	75	10	14	23	396	\N	f	f	t	available	\N	2026-06-11 17:23:40.705591+05:30	2026-06-26 12:56:42.355177+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
447	75	10	14	23	428	\N	f	f	t	available	\N	2026-06-11 17:23:41.294074+05:30	2026-06-26 12:56:42.886286+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
480	75	10	14	23	461	\N	f	f	t	available	\N	2026-06-11 17:23:41.883329+05:30	2026-06-26 12:56:43.355602+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
80	75	10	14	23	61	\N	f	f	t	available	\N	2026-06-11 17:23:35.540827+05:30	2026-06-26 12:56:44.552533+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
112	75	10	14	23	93	\N	f	f	t	available	\N	2026-06-11 17:23:36.028375+05:30	2026-06-26 12:56:45.180014+05:30	\N	47	1.00	\N	\N	\N	[]	sqft	sqft	\N	\N	f	\N
15	75	10	14	9	A104	north	f	f	t	available	\N	2026-06-01 16:46:35.817748+05:30	2026-06-26 12:56:45.315392+05:30	\N	47	125.00	145.00	\N	1870.00	[]	sqft	sqft	\N	\N	f	\N
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, rera_project_id, sales, notify_to_emails, launched_on, expected_completion, possession, is_active, inventory, search_address, address, street, country, state, city, zip, locality, latitude, longitude, enable_vr, amenities, india_property_code, magicbricks_code, status, created_by, created_at, updated_at, deleted_at, completed_steps, vr_upload, brochure_uploads, office_address, project_type, project_structure, inventory_subcategory, project_logo, gallery_images, gallery_videos, marketing_brochures, rera_documents, portal_selection, portal_reference_key, portal_sync_status) FROM stdin;
2	Quinn Montgomery	<p>Ex commodi rerum con.</p>	Quo alias eligendi d	none	{manager@example.com}	2021-01-11	2022-12-17	2023-03-10	t	f	Poonch, Haveli tehsil, Poonch district, Jammu and Kashmir, 185101, India	Poonch, Haveli tehsil, Poonch district, Jammu and Kashmir, 185101, India	Davada Infrastructure	India	Jammu and Kashmir	Poonch	185101	test	33.7670004	74.0957143	t	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 11:25:48.579974	2025-07-25 11:26:22.257266	2025-07-25 11:39:30.623275	{1,2,3}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
7	Rhea Ballard	<p>Id, eos tempor ut fu.</p>	Eu et sed excepturi 	nancy_gandhi	{manager@example.com}	1999-06-10	1999-09-01	2013-10-17	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 12:40:54.397418	2025-07-25 12:40:54.397418	2025-07-25 14:33:58.208185	{1}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
9	Gareth Goodwin	<p>Et exercitation magn.</p>	Autem rerum odio sed	hardik_shah	{team@example.com}	1998-09-04	2005-08-05	2024-08-25	t	f	Id velit voluptatibu	Consectetur sint nu	Qui doloribus conseq	Animi reiciendis mi	Sed nostrud vel magn	Eveniet nulla ipsa	17994	Libero amet tenetur	Quia pariatur Sunt	Voluptatem delectus	t	{"garden": false, "gazebo": false, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": false}	ertyuiop34567890-	234567890-sdfgjkl	completed	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 12:48:58.941077	2025-07-25 12:49:34.179252	2025-07-26 16:36:08.376596	{1,2,3,4,5,6}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
24	Aryan Updated			nancy_gandhi	\N	\N	\N	\N	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001				f	{"garden": true, "gazebo": false, "jogging_track": false, "kids_play_area": true, "sr_citizen_corner": true}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-08-21 15:19:57.668979	2025-09-01 15:55:29.896429	2025-09-01 15:55:50.780138	{1,2,4,5}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
59	Testing 125			{}	\N	2025-09-01	2025-09-02	2025-09-03	t	f											f	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-02 09:56:33.229178	2025-09-02 10:01:22.589007	2025-09-02 10:04:27.998547	{1}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
5	Rhea	<p>Id, eos tempor ut fu.</p>	Eu et sed excepturi 	nancy_gandhi	{manager@example.com}	1999-06-09	1999-08-31	2013-10-16	t	f	Eiusmod animi et ut	Consectetur quibusd	Quisquam aliqua Opt	Est est corporis au	Sapiente aliquip lab	Dolor cum a nesciunt	69183	Odio nisi aliquid ex	Elit tenetur aliqui	Qui maxime officia m	f	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 12:40:07.794245	2026-05-25 11:33:22.158053	\N	{1,2,3}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
6	Rhea 	<p>Id, eos tempor ut fu.</p>	Eu et sed excepturi 	nancy_gandhi	{manager@example.com}	1999-06-09	1999-08-31	2013-10-16	t	f											f	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 12:40:36.806232	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
60	Kim Tam	<p>wegief</p>	125	{"hardik_shah"}	{team@example.com}	2025-09-02	2025-09-03	2025-09-03	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	{}	\N	\N	{"draft","draft"}	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-02 15:37:58.075424	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
1	Ziaaaaaa	<p>Voluptatibus commodi.</p>	Aut rem sequi in min	hardik_shah	{manager@example.com}	1998-06-21	2000-04-04	2025-11-13	t	f	Aperiam sed ullamco	Architecto saepe bla	Assumenda enim volup	Blanditiis dignissim	Ratione cupiditate s	Et accusamus est con	53032	Voluptas non aut et	Labore quidem mollit	Sint quisquam est ni	t	{"garden": true, "gazebo": false, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": false}	Voluptas maiores aut	Est a lorem in qui	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 11:18:12.171393	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
13	Ruth Harmon	<p>Laborum itaque quas .</p>	345678	hardik_shah	{team@example.com}	\N	\N	\N	t	f	Amsterdam Museum, 92, Kalverstraat, Centrum, Amsterdam, North Holland, Netherlands, 1012 PH, Netherlands	92 Kalverstraat	Kalverstraat	Netherlands	North Holland	Amsterdam	1012 PH	Centrum	52.3704312	4.8904288	f	{"garden": false, "gazebo": false, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": false}	rtt	rrt	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-30 11:00:45.438361	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
14	aryannn	<p>hello</p>	8765432	none	{manager@example.com}	2025-07-09	2025-07-16	2025-08-22	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-08-01 16:41:34.193773	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
3	Abraaaaaa ym	<p>Doloremque qui aliqu.</p>	Id commodi quod prae	none	{team@example.com}	2025-07-05	2025-07-18	2025-07-22	t	f	Jawaharlal Nehru University, Vasant Vihar Tehsil, New Delhi, Mehrauli Tehsil, South Delhi, Delhi, 110067, India	Jawaharlal Nehru University, Vasant Vihar Tehsil, New Delhi, Mehrauli Tehsil, South Delhi, Delhi, 110067, India	Jawaharlal Nehru University	India	Delhi	New Delhi	110067	New Delhi	28.5401667	77.1645601	t	{"garden": false, "gazebo": false, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": true}	Voluptas maiores aut	09876543234567	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 11:40:46.775211	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
11	Bianca	<p>Sed autem at volupta.</p>	Eum dicta nobis dolo	hardik_shah	{manager@example.com}	2002-08-08	2017-03-07	2025-12-16	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	Ahmedabad	India	Gujarat	Ahmedabad	380001	Ahmedabad	23.0215374	72.5800568	t	{"garden": false, "gazebo": true, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": false}	test	tst	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-26 12:45:41.18627	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
8	Tatiana Wilson	<p>Optio, reprehenderit.</p>	Similique deserunt o	hardik_shah,nancy_gandhi	{manager@example.com}	2021-04-08	2022-10-08	2025-04-01	t	f											f	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 12:41:33.94875	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
4	Rhea Ballards	<p>Id, eos tempor ut fu.</p>	Eu et sed excepturi 	nancy_gandhi	{manager@example.com}	2025-07-08	2025-07-23	2025-08-06	t	f											f	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 12:40:05.970779	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
12	Courtney Langley	<p>Nemo magnam sed arch.</p>	Voluptatem obcaecati	hardik_shah	{manager@example.com}	\N	\N	\N	t	f											f	{}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-26 17:55:34.186146	2026-05-25 11:33:22.158053	\N	{1,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
10	Amos England	<p>In sint unde aut vel.</p>	Est aspernatur praes	{"{\\"value\\":\\"hardik_shah\\",\\"label\\":\\"HARDIK SHAH (Manager) (Sales Team)\\"}"}	{team@example.com}	1991-09-15	2000-04-27	2008-05-26	t	f	Lorem odio accusamus	Repellendus Reicien	Placeat asperiores	Autem cupiditate ex	Reprehenderit volupt	Labore est ut rerum	82398	Iusto molestias aliq	Repellendus Saepe s	Cumque alias qui mag	t	{"garden": false, "gazebo": false, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": false}	Irure non aliquid so	Do consequat Esse m	completed	1c46541d-18ed-40fa-ad80-6c900111e816	2025-07-25 15:06:45.608156	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
22	Kyle Moon	<p>Laboriosam, veritati.</p>	1234567890	nancy_gandhi	{manager@example.com}	2025-08-06	2025-08-07	2025-08-08	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-08-08 16:23:05.97552	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
23	Dholera	<p>Test</p>	876543223dweww	{"nancy_gandhi","hardik_shah"}	{manager@example.com}	2025-08-22	2025-08-22	2025-08-30	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001		23.0215374	72.5800568	f	{"garden": false, "gazebo": true, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": true}			draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-08-21 14:50:06.600987	2026-05-25 11:33:22.158053	\N	{1,2,3,4}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
63	Yathu Project	\N	\N	{}	{}	2025-09-24	2025-09-25	2025-09-27	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-24 15:59:36.337904	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
67	agam	\N	\N	047cbd62-bd78-4e42-be1c-72395edaf057	{}	2025-09-25	2025-09-26	2025-09-27	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-25 16:04:28.595908	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
49	IW Project(01-09-2025)	<p>Hdllo</p>	1234567	{"{\\"value\\":\\"{\\\\\\"nancy_gandhi\\\\\\"}\\",\\"label\\":\\"{\\\\\\"nancy_gandhi\\\\\\"}\\"}"}	\N	\N	\N	\N	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001				f	{"garden": false, "gazebo": true, "jogging_track": true, "kids_play_area": false, "sr_citizen_corner": true}	asg23456	34567ui	completed	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-01 10:40:04.854805	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
58	Aryan (1234)	<p>hwllp</p>	12345	{"hardik_shah"}	\N	2025-08-31	2025-09-01	2025-09-03	t	f											t	{}			{"draft","draft"}	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-01 17:08:39.988959	2026-05-25 11:33:22.158053	\N	{1}	1758694243508-923739768-JACKETED EXPANSION JOINT.glb	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
62	Hello Hello	\N	\N	{}	{}	2025-09-24	2025-09-25	2025-09-26	t	f	Shyamal, 14, Green Lane, Greater Kailash I, Kalkaji Tehsil, South East Delhi, Delhi, 110048, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001	Kalkaji Tehsil	28.5500527	77.2350749	t	{}	\N	\N	{"draft","draft"}	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-24 12:18:01.775592	2026-05-25 11:33:22.158053	\N	{1,2}	8696757373-JACKE.glb	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
68	Rhea		asdfgnh	a978e67d-5393-43a4-989c-374a9f47495c	{}	2025-11-26	2025-11-29	2025-12-03	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-25 12:23:47.944622	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
71	Komal		\N	\N	{}	2025-11-26	2025-11-27	2025-12-06	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-25 13:19:35.878922	2026-06-10 17:11:08.962737	\N	{1}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
65	Ananta Sky	\N	\N	{}	{}	2025-09-25	2025-09-26	2025-09-27	t	f	Naroda, Satguru Swami Teoonramji Maharaj Flyover, Naroda GIDC, Naroda, Asarva Taluka, Ahmedabad, Gujarat, 382325, India	Naroda, Satguru Swami Teoonramji Maharaj Flyover, Naroda GIDC, Naroda, Asarva Taluka, Ahmedabad, Gujarat, 382325, India	Satguru Swami Teoonramji Maharaj Flyover	India	Gujarat	Ahmedabad	382325	Naroda	23.0854097	72.6580946	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-25 09:45:37.339724	2026-05-25 11:33:22.158053	\N	{1,2}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
61	Aryanrtyu0okxs	<p>asdfghjkl;</p>	1234567	{"hardik_shah"}	\N	2025-09-02	2025-09-03	2025-09-03	t	f	Shyamal, 14, Green Lane, Greater Kailash I, Kalkaji Tehsil, South East Delhi, Delhi, 110048, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001	Kalkaji Tehsil	28.5500527	77.2350749	t	{"garden": false, "gazebo": false, "jogging_track": true, "kids_play_area": false, "sr_citizen_corner": false}	1234567	ertghjnkm2	{"draft","draft"}	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-02 16:36:28.9062	2026-05-25 11:33:22.158053	\N	{1,2,3,4,5,6}	1758708588702-603503644-JACKETED EXPANSION JOINT.glb	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
56	132Aruand	<p>sadfh</p>	q23	{"nancy_gandhi"}	\N	2025-09-01	2025-09-02	2025-09-03	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India		India	Gujarat	Ahmedabad	380001		23.0215374	72.5800568	t	{"garden": false, "gazebo": false, "jogging_track": false, "kids_play_area": false, "sr_citizen_corner": false}			{"draft","draft"}	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-01 17:03:08.304589	2026-05-25 11:33:22.158053	\N	{1,2,3,4}	1758708805473-462263556-Single_Expension_Joint.glb	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
66	Jitesh	\N	\N	047cbd62-bd78-4e42-be1c-72395edaf057	{}	2025-09-25	2025-09-25	2025-09-28	t	f	Naroda, Satguru Swami Teoonramji Maharaj Flyover, Naroda GIDC, Naroda, Asarva Taluka, Ahmedabad, Gujarat, 382325, India	Naroda, Satguru Swami Teoonramji Maharaj Flyover, Naroda GIDC, Naroda, Asarva Taluka, Ahmedabad, Gujarat, 382325, India	Satguru Swami Teoonramji Maharaj Flyover	India	Gujarat	Ahmedabad	382325	Naroda	23.0854097	72.6580946	t	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-25 11:34:21.908879	2026-05-25 11:33:22.158053	\N	{1,2,3}	1758780290422-18288141-House.glb	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
70	MANIK		SDFGH	a978e67d-5393-43a4-989c-374a9f47495c	{}	2025-11-26	2025-11-26	2025-11-28	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-25 12:29:02.18989	2026-05-25 11:33:22.158053	\N	{1}	\N	{}		\N	\N	\N	\N	[]	[]	{}	{}	\N	\N	\N
73	werty		\N	\N	{}	2025-11-26	2025-11-28	2025-12-06	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001		\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-26 12:27:05.532387	2026-05-25 15:22:55.527639	\N	{1}	\N	{}	Ahmedabad, Gujarat, 380001, India, Ahmedabad, Gujarat, 380001, India	RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
75	Dholera Aryan		\N	1c46541d-18ed-40fa-ad80-6c900111e816	{}	2026-05-26	2026-05-29	2026-06-03	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001		\N	\N	f	{}	\N	\N	completed	1c46541d-18ed-40fa-ad80-6c900111e816	2026-05-25 10:54:36.47798	2026-06-11 17:23:50.676763	\N	{1}	\N	{1779686715281-64261570-BuildYourWayCard1.png,1779686720616-219250155-BuildYourWayCard1.png}	\N	RESIDENTIAL	VILLA_ROW	bungalow	\N	[]	[]	{1779686715281-64261570-BuildYourWayCard1.png,1779686720616-219250155-BuildYourWayCard1.png}	{}	\N	\N	\N
72	Raman		\N	\N	{}	2025-11-26	2025-11-28	2025-12-05	t	f	Ahmedabad, Gujarat, 380001, India	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001		\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-25 13:28:05.450673	2026-05-29 17:14:41.200547	\N	{1,2}	1764061370842-616894801-House.glb	{"1764057516819-195597367-Lead_Source_Wise_Report_All_2025-10-21_to_2025-11-20 (1).pdf"}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{"1764057516819-195597367-Lead_Source_Wise_Report_All_2025-10-21_to_2025-11-20 (1).pdf"}	{}	\N	\N	\N
78	Safal Infosoft	<h3 class="ql-align-center"><strong>Building a better future</strong></h3><p>Intelliworkz Business Solutions Private Limited is a Digital and Technology Services Company offering expertise into various disciplines like Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions &amp; Mobile Applications.</p><p>In today's fast growing and dynamic business world, back office operations, technical support, business support services and technology based marketing solutions have become critical components for running the business successfully. At Intelliworkz we offer gamut of services which helps our customer to cut down their operational cost, outsource support services at affordable rates and hence they can focus on their core business activities. With strong collaboration of skilled people in our team we deliver quality services to our clients in prescribed time limit. We closely work with our clients to study and evaluate their business model so that we can offer them customised solutions.</p><h3 class="ql-align-center"><strong>Building a better future</strong></h3><p>Intelliworkz Business Solutions Private Limited is a Digital and Technology Services Company offering expertise into various disciplines like Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions &amp; Mobile Applications.</p><p>In today's fast growing and dynamic business world, back office operations, technical support, business support services and technology based marketing solutions have become critical components for running the business successfully. At Intelliworkz we offer gamut of services which helps our customer to cut down their operational cost, outsource support services at affordable rates and hence they can focus on their core business activities. With strong collaboration of skilled people in our team we deliver quality services to our clients in prescribed time limit. We closely work with our clients to study and evaluate their business model so that we can offer them customised solutions.</p>	\N	1c46541d-18ed-40fa-ad80-6c900111e816	{}	2026-06-01	\N	2026-10-01	t	t	Gavli Shivra, Gangapur, Chhatrapati Sambhajinagar District, Maharashtra, India	Gavli Shivra	\N	India	Maharashtra	Gavli Shivra	382325	\N	19.8781923	75.0681209	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2026-06-15 18:28:06.850588	2026-06-15 18:32:51.634933	2026-06-15 18:37:21.526444	{1,2,3,4,5,6}	\N	{}	\N	RESIDENTIAL	TOWER_BASED	flat_apartment	1781528286758-441941348-header-image.png	[]	[]	{}	{}	\N	\N	\N
69			\N	\N	{}	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-11-25 12:27:44.466919	2026-06-10 16:36:24.947821	2026-06-24 15:58:03.073645	{5}	\N	{}		RESIDENTIAL	TOWER_BASED	\N	\N	[]	[]	{}	{}	\N	\N	\N
74	25th May Project Creation		\N	047cbd62-bd78-4e42-be1c-72395edaf057	{}	2026-05-26	2026-05-29	2026-06-01	t	f	B Block, Office No, 912-A, World Trade Tower, Sarkhej - Gandhinagar Hwy, behind BMW Car Showroom, Makarba, Ahmedabad, Sarkhej-Okaf, Gujarat 382210	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	382210		\N	\N	f	{}	\N	\N	completed	1c46541d-18ed-40fa-ad80-6c900111e816	2026-05-25 10:24:58.963597	2026-05-25 11:48:16.451922	2026-06-25 16:51:38.223209	{1}	\N	{1779684957248-217443338-BuildYourWayCard1.png,1779684963281-502641668-BuildYourWayCard1.png}	\N	COMMERCIAL	TOWER_BASED	\N	\N	[]	[]	{1779684957248-217443338-BuildYourWayCard1.png,1779684963281-502641668-BuildYourWayCard1.png}	{}	\N	\N	\N
80	Aryan Parishar	<h3 class="ql-align-center"><strong>Building a better future</strong></h3><p>Intelliworkz Business Solutions Private Limited is a Digital and Technology Services Company offering expertise into various disciplines like Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions &amp; Mobile Applications.</p><p>In today's fast growing and dynamic business world, back office operations, technical support, business support services and technology based marketing solutions have become critical components for running the business successfully. At Intelliworkz we offer gamut of services which helps our customer to cut down their operational cost, outsource support services at affordable rates and hence they can focus on their core business activities. With strong collaboration of skilled people in our team we deliver quality services to our clients in prescribed time limit. We closely work with our clients to study and evaluate their business model so that we can offer them customised solutions.</p><h3 class="ql-align-center"><strong>Building a better future</strong></h3><p>Intelliworkz Business Solutions Private Limited is a Digital and Technology Services Company offering expertise into various disciplines like Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions &amp; Mobile Applications.</p><p>In today's fast growing and dynamic business world, back office operations, technical support, business support services and technology based marketing solutions have become critical components for running the business successfully. At Intelliworkz we offer gamut of services which helps our customer to cut down their operational cost, outsource support services at affordable rates and hence they can focus on their core business activities. With strong collaboration of skilled people in our team we deliver quality services to our clients in prescribed time limit. We closely work with our clients to study and evaluate their business model so that we can offer them customised solutions.</p>	\N	1c46541d-18ed-40fa-ad80-6c900111e816	{}	2026-06-01	\N	2026-07-01	t	t	Vidya Academy of Science and Technology, Farm Road, Velur, Kunnamkulam, Thrissur, Kerala, 680549, India	Vidya Academy of Science and Technology	Farm Road	India	Kerala	Velur	680549	\N	10.6275265	76.1456479	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2026-06-15 18:55:07.652527	2026-06-20 09:46:22.357796	2026-06-20 14:06:21.495199	{1,2,3,4,5,6}	\N	{}	,, ,	RESIDENTIAL	TOWER_BASED	flat_apartment	1781529907411-214395792-new_ft_logo.svg	[{"id": "5084745e-3bde-4cb5-89e8-52f59311fc05", "url": "http://localhost:3001/project_vr_app_document/1781530872795-758291704-image%20(24).png", "name": "image (24).png", "category": "Elevations", "filename": "1781530872795-758291704-image (24).png"}, {"id": "0a124ec1-5edd-4602-bd89-f0af68dc3404", "url": "http://localhost:3001/project_vr_app_document/1781530872813-722236589-image%20(23).png", "name": "image (23).png", "category": "Landscapes", "filename": "1781530872813-722236589-image (23).png"}, {"id": "996ddd30-d947-4649-9229-feda48dd0822", "url": "http://localhost:3001/project_vr_app_document/1781530872823-979590118-GARDEN-scaled-thegem-gallery-sidebar%201%20(1).png", "name": "GARDEN-scaled-thegem-gallery-sidebar 1 (1).png", "category": "Amenities", "filename": "1781530872823-979590118-GARDEN-scaled-thegem-gallery-sidebar 1 (1).png"}, {"id": "c88dfa36-a4b7-4c9d-bd9f-eda369bf1e11", "url": "http://localhost:3001/project_vr_app_document/1781530872836-252770783-brochure-1.png", "name": "brochure-1.png", "category": "Construction Progress", "filename": "1781530872836-252770783-brochure-1.png"}, {"id": "609be78c-bdf9-49ca-a9cd-ea7f601f715a", "url": "http://localhost:3001/project_vr_app_document/1781530872841-746375325-image%20(22).png", "name": "image (22).png", "category": "Construction Progress", "filename": "1781530872841-746375325-image (22).png"}, {"id": "e1919a63-19ed-49ea-9004-322fc1c63467", "url": "http://localhost:3001/project_vr_app_document/1781530872846-610398816-GARDEN-scaled-thegem-gallery-sidebar%201.png", "name": "GARDEN-scaled-thegem-gallery-sidebar 1.png", "category": "Elevations", "filename": "1781530872846-610398816-GARDEN-scaled-thegem-gallery-sidebar 1.png"}, {"id": "ec7b772b-1e78-4750-8296-fcc4259144a3", "url": "http://localhost:3001/project_vr_app_document/1781530872857-827230446-CRM_Data_Dictionary_v2.docx", "name": "CRM_Data_Dictionary_v2.docx", "category": "Elevations", "filename": "1781530872857-827230446-CRM_Data_Dictionary_v2.docx"}, {"id": "4891de43-118c-45cd-b799-dd61faa8ad5c", "url": "http://localhost:3001/project_vr_app_document/1781530872860-214284477-Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf", "name": "Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf", "category": "Elevations", "filename": "1781530872860-214284477-Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf"}, {"id": "0084062b-d20f-4469-a59c-96bd87002e51", "url": "http://localhost:3001/project_vr_app_document/1781530872864-755689638-CRM_Documentation_With_DataTypes%201.pdf", "name": "CRM_Documentation_With_DataTypes 1.pdf", "category": "Elevations", "filename": "1781530872864-755689638-CRM_Documentation_With_DataTypes 1.pdf"}, {"id": "0ca1f4e3-5b78-4b9b-ae33-80cd7251afad", "url": "http://localhost:3001/project_vr_app_document/1781530872864-103918424-image%20(24).png", "name": "image (24).png", "category": "Elevations", "filename": "1781530872864-103918424-image (24).png"}, {"id": "266d6dfe-2944-4870-b229-953e3e9c04e8", "url": "http://localhost:3001/project_vr_app_document/1781530872868-458466492-image%20(23).png", "name": "image (23).png", "category": "Elevations", "filename": "1781530872868-458466492-image (23).png"}, {"id": "8c7bbe52-76be-4a53-bd6d-14a182c70faa", "url": "http://localhost:3001/project_vr_app_document/1781530872871-955181313-image%20(22).png", "name": "image (22).png", "category": "Elevations", "filename": "1781530872871-955181313-image (22).png"}, {"id": "aa1db342-1a19-4f6f-aa99-9bfd2b509d16", "url": "http://localhost:3001/project_vr_app_document/1781530872874-30994597-QT-2026-00003%20(1).pdf", "name": "QT-2026-00003 (1).pdf", "category": "Elevations", "filename": "1781530872874-30994597-QT-2026-00003 (1).pdf"}, {"id": "a1715fdc-5233-4d0a-8c56-90390678c64b", "url": "http://localhost:3001/project_vr_app_document/1781530872885-22985692-QT-2026-00007.pdf", "name": "QT-2026-00007.pdf", "category": "Elevations", "filename": "1781530872885-22985692-QT-2026-00007.pdf"}, {"id": "cf23b755-8f05-4c55-8810-d3fbdaf333ee", "url": "http://localhost:3001/project_vr_app_document/1781530872899-966903801-QT-2026-00006.pdf", "name": "QT-2026-00006.pdf", "category": "Elevations", "filename": "1781530872899-966903801-QT-2026-00006.pdf"}]	[{"id": "10eaaf6d-5074-4d47-9cdd-389b50c49b0f", "url": "https://youtu.be/gslnJPEhq9A?si=IwJsSP-6jOkcsJl0", "name": "YouTube Video", "type": "url", "thumbnail": "https://img.youtube.com/vi/gslnJPEhq9A/hqdefault.jpg"}, {"id": "6c6e4612-14f8-4f4d-aa9a-93454ba2ab21", "url": "https://youtu.be/zgLRtclRhqU?si=hp_po9DiSArNUMyh", "name": "YouTube Video", "type": "url", "thumbnail": "https://img.youtube.com/vi/zgLRtclRhqU/hqdefault.jpg"}, {"id": "b4ef1d5c-5baa-4176-b866-2625035e92c9", "url": "https://www.hmtl.in/public/front/images/videos/degreasing_new.mp4", "name": "www.hmtl.in", "type": "url", "thumbnail": null}]	{"1781531606597-886520949-CRM_Documentation_With_DataTypes 1.pdf","1781531606608-853744294-QT-2026-00003 (1).pdf",1781531606631-662411400-QT-2026-00007.pdf,1781531606652-42142925-QT-2026-00006.pdf,"1781531634087-136856125-CRM_Documentation_With_DataTypes 1.pdf","1781531634088-21871069-QT-2026-00003 (1).pdf",1781531634095-731600477-QT-2026-00007.pdf,1781531634106-119220689-QT-2026-00006.pdf,"1781531666777-375837664-CRM_Documentation_With_DataTypes 1.pdf","1781531666778-933812976-QT-2026-00003 (1).pdf",1781531666804-781983289-QT-2026-00007.pdf,1781531666811-476073667-QT-2026-00006.pdf}	{1781531606675-477853161-QT-2026-00003.pdf,1781531606675-475061063-QT-2026-00002.pdf,1781531606675-715344632-QT-2026-00001.pdf,"1781531606679-959335116-Commercial Unit vth Terrace _Format of Quotation.pdf",1781531634115-726546539-QT-2026-00003.pdf,1781531634117-679782484-QT-2026-00002.pdf,1781531634118-228172841-QT-2026-00001.pdf,"1781531634119-561756266-Commercial Unit vth Terrace _Format of Quotation.pdf",1781531666818-467089626-QT-2026-00003.pdf,1781531666818-754436709-QT-2026-00002.pdf,1781531666818-22257054-QT-2026-00001.pdf,"1781531666823-346575929-Commercial Unit vth Terrace _Format of Quotation.pdf"}	\N	\N	\N
76	Manthan Sky	<p>Manthan Sky for Demo</p>	NA	\N	{}	2026-06-12	\N	2026-06-27	t	t	Bandra, Gornji Ramići, Ključ Municipality, Una-Sana Canton, Federation of Bosnia and Herzegovina, Bosnia and Herzegovina	Bandra	\N	Bosnia and Herzegovina	Federation of Bosnia and Herzegovina	Gornji Ramići	123456	\N	\N	\N	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2026-06-11 14:53:46.008652	2026-06-24 16:08:08.901224	\N	{1,6,4}	\N	{1781169933151-694437549-Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf,1781169946720-58110292-Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf}	,,,, ,,,	RESIDENTIAL	TOWER_BASED	flat_apartment	1781516515372-799867234-sidebar-img.png	[]	[]	{1781169933151-694437549-Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf,1781169946720-58110292-Lead_Source_Wise_Report_2026-05-10_to_2026-06-09.pdf}	{}	\N	\N	\N
64	Gobhi Roll	\N	\N	{}	{}	2025-09-25	2025-10-03	2025-10-04	t	f	Jordan, Jordan Road, Gun Club Hill, Yau Ma Tei, Yau Tsim Mong District, Kowloon, Hong Kong, China	Ahmedabad, Gujarat, 380001, India	213	India	Gujarat	Ahmedabad	380001	Yau Ma Tei	22.3048099	114.1717074	t	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2025-09-24 16:28:47.448634	2026-06-24 16:10:47.950774	\N	{1,2,3,6}	1758712458106-77953944-House.glb	{}	\N	\N	\N	\N	\N	[]	[]	{}	{}	Housing.com	317e92075df9a35834b5dd22459c080a	Active
79	Manthan	<h3 class="ql-align-center"><strong>Building a better future</strong></h3><p>Intelliworkz Business Solutions Private Limited is a Digital and Technology Services Company offering expertise into various disciplines like Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions &amp; Mobile Applications.</p><p>In today's fast growing and dynamic business world, back office operations, technical support, business support services and technology based marketing solutions have become critical components for running the business successfully. At Intelliworkz we offer gamut of services which helps our customer to cut down their operational cost, outsource support services at affordable rates and hence they can focus on their core business activities. With strong collaboration of skilled people in our team we deliver quality services to our clients in prescribed time limit. We closely work with our clients to study and evaluate their business model so that we can offer them customised solutions.</p><h3 class="ql-align-center"><strong>Building a better future</strong></h3><p>Intelliworkz Business Solutions Private Limited is a Digital and Technology Services Company offering expertise into various disciplines like Digital Transformation, Enterprise Software, Tech and Digital Marketing, Designing, UI/UX Services, Web Development, Custom Software Development, eCommerce Solutions &amp; Mobile Applications.</p><p>In today's fast growing and dynamic business world, back office operations, technical support, business support services and technology based marketing solutions have become critical components for running the business successfully. At Intelliworkz we offer gamut of services which helps our customer to cut down their operational cost, outsource support services at affordable rates and hence they can focus on their core business activities. With strong collaboration of skilled people in our team we deliver quality services to our clients in prescribed time limit. We closely work with our clients to study and evaluate their business model so that we can offer them customised solutions.</p>	\N	1c46541d-18ed-40fa-ad80-6c900111e816	{}	2026-06-01	\N	2026-08-01	t	t	Gavli Shivra, Gangapur, Chhatrapati Sambhajinagar District, Maharashtra, India	Gavli Shivra	\N	India	Maharashtra	Gavli Shivra	382325	\N	19.8781923	75.0681209	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2026-06-15 18:40:10.036869	2026-06-26 16:07:58.893095	\N	{1,2,3,4,5,6}	\N	{}	\N	RESIDENTIAL	TOWER_BASED	flat_apartment	1781529010029-115339526-header-image.png	[{"id": "83fee436-5f1c-453e-9032-8e08f8a5c67f", "url": "http://localhost:3001/project_vr_app_document/1781529076340-809012502-CRM_Documentation_With_DataTypes%201.pdf", "name": "CRM_Documentation_With_DataTypes 1.pdf", "category": "Elevations", "filename": "1781529076340-809012502-CRM_Documentation_With_DataTypes 1.pdf"}, {"id": "b5525204-a051-4a86-b3cd-9b553576298b", "url": "http://localhost:3001/project_vr_app_document/1781529076341-696742222-image%20(23).png", "name": "image (23).png", "category": "Landscapes", "filename": "1781529076341-696742222-image (23).png"}, {"id": "93397dd4-74a8-407b-a92d-0b616d2804ef", "url": "http://localhost:3001/project_vr_app_document/1781529076350-533711548-image%20(23).png", "name": "image (23).png", "category": "Amenities", "filename": "1781529076350-533711548-image (23).png"}, {"id": "777101a8-879c-495e-8748-d8b2308929ca", "url": "http://localhost:3001/project_vr_app_document/1781529076353-755003689-brochure-2.png", "name": "brochure-2.png", "category": "Construction Progress", "filename": "1781529076353-755003689-brochure-2.png"}]	[]	{}	{}	\N	\N	\N
77	Intelliworkz Apartment	<p>Intelliworkz Apartment</p>	123456	1c46541d-18ed-40fa-ad80-6c900111e816	{}	2026-07-01	\N	2027-09-01	t	t	Gavli Shivra, Gangapur, Chhatrapati Sambhajinagar District, Maharashtra, India	Gavli Shivra	Chhatrapati Sambhajinagar	India	Maharashtra	Gavli Shivra	7878787	Sambhajinagar	19.8781923	75.0681209	f	{}	\N	\N	draft	1c46541d-18ed-40fa-ad80-6c900111e816	2026-06-15 16:21:07.625861	2026-06-26 12:45:11.334544	\N	{1,2,3,4,5,6}	\N	{}	,,,, ,,,	RESIDENTIAL	TOWER_BASED	flat_apartment	1781521149794-769073515-header-image.png	[{"id": "48a3e416-2584-44c6-be21-7bea6f258776", "url": "http://localhost:3001/project_vr_app_document/1781526490860-951956576-image%20(24).png", "name": "image (24).png", "category": "Elevations", "filename": "1781526490860-951956576-image (24).png"}, {"id": "07b5a23e-ddc3-4f6c-993e-c19e0f043c80", "url": "http://localhost:3001/project_vr_app_document/1781526490874-658095691-image%20(22).png", "name": "image (22).png", "category": "Landscapes", "filename": "1781526490874-658095691-image (22).png"}, {"id": "133f3789-80d6-4297-aef7-7524dbcf71f9", "url": "http://localhost:3001/project_vr_app_document/1781526490883-665055864-brochure-1.png", "name": "brochure-1.png", "category": "Amenities", "filename": "1781526490883-665055864-brochure-1.png"}, {"id": "c1ded1c7-c9e8-4efe-922e-47eec8e6d5bf", "url": "http://localhost:3001/project_vr_app_document/1781526490886-471415696-floor-plan.png", "name": "floor-plan.png", "category": "Construction Progress", "filename": "1781526490886-471415696-floor-plan.png"}]	[{"id": "cd81a817-7e19-4d3a-9d4b-9e6851a05183", "url": "https://youtu.be/Pg0kuM_h5bw?si=Tu80iFrNiGjZRqf3", "name": "YouTube Video", "type": "url", "thumbnail": "https://img.youtube.com/vi/Pg0kuM_h5bw/hqdefault.jpg"}, {"id": "38a9ef8b-aed6-45b0-8d0f-39ede8bdfe8f", "url": "https://youtu.be/gslnJPEhq9A?si=IwJsSP-6jOkcsJl0", "name": "YouTube Video", "type": "url", "thumbnail": "https://img.youtube.com/vi/gslnJPEhq9A/hqdefault.jpg"}]	{1781521056751-551819643-LetterHead.pdf,"1781521730062-31598238-image (24).png","1781521735421-139669477-image (24).png"}	{1781521056757-456309684-QT-2026-00005.pdf,1781521730064-335833539-google.png,1781521735424-36993682-google.png}	\N	\N	\N
\.


--
-- Data for Name: projects_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects_backup (name, description, created_by, created_at, updated_at, state, city, zip, locality, latitude, longitude, rera_project_id, sales, id, location, type, start_date, end_date, total_units, sold_units, is_active) FROM stdin;
Green Valley Heights	Luxury residential apartments with modern amenities	\N	2025-06-06 17:55:25.176141+05:30	2025-06-06 17:55:25.176141+05:30	\N	\N	\N	\N	\N	\N	\N	\N	e1c8791a-3a01-4342-aef7-e1e6c308f8f2	\N	\N	\N	\N	0	0	t
Business Plaza	Commercial complex with office spaces	\N	2025-06-06 17:55:25.176141+05:30	2025-06-06 17:55:25.176141+05:30	\N	\N	\N	\N	\N	\N	\N	\N	bd4cdd10-eefb-4d74-91e6-16834d12eb8c	\N	\N	\N	\N	0	0	t
Sunset Villas	Premium villa project with garden spaces	\N	2025-06-06 17:55:25.176141+05:30	2025-06-06 17:55:25.176141+05:30	\N	\N	\N	\N	\N	\N	\N	\N	c507727d-d39a-4f78-85d0-71864be69061	\N	\N	\N	\N	0	0	t
Green Valley Heights	Luxury residential apartments with modern amenities	\N	2025-06-06 18:02:16.453413+05:30	2025-06-06 18:02:16.453413+05:30	\N	\N	\N	\N	\N	\N	\N	\N	04e149de-4f8f-4aba-8480-1da5bce5dfd5	\N	\N	\N	\N	0	0	t
Business Plaza	Commercial complex with office spaces	\N	2025-06-06 18:02:16.453413+05:30	2025-06-06 18:02:16.453413+05:30	\N	\N	\N	\N	\N	\N	\N	\N	cba894e7-a42d-4653-b001-d9e190b5f0ff	\N	\N	\N	\N	0	0	t
Sunset Villas	Premium villa project with garden spaces	\N	2025-06-06 18:02:16.453413+05:30	2025-06-06 18:02:16.453413+05:30	\N	\N	\N	\N	\N	\N	\N	\N	55952f90-0d39-4a70-8492-4923a951ca71	\N	\N	\N	\N	0	0	t
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, project_id, flat_no, floor, area_sqft, price, status, description, bedrooms, bathrooms, created_at, updated_at) FROM stdin;
3555b0b2-6b14-4c68-aeb5-09798d491aba	407ed1ab-c3c9-4983-95ab-7263a377f607	A-1	1	1250.00	850000.00	available	\N	3	2	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
1f145e3b-ffe8-4ea2-b871-11c66362bdba	407ed1ab-c3c9-4983-95ab-7263a377f607	A-2	1	1300.00	900000.00	available	\N	4	1	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
9cb1bb3e-708b-434c-a808-02fd25d14068	407ed1ab-c3c9-4983-95ab-7263a377f607	A-3	2	1350.00	950000.00	available	\N	2	2	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
6dcec6e9-b986-4f15-9979-0aec7ff61ece	407ed1ab-c3c9-4983-95ab-7263a377f607	A-4	2	1400.00	1000000.00	available	\N	3	1	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
a81659aa-1592-47da-bb24-93ec7849ec91	407ed1ab-c3c9-4983-95ab-7263a377f607	A-5	3	1450.00	1050000.00	available	\N	4	2	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
724acfbe-3ff6-4c30-a556-789b1476e3fa	407ed1ab-c3c9-4983-95ab-7263a377f607	A-6	3	1500.00	1100000.00	available	\N	2	1	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
7e9ce980-728c-4b27-a9f7-e6a2e99cedf3	407ed1ab-c3c9-4983-95ab-7263a377f607	A-7	4	1550.00	1150000.00	available	\N	3	2	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
c6b8195f-c11c-463f-81f2-2fd178747c9f	407ed1ab-c3c9-4983-95ab-7263a377f607	A-8	4	1600.00	1200000.00	available	\N	4	1	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
ac238e20-7e0f-4c65-aa36-7e8db61297e5	407ed1ab-c3c9-4983-95ab-7263a377f607	A-9	5	1650.00	1250000.00	available	\N	2	2	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
578a9884-a079-4189-8803-d16d58ae6713	407ed1ab-c3c9-4983-95ab-7263a377f607	A-10	5	1700.00	1300000.00	available	\N	3	1	2025-06-07 15:55:25.190563+05:30	2025-06-07 15:55:25.190563+05:30
e6d999b1-8f18-48e3-ac4e-82d8511b18a4	407ed1ab-c3c9-4983-95ab-7263a377f607	A-1	1	1250.00	850000.00	available	\N	3	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
e43ff833-3f53-4104-9af2-7e910ff5bb2b	407ed1ab-c3c9-4983-95ab-7263a377f607	A-2	1	1300.00	900000.00	available	\N	4	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
63d2456e-16aa-44ad-8734-989b835fd06e	407ed1ab-c3c9-4983-95ab-7263a377f607	A-3	2	1350.00	950000.00	available	\N	2	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
41d884bc-7d91-4fb6-aaef-a583316a04d0	407ed1ab-c3c9-4983-95ab-7263a377f607	A-4	2	1400.00	1000000.00	available	\N	3	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
3dd7727a-266a-405c-aef1-da934f7ef603	407ed1ab-c3c9-4983-95ab-7263a377f607	A-5	3	1450.00	1050000.00	available	\N	4	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
3ebd7d00-a508-49fa-b158-d1a27b9de416	407ed1ab-c3c9-4983-95ab-7263a377f607	A-6	3	1500.00	1100000.00	available	\N	2	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
73617ad5-15ec-4b4c-9f8c-47013179a9d1	407ed1ab-c3c9-4983-95ab-7263a377f607	A-7	4	1550.00	1150000.00	available	\N	3	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
271e9d53-769c-40f8-9e12-babce0064e15	407ed1ab-c3c9-4983-95ab-7263a377f607	A-8	4	1600.00	1200000.00	available	\N	4	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
2d6937d1-6997-4472-9a17-a57b0a513b31	407ed1ab-c3c9-4983-95ab-7263a377f607	A-9	5	1650.00	1250000.00	available	\N	2	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
34444068-1149-4c75-80b2-ed40dbf2916a	407ed1ab-c3c9-4983-95ab-7263a377f607	A-10	5	1700.00	1300000.00	available	\N	3	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
c367aae9-5769-4887-b992-a03023a4024d	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-1	1	1250.00	850000.00	available	\N	3	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
6cfb3bf8-4a9e-4a9c-998a-f3fe9c28dd39	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-2	1	1300.00	900000.00	available	\N	4	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
26810bed-93fc-41eb-abb6-8874ac85ef54	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-3	2	1350.00	950000.00	available	\N	2	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
7082fc26-1f4b-4a59-9a48-cd728cbb4fda	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-4	2	1400.00	1000000.00	available	\N	3	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
723d17e6-a862-4a67-99e6-62c7dc53a8a7	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-5	3	1450.00	1050000.00	available	\N	4	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
2777fd6e-9d57-45fc-bf7c-f76f70a51965	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-6	3	1500.00	1100000.00	available	\N	2	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
2c029847-cd26-495a-b00f-b10c5010f851	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-7	4	1550.00	1150000.00	available	\N	3	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
55d5cf87-0a73-4f70-9431-f29cbe003a49	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-8	4	1600.00	1200000.00	available	\N	4	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
06735849-6236-44e7-be2c-2acc5885297e	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-9	5	1650.00	1250000.00	available	\N	2	2	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
cf8deeae-2731-4245-8845-9fd3bfb78d61	3fc0ed90-4cc5-4b41-94a6-e4ec64f5facb	A-10	5	1700.00	1300000.00	available	\N	3	1	2025-06-07 16:05:09.480726+05:30	2025-06-07 16:05:09.480726+05:30
\.


--
-- Data for Name: quotation_number_sequences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_number_sequences (year, last_number, updated_at) FROM stdin;
2026	9	2026-06-26 16:06:16.253799+05:30
\.


--
-- Data for Name: quotation_particulars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_particulars (id, template_id, label, calculation_type, value, applies_to, include_in_subtotal, sort_order, is_optional, created_at) FROM stdin;
a3bc91af-29c9-44b6-9e50-27402f07ac3c	7612ce43-433f-4928-b700-15e43478dd41	GST	percent_of_base	12.0000	unit	t	0	f	2026-05-27 12:47:30.922368+05:30
a8cfc93a-1922-4267-8b02-3c4baecb540c	7612ce43-433f-4928-b700-15e43478dd41	Legal Tax	percent_of_base	4.9900	unit	t	1	f	2026-05-27 12:47:30.922368+05:30
b3553754-9366-47f2-a7f3-9429534854e5	be95aede-037c-4243-91e3-3ddc3fcc51b9	GST	percent_of_base	12.0000	unit	t	0	f	2026-05-27 17:36:34.326479+05:30
f53a8bcf-ed95-433d-9f30-bab0639b80ce	be95aede-037c-4243-91e3-3ddc3fcc51b9	Legal Charges	percent_of_base	4.9900	unit	t	1	f	2026-05-27 17:36:34.326479+05:30
6630c4df-8094-44e8-ada5-cfd03dd90bd2	be95aede-037c-4243-91e3-3ddc3fcc51b9	Development Charges	fixed	360.0000	unit	t	2	f	2026-05-27 17:36:34.326479+05:30
54480675-c41e-4e80-abf3-0914b3ee63d5	e59d4734-2d4a-4fea-b5f2-ddae7f562dc5	GST	percent_of_total	12.0000	unit	t	0	f	2026-05-27 17:53:06.58666+05:30
42f81690-71f5-4a14-ac87-970c26681971	e59d4734-2d4a-4fea-b5f2-ddae7f562dc5	Stamp Duty	percent_of_base	4.9900	unit	t	1	f	2026-05-27 17:53:06.58666+05:30
c0cfa39d-56e2-45fe-af3e-31ae4bf319ce	e59d4734-2d4a-4fea-b5f2-ddae7f562dc5	Development Charges	fixed	360.0000	unit	t	2	f	2026-05-27 17:53:06.58666+05:30
94587315-2bbc-41be-a6d8-571b190cd4de	e59d4734-2d4a-4fea-b5f2-ddae7f562dc5	Legal Charges	fixed	25000.0000	unit	t	3	f	2026-05-27 17:53:06.58666+05:30
c0f925c1-061f-47bd-bda9-71a88d009170	4131cdbd-d43e-4052-b191-0d74dc65abb4	Development & Maintenance	rate_x_total_area	360.0000	unit	t	0	f	2026-05-28 15:10:14.965653+05:30
dd28302d-72cf-43b8-a8e1-a94d1314566a	4131cdbd-d43e-4052-b191-0d74dc65abb4	Advocate Fees	fixed_amount	25000.0000	unit	t	1	f	2026-05-28 15:10:14.965653+05:30
be6c3ced-fcbb-4e87-86bf-43440f4c0edc	4131cdbd-d43e-4052-b191-0d74dc65abb4	Stamp Duty	percent_of_basic_price	4.9900	unit	t	2	f	2026-05-28 15:10:14.965653+05:30
9f0687ec-cb9b-43d5-9dbd-cac2d11abf45	4131cdbd-d43e-4052-b191-0d74dc65abb4	Registration Fees	percent_of_basic_price	1.0000	unit	t	3	f	2026-05-28 15:10:14.965653+05:30
f7a04574-6f47-4332-bc9d-ebf68ce3d135	77e72a8a-97da-4f36-873b-d0d5cbc2b291	GST	percent_of_basic_price	12.0000	unit	t	0	f	2026-06-01 14:47:09.009943+05:30
8d8bad2d-954c-42fc-83cc-cadd518e1ae1	77e72a8a-97da-4f36-873b-d0d5cbc2b291	Stamp Duty	percent_of_basic_price	4.9900	unit	t	1	f	2026-06-01 14:47:09.009943+05:30
41bbafe8-edf3-42c9-b275-df0d77846b73	77e72a8a-97da-4f36-873b-d0d5cbc2b291	Development Charges	rate_x_total_area	360.0000	unit	t	2	f	2026-06-01 14:47:09.009943+05:30
64503093-8b96-4216-bbf1-60ce58dd156a	77e72a8a-97da-4f36-873b-d0d5cbc2b291	Legal Charges	fixed_amount	25000.0000	unit	t	3	f	2026-06-01 14:47:09.009943+05:30
1731a19b-1332-47b1-ba93-3e845f47bf81	95109bd0-9f96-44d1-b3cc-8860a3ce48a6	Gst	percent_of_basic_price	0.0000	unit	t	0	f	2026-06-24 10:35:40.442582+05:30
231cab30-a000-4d00-a939-a0c4c420dd8e	7b822923-bfa6-4b7f-86e4-6902ffa2677b	kuchbhi	percent_of_basic_price	0.0000	unit	t	0	f	2026-06-24 10:37:58.908151+05:30
b2b91ab4-8af2-44b7-b53f-46c86e65d647	7b822923-bfa6-4b7f-86e4-6902ffa2677b	dubara kuch	percent_of_basic_price	0.0000	unit	t	1	f	2026-06-24 10:37:58.908151+05:30
b2cbfdd6-3b3c-4fd2-b894-827d5e0eb44f	47706e81-5471-415a-9095-c93df20c55b4	dubara kuch	percent_of_basic_price	0.0000	unit	t	0	f	2026-06-24 11:09:58.856982+05:30
cf9d4a78-5a18-48b0-aa63-f2128abbb224	283b43c9-ac38-407b-a8cf-707041e78838	dubara kuch	percent_of_basic_price	0.0000	unit	t	0	f	2026-06-24 11:09:59.191046+05:30
03c960e6-592c-449a-88fa-dc632003418c	05fcaee6-1179-411c-9f3d-6760ead35112	GST	percent_of_basic_price	12.0000	unit	t	0	f	2026-06-24 11:11:01.14671+05:30
b72202c5-b460-490f-92ad-a64151913e70	05fcaee6-1179-411c-9f3d-6760ead35112	dubara kuch	percent_of_basic_price	0.0000	unit	t	1	f	2026-06-24 11:11:01.14671+05:30
b40ffb84-3f18-4049-920d-fb2ea8ccaee4	4ac52ce9-21d4-497a-a92c-4518009c83d6	GST	percent_of_basic_price	12.0000	unit	t	0	f	2026-06-24 11:11:18.787363+05:30
daf14b25-2020-46aa-b4f4-847096972690	4ac52ce9-21d4-497a-a92c-4518009c83d6	dubara kuch	percent_of_basic_price	0.0000	unit	t	1	f	2026-06-24 11:11:18.787363+05:30
d4da9079-0713-42a9-b6d8-417127c22400	4ac52ce9-21d4-497a-a92c-4518009c83d6	GST@	percent_of_basic_price	8.0000	unit	t	2	f	2026-06-24 11:11:18.787363+05:30
4175e47f-942b-4f68-bb8a-534dd5812082	125a40a1-6d67-4f52-b758-41b7b1f51dc5	GST	percent_of_basic_price	12.0000	unit	t	0	f	2026-06-26 16:05:35.105914+05:30
76f23e6f-4557-4390-91b3-ff6e792f8811	125a40a1-6d67-4f52-b758-41b7b1f51dc5	Advocate Fees	fixed_amount	25000.0000	unit	t	1	f	2026-06-26 16:05:35.105914+05:30
5936fb60-fe15-4be7-9268-d3eb5eee3059	32cc4373-aabf-44a0-967e-912d3786968d	dubara kuch	percent_of_basic_price	0.0000	unit	t	0	f	2026-06-26 17:09:38.354493+05:30
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_templates (id, project_id, template_name, version, is_active, has_terrace_units, created_at, updated_at) FROM stdin;
be95aede-037c-4243-91e3-3ddc3fcc51b9	74	Quote1	1	t	f	2026-05-27 17:36:34.326479+05:30	2026-05-27 17:36:34.326479+05:30
7612ce43-433f-4928-b700-15e43478dd41	75	Aryan	1	f	f	2026-05-27 12:47:30.922368+05:30	2026-05-27 17:53:06.58666+05:30
4131cdbd-d43e-4052-b191-0d74dc65abb4	73	Aryan Test	1	t	f	2026-05-28 15:10:14.965653+05:30	2026-05-28 15:10:14.965653+05:30
e59d4734-2d4a-4fea-b5f2-ddae7f562dc5	75	PA	2	f	t	2026-05-27 17:53:06.58666+05:30	2026-06-01 14:47:09.009943+05:30
77e72a8a-97da-4f36-873b-d0d5cbc2b291	75	PA	3	t	t	2026-06-01 14:47:09.009943+05:30	2026-06-01 14:47:09.009943+05:30
95109bd0-9f96-44d1-b3cc-8860a3ce48a6	79	quATION for manthan	1	f	f	2026-06-24 10:35:40.442582+05:30	2026-06-24 10:37:58.908151+05:30
7b822923-bfa6-4b7f-86e4-6902ffa2677b	79	Mantan 2	1	f	f	2026-06-24 10:37:58.908151+05:30	2026-06-24 11:09:58.856982+05:30
47706e81-5471-415a-9095-c93df20c55b4	79	Mantan 2	2	f	f	2026-06-24 11:09:58.856982+05:30	2026-06-24 11:09:59.191046+05:30
283b43c9-ac38-407b-a8cf-707041e78838	79	Mantan 2	3	f	f	2026-06-24 11:09:59.191046+05:30	2026-06-24 11:11:01.14671+05:30
05fcaee6-1179-411c-9f3d-6760ead35112	79	Mantan 2	4	f	f	2026-06-24 11:11:01.14671+05:30	2026-06-24 11:11:18.787363+05:30
125a40a1-6d67-4f52-b758-41b7b1f51dc5	77	H	1	t	f	2026-06-26 16:05:35.105914+05:30	2026-06-26 16:05:35.105914+05:30
4ac52ce9-21d4-497a-a92c-4518009c83d6	79	Mantan 2	5	f	f	2026-06-24 11:11:18.787363+05:30	2026-06-26 17:09:38.354493+05:30
32cc4373-aabf-44a0-967e-912d3786968d	79	Mantan 2	6	t	f	2026-06-26 17:09:38.354493+05:30	2026-06-26 17:09:38.354493+05:30
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (id, template_id, project_id, unit_id, lead_id, quotation_number, client_name, quotation_date, base_price, carpet_area, super_builtup_area, terrace_area, unit_rate, terrace_rate, total_amount, particulars_snapshot, status, notes, created_at, updated_at) FROM stdin;
1d7cf816-cf5a-45fa-a86a-6b95485d1bfc	be95aede-037c-4243-91e3-3ddc3fcc51b9	74	9	\N	QT-2026-00001	Aryan	2026-05-27	1890.00	8999.00	8999.00	\N	8500.00	\N	2571.11	{"unit": {"id": 9, "unit_rate": 8500, "unit_number": "A101", "terrace_rate": null, "unit_base_price": 1890, "carpet_area_sqft": 8999, "terrace_area_sqft": null, "terrace_base_price": 0, "super_builtup_area_sqft": 8999}, "items": [{"id": "b3553754-9366-47f2-a7f3-9429534854e5", "label": "GST", "value": 12, "applies_to": "unit", "sort_order": 0, "is_optional": false, "unit_amount": 226.8, "total_amount": 226.8, "terrace_amount": 0, "calculation_type": "percent_of_base", "include_in_subtotal": true}, {"id": "f53a8bcf-ed95-433d-9f30-bab0639b80ce", "label": "Legal Charges", "value": 4.99, "applies_to": "unit", "sort_order": 1, "is_optional": false, "unit_amount": 94.31, "total_amount": 94.31, "terrace_amount": 0, "calculation_type": "percent_of_base", "include_in_subtotal": true}, {"id": "6630c4df-8094-44e8-ada5-cfd03dd90bd2", "label": "Development Charges", "value": 360, "applies_to": "unit", "sort_order": 2, "is_optional": false, "unit_amount": 360, "total_amount": 360, "terrace_amount": 0, "calculation_type": "fixed", "include_in_subtotal": true}], "totals": {"grand_total": 2571.11, "unit_particulars_total": 681.11, "terrace_particulars_total": 0}, "template": {"id": "be95aede-037c-4243-91e3-3ddc3fcc51b9", "version": 1, "template_name": "Quote1", "has_terrace_units": false}, "generated_at": "2026-05-27T12:07:17.640Z"}	draft	\N	2026-05-27 17:37:17.641059+05:30	2026-05-27 17:37:17.641059+05:30
d6637d67-459d-4215-9392-a6d4ce1f198d	e59d4734-2d4a-4fea-b5f2-ddae7f562dc5	75	8	\N	QT-2026-00002	Manthan	2026-05-27	1890.00	8999.00	8999.00	\N	\N	\N	27571.11	{"unit": {"id": 8, "unit_rate": null, "unit_number": "A101", "terrace_rate": null, "unit_base_price": 1890, "carpet_area_sqft": 8999, "terrace_area_sqft": null, "terrace_base_price": 0, "super_builtup_area_sqft": 8999}, "items": [{"id": "54480675-c41e-4e80-abf3-0914b3ee63d5", "label": "GST", "value": 12, "applies_to": "unit", "sort_order": 0, "is_optional": false, "unit_amount": 226.8, "total_amount": 226.8, "terrace_amount": 0, "calculation_type": "percent_of_total", "include_in_subtotal": true}, {"id": "42f81690-71f5-4a14-ac87-970c26681971", "label": "Stamp Duty", "value": 4.99, "applies_to": "unit", "sort_order": 1, "is_optional": false, "unit_amount": 94.31, "total_amount": 94.31, "terrace_amount": 0, "calculation_type": "percent_of_base", "include_in_subtotal": true}, {"id": "c0cfa39d-56e2-45fe-af3e-31ae4bf319ce", "label": "Development Charges", "value": 360, "applies_to": "unit", "sort_order": 2, "is_optional": false, "unit_amount": 360, "total_amount": 360, "terrace_amount": 0, "calculation_type": "fixed", "include_in_subtotal": true}, {"id": "94587315-2bbc-41be-a6d8-571b190cd4de", "label": "Legal Charges", "value": 25000, "applies_to": "unit", "sort_order": 3, "is_optional": false, "unit_amount": 25000, "total_amount": 25000, "terrace_amount": 0, "calculation_type": "fixed", "include_in_subtotal": true}], "totals": {"grand_total": 27571.11, "unit_particulars_total": 25681.11, "terrace_particulars_total": 0}, "template": {"id": "e59d4734-2d4a-4fea-b5f2-ddae7f562dc5", "version": 2, "template_name": "PA", "has_terrace_units": true}, "generated_at": "2026-05-27T12:27:28.930Z"}	draft	\N	2026-05-27 17:57:28.932246+05:30	2026-05-27 17:57:28.932246+05:30
1e32763f-6408-4b11-8504-87c7050a8238	4131cdbd-d43e-4052-b191-0d74dc65abb4	73	12	\N	QT-2026-00003	Aryan	2026-05-28	1571905.00	100.00	84.93	\N	\N	\N	1757636.91	{"unit": {"id": 12, "total_area": 184.93, "basic_price": 1571905, "unit_number": "A101", "price_per_unit": 8500, "carpet_area_sqft": 100, "super_builtup_area_sqft": 84.93}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 1571905, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "c0f925c1-061f-47bd-bda9-71a88d009170", "label": "Development & Maintenance", "value": 360, "amount": 66574.8, "sort_order": 0, "is_optional": false, "calculation_type": "rate_x_total_area"}, {"id": "dd28302d-72cf-43b8-a8e1-a94d1314566a", "label": "Advocate Fees", "value": 25000, "amount": 25000, "sort_order": 1, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "be6c3ced-fcbb-4e87-86bf-43440f4c0edc", "label": "Stamp Duty", "value": 4.99, "amount": 78438.06, "sort_order": 2, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "9f0687ec-cb9b-43d5-9dbd-cac2d11abf45", "label": "Registration Fees", "value": 1, "amount": 15719.05, "sort_order": 3, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 1757636.91, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 1757636.91}, "template": {"id": "4131cdbd-d43e-4052-b191-0d74dc65abb4", "version": 1, "template_name": "Aryan Test", "has_terrace_units": false}, "generated_at": "2026-05-28T10:04:29.392Z"}	draft	\N	2026-05-28 15:34:29.393537+05:30	2026-05-28 15:34:29.393537+05:30
14b0d33a-7629-4a0b-8705-ab4e69b335ed	4131cdbd-d43e-4052-b191-0d74dc65abb4	73	12	\N	QT-2026-00004	Manthan	2026-05-28	1571905.00	100.00	84.93	\N	\N	\N	1757636.91	{"unit": {"id": 12, "total_area": 184.93, "basic_price": 1571905, "unit_number": "A101", "price_per_unit": 8500, "carpet_area_sqft": 100, "super_builtup_area_sqft": 84.93}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 1571905, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "c0f925c1-061f-47bd-bda9-71a88d009170", "label": "Development & Maintenance", "value": 360, "amount": 66574.8, "sort_order": 0, "is_optional": false, "calculation_type": "rate_x_total_area"}, {"id": "dd28302d-72cf-43b8-a8e1-a94d1314566a", "label": "Advocate Fees", "value": 25000, "amount": 25000, "sort_order": 1, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "be6c3ced-fcbb-4e87-86bf-43440f4c0edc", "label": "Stamp Duty", "value": 4.99, "amount": 78438.06, "sort_order": 2, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "9f0687ec-cb9b-43d5-9dbd-cac2d11abf45", "label": "Registration Fees", "value": 1, "amount": 15719.05, "sort_order": 3, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 1757636.91, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 1757636.91}, "template": {"id": "4131cdbd-d43e-4052-b191-0d74dc65abb4", "version": 1, "template_name": "Aryan Test", "has_terrace_units": false}, "generated_at": "2026-05-28T10:38:55.269Z"}	draft	\N	2026-05-28 16:08:55.270414+05:30	2026-05-28 16:08:55.270414+05:30
0bdf5c35-83b5-4d87-8bb9-1282ef95dc7c	4131cdbd-d43e-4052-b191-0d74dc65abb4	73	12	\N	QT-2026-00005	Arvind Rajput	2026-05-28	1571905.00	100.00	84.93	\N	\N	\N	1757636.91	{"unit": {"id": 12, "total_area": 184.93, "basic_price": 1571905, "unit_number": "A101", "price_per_unit": 8500, "carpet_area_sqft": 100, "super_builtup_area_sqft": 84.93}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 1571905, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "c0f925c1-061f-47bd-bda9-71a88d009170", "label": "Development & Maintenance", "value": 360, "amount": 66574.8, "sort_order": 0, "is_optional": false, "calculation_type": "rate_x_total_area"}, {"id": "dd28302d-72cf-43b8-a8e1-a94d1314566a", "label": "Advocate Fees", "value": 25000, "amount": 25000, "sort_order": 1, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "be6c3ced-fcbb-4e87-86bf-43440f4c0edc", "label": "Stamp Duty", "value": 4.99, "amount": 78438.06, "sort_order": 2, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "9f0687ec-cb9b-43d5-9dbd-cac2d11abf45", "label": "Registration Fees", "value": 1, "amount": 15719.05, "sort_order": 3, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 1757636.91, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 1757636.91}, "template": {"id": "4131cdbd-d43e-4052-b191-0d74dc65abb4", "version": 1, "template_name": "Aryan Test", "has_terrace_units": false}, "generated_at": "2026-05-28T12:02:26.107Z"}	draft	\N	2026-05-28 17:32:26.107725+05:30	2026-05-28 17:32:26.107725+05:30
6be68caa-15f1-4d16-bcd9-5d199c6b6fa3	77e72a8a-97da-4f36-873b-d0d5cbc2b291	75	14	\N	QT-2026-00006	aryan pandey	2026-06-01	799200.00	189.00	255.00	\N	\N	\N	1119824.08	{"unit": {"id": 14, "total_area": 444, "basic_price": 799200, "unit_number": "A103", "price_per_unit": 1800, "carpet_area_sqft": 189, "super_builtup_area_sqft": 255}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 799200, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "f7a04574-6f47-4332-bc9d-ebf68ce3d135", "label": "GST", "value": 12, "amount": 95904, "sort_order": 0, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "8d8bad2d-954c-42fc-83cc-cadd518e1ae1", "label": "Stamp Duty", "value": 4.99, "amount": 39880.08, "sort_order": 1, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "41bbafe8-edf3-42c9-b275-df0d77846b73", "label": "Development Charges", "value": 360, "amount": 159840, "sort_order": 2, "is_optional": false, "calculation_type": "rate_x_total_area"}, {"id": "64503093-8b96-4216-bbf1-60ce58dd156a", "label": "Legal Charges", "value": 25000, "amount": 25000, "sort_order": 3, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 1119824.08, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 1119824.08}, "template": {"id": "77e72a8a-97da-4f36-873b-d0d5cbc2b291", "version": 3, "template_name": "PA", "has_terrace_units": true}, "generated_at": "2026-06-01T09:17:28.426Z"}	draft	\N	2026-06-01 14:47:28.42691+05:30	2026-06-01 14:47:28.42691+05:30
2e28bf34-4336-48e3-94fd-7f9817d0d0d9	77e72a8a-97da-4f36-873b-d0d5cbc2b291	75	15	\N	QT-2026-00007	Manthan Panchal	2026-06-01	504900.00	125.00	145.00	\N	\N	\N	712882.51	{"unit": {"id": 15, "total_area": 270, "basic_price": 504900, "unit_number": "A104", "price_per_unit": 1870, "carpet_area_sqft": 125, "super_builtup_area_sqft": 145}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 504900, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "f7a04574-6f47-4332-bc9d-ebf68ce3d135", "label": "GST", "value": 12, "amount": 60588, "sort_order": 0, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "8d8bad2d-954c-42fc-83cc-cadd518e1ae1", "label": "Stamp Duty", "value": 4.99, "amount": 25194.51, "sort_order": 1, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "41bbafe8-edf3-42c9-b275-df0d77846b73", "label": "Development Charges", "value": 360, "amount": 97200, "sort_order": 2, "is_optional": false, "calculation_type": "rate_x_total_area"}, {"id": "64503093-8b96-4216-bbf1-60ce58dd156a", "label": "Legal Charges", "value": 25000, "amount": 25000, "sort_order": 3, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 712882.51, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 712882.51}, "template": {"id": "77e72a8a-97da-4f36-873b-d0d5cbc2b291", "version": 3, "template_name": "PA", "has_terrace_units": true}, "generated_at": "2026-06-01T11:17:10.830Z"}	draft	\N	2026-06-01 16:47:10.831235+05:30	2026-06-01 16:47:10.831235+05:30
da189503-0d35-47ea-bb9b-874c1774cad9	125a40a1-6d67-4f52-b758-41b7b1f51dc5	77	543	\N	QT-2026-00008	Manthan	2026-06-26	285000.00	180.00	150.00	\N	\N	\N	344200.00	{"unit": {"id": 543, "total_area": 150, "basic_price": 285000, "unit_number": "A104", "price_per_unit": 1900, "carpet_area_sqft": 180, "super_builtup_area_sqft": 150}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 285000, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "4175e47f-942b-4f68-bb8a-534dd5812082", "label": "GST", "value": 12, "amount": 34200, "sort_order": 0, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "76f23e6f-4557-4390-91b3-ff6e792f8811", "label": "Advocate Fees", "value": 25000, "amount": 25000, "sort_order": 1, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 344200, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 344200}, "template": {"id": "125a40a1-6d67-4f52-b758-41b7b1f51dc5", "version": 1, "template_name": "H", "has_terrace_units": false}, "generated_at": "2026-06-26T10:36:06.126Z"}	draft	\N	2026-06-26 16:06:06.127238+05:30	2026-06-26 16:06:06.127238+05:30
d3777346-7fb9-4896-abd1-b7599bafed8a	125a40a1-6d67-4f52-b758-41b7b1f51dc5	77	543	\N	QT-2026-00009	Manthan	2026-06-26	285000.00	180.00	150.00	\N	\N	\N	344200.00	{"unit": {"id": 543, "total_area": 150, "basic_price": 285000, "unit_number": "A104", "price_per_unit": 1900, "carpet_area_sqft": 180, "super_builtup_area_sqft": 150}, "items": [{"id": "basic_price", "label": "Total Basic Price", "value": null, "amount": 285000, "sort_order": -1, "calculation_type": "base_auto"}, {"id": "4175e47f-942b-4f68-bb8a-534dd5812082", "label": "GST", "value": 12, "amount": 34200, "sort_order": 0, "is_optional": false, "calculation_type": "percent_of_basic_price"}, {"id": "76f23e6f-4557-4390-91b3-ff6e792f8811", "label": "Advocate Fees", "value": 25000, "amount": 25000, "sort_order": 1, "is_optional": false, "calculation_type": "fixed_amount"}, {"id": "grand_total", "label": "Grand Total", "value": null, "amount": 344200, "sort_order": 999999, "calculation_type": "sum_auto"}], "totals": {"grand_total": 344200}, "template": {"id": "125a40a1-6d67-4f52-b758-41b7b1f51dc5", "version": 1, "template_name": "H", "has_terrace_units": false}, "generated_at": "2026-06-26T10:36:16.252Z"}	draft	\N	2026-06-26 16:06:16.253799+05:30	2026-06-26 16:06:16.253799+05:30
\.


--
-- Data for Name: roles_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_permissions (id, role_name, permissions, status, created_at, updated_at, deleted_at) FROM stdin;
459fd983-2f99-4763-bc7f-e3ef84fda339	admin	{"admin": ["view_leads", "create_leads", "assign_leads", "view_projects", "create_projects", "manage_project", "edit_projects", "delete_projects", "create_users", "view_reports", "export_reports", "manage_users", "view_followups", "view_settings", "view_tasks", "import_leads", "import_projects", "import_users", "export_leads", "export_projects", "export_users", "manage_lead_types", "create_lead_types", "view_roles", "update_roles", "create_roles", "delete_roles"]}	t	2025-09-04 10:07:12.198338+05:30	\N	\N
b5b0028d-9146-4c0b-a85a-3b7bcdfe0f2b	aryanTest	{"aryanTest": ["view_leads", "view_projects", "create_users", "manage_users", "update_roles", "create_roles", "view_tasks"]}	t	2025-09-04 11:22:28.673887+05:30	\N	2025-09-04 11:22:35.519116+05:30
d4d9bef3-1005-4df1-a60e-4da7af5d86aa	helloAryan	{"helloAryan": ["view_leads", "view_projects", "view_reports", "view_followups", "view_settings", "view_roles"]}	t	2025-09-04 15:52:16.26776+05:30	2025-09-04 16:17:38.627008+05:30	2025-09-05 15:13:24.144641+05:30
36895622-4a36-4ef2-bb43-8d000fa63bf4	yathu	{"yathu": ["view_leads", "view_projects", "create_leads", "create_projects", "view_roles", "create_lead_types", "view_reports"]}	t	2025-09-05 15:24:21.587661+05:30	2025-09-05 15:24:27.909928+05:30	2025-09-05 15:24:30.896297+05:30
ec2a7e6c-592e-4bfd-9652-3246a32ed94b	MSDhnoni	{"MSDhnoni": ["view_leads", "view_projects", "create_projects", "create_leads", "create_users", "view_reports"]}	t	2025-09-05 15:25:02.987497+05:30	2025-09-05 15:25:41.638887+05:30	2025-09-05 15:30:14.155807+05:30
a498fcfa-bae2-4a99-a48d-ca09dde2a8e9	Testr	{"Testr": ["view_leads"]}	t	2025-09-20 17:34:51.885562+05:30	2025-09-20 17:35:27.932212+05:30	2025-09-20 17:35:41.070749+05:30
1838d860-8270-4e74-bdc8-fe60be8d9b6e	sales	{"sales": ["view_leads", "create_leads", "assign_leads", "import_leads", "view_projects", "view_followups", "export_leads"]}	t	2025-09-22 10:11:26.715864+05:30	2025-12-04 09:25:43.349278+05:30	\N
22feac6a-3aa4-438a-bbe0-176a6c62d75c	aryanTest2	{"aryanTest2": ["view_reports", "view_projects", "create_leads", "assign_leads", "create_users", "manage_users", "edit_projects", "manage_project", "view_followups", "view_settings", "view_tasks", "create_roles", "create_lead_types", "view_leads", "import_leads"]}	t	2025-09-04 11:23:39.694799+05:30	2025-12-04 15:40:22.212799+05:30	\N
\.


--
-- Data for Name: task_activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_activity_log (id, task_id, user_id, user_name, action, field_name, old_value, new_value, created_at) FROM stdin;
1	8	1c46541d-18ed-40fa-ad80-6c900111e816	User	created	\N	\N	Hello Aryan	2026-06-03 15:36:05.810252+05:30
2	2	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	completed	2026-06-03 15:40:41.620427+05:30
3	8	955fb036-8a5f-494a-ba3f-20c7622318db	User	status_changed	status	open	in_progress	2026-06-03 15:41:23.351213+05:30
4	8	955fb036-8a5f-494a-ba3f-20c7622318db	User	comment_added	\N	\N	\N	2026-06-03 15:41:32.829267+05:30
5	8	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	in_progress	completed	2026-06-04 10:08:47.184851+05:30
6	1	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	completed	2026-06-04 10:08:57.246998+05:30
7	2	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	completed	on_hold	2026-06-04 10:08:59.287626+05:30
8	2	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	on_hold	completed	2026-06-04 10:09:26.05065+05:30
9	7	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	completed	2026-06-04 10:09:32.613978+05:30
10	6	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	completed	2026-06-04 10:09:34.137323+05:30
11	3	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	on_hold	2026-06-04 10:09:39.419005+05:30
12	4	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	in_progress	2026-06-04 10:09:41.437933+05:30
13	5	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	completed	2026-06-04 10:09:46.289932+05:30
14	3	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	on_hold	completed	2026-06-08 16:30:30.079073+05:30
15	4	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	in_progress	open	2026-06-08 16:30:31.936528+05:30
16	4	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	completed	2026-06-08 16:30:33.649777+05:30
17	2	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	completed	open	2026-06-24 11:18:32.444522+05:30
18	1	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	completed	in_progress	2026-06-24 11:18:33.491112+05:30
19	4	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	completed	on_hold	2026-06-24 11:18:34.300799+05:30
20	3	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	completed	in_progress	2026-06-24 11:18:35.395972+05:30
21	8	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	completed	in_progress	2026-06-24 11:18:36.462301+05:30
22	2	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	open	in_progress	2026-06-24 11:18:38.716457+05:30
23	1	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	in_progress	open	2026-06-24 16:36:48.19699+05:30
24	3	1c46541d-18ed-40fa-ad80-6c900111e816	User	status_changed	status	in_progress	on_hold	2026-06-24 16:36:50.508287+05:30
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_comments (id, task_id, user_id, user_name, body, created_at) FROM stdin;
1	8	955fb036-8a5f-494a-ba3f-20c7622318db	User	Working	2026-06-03 15:41:32.824681+05:30
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, due_on, assignees, remark, priority, document, created_by, project_id, created_at, updated_at, deleted_at, lead_id, status, due_time, reminder_at, association_type) FROM stdin;
7	Test	\N	\N	{b048f034-eace-484e-bae7-9a91b223975f}	\N	medium	\N	1c46541d-18ed-40fa-ad80-6c900111e816	5	2025-09-12 10:37:06.507296	2026-06-04 10:09:32.613978	\N	\N	completed	\N	\N	standalone
6	Test 4	Hello Test 4	2025-09-09 14:16:00+05:30	{b048f034-eace-484e-bae7-9a91b223975f,4dd42889-b1e8-45e1-a180-aa3ea9007dd1}	Hello Test 4	medium	\N	1c46541d-18ed-40fa-ad80-6c900111e816	1	2025-09-08 14:17:09.630727	2026-06-04 10:09:34.137323	\N	\N	completed	\N	\N	standalone
5	Test-8	Hello	2025-09-13 16:22:00+05:30	{b048f034-eace-484e-bae7-9a91b223975f}	Do it now	high	\N	1c46541d-18ed-40fa-ad80-6c900111e816	1	2025-09-06 16:22:46.680071	2026-06-04 10:09:46.289932	\N	\N	completed	\N	\N	standalone
4	Test5	hello	2025-08-29 15:51:00+05:30	{b048f034-eace-484e-bae7-9a91b223975f,a978e67d-5393-43a4-989c-374a9f47495c}	Hello	low	\N	1c46541d-18ed-40fa-ad80-6c900111e816	4	2025-08-25 15:50:03.679292	2026-06-24 11:18:34.300799	\N	\N	on_hold	\N	\N	standalone
8	Hello Aryan	hello aryan 	2026-06-04 09:00:00+05:30	{1c46541d-18ed-40fa-ad80-6c900111e816,047cbd62-bd78-4e42-be1c-72395edaf057,955fb036-8a5f-494a-ba3f-20c7622318db}	Do it fast 	high	\N	1c46541d-18ed-40fa-ad80-6c900111e816	\N	2026-06-03 15:36:05.810252	2026-06-24 11:18:36.462301	\N	\N	in_progress	09:00:00	2026-06-03 17:38:00+05:30	standalone
2	Test-2	HelloTest2	2025-08-22 11:09:00+05:30	{b048f034-eace-484e-bae7-9a91b223975f,a978e67d-5393-43a4-989c-374a9f47495c}	Please do this.	medium	\N	1c46541d-18ed-40fa-ad80-6c900111e816	14	2025-08-20 11:09:58.137693	2026-06-24 11:18:38.716457	\N	\N	in_progress	\N	\N	standalone
1	Sample Project Task with UUIDs	A task to test UUID-based user assignments for project ID 14.	2025-08-25 19:32:00+05:30	{b048f034-eace-484e-bae7-9a91b223975f,1167ea80-20d8-4553-99ca-8b5a73af4a89}	Test remark with UUID support.	high	\N	1c46541d-18ed-40fa-ad80-6c900111e816	14	2025-08-19 14:37:59.461017	2026-06-24 16:36:48.19699	\N	\N	open	\N	\N	standalone
3	Test-3	Hello 3	2025-08-27 16:18:00+05:30	{b048f034-eace-484e-bae7-9a91b223975f,a978e67d-5393-43a4-989c-374a9f47495c}	Test 3	low	\N	1c46541d-18ed-40fa-ad80-6c900111e816	5	2025-08-22 16:19:16.902299	2026-06-24 16:36:50.508287	\N	\N	on_hold	\N	\N	standalone
\.


--
-- Data for Name: unit_pricing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unit_pricing (id, project_id, unit_id, base_rate_per_sqft, total_base_amount, floor_rise_per_floor, plc_amount, amenities_charges, parking_charges, gst_percentage, other_charges, discount_amount, effective_from, effective_to, remarks, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: unit_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unit_types (id, project_id, unit_name, configuration, carpet_area_sqft, builtup_area_sqft, super_builtup_area_sqft, balcony_area_sqft, bedroom_count, bathroom_count, description, created_at, updated_at, deleted_at, label, is_active) FROM stdin;
1	72	Mini	\N	5000.00	\N	2010.00	\N	\N	\N	\N	2026-01-12 14:26:12.919171+05:30	2026-01-12 14:26:12.919171+05:30	\N	\N	t
2	72	King Size	\N	1200.00	\N	4400.00	\N	\N	\N	\N	2026-01-12 14:28:47.767483+05:30	2026-01-12 14:28:47.767483+05:30	\N	\N	t
3	72	Store	\N	1500.00	\N	4400.00	\N	\N	\N	\N	2026-01-12 14:29:41.679154+05:30	2026-01-12 14:29:41.679154+05:30	\N	\N	t
4	72	Mini Store	\N	18000.00	\N	1818.00	\N	\N	\N	\N	2026-02-11 16:16:27.428246+05:30	2026-02-11 16:16:27.428246+05:30	\N	\N	t
6	74	A101	\N	8999.00	\N	8999.00	\N	\N	\N	\N	2026-05-27 17:32:18.590454+05:30	2026-05-27 17:32:18.590454+05:30	\N	\N	t
8	73	A101	\N	85.00	\N	100.00	\N	\N	\N	\N	2026-05-28 15:11:30.602115+05:30	2026-05-28 15:11:30.602115+05:30	\N	\N	t
11	69	FLAT	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-10 16:36:24.947821+05:30	2026-06-10 16:36:24.947821+05:30	\N	\N	t
13	71	FLAT	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-10 17:10:17.358191+05:30	2026-06-10 17:10:17.358191+05:30	\N	\N	t
7	75	B-903	\N	210.00	\N	90.00	\N	\N	\N	\N	2026-05-27 17:43:55.80828+05:30	2026-05-27 17:43:55.80828+05:30	\N	\N	f
5	75	A101	\N	8999.00	\N	8999.00	\N	\N	\N	\N	2026-05-27 14:25:29.901316+05:30	2026-05-27 14:25:29.901316+05:30	\N	\N	f
12	75	FLAT	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-10 17:04:16.198566+05:30	2026-06-10 17:04:16.198566+05:30	\N	\N	f
14	75	1_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 14:42:45.522661+05:30	2026-06-11 14:42:45.522661+05:30	\N	1 BHK	f
15	75	3_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 14:42:47.071709+05:30	2026-06-11 14:42:47.071709+05:30	\N	3 BHK	f
9	75	OFFICE	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-01 16:45:49.378746+05:30	2026-06-01 16:45:49.378746+05:30	\N	\N	f
10	75	SHOP	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-01 16:45:49.41787+05:30	2026-06-01 16:45:49.41787+05:30	\N	\N	f
16	75	1_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 14:42:55.236537+05:30	2026-06-11 14:42:55.236537+05:30	\N	1 BHK	t
17	75	2BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 14:43:03.816118+05:30	2026-06-11 14:43:03.816118+05:30	\N	2Bhk	t
18	75	25BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 14:43:11.888222+05:30	2026-06-11 14:43:11.888222+05:30	\N	2.5Bhk	t
23	75	VILLA	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 16:13:37.68224+05:30	2026-06-11 16:13:37.68224+05:30	\N	\N	t
24	75	ROW_HOUSE	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-11 16:13:37.68224+05:30	2026-06-11 16:13:37.68224+05:30	\N	\N	t
32	76	1_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 15:45:07.677337+05:30	2026-06-15 15:45:07.677337+05:30	\N	1 BHK	t
33	76	3_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 15:45:08.700661+05:30	2026-06-15 15:45:08.700661+05:30	\N	3 BHK	t
34	76	2_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 15:45:16.974072+05:30	2026-06-15 15:45:16.974072+05:30	\N	2 BHK	t
36	77	1_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 16:25:16.962374+05:30	2026-06-15 16:25:16.962374+05:30	\N	1 BHK	t
38	77	2_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 16:25:18.700834+05:30	2026-06-15 16:25:18.700834+05:30	\N	2 BHK	t
35	77	FLAT	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 16:21:07.679262+05:30	2026-06-15 16:21:07.679262+05:30	\N	\N	f
39	77	OFFICE	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 16:26:00.981689+05:30	2026-06-15 16:26:00.981689+05:30	\N	Office	t
37	77	3_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 16:25:18.063596+05:30	2026-06-15 16:25:18.063596+05:30	\N	3 BHK	f
40	78	FLAT	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-15 18:28:06.984723+05:30	2026-06-15 18:28:06.984723+05:30	\N	\N	t
44	80	1_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-20 09:46:19.365406+05:30	2026-06-20 09:46:19.365406+05:30	\N	1 BHK	t
45	80	3_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-20 09:46:19.818723+05:30	2026-06-20 09:46:19.818723+05:30	\N	3 BHK	t
46	80	2_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-20 09:46:21.385377+05:30	2026-06-20 09:46:21.385377+05:30	\N	2 BHK	t
47	79	2_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-26 16:07:53.734949+05:30	2026-06-26 16:07:53.734949+05:30	\N	2 BHK	t
48	79	3_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-26 16:07:54.478582+05:30	2026-06-26 16:07:54.478582+05:30	\N	3 BHK	t
49	79	1_BHK	\N	1.00	\N	\N	\N	\N	\N	\N	2026-06-26 16:07:54.887413+05:30	2026-06-26 16:07:54.887413+05:30	\N	1 BHK	t
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, role, assigned_by, assigned_at, created_at, deleted_at, user_id) FROM stdin;
bc4b79c1-b856-4175-8601-85846b4afdaf	admin	system	2025-08-28 16:00:00+05:30	2025-08-28 16:00:00+05:30	\N	\N
644a0e5e-1477-407b-af97-b93cd6005686	manager	system	2025-08-28 16:00:00+05:30	2025-08-28 16:00:00+05:30	\N	\N
d39e8078-8269-4926-8a7e-eb945f2d51b7	agent	system	2025-08-28 16:00:00+05:30	2025-08-28 16:00:00+05:30	\N	\N
c4c1cad8-f9be-42fb-b2bc-ad36ba171425	user(sales)	system	2025-08-28 16:00:00+05:30	2025-08-28 16:00:00+05:30	\N	\N
7d470769-aee9-48bc-8c70-11a1e336a730	test_role	system	2025-08-28 16:30:00+05:30	2025-08-28 16:30:00+05:30	\N	\N
3ecfc53a-8f35-4ece-96d4-367cea731284	admin	admin	2025-09-02 14:43:06.337377+05:30	2025-09-02 14:43:06.337377+05:30	\N	ff80f443-a041-45d6-9ba5-d972d321ae9a
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, phone, is_active, created_at, updated_at, last_login, deleted_at, photo, roles_permissions_id) FROM stdin;
ece9b316-d32c-4448-85ff-da0becf2720d	uidesigner.intelliworkz@gmail.com	$2b$10$bUmpNMMR44I8YqXbDUrBFOYMXPl7vfbv5Lv8AQtzvpahdKOLoihIu	ui/ux	1234567890	t	2025-06-27 12:28:53.049783+05:30	2025-06-27 12:28:53.049783+05:30	\N	2025-06-27 17:29:41.783716+05:30	\N	\N
9a03a877-a53d-4c7b-bfb2-18673b29d9d3	uidesigner1.intelliworkz@gmail.com	$2b$10$zl5GbirSqlr52Z/4wcO8eeS6bA7kvHcxYcTTqPKSHZhtYiVD3xdUC	UI - UX	906201130	f	2025-06-27 17:32:05.327293+05:30	2025-06-27 17:32:13.804708+05:30	\N	2025-06-27 17:36:35.052122+05:30	\N	\N
870702eb-86c5-435d-9b50-f16baa826733	testing@gmail.com	$2b$10$C2Eb//9VxUt9XBN.AWin5u9NBnqr2QGJoIaL7vP5nMeyeEnMDU01m	User Management Testing	906201130	f	2025-06-28 16:00:07.504122+05:30	2025-07-03 13:43:48.864828+05:30	\N	2025-07-09 18:28:42.959194+05:30	\N	\N
86da1681-109e-48a2-9939-ec2f9ed53b4c	iw@gmail.com	$2b$10$eNPu06K0hjuq5DK8LqbgF.5NQ05APR2g5hR/7uQbIWyicgURefTTO	IW Team	9427801299	t	2025-07-11 16:52:31.846839+05:30	2025-07-11 18:08:15.957737+05:30	\N	2025-07-11 18:16:04.015891+05:30	\N	\N
ee0d0014-4ea5-493d-b921-fc6037bed229	htmldesigner.intelliworkz@gmail.com	$2b$10$HOqaD8Nn.qgbGH/pLk7ZreER4Oq77dGlfkKHfmKEy1SfYzEV.nAgS	Ravi	9427801299	f	2025-07-01 15:13:58.962472+05:30	2025-07-01 15:13:58.962472+05:30	\N	2025-07-01 15:14:05.362534+05:30	\N	\N
e0c6aa02-1e4e-4a7d-9335-e7bb7f509d1d	agent@demo.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	Agent User	9427801299	f	2025-06-07 15:55:25.16695+05:30	2025-07-10 10:23:50.342415+05:30	\N	2025-07-10 10:26:09.687134+05:30	\N	\N
e76afff7-2c6c-4d60-8957-9f01149333b9	webdeveloper3.intelliworkzd@gmail.com	$2b$10$82T9xMTT13XBf/mrKV/CmOzbC0sQgnn347/7pAoabj3vvjzgAaW4m	Yash	1906201130	t	2025-06-27 18:04:31.646913+05:30	2025-06-27 18:04:31.646913+05:30	\N	2025-06-27 18:10:41.246323+05:30	\N	\N
c18e5d01-615b-4dc7-9c77-e5bb18f05f15	manager@demo.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	Manager Testing	9062011367	t	2025-06-07 15:55:25.16695+05:30	2025-06-26 18:05:23.688542+05:30	\N	2025-06-28 15:59:47.571662+05:30	\N	\N
623d98c0-1414-4ae4-a7f7-a0fe1aa40e78	webdeveloper.intelliworkz@gmail.com	$2b$10$17z7AD1Y1zWuATUd/idX1uw07U1..eK.44HkbJ8eOubzKBq4a0.ta	yamini	90620113032	f	2025-06-27 10:27:42.935119+05:30	2025-06-27 18:03:45.861724+05:30	\N	2025-06-27 18:03:58.785677+05:30	\N	\N
ce7e1c46-1db1-41c3-95b1-d342cf245c3e	webdeveloper11.intelliworkz@gmail.com	mbszq3wfhilvky	Agam Tyagi	90620111233	f	2025-06-12 11:51:13.419783+05:30	2025-06-28 15:43:44.696725+05:30	\N	2025-06-28 16:10:03.592826+05:30	\N	\N
a24d4da3-6b63-43f2-bc5a-e21dd7a9e9d7	testing1@gmail.com	$2b$10$7mudIaM4S/1KAXdi43PxD.o4/eVc4.ar7yDMozRHLIVyBMpm226EC	test1	1906201130	f	2025-07-10 14:35:12.312277+05:30	2025-07-10 14:39:06.744469+05:30	\N	2025-07-10 14:39:12.883708+05:30	\N	\N
4dd42889-b1e8-45e1-a180-aa3ea9007dd1	jyro@mailinator.com	$2b$10$0Ypw0wRB26X9ql8rL0SiiePiNAusYP6R9r4tKeZTn0RoOiVMC2bN.	Jesse Haney	+1 (523) 67	t	2025-07-11 18:35:27.475514+05:30	2025-07-14 17:13:54.356076+05:30	\N	\N	\N	\N
7f98566a-74a6-416e-b381-41a38fc8664e	jeet@intelliworkz.tech	$2b$10$ThUdwnJPUVkwuERwvXxJYuxKhRqx8mJm3Bl3OgOlun3Ox1yE69oD6	Jeet Thaker	9427801299	f	2025-06-10 15:05:45.72947+05:30	2025-07-26 17:54:51.114649+05:30	\N	\N	image2.png	\N
1167ea80-20d8-4553-99ca-8b5a73af4a89	webdeveloper3.intelliworkz@gmail.com	$2b$10$gce.FiCxad1KyMp2v.47g.71IljnJAb7gE1LPcLCsoXWkChMEjniS	Yamini Patel	7894563334	f	2025-06-26 18:20:26.6196+05:30	2025-07-26 15:19:15.685703+05:30	2025-07-12 12:39:10.164226+05:30	\N	image4.png	\N
9004dbf4-c014-4679-a399-f5b64163c005	designer1.intelliworkz@gmail.com	$2b$10$OtApDdSez1S9HcGYAdJE1e1IXyexOiBjDBvoQrHgILXGrf3ObOUK2	Kinal Ba	9427801299	t	2025-07-12 17:00:45.304645+05:30	2025-07-26 15:19:33.993927+05:30	2025-07-12 17:53:53.092349+05:30	\N	pr-1.webp	\N
d166f449-18d1-44cf-ad34-a95be7f1cc25	davdabuilder@example.com	$2b$10$U54DX9z6SoMQ03DbPCdPV..1oE5Xk7yKA8h86e4y9N/hDrHRCF2Ii	Davada Infrastructure	+1234567890	f	2025-07-26 15:25:00.181888+05:30	2025-07-26 15:25:00.181888+05:30	\N	\N	portfolio_1-3.webp	\N
047cbd62-bd78-4e42-be1c-72395edaf057	aryaniw@gamil.com	$2b$10$0P8SCGcrSQCigTtLZtj04u1orBjfIHtuyfW/wUG0cY8ouoTd6Yz5S	Aryan IW	9876543210	t	2025-09-22 10:12:29.672024+05:30	2025-12-17 14:32:00.813908+05:30	2025-12-17 16:23:41.65942+05:30	\N	\N	459fd983-2f99-4763-bc7f-e3ef84fda339
8460b624-7121-43ae-b5a4-2968c9f254b2	anmol@gmail.com	$2b$10$nABkwKJFMrg7ARSvA6v7juukWTRr1vGDBezOH1OjXBBJeqm/UPCby	Anmol	9876543210	t	2025-09-04 12:21:15.593876+05:30	2025-09-10 17:02:47.730818+05:30	2025-09-17 17:09:16.314919+05:30	2025-09-17 16:25:38.875597+05:30	\N	22feac6a-3aa4-438a-bbe0-176a6c62d75c
9c42e956-ad41-47aa-94c9-3ad956dd5ccb	team@intelliworkz.tech	$2b$10$sre1XIKRKkNmi1ObENXRDu7PK4W54uPJycwDkWDxeBSutZX/.mNjS	iw	9427801299	t	2025-07-11 18:32:33.659622+05:30	2025-09-02 13:07:31.449174+05:30	\N	\N	image (6).png	\N
ff80f443-a041-45d6-9ba5-d972d321ae9a	govind@gmail.com	$2b$10$/rFk58YmD55Txx84dwAhXupzN80GtxNVent7j5/s7K/6KCRO4UAfi	Govind P	9876543210	f	2025-09-02 12:33:43.674178+05:30	2025-09-18 15:27:23.124891+05:30	\N	\N	\N	22feac6a-3aa4-438a-bbe0-176a6c62d75c
a978e67d-5393-43a4-989c-374a9f47495c	yatharth@intelliworkz.com	$2b$10$ZNwbpX.wU5f6bfifr.sfK.jTLxTe0LemXPbUJWjK3Pgv7CMidenlO	Yatharth	90620113067	f	2025-06-26 18:24:25.600138+05:30	2025-09-08 11:12:49.656965+05:30	\N	\N	pr-1-1.webp	459fd983-2f99-4763-bc7f-e3ef84fda339
9b9eae0e-1b46-40e2-80c0-a48f23a05fa3	a83	$2b$10$.eY5KIrKnC/1VAwbDqABiO92Qg1o4eW/.pUusgIa7fdBuxAKN.73W	1234	abc	t	2025-09-04 12:29:29.920991+05:30	2025-09-17 16:22:25.656019+05:30	2025-09-04 13:57:29.70299+05:30	\N	\N	22feac6a-3aa4-438a-bbe0-176a6c62d75c
a24b33ca-b4b9-4e21-8439-a7544983ef82	harsh@gmail.xom	$2b$10$q3NyiK0m0WKf42c3EXrwPuuoxq67MTQnUCZJIWR2Nz3WNKm.QlVKm	Harsh G	9876543210	t	2025-09-10 16:11:35.649934+05:30	2025-09-10 17:02:08.770306+05:30	2025-09-10 17:01:14.585545+05:30	2025-09-10 17:10:28.073757+05:30	\N	459fd983-2f99-4763-bc7f-e3ef84fda339
10ddcee7-5ea1-4012-ac4f-1c667442f89d	shreya@hotmail.com	$2b$10$OfutIza0Lcb6GAzAQk8GhO6xfz/gznxkuRARh3Z8Ts6T2G4i9n6cu	Shreya Rathod	1234567890	t	2025-09-18 11:09:50.425521+05:30	2025-09-18 11:25:39.120253+05:30	2025-09-18 14:03:25.148221+05:30	2025-09-18 14:44:57.963766+05:30	\N	22feac6a-3aa4-438a-bbe0-176a6c62d75c
955fb036-8a5f-494a-ba3f-20c7622318db	aryanpandey.ce@gmail.com	$2b$10$WlkLzHeYrS1PfNg8KAJDgOC/AhpoJUkCnCf.HyOMw2d8eTA/EnT2K	Inzy	9876543210	t	2025-10-30 11:40:18.812897+05:30	2025-12-10 16:33:41.139962+05:30	2026-06-03 15:41:14.884521+05:30	\N	\N	1838d860-8270-4e74-bdc8-fe60be8d9b6e
764a6360-57ee-49f6-99b8-ae0465037b7d	testin1809@gmail.com	$2b$10$YqR6HHPO8NtEsO2PZ15dNe2vhD3bXHd7zzY8KZtAjkrORFkAFIDy6	test today	9876543210	t	2025-09-18 16:52:20.313181+05:30	2025-09-20 17:34:15.543019+05:30	2025-09-18 16:56:30.156102+05:30	\N	\N	22feac6a-3aa4-438a-bbe0-176a6c62d75c
b048f034-eace-484e-bae7-9a91b223975f	aryan@gmail.com	$2b$10$f4dnhrosdkf4pOqCe6yftOWjEnFFyrAZHHyktdljVW5m2CCB4mLqu	Aryan Pandey	9876543210	t	2025-08-05 11:01:22.677554+05:30	2025-08-25 14:58:10.95652+05:30	2026-06-03 12:01:59.688003+05:30	\N	\N	\N
e90aec1c-80b3-48b6-b073-8566f137235b	developer12.intelliworkz@gmail.com	$2b$10$6pJ8xiFA5vGwpH2Ty6wr2.xdSdy0nye8NopaLmKQhPGzAFD24OQ.u	Manthan Panchal	9062011309	t	2026-06-25 12:43:13.186818+05:30	2026-06-25 14:36:57.807553+05:30	2026-06-25 14:47:42.639475+05:30	\N	\N	459fd983-2f99-4763-bc7f-e3ef84fda339
1c46541d-18ed-40fa-ad80-6c900111e816	arvind@intelliworkz.tech	$2b$10$JLijlRjpAjiJ2Mzv4BpT9OO01Jet4IM9zTvOr6rg44RDowf.lWNEq	Arvind Rajput	9427801299	t	2025-06-10 15:07:21.689353+05:30	2025-10-16 12:11:51.676733+05:30	2026-06-26 15:04:39.745327+05:30	\N	cropped-image.jpg	459fd983-2f99-4763-bc7f-e3ef84fda339
\.


--
-- Name: amenity_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.amenity_master_id_seq', 12, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 9, true);


--
-- Name: folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.folders_id_seq', 22, true);


--
-- Name: lead_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_activities_id_seq', 66, true);


--
-- Name: lead_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_documents_id_seq', 25, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 5813, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: otp_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_records_id_seq', 21, true);


--
-- Name: project_amenities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_amenities_id_seq', 42, true);


--
-- Name: project_brochure_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_brochure_files_id_seq', 1, false);


--
-- Name: project_brochures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_brochures_id_seq', 63, true);


--
-- Name: project_floors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_floors_id_seq', 44, true);


--
-- Name: project_hierarchy_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_hierarchy_nodes_id_seq', 653, true);


--
-- Name: project_price_quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_price_quotes_id_seq', 63, true);


--
-- Name: project_specifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_specifications_id_seq', 79, true);


--
-- Name: project_towers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_towers_id_seq', 19, true);


--
-- Name: project_units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_units_id_seq', 687, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 80, true);


--
-- Name: task_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_activity_log_id_seq', 24, true);


--
-- Name: task_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_comments_id_seq', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 8, true);


--
-- Name: unit_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unit_pricing_id_seq', 1, false);


--
-- Name: unit_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unit_types_id_seq', 49, true);


--
-- Name: amenity_master amenity_master_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_master
    ADD CONSTRAINT amenity_master_name_key UNIQUE (name);


--
-- Name: amenity_master amenity_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_master
    ADD CONSTRAINT amenity_master_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_addresses company_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses
    ADD CONSTRAINT company_addresses_pkey PRIMARY KEY (id);


--
-- Name: company_contacts company_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_contacts
    ADD CONSTRAINT company_contacts_pkey PRIMARY KEY (id);


--
-- Name: company_dlt_details company_dlt_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_dlt_details
    ADD CONSTRAINT company_dlt_details_pkey PRIMARY KEY (id);


--
-- Name: company_email_footers company_email_footers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_email_footers
    ADD CONSTRAINT company_email_footers_pkey PRIMARY KEY (id);


--
-- Name: company_marketing_domains company_marketing_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_marketing_domains
    ADD CONSTRAINT company_marketing_domains_pkey PRIMARY KEY (id);


--
-- Name: company_social_urls company_social_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_social_urls
    ADD CONSTRAINT company_social_urls_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_sender_id_receiver_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: folders folders_name_parent_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_name_parent_id_user_id_key UNIQUE (name, parent_id, user_id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_assignment_history lead_assignment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignment_history
    ADD CONSTRAINT lead_assignment_history_pkey PRIMARY KEY (id);


--
-- Name: lead_documents lead_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_documents
    ADD CONSTRAINT lead_documents_pkey PRIMARY KEY (id);


--
-- Name: lead_types lead_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_types
    ADD CONSTRAINT lead_types_pkey PRIMARY KEY (id);


--
-- Name: leads leads_external_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_external_id_key UNIQUE (external_id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: message_reads message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (message_id, user_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_records otp_records_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_records
    ADD CONSTRAINT otp_records_email_key UNIQUE (email);


--
-- Name: otp_records otp_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_records
    ADD CONSTRAINT otp_records_pkey PRIMARY KEY (id);


--
-- Name: project_amenities project_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_amenities
    ADD CONSTRAINT project_amenities_pkey PRIMARY KEY (id);


--
-- Name: project_amenities project_amenities_project_id_amenity_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_amenities
    ADD CONSTRAINT project_amenities_project_id_amenity_id_key UNIQUE (project_id, amenity_id);


--
-- Name: project_brochure_files project_brochure_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_brochure_files
    ADD CONSTRAINT project_brochure_files_pkey PRIMARY KEY (id);


--
-- Name: project_brochures project_brochures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_brochures
    ADD CONSTRAINT project_brochures_pkey PRIMARY KEY (id);


--
-- Name: project_floors project_floors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_floors
    ADD CONSTRAINT project_floors_pkey PRIMARY KEY (id);


--
-- Name: project_floors project_floors_tower_id_floor_number_deleted_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_floors
    ADD CONSTRAINT project_floors_tower_id_floor_number_deleted_at_key UNIQUE (tower_id, floor_number, deleted_at);


--
-- Name: project_hierarchy_nodes project_hierarchy_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_hierarchy_nodes
    ADD CONSTRAINT project_hierarchy_nodes_pkey PRIMARY KEY (id);


--
-- Name: project_hierarchy_nodes project_hierarchy_nodes_project_id_parent_id_name_deleted_a_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_hierarchy_nodes
    ADD CONSTRAINT project_hierarchy_nodes_project_id_parent_id_name_deleted_a_key UNIQUE (project_id, parent_id, name, deleted_at);


--
-- Name: project_price_quotes project_price_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_price_quotes
    ADD CONSTRAINT project_price_quotes_pkey PRIMARY KEY (id);


--
-- Name: project_specifications project_specifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_specifications
    ADD CONSTRAINT project_specifications_pkey PRIMARY KEY (id);


--
-- Name: project_towers project_towers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_towers
    ADD CONSTRAINT project_towers_pkey PRIMARY KEY (id);


--
-- Name: project_towers project_towers_project_id_tower_name_deleted_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_towers
    ADD CONSTRAINT project_towers_project_id_tower_name_deleted_at_key UNIQUE (project_id, tower_name, deleted_at);


--
-- Name: project_units project_units_floor_id_unit_number_deleted_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_floor_id_unit_number_deleted_at_key UNIQUE (floor_id, unit_number, deleted_at);


--
-- Name: project_units project_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_pkey PRIMARY KEY (id);


--
-- Name: projects_backup projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects_backup
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey1 PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: quotation_number_sequences quotation_number_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_number_sequences
    ADD CONSTRAINT quotation_number_sequences_pkey PRIMARY KEY (year);


--
-- Name: quotation_particulars quotation_particulars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_particulars
    ADD CONSTRAINT quotation_particulars_pkey PRIMARY KEY (id);


--
-- Name: quotation_templates quotation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_quotation_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_quotation_number_key UNIQUE (quotation_number);


--
-- Name: roles_permissions roles_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permissions
    ADD CONSTRAINT roles_permissions_pkey PRIMARY KEY (id);


--
-- Name: task_activity_log task_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_activity_log
    ADD CONSTRAINT task_activity_log_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: roles_permissions unique_role_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permissions
    ADD CONSTRAINT unique_role_name UNIQUE (role_name);


--
-- Name: user_roles unique_user_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT unique_user_role UNIQUE (user_id, role);


--
-- Name: unit_pricing unit_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_pricing
    ADD CONSTRAINT unit_pricing_pkey PRIMARY KEY (id);


--
-- Name: unit_types unit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types
    ADD CONSTRAINT unit_types_pkey PRIMARY KEY (id);


--
-- Name: unit_types unit_types_project_id_unit_name_deleted_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types
    ADD CONSTRAINT unit_types_project_id_unit_name_deleted_at_key UNIQUE (project_id, unit_name, deleted_at);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_companies_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_deleted_at ON public.companies USING btree (deleted_at);


--
-- Name: idx_company_addresses_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_addresses_company_id ON public.company_addresses USING btree (company_id);


--
-- Name: idx_company_contacts_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_contacts_company_id ON public.company_contacts USING btree (company_id);


--
-- Name: idx_company_dlt_details_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_dlt_details_company_id ON public.company_dlt_details USING btree (company_id);


--
-- Name: idx_company_email_footers_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_email_footers_company_id ON public.company_email_footers USING btree (company_id);


--
-- Name: idx_company_marketing_domains_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_marketing_domains_company_id ON public.company_marketing_domains USING btree (company_id);


--
-- Name: idx_company_social_urls_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_social_urls_company_id ON public.company_social_urls USING btree (company_id);


--
-- Name: idx_contacts_assigned_agent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_assigned_agent ON public.contacts USING btree (assigned_agent_id);


--
-- Name: idx_contacts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_created_at ON public.contacts USING btree (created_at);


--
-- Name: idx_contacts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_status ON public.contacts USING btree (status);


--
-- Name: idx_conversations_participants; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_participants ON public.conversations USING btree (sender_id, receiver_id);


--
-- Name: idx_documents_folder_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_folder_id ON public.documents USING btree (folder_id);


--
-- Name: idx_documents_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_user_id ON public.documents USING btree (user_id);


--
-- Name: idx_folders_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_folders_parent_id ON public.folders USING btree (parent_id);


--
-- Name: idx_folders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_folders_user_id ON public.folders USING btree (user_id);


--
-- Name: idx_follow_ups_assigned_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_assigned_user ON public.follow_ups USING btree (assigned_user_id);


--
-- Name: idx_follow_ups_contact_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_contact_id ON public.follow_ups USING btree (contact_id);


--
-- Name: idx_follow_ups_scheduled_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_scheduled_date ON public.follow_ups USING btree (scheduled_date);


--
-- Name: idx_follow_ups_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_status ON public.follow_ups USING btree (status);


--
-- Name: idx_hierarchy_nodes_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hierarchy_nodes_parent_id ON public.project_hierarchy_nodes USING btree (parent_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_hierarchy_nodes_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hierarchy_nodes_project_id ON public.project_hierarchy_nodes USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_lah_assigned_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lah_assigned_at ON public.lead_assignment_history USING btree (assigned_at);


--
-- Name: idx_lah_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lah_lead_id ON public.lead_assignment_history USING btree (lead_id);


--
-- Name: idx_lah_new_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lah_new_assigned ON public.lead_assignment_history USING btree (new_assigned_to);


--
-- Name: idx_lah_old_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lah_old_assigned ON public.lead_assignment_history USING btree (old_assigned_to);


--
-- Name: idx_lah_open_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lah_open_assignment ON public.lead_assignment_history USING btree (lead_id, new_assigned_to) WHERE (unassigned_at IS NULL);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_project_amenities_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_amenities_project ON public.project_amenities USING btree (project_id);


--
-- Name: idx_project_brochure_files_brochure_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_brochure_files_brochure_id ON public.project_brochure_files USING btree (brochure_id);


--
-- Name: idx_project_brochures_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_brochures_project_id ON public.project_brochures USING btree (project_id);


--
-- Name: idx_project_floors_tower_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_floors_tower_id ON public.project_floors USING btree (tower_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_project_price_quotes_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_price_quotes_project_id ON public.project_price_quotes USING btree (project_id);


--
-- Name: idx_project_specifications_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_specifications_project_id ON public.project_specifications USING btree (project_id);


--
-- Name: idx_project_towers_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_towers_project_id ON public.project_towers USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_project_units_floor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_units_floor_id ON public.project_units USING btree (floor_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_project_units_hierarchy_node_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_units_hierarchy_node_id ON public.project_units USING btree (hierarchy_node_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_project_units_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_units_project_id ON public.project_units USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_project_units_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_units_status ON public.project_units USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_properties_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_project_id ON public.properties USING btree (project_id);


--
-- Name: idx_properties_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_status ON public.properties USING btree (status);


--
-- Name: idx_quotations_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_lead ON public.quotations USING btree (lead_id);


--
-- Name: idx_quotations_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_project ON public.quotations USING btree (project_id);


--
-- Name: idx_quotations_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_unit ON public.quotations USING btree (unit_id);


--
-- Name: idx_tasks_due_on; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_due_on ON public.tasks USING btree (due_on) WHERE (deleted_at IS NULL);


--
-- Name: idx_tasks_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_lead_id ON public.tasks USING btree (lead_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_unit_pricing_effective; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_pricing_effective ON public.unit_pricing USING btree (unit_id, effective_from, effective_to) WHERE (deleted_at IS NULL);


--
-- Name: idx_unit_pricing_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_pricing_unit_id ON public.unit_pricing USING btree (unit_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_unit_types_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_types_project_id ON public.unit_types USING btree (project_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: leads_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX leads_unique_idx ON public.leads USING btree (lower((name)::text), lower((email)::text), phone);


--
-- Name: uniq_accepted_quotation_per_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_accepted_quotation_per_unit ON public.quotations USING btree (unit_id) WHERE ((status)::text = 'accepted'::text);


--
-- Name: uniq_active_quotation_template_per_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_active_quotation_template_per_project ON public.quotation_templates USING btree (project_id) WHERE (is_active = true);


--
-- Name: company_addresses company_addresses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses
    ADD CONSTRAINT company_addresses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_contacts company_contacts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_contacts
    ADD CONSTRAINT company_contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_dlt_details company_dlt_details_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_dlt_details
    ADD CONSTRAINT company_dlt_details_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_email_footers company_email_footers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_email_footers
    ADD CONSTRAINT company_email_footers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_marketing_domains company_marketing_domains_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_marketing_domains
    ADD CONSTRAINT company_marketing_domains_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_social_urls company_social_urls_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_social_urls
    ADD CONSTRAINT company_social_urls_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_assigned_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.users(id);


--
-- Name: contacts contacts_interested_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_interested_property_id_fkey FOREIGN KEY (interested_property_id) REFERENCES public.properties(id);


--
-- Name: conversations conversations_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leads fk_leads_assigned_to; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tasks fk_project; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: users fk_roles_permissions; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_roles_permissions FOREIGN KEY (roles_permissions_id) REFERENCES public.roles_permissions(id) ON DELETE SET NULL;


--
-- Name: folders folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: folders folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id);


--
-- Name: follow_ups follow_ups_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_assignment_history lead_assignment_history_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignment_history
    ADD CONSTRAINT lead_assignment_history_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lead_assignment_history lead_assignment_history_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignment_history
    ADD CONSTRAINT lead_assignment_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_assignment_history lead_assignment_history_new_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignment_history
    ADD CONSTRAINT lead_assignment_history_new_assigned_to_fkey FOREIGN KEY (new_assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lead_assignment_history lead_assignment_history_old_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_assignment_history
    ADD CONSTRAINT lead_assignment_history_old_assigned_to_fkey FOREIGN KEY (old_assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lead_documents lead_documents_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_documents
    ADD CONSTRAINT lead_documents_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads leads_interested_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_interested_project_id_fkey FOREIGN KEY (interested_project_id) REFERENCES public.projects(id);


--
-- Name: message_reads message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_reads message_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_amenities project_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_amenities
    ADD CONSTRAINT project_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenity_master(id) ON DELETE CASCADE;


--
-- Name: project_amenities project_amenities_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_amenities
    ADD CONSTRAINT project_amenities_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_brochure_files project_brochure_files_brochure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_brochure_files
    ADD CONSTRAINT project_brochure_files_brochure_id_fkey FOREIGN KEY (brochure_id) REFERENCES public.project_brochures(id) ON DELETE CASCADE;


--
-- Name: project_brochures project_brochures_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_brochures
    ADD CONSTRAINT project_brochures_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_floors project_floors_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_floors
    ADD CONSTRAINT project_floors_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_floors project_floors_tower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_floors
    ADD CONSTRAINT project_floors_tower_id_fkey FOREIGN KEY (tower_id) REFERENCES public.project_towers(id) ON DELETE CASCADE;


--
-- Name: project_hierarchy_nodes project_hierarchy_nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_hierarchy_nodes
    ADD CONSTRAINT project_hierarchy_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.project_hierarchy_nodes(id) ON DELETE CASCADE;


--
-- Name: project_hierarchy_nodes project_hierarchy_nodes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_hierarchy_nodes
    ADD CONSTRAINT project_hierarchy_nodes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_price_quotes project_price_quotes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_price_quotes
    ADD CONSTRAINT project_price_quotes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_specifications project_specifications_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_specifications
    ADD CONSTRAINT project_specifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_towers project_towers_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_towers
    ADD CONSTRAINT project_towers_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_units project_units_floor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_floor_id_fkey FOREIGN KEY (floor_id) REFERENCES public.project_floors(id) ON DELETE CASCADE;


--
-- Name: project_units project_units_hierarchy_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_hierarchy_node_id_fkey FOREIGN KEY (hierarchy_node_id) REFERENCES public.project_hierarchy_nodes(id) ON DELETE CASCADE;


--
-- Name: project_units project_units_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_units project_units_tower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_tower_id_fkey FOREIGN KEY (tower_id) REFERENCES public.project_towers(id) ON DELETE CASCADE;


--
-- Name: project_units project_units_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_units
    ADD CONSTRAINT project_units_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.unit_types(id) ON DELETE RESTRICT;


--
-- Name: projects_backup projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects_backup
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: quotation_particulars quotation_particulars_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_particulars
    ADD CONSTRAINT quotation_particulars_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.quotation_templates(id) ON DELETE CASCADE;


--
-- Name: quotation_templates quotation_templates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: quotations quotations_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: quotations quotations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: quotations quotations_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.quotation_templates(id) ON DELETE RESTRICT;


--
-- Name: quotations quotations_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.project_units(id) ON DELETE CASCADE;


--
-- Name: task_activity_log task_activity_log_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_activity_log
    ADD CONSTRAINT task_activity_log_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: unit_pricing unit_pricing_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_pricing
    ADD CONSTRAINT unit_pricing_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: unit_pricing unit_pricing_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_pricing
    ADD CONSTRAINT unit_pricing_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.project_units(id) ON DELETE CASCADE;


--
-- Name: unit_types unit_types_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types
    ADD CONSTRAINT unit_types_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: TABLE contacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contacts TO pg_database_owner;


--
-- Name: TABLE follow_ups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.follow_ups TO pg_database_owner;


--
-- Name: TABLE projects_backup; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.projects_backup TO pg_database_owner;


--
-- Name: TABLE properties; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.properties TO pg_database_owner;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO pg_database_owner;


--
-- PostgreSQL database dump complete
--

\unrestrict DfOZDQmGDUV4mIKBg8ixNmOSbkXSU230aTw5nAlQr2uu5aUe4umAuOfbOVhqPYl

