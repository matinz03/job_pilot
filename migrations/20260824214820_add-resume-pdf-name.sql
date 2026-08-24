alter table public.profiles
  add column resume_pdf_name text;

update public.profiles
set resume_pdf_name = 'resume.pdf'
where resume_pdf_name is null
  and (resume_pdf_key is not null or resume_pdf_url is not null);
