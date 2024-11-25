-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist
drop table if exists public.payments cascade;
drop table if exists public.subscription_plans cascade;
drop table if exists public.locations cascade;
drop table if exists public.users cascade;

-- Create users table
create table public.users (
    id uuid primary key,
    email text not null unique,
    role text not null check (role in ('admin', 'user')),
    parent_id uuid references public.users(id) on delete cascade,
    pixel_code uuid default uuid_generate_v4(),
    subscription_status text default 'free',
    subscription_end_date timestamptz,
    address_count integer default 0,
    two_factor_enabled boolean default false,
    is_demo boolean default false,
    notification_preferences jsonb default '{"email":true,"browser":false,"updates":true,"security":true}'::jsonb,
    created_at timestamptz default now()
);

-- Create subscription_plans table
create table public.subscription_plans (
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
create table public.payments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade,
    amount decimal not null,
    status text not null check (status in ('success', 'pending', 'failed')),
    plan_id uuid references public.subscription_plans(id),
    stripe_payment_id text,
    created_at timestamptz default now()
);

-- Create locations table
create table public.locations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade,
    latitude double precision not null,
    longitude double precision not null,
    address text,
    city text,
    country text,
    device_info jsonb,
    timestamp timestamptz default now(),
    created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.payments enable row level security;
alter table public.locations enable row level security;

-- RLS Policies for users
create policy "Users can view own data and sub-users"
    on public.users for select
    using (
        auth.uid() = id 
        or auth.uid() = parent_id 
        or exists (
            select 1 from public.users u 
            where u.id = auth.uid() 
            and u.role = 'admin'
        )
    );

create policy "Users can update own data"
    on public.users for update
    using (auth.uid() = id);

-- RLS Policies for subscription_plans
create policy "Anyone can view subscription plans"
    on public.subscription_plans for select
    using (true);

-- RLS Policies for payments
create policy "Users can view own payments"
    on public.payments for select
    using (auth.uid() = user_id);

create policy "Users can insert own payments"
    on public.payments for insert
    with check (auth.uid() = user_id);

-- RLS Policies for locations
create policy "Users can view own locations"
    on public.locations for select
    using (auth.uid() = user_id);

create policy "Users can insert own locations"
    on public.locations for insert
    with check (auth.uid() = user_id);

-- Insert default subscription plans
insert into public.subscription_plans (name, price, address_limit, features, is_popular) values 
    ('Free', 0, 5, '["5 locations", "Basic analytics", "Email support"]', false),
    ('Premium', 29.99, 50, '["50 locations", "Advanced analytics", "Priority support", "Real-time tracking", "Custom reports"]', true),
    ('Enterprise', 99.99, -1, '["Unlimited locations", "Enterprise analytics", "24/7 Priority support", "Real-time tracking", "Custom reports", "API access", "Dedicated account manager"]', false)
on conflict do nothing;

-- Insert test users
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
values 
    ('00000000-0000-0000-0000-000000000001', 'admin@test.com', crypt('Asd1234.', gen_salt('bf')), now()),
    ('00000000-0000-0000-0000-000000000002', 'test@test.com', crypt('Asd1234.', gen_salt('bf')), now())
on conflict (id) do nothing;

insert into public.users (id, email, role, subscription_status)
values
    ('00000000-0000-0000-0000-000000000001', 'admin@test.com', 'admin', 'premium'),
    ('00000000-0000-0000-0000-000000000002', 'test@test.com', 'user', 'free')
on conflict (id) do nothing;