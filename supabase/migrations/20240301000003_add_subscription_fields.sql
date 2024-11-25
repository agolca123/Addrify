-- Add subscription related fields to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS address_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Create subscription_plans table if not exists
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

-- Create payments table if not exists
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
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans if they don't exist
INSERT INTO public.subscription_plans (name, price, address_limit, features, is_popular)
VALUES 
    ('Free', 0, 5, '["5 locations", "Basic analytics", "Email support"]', false),
    ('Premium', 29.99, 50, '["50 locations", "Advanced analytics", "Priority support", "Real-time tracking", "Custom reports"]', true),
    ('Enterprise', 99.99, -1, '["Unlimited locations", "Enterprise analytics", "24/7 Priority support", "Real-time tracking", "Custom reports", "API access", "Dedicated account manager"]', false)
ON CONFLICT DO NOTHING;