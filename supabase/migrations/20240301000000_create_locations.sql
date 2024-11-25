-- Create locations table
create table if not exists public.locations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    latitude double precision not null,
    longitude double precision not null,
    address text,
    city text,
    country text,
    timestamp timestamptz default now(),
    device_info jsonb,
    created_at timestamptz default now()
);

-- Create RLS policies
alter table public.locations enable row level security;

create policy "Users can view their own locations"
    on public.locations for select
    using (auth.uid() = user_id);

create policy "Users can insert their own locations"
    on public.locations for insert
    with check (auth.uid() = user_id);

-- Create function to ensure table exists
create or replace function public.create_locations_table()
returns void
language plpgsql
security definer
as $$
begin
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'locations') then
        create table public.locations (
            id uuid primary key default uuid_generate_v4(),
            user_id uuid references auth.users(id) on delete cascade,
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

        create policy "Users can view their own locations"
            on public.locations for select
            using (auth.uid() = user_id);

        create policy "Users can insert their own locations"
            on public.locations for insert
            with check (auth.uid() = user_id);
    end if;
end;
$$;