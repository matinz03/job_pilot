create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  current_title text,
  experience_level text,
  years_experience integer,
  skills text[] not null default '{}',
  industries text[] not null default '{}',
  work_experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  job_titles_seeking text[] not null default '{}',
  remote_preference text,
  preferred_locations text[] not null default '{}',
  salary_expectation text,
  cover_letter_tone text,
  linkedin_url text,
  portfolio_url text,
  work_authorization text,
  resume_pdf_url text,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_years_experience_positive
    check (years_experience is null or years_experience > 0)
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running',
  job_title_searched text not null,
  location_searched text,
  jobs_found integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint agent_runs_status_valid
    check (status in ('running', 'completed', 'failed')),
  constraint agent_runs_jobs_found_non_negative check (jobs_found >= 0)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.agent_runs(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  source_url text,
  external_apply_url text,
  title text not null,
  company text not null,
  location text,
  salary text,
  job_type text,
  about_role text,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  nice_to_have text[] not null default '{}',
  benefits text[] not null default '{}',
  about_company text,
  match_score integer not null,
  match_reason text,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  company_research jsonb,
  found_at timestamptz not null default now(),
  constraint jobs_source_valid check (source in ('search', 'url')),
  constraint jobs_match_score_valid check (match_score between 0 and 100)
);

create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.agent_runs(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  level text not null default 'info',
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index agent_runs_user_started_at_idx
  on public.agent_runs (user_id, started_at desc);
create index jobs_run_id_idx on public.jobs (run_id);
create index jobs_user_found_at_idx on public.jobs (user_id, found_at desc);
create index jobs_user_match_score_idx on public.jobs (user_id, match_score desc);
create index agent_logs_run_created_at_idx
  on public.agent_logs (run_id, created_at desc);
create index agent_logs_user_created_at_idx
  on public.agent_logs (user_id, created_at desc);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.agent_runs to authenticated;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update, delete on public.agent_logs to authenticated;

alter table public.profiles enable row level security;
alter table public.agent_runs enable row level security;
alter table public.jobs enable row level security;
alter table public.agent_logs enable row level security;

create policy profiles_manage_own on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy agent_runs_manage_own on public.agent_runs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy jobs_manage_own on public.jobs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy agent_logs_manage_own on public.agent_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;

create policy resumes_path_select on storage.objects
  for select to authenticated
  using (
    bucket = 'resumes'
    and (storage.foldername(key))[1] = (select auth.jwt() ->> 'sub')
  );

create policy resumes_path_insert on storage.objects
  for insert to authenticated
  with check (
    bucket = 'resumes'
    and (storage.foldername(key))[1] = (select auth.jwt() ->> 'sub')
  );

create policy resumes_path_update on storage.objects
  for update to authenticated
  using (
    bucket = 'resumes'
    and (storage.foldername(key))[1] = (select auth.jwt() ->> 'sub')
  )
  with check (
    bucket = 'resumes'
    and (storage.foldername(key))[1] = (select auth.jwt() ->> 'sub')
  );

create policy resumes_path_delete on storage.objects
  for delete to authenticated
  using (
    bucket = 'resumes'
    and (storage.foldername(key))[1] = (select auth.jwt() ->> 'sub')
  );
