-- Add engagement tracking fields to locations table
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

-- Create index for page_url
CREATE INDEX IF NOT EXISTS idx_locations_page_url ON public.locations(page_url);

-- Create function to calculate engagement level color
CREATE OR REPLACE FUNCTION get_engagement_color(score float)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN CASE
        WHEN score >= 8 THEN '#22C55E' -- Green (High engagement)
        WHEN score >= 5 THEN '#F59E0B' -- Yellow (Medium engagement)
        ELSE '#EF4444' -- Red (Low engagement)
    END;
END;
$$;

-- Create view for engagement analytics
CREATE OR REPLACE VIEW public.engagement_analytics AS
SELECT 
    user_id,
    page_url,
    COUNT(*) as visit_count,
    AVG((engagement_data->>'total')::float) as avg_engagement,
    get_engagement_color(AVG((engagement_data->>'total')::float)) as engagement_color,
    jsonb_agg(DISTINCT engagement_data) as engagement_details,
    MIN(timestamp) as first_visit,
    MAX(timestamp) as last_visit
FROM public.locations
WHERE engagement_data IS NOT NULL
GROUP BY user_id, page_url;

-- Create materialized view for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.engagement_analytics_mv
AS SELECT * FROM public.engagement_analytics
WITH DATA;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_analytics_mv_user_page
ON public.engagement_analytics_mv(user_id, page_url);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_engagement_analytics_mv()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.engagement_analytics_mv;
    RETURN NULL;
END;
$$;

-- Create trigger to refresh materialized view
DROP TRIGGER IF EXISTS refresh_engagement_analytics_mv_trigger ON public.locations;
CREATE TRIGGER refresh_engagement_analytics_mv_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.locations
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_engagement_analytics_mv();

-- Create function to get engagement summary
CREATE OR REPLACE FUNCTION get_engagement_summary(p_user_id uuid)
RETURNS TABLE (
    page_url text,
    visit_count bigint,
    avg_engagement float,
    engagement_color text,
    first_visit timestamptz,
    last_visit timestamptz,
    engagement_trend text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.page_url,
        ea.visit_count,
        ea.avg_engagement,
        ea.engagement_color,
        ea.first_visit,
        ea.last_visit,
        CASE 
            WHEN ea.avg_engagement >= 8 THEN 'High'
            WHEN ea.avg_engagement >= 5 THEN 'Medium'
            ELSE 'Low'
        END as engagement_trend
    FROM public.engagement_analytics_mv ea
    WHERE ea.user_id = p_user_id
    ORDER BY ea.avg_engagement DESC;
END;
$$;