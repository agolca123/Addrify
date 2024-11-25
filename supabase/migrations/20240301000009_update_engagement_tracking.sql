-- Add missing fields to locations table
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS page_url text,
ADD COLUMN IF NOT EXISTS engagement_data jsonb DEFAULT jsonb_build_object(
    'total', 0,
    'details', jsonb_build_object(
        'timeSpent', 0,
        'timeScore', 0,
        'pageViews', 0,
        'pageViewScore', 0,
        'clicks', 0,
        'clickScore', 0
    )
);

-- Create or replace function to calculate engagement metrics
CREATE OR REPLACE FUNCTION calculate_engagement_metrics(
    p_user_id uuid,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
    page_url text,
    total_visits bigint,
    avg_engagement numeric,
    engagement_trend text,
    first_visit timestamptz,
    last_visit timestamptz,
    engagement_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH page_metrics AS (
        SELECT 
            l.page_url,
            COUNT(*) as visit_count,
            AVG((l.engagement_data->>'total')::numeric) as avg_engagement_score,
            MIN(l.timestamp) as first_visit_time,
            MAX(l.timestamp) as last_visit_time,
            jsonb_agg(l.engagement_data) as all_engagement_data
        FROM public.locations l
        WHERE l.user_id = p_user_id
        AND (p_start_date IS NULL OR l.timestamp >= p_start_date)
        AND (p_end_date IS NULL OR l.timestamp <= p_end_date)
        GROUP BY l.page_url
    )
    SELECT 
        pm.page_url,
        pm.visit_count,
        ROUND(pm.avg_engagement_score, 2),
        CASE 
            WHEN pm.avg_engagement_score >= 8 THEN 'High'
            WHEN pm.avg_engagement_score >= 5 THEN 'Medium'
            ELSE 'Low'
        END,
        pm.first_visit_time,
        pm.last_visit_time,
        jsonb_build_object(
            'timeSpent', (pm.all_engagement_data->0->'details'->>'timeSpent')::numeric,
            'timeScore', (pm.all_engagement_data->0->'details'->>'timeScore')::numeric,
            'pageViews', (pm.all_engagement_data->0->'details'->>'pageViews')::numeric,
            'pageViewScore', (pm.all_engagement_data->0->'details'->>'pageViewScore')::numeric,
            'clicks', (pm.all_engagement_data->0->'details'->>'clicks')::numeric,
            'clickScore', (pm.all_engagement_data->0->'details'->>'clickScore')::numeric
        )
    FROM page_metrics pm
    ORDER BY pm.avg_engagement_score DESC;
END;
$$;

-- Create or replace function to get engagement summary
CREATE OR REPLACE FUNCTION get_engagement_summary(
    p_user_id uuid,
    p_days integer DEFAULT 30
)
RETURNS TABLE (
    page_url text,
    visit_count bigint,
    avg_engagement numeric,
    engagement_color text,
    first_visit timestamptz,
    last_visit timestamptz,
    engagement_trend text,
    engagement_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT *
        FROM calculate_engagement_metrics(
            p_user_id,
            CURRENT_TIMESTAMP - (p_days || ' days')::interval,
            CURRENT_TIMESTAMP
        )
    )
    SELECT 
        m.page_url,
        m.total_visits,
        m.avg_engagement,
        CASE 
            WHEN m.avg_engagement >= 8 THEN '#22C55E'
            WHEN m.avg_engagement >= 5 THEN '#F59E0B'
            ELSE '#EF4444'
        END,
        m.first_visit,
        m.last_visit,
        m.engagement_trend,
        m.engagement_details
    FROM metrics m;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_engagement ON public.locations USING gin (engagement_data);
CREATE INDEX IF NOT EXISTS idx_locations_page_timestamp ON public.locations (page_url, timestamp);

-- Update RLS policies
CREATE POLICY "Users can view own engagement data"
    ON public.locations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create function to update engagement data
CREATE OR REPLACE FUNCTION update_engagement_data(
    p_location_id uuid,
    p_engagement_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.locations
    SET engagement_data = p_engagement_data
    WHERE id = p_location_id
    AND user_id = auth.uid();
END;
$$;