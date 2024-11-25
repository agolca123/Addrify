-- Create reverse_address_results table with improved structure
CREATE TABLE IF NOT EXISTS public.reverse_address_results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    address text,
    street_address text,
    city text,
    country text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    user_data jsonb DEFAULT jsonb_build_object(
        'name', null,
        'phone', null,
        'email', null,
        'age', null,
        'gender', null,
        'interests', null,
        'occupation', null,
        'income_level', null,
        'education', null,
        'marital_status', null,
        'household_size', null
    ),
    reverse_timestamp timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reverse_address_updated_at
    BEFORE UPDATE ON public.reverse_address_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.reverse_address_results ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reverse_address_user_id ON public.reverse_address_results(user_id);
CREATE INDEX IF NOT EXISTS idx_reverse_address_location_id ON public.reverse_address_results(location_id);
CREATE INDEX IF NOT EXISTS idx_reverse_address_timestamp ON public.reverse_address_results(reverse_timestamp);
CREATE INDEX IF NOT EXISTS idx_reverse_address_coords ON public.reverse_address_results(latitude, longitude);

-- RLS Policies with improved security
CREATE POLICY "Users can view own reverse address results"
    ON public.reverse_address_results FOR SELECT
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own reverse address results"
    ON public.reverse_address_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reverse address results"
    ON public.reverse_address_results FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to store reverse address results with validation
CREATE OR REPLACE FUNCTION store_reverse_address_result(
    p_location_id uuid,
    p_user_id uuid,
    p_address text,
    p_street_address text,
    p_city text,
    p_country text,
    p_latitude double precision,
    p_longitude double precision,
    p_user_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id uuid;
    location_exists boolean;
BEGIN
    -- Validate location exists and belongs to user
    SELECT EXISTS (
        SELECT 1 FROM public.locations 
        WHERE id = p_location_id AND user_id = p_user_id
    ) INTO location_exists;

    IF NOT location_exists THEN
        RAISE EXCEPTION 'Invalid location ID or unauthorized access';
    END IF;

    -- Insert the result
    INSERT INTO public.reverse_address_results (
        location_id,
        user_id,
        address,
        street_address,
        city,
        country,
        latitude,
        longitude,
        user_data
    )
    VALUES (
        p_location_id,
        p_user_id,
        p_address,
        p_street_address,
        p_city,
        p_country,
        p_latitude,
        p_longitude,
        p_user_data
    )
    RETURNING id INTO result_id;

    -- Send notification to user
    PERFORM send_notification(
        p_user_id,
        'reverse_address',
        'New Reverse Address Result',
        'A new reverse address lookup has been completed for ' || p_address,
        jsonb_build_object(
            'location_id', p_location_id,
            'result_id', result_id,
            'address', p_address
        )
    );

    RETURN result_id;
END;
$$;

-- Function to get reverse address results with pagination
CREATE OR REPLACE FUNCTION get_user_reverse_address_results(
    p_user_id uuid,
    p_limit integer DEFAULT 10,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    location_id uuid,
    address text,
    street_address text,
    city text,
    country text,
    latitude double precision,
    longitude double precision,
    user_data jsonb,
    reverse_timestamp timestamptz,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH total AS (
        SELECT COUNT(*) AS count
        FROM public.reverse_address_results
        WHERE user_id = p_user_id
    )
    SELECT 
        r.id,
        r.location_id,
        r.address,
        r.street_address,
        r.city,
        r.country,
        r.latitude,
        r.longitude,
        r.user_data,
        r.reverse_timestamp,
        total.count
    FROM public.reverse_address_results r
    CROSS JOIN total
    WHERE r.user_id = p_user_id
    ORDER BY r.reverse_timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to update user data with validation
CREATE OR REPLACE FUNCTION update_reverse_address_user_data(
    p_result_id uuid,
    p_user_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated boolean;
BEGIN
    WITH update_result AS (
        UPDATE public.reverse_address_results
        SET 
            user_data = p_user_data,
            reverse_timestamp = now()
        WHERE id = p_result_id
        AND user_id = auth.uid()
        RETURNING id
    )
    SELECT EXISTS (SELECT 1 FROM update_result) INTO updated;

    RETURN updated;
END;
$$;

-- Improved trigger for automatic reverse address creation
CREATE OR REPLACE FUNCTION create_reverse_address_on_location()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reverse_address_results (
        location_id,
        user_id,
        address,
        street_address,
        city,
        country,
        latitude,
        longitude
    )
    VALUES (
        NEW.id,
        NEW.user_id,
        NEW.address,
        '', -- Will be updated by API
        NEW.city,
        NEW.country,
        NEW.latitude,
        NEW.longitude
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_create_reverse_address ON public.locations;

-- Create new trigger
CREATE TRIGGER trigger_create_reverse_address
    AFTER INSERT ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION create_reverse_address_on_location();