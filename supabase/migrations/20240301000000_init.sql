-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create users table
create table if not exists public.users (
    id uuid primary key,
    email text not null unique,
    role text not null check (role in ('admin', 'user')),
    parent_id uuid references public.users(id) on delete cascade,
    pixel_code uuid default uuid_generate_v4(),
    created_at timestamptz default now()
);

-- Enable RLS on users table
alter table public.users enable row level security;

-- Users can read their own data and their sub-users' data
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

-- Only admins can insert new users
create policy "Admins can insert users"
    on public.users for insert
    with check (
        exists (
            select 1 from public.users u 
            where u.id = auth.uid() 
            and u.role = 'admin'
        )
    );

-- Users can only delete their sub-users
create policy "Users can delete their sub-users"
    on public.users for delete
    using (
        exists (
            select 1 from public.users u 
            where u.id = auth.uid() 
            and (
                u.id = parent_id 
                or (u.role = 'admin' and id != auth.uid())
            )
        )
    );

-- Create locations table
create table if not exists public.locations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade,
    latitude double precision not null,
    longitude double precision not null,
    address text,
    city text,
    country text,
    timestamp timestamptz default now(),
    device_info jsonb,
    created_at timestamptz default now()
);

-- Enable RLS on locations table
alter table public.locations enable row level security;

-- Users can view their own locations and their sub-users' locations
create policy "Users can view own and sub-users locations"
    on public.locations for select
    using (
        exists (
            select 1 from public.users u 
            where (u.id = auth.uid() and u.id = user_id)
            or (u.parent_id = auth.uid())
            or (u.role = 'admin' and u.id = auth.uid())
        )
    );

-- Users can insert their own locations
create policy "Users can insert own locations"
    on public.locations for insert
    with check (auth.uid() = user_id);

-- Function to initialize users table
create or replace function public.init_users_table()
returns void
language plpgsql
security definer
as $$
begin
    -- Create users table if it doesn't exist
    create table if not exists public.users (
        id uuid primary key,
        email text not null unique,
        role text not null check (role in ('admin', 'user')),
        parent_id uuid references public.users(id) on delete cascade,
        pixel_code uuid default uuid_generate_v4(),
        created_at timestamptz default now()
    );

    -- Enable RLS
    alter table public.users enable row level security;

    -- Create policies if they don't exist
    if not exists (select from pg_policies where tablename = 'users' and policyname = 'Users can view own data and sub-users') then
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
    end if;

    if not exists (select from pg_policies where tablename = 'users' and policyname = 'Admins can insert users') then
        create policy "Admins can insert users"
            on public.users for insert
            with check (
                exists (
                    select 1 from public.users u 
                    where u.id = auth.uid() 
                    and u.role = 'admin'
                )
            );
    end if;

    if not exists (select from pg_policies where tablename = 'users' and policyname = 'Users can delete their sub-users') then
        create policy "Users can delete their sub-users"
            on public.users for delete
            using (
                exists (
                    select 1 from public.users u 
                    where u.id = auth.uid() 
                    and (
                        u.id = parent_id 
                        or (u.role = 'admin' and id != auth.uid())
                    )
                )
            );
    end if;
end;
$$;

-- Function to initialize locations table
create or replace function public.init_locations_table()
returns void
language plpgsql
security definer
as $$
begin
    -- Create locations table if it doesn't exist
    create table if not exists public.locations (
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references public.users(id) on delete cascade,
        latitude double precision not null,
        longitude double precision not null,
        address text,
        city text,
        country text,
        timestamp timestamptz default now(),
        device_info jsonb,
        created_at timestamptz default now()
    );

    -- Enable RLS
    alter table public.locations enable row level security;

    -- Create policies if they don't exist
    if not exists (select from pg_policies where tablename = 'locations' and policyname = 'Users can view own and sub-users locations') then
        create policy "Users can view own and sub-users locations"
            on public.locations for select
            using (
                exists (
                    select 1 from public.users u 
                    where (u.id = auth.uid() and u.id = user_id)
                    or (u.parent_id = auth.uid())
                    or (u.role = 'admin' and u.id = auth.uid())
                )
            );
    end if;

    if not exists (select from pg_policies where tablename = 'locations' and policyname = 'Users can insert own locations') then
        create policy "Users can insert own locations"
            on public.locations for insert
            with check (auth.uid() = user_id);
    end if;
end;
$$;

-- Function to create default admin user
create or replace function public.create_default_admin()
returns void
language plpgsql
security definer
as $$
declare
    default_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
    -- Insert into auth.users if not exists
    insert into auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    )
    values (
        default_user_id,
        'admin@example.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        'authenticated',
        'authenticated'
    )
    on conflict (id) do nothing;

    -- Insert into public.users if not exists
    insert into public.users (
        id,
        email,
        role,
        pixel_code
    )
    values (
        default_user_id,
        'admin@example.com',
        'admin',
        uuid_generate_v4()
    )
    on conflict (id) do nothing;
end;
$$;