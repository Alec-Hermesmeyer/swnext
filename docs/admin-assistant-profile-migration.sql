alter table public.profiles
  add column if not exists department text;

comment on column public.profiles.role is
  'Application role used by the admin assistant for permissions and personalization.';

comment on column public.profiles.department is
  'Business department used by the admin assistant for personalization. This is separate from crew scheduler roster data.';

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_department on public.profiles(department);
