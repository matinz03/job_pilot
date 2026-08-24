alter table public.profiles
  add column resume_pdf_key text,
  add column completion_percentage integer not null default 0,
  add column missing_fields text[] not null default '{}',
  add constraint profiles_completion_percentage_valid
    check (completion_percentage between 0 and 100);
