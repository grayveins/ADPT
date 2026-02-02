create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exercises_public_idx
  on public.exercises (is_public, name);

create index if not exists exercises_user_idx
  on public.exercises (created_by, name);

alter table public.exercises enable row level security;

create policy "Exercises read public or own"
  on public.exercises for select
  using (is_public = true or auth.uid() = created_by);

create policy "Exercises insert own"
  on public.exercises for insert
  with check (auth.uid() = created_by);

create policy "Exercises update own"
  on public.exercises for update
  using (auth.uid() = created_by);

create policy "Exercises delete own"
  on public.exercises for delete
  using (auth.uid() = created_by);

drop trigger if exists set_exercises_updated_at on public.exercises;
create trigger set_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

insert into public.exercises (name, category, is_public)
values
  ('Bench Press', 'Chest', true),
  ('Incline Bench Press', 'Chest', true),
  ('Dumbbell Bench Press', 'Chest', true),
  ('Push-Up', 'Chest', true),
  ('Chest Fly', 'Chest', true),
  ('Deadlift', 'Back', true),
  ('Barbell Row', 'Back', true),
  ('Pull-Up', 'Back', true),
  ('Lat Pulldown', 'Back', true),
  ('Seated Row', 'Back', true),
  ('Overhead Press', 'Shoulders', true),
  ('Dumbbell Shoulder Press', 'Shoulders', true),
  ('Lateral Raise', 'Shoulders', true),
  ('Rear Delt Fly', 'Shoulders', true),
  ('Bicep Curl', 'Arms', true),
  ('Hammer Curl', 'Arms', true),
  ('Tricep Pushdown', 'Arms', true),
  ('Tricep Dip', 'Arms', true),
  ('Squat', 'Legs', true),
  ('Front Squat', 'Legs', true),
  ('Leg Press', 'Legs', true),
  ('Romanian Deadlift', 'Legs', true),
  ('Lunges', 'Legs', true),
  ('Leg Curl', 'Legs', true),
  ('Leg Extension', 'Legs', true),
  ('Calf Raise', 'Legs', true),
  ('Plank', 'Core', true),
  ('Hanging Leg Raise', 'Core', true),
  ('Cable Crunch', 'Core', true),
  ('Clean and Press', 'Full Body', true),
  ('Kettlebell Swing', 'Full Body', true),
  ('Running', 'Cardio', true),
  ('Cycling', 'Cardio', true),
  ('Rowing', 'Cardio', true);

alter table public.workout_logs drop column if exists sets;
alter table public.workout_logs drop column if exists reps;
alter table public.workout_logs drop column if exists weight_kg;

alter table public.workout_logs
  add column if not exists exercise_id uuid references public.exercises(id) on delete set null,
  add column if not exists sets jsonb not null default '[]'::jsonb;
