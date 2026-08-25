alter table public.jobs
  add column researched_at timestamptz;

create index jobs_user_researched_at_idx
  on public.jobs (user_id, researched_at desc)
  where researched_at is not null;

create function public.dashboard_stats()
returns table (
  total_jobs bigint,
  average_match_score numeric,
  companies_researched bigint,
  jobs_this_week bigint,
  jobs_last_week bigint,
  average_match_score_this_week numeric,
  average_match_score_last_week numeric,
  companies_researched_this_week bigint,
  companies_researched_last_week bigint
)
language sql
stable
set search_path = pg_catalog, public
as $$
  with window_bounds as (
    select
      now() - interval '7 days' as current_start,
      now() - interval '14 days' as previous_start
  )
  select
    count(*) as total_jobs,
    avg(j.match_score) as average_match_score,
    count(j.company_research) as companies_researched,
    count(*) filter (where j.found_at >= b.current_start) as jobs_this_week,
    count(*) filter (where j.found_at >= b.previous_start and j.found_at < b.current_start) as jobs_last_week,
    avg(j.match_score) filter (where j.found_at >= b.current_start) as average_match_score_this_week,
    avg(j.match_score) filter (where j.found_at >= b.previous_start and j.found_at < b.current_start) as average_match_score_last_week,
    count(*) filter (where j.researched_at >= b.current_start) as companies_researched_this_week,
    count(*) filter (where j.researched_at >= b.previous_start and j.researched_at < b.current_start) as companies_researched_last_week
  from public.jobs as j
  cross join window_bounds as b
  where j.user_id = auth.uid();
$$;

revoke all on function public.dashboard_stats() from public;
grant execute on function public.dashboard_stats() to authenticated;
