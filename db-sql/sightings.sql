-- Drop existing objects first (in reverse dependency order)
DROP VIEW IF EXISTS public.sightings_public CASCADE;
DROP TABLE IF EXISTS public.sightings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.sighting_type CASCADE;
DROP TYPE IF EXISTS public.frequency_type CASCADE;
DROP TYPE IF EXISTS public.activity_type CASCADE;
DROP TYPE IF EXISTS public.cause_of_death_type CASCADE;
DROP TYPE IF EXISTS public.observed_type CASCADE;
DROP TYPE IF EXISTS public.site_type CASCADE;
DROP TYPE IF EXISTS public.nestbox_type CASCADE;
DROP TYPE IF EXISTS public.connection_type CASCADE;
-- NEW: drop roles enum if present
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Enable PostGIS extension for geography and geometry types
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Create ENUM types for form values
CREATE TYPE public.sighting_type AS ENUM ('live', 'site', 'dead');

CREATE TYPE public.frequency_type AS ENUM ('once', 'weekly', 'monthly', 'less-monthly');

CREATE TYPE public.activity_type AS ENUM ('driving', 'walking', 'home', 'other');

CREATE TYPE public.cause_of_death_type AS ENUM (
    'road-minor',
    'road-major', 
    'road-motorway',
    'powerlines',
    'railway',
    'drowned',
    'unknown',
    'other'
);

CREATE TYPE public.observed_type AS ENUM (
    'nest',
    'roost-regular',
    'roost-occasional',
    'fly-in-out',
    'carrying-food',
    'young-heard'
);

CREATE TYPE public.site_type AS ENUM (
    'traditional-farm',
    'modern-farm',
    'mixed-farm',
    'tree-hole',
    'other'
);

CREATE TYPE public.nestbox_type AS ENUM ('yes', 'no', 'unknown');

CREATE TYPE public.connection_type AS ENUM ('owner', 'tenant', 'watcher', 'other');

-- NEW: roles enum
CREATE TYPE public.user_role AS ENUM ('admin','user');

-- NEW: profiles table to store roles (source of truth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- NEW: helper function to check admin status without recursion
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;

-- NEW: profiles policies (secure role management, no recursion)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile as user" ON public.profiles;

-- users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- admins can read all profiles
CREATE POLICY "Admins can read any profile"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- admins can update any profile (e.g., promote/demote)
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- (optional safety) allow authenticated users to insert their own row only as 'user'
CREATE POLICY "Users can insert their own profile as user"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'user');

-- NEW: auto-create a profile row on signup (standard Supabase pattern) and sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Ensure a fresh trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- NEW: keep email in sync if auth.users.email changes
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE PROCEDURE public.handle_user_email_update();

-- Recreate sightings table with VARCHAR limits and DATE fields
CREATE TABLE public.sightings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User information (from auth.users)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Form type
    type public.sighting_type NOT NULL,
    
    -- Location information (PostGIS)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    location_notes VARCHAR(700),
    
    -- Contact information
    contact_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(320) NOT NULL, -- RFC 5321 max email length
    contact_postcode VARCHAR(20),
    
    -- Common fields
    sighting_date DATE NOT NULL,
    observation_period_from DATE,
    observation_period_to DATE,
    
    -- Live sighting specific fields
    frequency public.frequency_type,
    activity public.activity_type,
    activity_other VARCHAR(200),
    
    -- Site/Roost/Nest specific fields
    observed public.observed_type[],
    site_type public.site_type,
    site_type_other VARCHAR(200),
    nestbox public.nestbox_type,
    connection public.connection_type,
    connection_other VARCHAR(200),
    
    -- Dead sighting specific fields
    cause_of_death public.cause_of_death_type,
    cause_of_death_other VARCHAR(200),
    death_details VARCHAR(700),
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes VARCHAR(700),
    
    -- Constraints for conditional required fields
    CONSTRAINT live_sighting_activity_other_check 
        CHECK (type != 'live' OR activity != 'other' OR (activity_other IS NOT NULL AND length(trim(activity_other)) > 0)),
    CONSTRAINT site_sighting_site_type_other_check 
        CHECK (type != 'site' OR site_type != 'other' OR (site_type_other IS NOT NULL AND length(trim(site_type_other)) > 0)),
    CONSTRAINT site_sighting_connection_other_check 
        CHECK (type != 'site' OR connection != 'other' OR (connection_other IS NOT NULL AND length(trim(connection_other)) > 0)),
    CONSTRAINT dead_sighting_cause_other_check 
        CHECK (type != 'dead' OR cause_of_death != 'other' OR (cause_of_death_other IS NOT NULL AND length(trim(cause_of_death_other)) > 0)),
    CONSTRAINT observation_period_order_check
        CHECK (observation_period_from IS NULL OR observation_period_to IS NULL OR observation_period_from <= observation_period_to)
);

-- Create indexes for performance
CREATE INDEX idx_sightings_location ON public.sightings USING GIST (location);
CREATE INDEX idx_sightings_type ON public.sightings (type);
CREATE INDEX idx_sightings_user_id ON public.sightings (user_id);
CREATE INDEX idx_sightings_sighting_date ON public.sightings (sighting_date);
CREATE INDEX idx_sightings_created_at ON public.sightings (created_at);
CREATE INDEX idx_sightings_status ON public.sightings (status);

-- Additional indexes for query performance
CREATE INDEX idx_sightings_contact_email ON public.sightings (contact_email);
CREATE INDEX idx_sightings_observation_period_from ON public.sightings (observation_period_from) WHERE observation_period_from IS NOT NULL;
CREATE INDEX idx_sightings_observation_period_to ON public.sightings (observation_period_to) WHERE observation_period_to IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sightings_updated_at 
    BEFORE UPDATE ON public.sightings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can view their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can update their own pending sightings" ON public.sightings;
DROP POLICY IF EXISTS "Admins can select any sightings" ON public.sightings;
DROP POLICY IF EXISTS "Admins can insert any sightings" ON public.sightings;
DROP POLICY IF EXISTS "Admins can update any sightings" ON public.sightings;
DROP POLICY IF EXISTS "Admins can delete any sightings" ON public.sightings;

-- Policies
-- Users can insert their own sightings
CREATE POLICY "Users can insert their own sightings" ON public.sightings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own sightings
CREATE POLICY "Users can view their own sightings" ON public.sightings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own pending sightings (explicit WITH CHECK for safety)
CREATE POLICY "Users can update their own pending sightings" ON public.sightings
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admin overrides (CRUD on all rows) using helper to avoid recursion
CREATE POLICY "Admins can select any sightings" ON public.sightings
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert any sightings" ON public.sightings
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any sightings" ON public.sightings
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any sightings" ON public.sightings
  FOR DELETE
  USING (public.is_admin(auth.uid()));

create or replace function public.lat(s public.sightings)
returns double precision
language sql stable
set search_path = public, extensions
as $$
  select st_y((s.location::geometry));
$$;

create or replace function public.lng(s public.sightings)
returns double precision
language sql stable
set search_path = public, extensions
as $$
  select st_x((s.location::geometry));
$$;


-- Create a public view for sightings with limited fields

-- Remove existing view if it exists
DROP VIEW IF EXISTS public.sightings_public;

-- Recreate the public view with lat/lng instead of geography
CREATE OR REPLACE VIEW public.sightings_public AS
WITH g AS (
  SELECT
    id,
    type,
    status,
    sighting_date,
    -- snap to a 5,000m grid in a metric projection, then get the centroid in WGS84
    ST_Transform(
      ST_Centroid(
        ST_SnapToGrid(
          ST_Transform(location::geometry, 3857),
          5000, 5000  -- 5 km grid
        )
      ),
      4326
    ) AS geom_5km
  FROM public.sightings
  -- WHERE status = 'approved'
)
SELECT
  id,              -- omit if you don’t want stable IDs public
  type,
  sighting_date,
  ST_Y(geom_5km) AS lat,
  ST_X(geom_5km) AS lng
FROM g;

-- Ensure anon can read only the view, not the base table
GRANT SELECT ON public.sightings_public TO anon;
REVOKE ALL ON public.sightings FROM anon;
