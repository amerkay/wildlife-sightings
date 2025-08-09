-- Drop existing table and recreate with optimized field types
DROP TABLE IF EXISTS public.sightings CASCADE;

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

-- Policies
-- Users can insert their own sightings
CREATE POLICY "Users can insert their own sightings" ON public.sightings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own sightings
CREATE POLICY "Users can view their own sightings" ON public.sightings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own pending sightings
CREATE POLICY "Users can update their own pending sightings" ON public.sightings
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Anonymous users can insert sightings (for public form submission)
CREATE POLICY "Anonymous users can insert sightings" ON public.sightings
    FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Public can view approved sightings (for map display)
CREATE POLICY "Public can view approved sightings" ON public.sightings
    FOR SELECT USING (status = 'approved');

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