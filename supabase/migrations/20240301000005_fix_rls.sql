-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own data and sub-users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON public.locations;

-- Create improved RLS policies for users table
CREATE POLICY "Users can view own data and sub-users"
    ON public.users FOR SELECT
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
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
    ON public.users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Create improved RLS policies for subscription_plans table
CREATE POLICY "Anyone can view subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage subscription plans"
    ON public.subscription_plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Create improved RLS policies for payments table
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments"
    ON public.payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Create improved RLS policies for locations table
CREATE POLICY "Users can view own locations"
    ON public.locations FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND (
                u.role = 'admin' 
                OR (u.id = (
                    SELECT parent_id 
                    FROM public.users 
                    WHERE id = public.locations.user_id
                ))
            )
        )
    );

CREATE POLICY "Users can insert own locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all locations"
    ON public.locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Create functions for table initialization
CREATE OR REPLACE FUNCTION init_subscription_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create subscription_plans table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.subscription_plans (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL,
        price decimal NOT NULL,
        address_limit integer NOT NULL,
        features jsonb NOT NULL,
        is_popular boolean DEFAULT false,
        stripe_price_id text,
        created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
END;
$$;

CREATE OR REPLACE FUNCTION init_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create payments table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.payments (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
        amount decimal NOT NULL,
        status text NOT NULL CHECK (status IN ('success', 'pending', 'failed')),
        plan_id uuid REFERENCES public.subscription_plans(id),
        stripe_payment_id text,
        created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
END;
$$;

CREATE OR REPLACE FUNCTION init_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create locations table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.locations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
        latitude double precision NOT NULL,
        longitude double precision NOT NULL,
        address text,
        city text,
        country text,
        device_info jsonb,
        timestamp timestamptz DEFAULT now(),
        created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
END;
$$;