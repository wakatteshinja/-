-- Digital Scorer Pro schema
create extension if not exists "pgcrypto";

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  base_image_path text not null,
  config jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  student_no text,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  template_id uuid not null references templates(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  answer_image_path text not null,
  annotated_image_path text,
  scores jsonb not null,
  total_score numeric not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, class_id, student_id)
);

alter table templates enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table submissions enable row level security;

create policy "own templates" on templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own classes" on classes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own students" on students for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own submissions" on submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
