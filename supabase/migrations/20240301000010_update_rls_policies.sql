-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data and sub-users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can delete their sub-users" ON public.users;
DROP POLICY IF EXISTS "Users can view own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data and sub-users"
    ON public.users
    FOR SELECT
    USING (
        auth.uid() = id 
        OR auth.uid() = parent_id 
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert users"
    ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can delete their sub-users"
    ON public.users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND (
                u.id = parent_id 
                OR (u.role = 'admin' AND id != auth.uid())
            )
        )
    );

-- Locations table policies
CREATE POLICY "Users can view own locations"
    ON public.locations
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND (
                u.role = 'admin'
                OR u.id = (
                    SELECT parent_id 
                    FROM public.users 
                    WHERE id = public.locations.user_id
                )
            )
        )
    );

CREATE POLICY "Users can insert own locations"
    ON public.locations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
    ON public.locations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
    ON public.locations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Subscription plans policies
CREATE POLICY "Anyone can view subscription plans"
    ON public.subscription_plans
    FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify subscription plans"
    ON public.subscription_plans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Payments table policies
CREATE POLICY "Users can view own payments"
    ON public.payments
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own payments"
    ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can modify payments"
    ON public.payments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Helper function to check if user has access to location
CREATE OR REPLACE FUNCTION check_location_access(location_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.locations l
        JOIN public.users u ON u.id = auth.uid()
        WHERE l.id = location_id
        AND (
            l.user_id = auth.uid()
            OR u.role = 'admin'
            OR u.id = (
                SELECT parent_id 
                FROM public.users 
                WHERE id = l.user_id
            )
        )
    );
END;
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$;