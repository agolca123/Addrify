-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    city TEXT,
    country TEXT,
    device_info JSONB,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserting location data
CREATE POLICY "Allow anonymous insert" ON locations
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow users to view their own location data
CREATE POLICY "Users can view own locations" ON locations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS locations_user_id_idx ON locations(user_id);
CREATE INDEX IF NOT EXISTS locations_timestamp_idx ON locations(timestamp);

-- Function to initialize the database
CREATE OR REPLACE FUNCTION init_database()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create the locations table
    CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        address TEXT,
        city TEXT,
        country TEXT,
        device_info JSONB,
        timestamp TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DROP POLICY IF EXISTS "Allow anonymous insert" ON locations;
    CREATE POLICY "Allow anonymous insert" ON locations
        FOR INSERT
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can view own locations" ON locations;
    CREATE POLICY "Users can view own locations" ON locations
        FOR SELECT
        USING (auth.uid() = user_id);
END;
$$;