-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create subscription_plans table
create table if not exists public.subscription_plans (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    price decimal not null,
    address_limit integer not null,
    features jsonb not null,
    is_popular boolean default false,
    stripe_price_id text,
    created_at timestamptz default now()
);

-- Create payments table
create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade,
    amount decimal not null,
    status text not null check (status in ('success', 'pending', 'failed')),
    plan_id uuid references public.subscription_plans(id),
    stripe_payment_id text,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.subscription_plans enable row level security;
alter table public.payments enable row level security;

-- RLS Policies for subscription_plans
create policy "Anyone can view subscription plans"
    on public.subscription_plans for select
    using (true);

-- RLS Policies for payments
create policy "Users can view their own payments"
    on public.payments for select
    using (auth.uid() = user_id);

create policy "Users can insert their own payments"
    on public.payments for insert
    with check (auth.uid() = user_id);

-- Insert default subscription plans
insert into public.subscription_plans (name, price, address_limit, features, is_popular) values
    ('Free', 0, 5, '["5 locations", "Basic analytics", "Email support"]', false),
    ('Premium', 29.99, 50, '["50 locations", "Advanced analytics", "Priority support", "Real-time tracking", "Custom reports"]', true),
    ('Enterprise', 99.99, -1, '["Unlimited locations", "Enterprise analytics", "24/7 Priority support", "Real-time tracking", "Custom reports", "API access", "Dedicated account manager"]', false)
on conflict do nothing;