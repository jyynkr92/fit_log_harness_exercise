-- FitLog 초기 스키마: 운동 종목, 운동 세션, 세트
-- 모든 테이블 RLS 활성화 (CLAUDE.md 불변식 #10, docs/BACKEND.md)

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  category text not null default 'etc',
  owner_id uuid references auth.users (id) on delete cascade, -- null = 기본 제공 종목
  created_at timestamptz not null default now()
);
create unique index exercises_owner_name_idx on public.exercises (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  note text,
  check (ended_at is null or ended_at >= started_at)
);
create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_index int not null check (set_index >= 0),
  weight numeric(6, 2) not null check (weight >= 0),
  reps int not null check (reps > 0 and reps <= 1000),
  created_at timestamptz not null default now()
);
create index workout_sets_workout_idx on public.workout_sets (workout_id, set_index);

alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

-- exercises: 기본 종목 + 내 종목 조회, 내 종목만 수정
create policy "exercises_select" on public.exercises for select to authenticated
  using (owner_id is null or owner_id = auth.uid());
create policy "exercises_insert_own" on public.exercises for insert to authenticated
  with check (owner_id = auth.uid());
create policy "exercises_modify_own" on public.exercises for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "exercises_delete_own" on public.exercises for delete to authenticated
  using (owner_id = auth.uid());

-- workouts: 내 것만
create policy "workouts_all_own" on public.workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workout_sets: 부모 workout 소유자만
create policy "sets_all_via_workout" on public.workout_sets for all to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
