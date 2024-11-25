-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create configuration table for dynamic settings
CREATE TABLE IF NOT EXISTS public.app_config (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_config_updated_at
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default configurations
INSERT INTO public.app_config (key, value, description) VALUES
('location_tracking', 
 jsonb_build_object(
    'interval', 300000,
    'high_accuracy', true,
    'timeout', 5000,
    'maximum_age', 0
 ),
 'Location tracking configuration settings'
),
('subscription_limits', 
 jsonb_build_object(
    'free', jsonb_build_object('address_limit', 5, 'features', '["Basic analytics", "Email support"]'),
    'premium', jsonb_build_object('address_limit', 50, 'features', '["Advanced analytics", "Priority support"]'),
    'enterprise', jsonb_build_object('address_limit', -1, 'features', '["Enterprise features", "24/7 support"]')
 ),
 'Subscription plan limits and features'
),
('notification_settings',
 jsonb_build_object(
    'email_enabled', true,
    'push_enabled', true,
    'notification_types', '["payment", "subscription", "location", "security"]'
 ),
 'Global notification settings'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

-- Add geometry column to locations table for better spatial queries
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Create or replace function to automatically update geometry column
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for geometry updates
DROP TRIGGER IF EXISTS update_location_geom_trigger ON public.locations;
CREATE TRIGGER update_location_geom_trigger
    BEFORE INSERT OR UPDATE OF latitude, longitude ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geom();

-- Add audit logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id),
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Create audit logging function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_data jsonb;
BEGIN
    audit_data = jsonb_build_object(
        'user_id', current_setting('app.current_user_id', true),
        'ip_address', current_setting('app.client_ip', true),
        'user_agent', current_setting('app.user_agent', true)
    );

    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent
    )
    VALUES (
        (audit_data->>'user_id')::uuid,
        TG_OP,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE to_jsonb(NEW)
        END,
        audit_data->>'ip_address',
        audit_data->>'user_agent'
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to main tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_locations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_user_timestamp ON public.locations (user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON public.locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs (user_id, action);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments (user_id, status);

-- Add notification system
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read);

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_message text,
    p_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to get app configuration
CREATE OR REPLACE FUNCTION get_app_config(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_value jsonb;
BEGIN
    SELECT value INTO config_value
    FROM public.app_config
    WHERE key = p_key;
    
    RETURN config_value;
END;
$$;

-- Function to update app configuration
CREATE OR REPLACE FUNCTION update_app_config(p_key text, p_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.app_config (key, value)
    VALUES (p_key, p_value)
    ON CONFLICT (key) DO UPDATE
    SET value = p_value,
        updated_at = now();
END;
$$;

-- Add subscription management functions
CREATE OR REPLACE FUNCTION check_subscription_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_subscription record;
    location_count integer;
    address_limit integer;
BEGIN
    -- Get user's subscription status and address limit
    SELECT subscription_status INTO user_subscription
    FROM public.users
    WHERE id = p_user_id;

    -- Get address limit from config
    SELECT (get_app_config('subscription_limits')->>user_subscription.subscription_status->>'address_limit')::integer
    INTO address_limit;

    -- Get current location count
    SELECT COUNT(*) INTO location_count
    FROM public.locations
    WHERE user_id = p_user_id;

    -- Check if user has reached their limit
    RETURN CASE
        WHEN address_limit = -1 THEN true  -- Unlimited
        WHEN location_count >= address_limit THEN false
        ELSE true
    END;
END;
$$;

-- Function to handle subscription upgrades
CREATE OR REPLACE FUNCTION upgrade_subscription(
    p_user_id uuid,
    p_new_plan text,
    p_payment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user's subscription
    UPDATE public.users
    SET subscription_status = p_new_plan,
        subscription_end_date = CASE
            WHEN p_new_plan = 'free' THEN NULL
            ELSE now() + interval '1 month'
        END
    WHERE id = p_user_id;

    -- Send notification
    PERFORM send_notification(
        p_user_id,
        'subscription_upgrade',
        'Subscription Upgraded',
        'Your subscription has been upgraded to ' || p_new_plan,
        jsonb_build_object('plan', p_new_plan, 'payment_id', p_payment_id)
    );
END;
$$;