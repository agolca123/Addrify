-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Function to initialize users table
create or replace function public.init_users_table()
returns void
language plpgsql
security definer
as $$
begin
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'users') then
        create table public.users (
            id uuid primary key references auth.users(id) on delete cascade,
            email text not null,
            role text not null check (role in ('admin', 'user')),
            parent_id uuid references public.users(id) on delete cascade,
            pixel_code uuid default uuid_generate_v4(),
            created_at timestamptz default now()
        );

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
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'locations') then
        create table public.locations (
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
    end if;
end;
$$;

-- Create default admin user function
create or replace function public.create_default_admin()
returns void
language plpgsql
security definer
as $$
declare
    default_user_id uuid;
begin
    -- Create auth user if not exists
    insert into auth.users (id, email, encrypted_password, email_confirmed_at)
    values (
        '00000000-0000-0000-0000-000000000000',
        'admin@example.com',
        crypt('admin123', gen_salt('bf')),
        now()
    )
    on conflict (id) do nothing
    returning id into default_user_id;

    -- Create user record
    insert into public.users (id, email, role)
    values (
        default_user_id,
        'admin@example.com',
        'admin'
    )
    on conflict (id) do nothing;
end;
$$;