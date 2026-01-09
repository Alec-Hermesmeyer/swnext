-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ContractAmount (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Amount numeric,
  CONSTRAINT ContractAmount_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Customer (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  CONSTRAINT Customer_pkey PRIMARY KEY (id)
);
CREATE TABLE public.DateSold (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Date text,
  CONSTRAINT DateSold_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Estimator (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Estimator text,
  CONSTRAINT Estimator_pkey PRIMARY KEY (id)
);
CREATE TABLE public.JobName (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Job_Name text,
  CONSTRAINT JobName_pkey PRIMARY KEY (id)
);
CREATE TABLE public.MonthSold (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Month text,
  CONSTRAINT MonthSold_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Sales (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  customer text,
  amount numeric,
  scope text,
  day_sold text,
  month_Sold text,
  estimator text,
  job_Name text,
  job_number text,
  start_date date,
  end_date date,
  status text,
  date_bid text DEFAULT ''::text,
  project_manager text,
  is_won boolean,
  bid_lost boolean,
  address text,
  contacts text,
  city text,
  zip text,
  CONSTRAINT Sales_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Scope (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Scope text,
  CONSTRAINT Scope_pkey PRIMARY KEY (id)
);
CREATE TABLE public.blog (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  slug text,
  metaTitle text,
  metaDesc text,
  imgUrl text,
  isFeatured boolean,
  p1 text,
  p2Title text,
  p2 text,
  p3Title text,
  p3 text,
  p4Title text,
  p4Top text,
  p4Bottom text,
  p5Title text,
  p5 text,
  CONSTRAINT blog_pkey PRIMARY KEY (id)
);
CREATE TABLE public.blog_posts (
  id integer NOT NULL DEFAULT nextval('blog_posts_id_seq'::regclass),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  author text,
  published boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.brand_voice (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE CHECK (platform = ANY (ARRAY['facebook'::text, 'linkedin'::text, 'global'::text])),
  voice_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  tone_controls jsonb NOT NULL DEFAULT '{"brevity_detail": 5, "salesy_informative": 5, "professional_casual": 5, "technical_accessible": 5}'::jsonb,
  analyzed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brand_voice_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.company_contacts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  job_title text,
  email text,
  phone text,
  CONSTRAINT company_contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contact_form (
  id integer NOT NULL DEFAULT nextval('contact_form_id_seq'::regclass),
  name text,
  email text,
  number text,
  message text,
  company text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_form_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contact_form_submissions (
  id integer NOT NULL DEFAULT nextval('contact_form_submissions_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  name text,
  email text,
  number text,
  message text,
  CONSTRAINT contact_form_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.image_assignments (
  id integer NOT NULL DEFAULT nextval('image_assignments_id_seq'::regclass),
  page character varying NOT NULL,
  slot character varying NOT NULL,
  image_url text NOT NULL,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT image_assignments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.job_form (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  name text,
  email text,
  number text,
  message text,
  position text,
  CONSTRAINT job_form_pkey PRIMARY KEY (id)
);
CREATE TABLE public.jobs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  jobTitle text,
  jobDesc text,
  is_Open boolean DEFAULT false,
  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.log_table (
  id integer NOT NULL DEFAULT nextval('log_table_id_seq'::regclass),
  log_info jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT log_table_pkey PRIMARY KEY (id)
);
CREATE TABLE public.organization (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  CONSTRAINT organization_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  username text UNIQUE CHECK (char_length(username) >= 3),
  full_name text,
  avatar_url text,
  website text,
  role text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.social_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE CHECK (platform = ANY (ARRAY['facebook'::text, 'linkedin'::text])),
  page_id text NOT NULL,
  page_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamp with time zone,
  connected_at timestamp with time zone DEFAULT now(),
  last_sync_at timestamp with time zone,
  CONSTRAINT social_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.social_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  date date NOT NULL,
  followers integer,
  impressions integer,
  engagement_rate numeric,
  data jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT social_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.social_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes integer,
  category text CHECK (category = ANY (ARRAY['job_site'::text, 'equipment'::text, 'team'::text, 'before_after'::text, 'general'::text])),
  tags ARRAY DEFAULT '{}'::text[],
  ai_description text,
  uploaded_at timestamp with time zone DEFAULT now(),
  used_count integer DEFAULT 0,
  CONSTRAINT social_images_pkey PRIMARY KEY (id)
);
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platforms ARRAY NOT NULL,
  content text NOT NULL,
  image_ids ARRAY DEFAULT '{}'::uuid[],
  post_type text CHECK (post_type = ANY (ARRAY['project_showcase'::text, 'hiring'::text, 'industry_tip'::text, 'company_update'::text, 'community'::text, 'general'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'scheduled'::text, 'published'::text, 'failed'::text])),
  tone_settings jsonb,
  scheduled_for timestamp with time zone,
  published_at timestamp with time zone,
  platform_post_ids jsonb DEFAULT '{}'::jsonb,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT social_posts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.synced_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  platform_post_id text NOT NULL,
  content text,
  posted_at timestamp with time zone,
  engagement jsonb DEFAULT '{}'::jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  image_url text,
  CONSTRAINT synced_posts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  due_date date,
  assigned_to text,
  user_id uuid,
  inserted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_user_id uuid,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT tasks_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_name text,
  user_password text,
  user_ID uuid DEFAULT gen_random_uuid(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);