-- =====================================================================================
-- VerifyIT core schema: catalog, user progress, attempts, certificates, RLS, functions.
--
-- Security model
--   * The browser and the Express API both talk to Supabase with the public anon key plus
--     the user's JWT, so the database cannot tell them apart. Anything that must be
--     authoritative (quiz scores, investigation correctness, certificates) is therefore
--     written ONLY by SECURITY DEFINER functions that compute the result themselves.
--     Authenticated users get SELECT on their own rows and nothing else on those tables.
--   * Lesson and toolkit progress are self-reported by nature, so users may write their
--     own rows directly; RLS restricts every row to its owner.
--   * Answer keys and expected verdicts live in the `private` schema, which is not exposed
--     through the Data API and is not readable by anon/authenticated.
-- =====================================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

-- -------------------------------------------------------------------------------------
-- Shared helpers
-- -------------------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Normalizes a person's name: trims and collapses whitespace. Returns NULL for empty input.
create or replace function private.normalize_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), '');
$$;

create or replace function private.is_valid_name(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_name is not null
     and char_length(p_name) between 2 and 80
     and p_name !~ '[[:cntrl:]]';
$$;

-- -------------------------------------------------------------------------------------
-- Trusted catalog (seeded from the server catalog by the *_catalog_sync.sql migrations)
-- -------------------------------------------------------------------------------------

create table private.lessons (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  title text not null,
  sort_order integer not null,
  required_for_certificate boolean not null default true,
  active boolean not null default true
);

create table private.investigation_cases (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  title text not null,
  expected_verdict text not null check (expected_verdict in ('supported', 'misleading', 'insufficient')),
  sort_order integer not null,
  required_for_certificate boolean not null default true,
  active boolean not null default true
);

create table private.quiz_categories (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  title text not null,
  is_mixed boolean not null default false,
  questions_per_category integer check (questions_per_category is null or questions_per_category > 0),
  sort_order integer not null,
  active boolean not null default true,
  constraint quiz_categories_mixed_size check (not is_mixed or questions_per_category is not null)
);

create table private.quiz_questions (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  category_id text not null references private.quiz_categories (id) on update cascade,
  option_count integer not null check (option_count between 2 and 10),
  correct_option integer not null,
  active boolean not null default true,
  constraint quiz_questions_correct_option_range check (correct_option >= 0 and correct_option < option_count)
);
create index quiz_questions_category_idx on private.quiz_questions (category_id) where active;

create table private.toolkit_items (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  sort_order integer not null,
  active boolean not null default true
);

alter table private.lessons enable row level security;
alter table private.investigation_cases enable row level security;
alter table private.quiz_categories enable row level security;
alter table private.quiz_questions enable row level security;
alter table private.toolkit_items enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

-- -------------------------------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Trimmed, single-spaced, 2-80 characters, no control characters. The expressions are inlined
  -- so the check does not depend on privileges in the private schema.
  constraint profiles_display_name_valid check (
    display_name is null
    or (
      display_name = btrim(regexp_replace(display_name, '\s+', ' ', 'g'))
      and char_length(display_name) between 2 and 80
      and display_name !~ '[[:cntrl:]]'
    )
  )
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Creates a profile for every new auth user. An unusable display name never blocks sign-up;
-- the profile is created without one and the user can set it later.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := private.normalize_name(new.raw_user_meta_data ->> 'display_name');
begin
  if not private.is_valid_name(v_name) then
    v_name := null;
  end if;
  insert into public.profiles (id, display_name)
  values (new.id, v_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -------------------------------------------------------------------------------------
-- lesson_progress
-- -------------------------------------------------------------------------------------

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null references private.lessons (id) on update cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint lesson_progress_user_lesson_key unique (user_id, lesson_id),
  constraint lesson_progress_completed_at check (completed = (completed_at is not null))
);

-- Timestamps are always set by the database, and owner/lesson cannot be changed after insert.
-- The first completion time is preserved when a completed lesson is completed again.
create or replace function private.lesson_progress_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.lesson_id := old.lesson_id;
  end if;
  if new.completed then
    if tg_op = 'UPDATE' and old.completed then
      new.completed_at := old.completed_at;
    else
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger lesson_progress_before_write
  before insert or update on public.lesson_progress
  for each row execute function private.lesson_progress_before_write();

-- -------------------------------------------------------------------------------------
-- quiz_attempts and quiz_answer_results (written only by public.submit_quiz_attempt)
-- -------------------------------------------------------------------------------------

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null references private.quiz_categories (id) on update cascade,
  score integer not null,
  total_questions integer not null,
  client_attempt_id uuid,
  completed_at timestamptz not null default now(),
  constraint quiz_attempts_total_positive check (total_questions > 0),
  constraint quiz_attempts_score_range check (score >= 0 and score <= total_questions),
  -- Lets clients retry a submission (or sync it later) without creating duplicates.
  constraint quiz_attempts_client_attempt_key unique (user_id, client_attempt_id)
);
create index quiz_attempts_user_completed_idx on public.quiz_attempts (user_id, completed_at desc);
create index quiz_attempts_user_category_idx on public.quiz_attempts (user_id, category);

create table public.quiz_answer_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id text not null references private.quiz_questions (id) on update cascade,
  position smallint not null check (position >= 1),
  selected_answer smallint not null check (selected_answer >= 0),
  is_correct boolean not null,
  confidence_rating smallint check (confidence_rating between 1 and 5),
  created_at timestamptz not null default now(),
  constraint quiz_answer_results_attempt_question_key unique (attempt_id, question_id)
);

-- -------------------------------------------------------------------------------------
-- investigation_attempts (written only by public.submit_investigation_attempt)
-- -------------------------------------------------------------------------------------

create table public.investigation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id text not null references private.investigation_cases (id) on update cascade,
  selected_verdict text not null check (selected_verdict in ('supported', 'misleading', 'insufficient')),
  is_correct boolean not null,
  confidence_rating smallint check (confidence_rating between 1 and 5),
  client_attempt_id uuid,
  submitted_at timestamptz not null default now(),
  constraint investigation_attempts_client_attempt_key unique (user_id, client_attempt_id)
);
create index investigation_attempts_user_case_idx on public.investigation_attempts (user_id, case_id);
create index investigation_attempts_user_submitted_idx on public.investigation_attempts (user_id, submitted_at desc);

-- -------------------------------------------------------------------------------------
-- toolkit_progress
-- -------------------------------------------------------------------------------------

create table public.toolkit_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null references private.toolkit_items (id) on update cascade,
  checked boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint toolkit_progress_user_item_key unique (user_id, item_id)
);

create or replace function private.toolkit_progress_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.item_id := old.item_id;
  end if;
  return new;
end;
$$;

create trigger toolkit_progress_before_write
  before insert or update on public.toolkit_progress
  for each row execute function private.toolkit_progress_before_write();

-- -------------------------------------------------------------------------------------
-- certificates (written only by public.issue_certificate)
-- -------------------------------------------------------------------------------------

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  certificate_number text not null,
  certificate_type text not null default 'digital-literacy-completion',
  recipient_name text not null,
  issued_at timestamptz not null default now(),
  status text not null default 'active',
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint certificates_number_key unique (certificate_number),
  constraint certificates_number_format check (certificate_number ~ '^VIT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$'),
  constraint certificates_type_valid check (certificate_type in ('digital-literacy-completion')),
  constraint certificates_status_valid check (status in ('active', 'revoked')),
  constraint certificates_revoked_at check ((status = 'revoked') = (revoked_at is not null)),
  constraint certificates_recipient_name_valid check (
    recipient_name = btrim(regexp_replace(recipient_name, '\s+', ' ', 'g'))
    and char_length(recipient_name) between 2 and 80
    and recipient_name !~ '[[:cntrl:]]'
  )
);
create index certificates_user_idx on public.certificates (user_id);
-- At most one active certificate per user and certificate type, even under concurrent requests.
create unique index certificates_one_active_per_type on public.certificates (user_id, certificate_type) where status = 'active';

-- -------------------------------------------------------------------------------------
-- Row Level Security and privileges
-- (Supabase grants broad default privileges on new public tables; reset them explicitly.)
-- -------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answer_results enable row level security;
alter table public.investigation_attempts enable row level security;
alter table public.toolkit_progress enable row level security;
alter table public.certificates enable row level security;

revoke all on public.profiles, public.lesson_progress, public.quiz_attempts, public.quiz_answer_results,
  public.investigation_attempts, public.toolkit_progress, public.certificates
  from public, anon, authenticated;

-- profiles: read, create, and rename your own profile only.
grant select on public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- lesson_progress: own rows only. (user_id/lesson_id are in the update grant only because
-- upserts name them; the trigger keeps them unchanged.)
grant select on public.lesson_progress to authenticated;
grant insert (user_id, lesson_id, completed) on public.lesson_progress to authenticated;
grant update (user_id, lesson_id, completed) on public.lesson_progress to authenticated;
create policy "lesson_progress_select_own" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lesson_progress_insert_own" on public.lesson_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lesson_progress_update_own" on public.lesson_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- toolkit_progress: own rows only.
grant select on public.toolkit_progress to authenticated;
grant insert (user_id, item_id, checked) on public.toolkit_progress to authenticated;
grant update (user_id, item_id, checked) on public.toolkit_progress to authenticated;
create policy "toolkit_progress_select_own" on public.toolkit_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "toolkit_progress_insert_own" on public.toolkit_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "toolkit_progress_update_own" on public.toolkit_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Attempts and certificates: read-only for their owner. Writes happen only in the
-- SECURITY DEFINER functions below, which compute scores and eligibility themselves.
grant select on public.quiz_attempts, public.quiz_answer_results, public.investigation_attempts, public.certificates
  to authenticated;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "quiz_answer_results_select_own" on public.quiz_answer_results
  for select to authenticated using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = quiz_answer_results.attempt_id and a.user_id = (select auth.uid())
    )
  );
create policy "investigation_attempts_select_own" on public.investigation_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "certificates_select_own" on public.certificates
  for select to authenticated using ((select auth.uid()) = user_id);

-- -------------------------------------------------------------------------------------
-- Quiz submission: validates the answer set and scores it against the private answer key.
-- p_answers: [{ "question_id": text, "selected_answer": int, "confidence_rating": int|null }]
-- Returns { attempt_id, created }. Repeating a client_attempt_id returns the original attempt.
-- -------------------------------------------------------------------------------------

create or replace function public.submit_quiz_attempt(
  p_category text,
  p_answers jsonb,
  p_client_attempt_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_category private.quiz_categories;
  v_count integer;
  v_attempt_id uuid;
  v_existing_category text;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select * into v_category from private.quiz_categories where id = p_category and active;
  if not found then
    raise exception 'UNKNOWN_CATEGORY' using errcode = 'P0001';
  end if;

  if p_client_attempt_id is not null then
    select id, category into v_attempt_id, v_existing_category
    from public.quiz_attempts
    where user_id = v_user and client_attempt_id = p_client_attempt_id;
    if found then
      if v_existing_category <> p_category then
        raise exception 'CLIENT_ATTEMPT_ID_CONFLICT' using errcode = 'P0001';
      end if;
      return jsonb_build_object('attempt_id', v_attempt_id, 'created', false);
    end if;
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'INVALID_ANSWERS' using errcode = 'P0001';
  end if;
  v_count := jsonb_array_length(p_answers);
  if v_count = 0 or v_count > 100 then
    raise exception 'INVALID_ANSWERS' using errcode = 'P0001';
  end if;

  -- Shape and range checks. CASE guards keep casts from running on non-numbers.
  if exists (
    select 1
    from jsonb_array_elements(p_answers) e
    where jsonb_typeof(e) <> 'object'
       or jsonb_typeof(e -> 'question_id') is distinct from 'string'
       or jsonb_typeof(e -> 'selected_answer') is distinct from 'number'
       or (case when jsonb_typeof(e -> 'selected_answer') = 'number'
                then (e ->> 'selected_answer')::numeric not between 0 and 9
                  or (e ->> 'selected_answer')::numeric <> trunc((e ->> 'selected_answer')::numeric)
                else true end)
  ) then
    raise exception 'INVALID_ANSWERS' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) e
    where coalesce(jsonb_typeof(e -> 'confidence_rating'), 'null') <> 'null'
      and (case when jsonb_typeof(e -> 'confidence_rating') = 'number'
                then (e ->> 'confidence_rating')::numeric not in (1, 2, 3, 4, 5)
                else true end)
  ) then
    raise exception 'INVALID_CONFIDENCE' using errcode = 'P0001';
  end if;

  if (select count(distinct e ->> 'question_id') from jsonb_array_elements(p_answers) e) <> v_count then
    raise exception 'DUPLICATE_QUESTION' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) e
    left join private.quiz_questions q on q.id = e ->> 'question_id' and q.active
    where q.id is null
  ) then
    raise exception 'UNKNOWN_QUESTION' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) e
    join private.quiz_questions q on q.id = e ->> 'question_id'
    where (e ->> 'selected_answer')::integer >= q.option_count
  ) then
    raise exception 'INVALID_SELECTED_ANSWER' using errcode = 'P0001';
  end if;

  -- The answer set must be exactly what the quiz presents.
  if not v_category.is_mixed then
    -- A topic quiz contains every active question of its category.
    if exists (
      select 1
      from jsonb_array_elements(p_answers) e
      join private.quiz_questions q on q.id = e ->> 'question_id'
      where q.category_id <> v_category.id
    ) or v_count <> (select count(*) from private.quiz_questions where category_id = v_category.id and active) then
      raise exception 'INVALID_QUESTION_SET' using errcode = 'P0001';
    end if;
  else
    -- The Mixed Challenge draws questions_per_category questions from every active topic category.
    if exists (
      select 1
      from private.quiz_categories c
      where c.active and not c.is_mixed
        and v_category.questions_per_category <> (
          select count(*)
          from jsonb_array_elements(p_answers) e
          join private.quiz_questions q on q.id = e ->> 'question_id'
          where q.category_id = c.id
        )
    ) or v_count <> v_category.questions_per_category * (
      select count(*) from private.quiz_categories where active and not is_mixed
    ) then
      raise exception 'INVALID_QUESTION_SET' using errcode = 'P0001';
    end if;
  end if;

  begin
    insert into public.quiz_attempts (user_id, category, score, total_questions, client_attempt_id)
    select v_user,
           v_category.id,
           count(*) filter (where q.correct_option = (e ->> 'selected_answer')::integer),
           count(*),
           p_client_attempt_id
    from jsonb_array_elements(p_answers) e
    join private.quiz_questions q on q.id = e ->> 'question_id'
    returning id into v_attempt_id;

    insert into public.quiz_answer_results (attempt_id, question_id, position, selected_answer, is_correct, confidence_rating)
    select v_attempt_id,
           q.id,
           e.ord::smallint,
           (e.value ->> 'selected_answer')::smallint,
           q.correct_option = (e.value ->> 'selected_answer')::integer,
           (e.value ->> 'confidence_rating')::smallint
    from jsonb_array_elements(p_answers) with ordinality as e(value, ord)
    join private.quiz_questions q on q.id = e.value ->> 'question_id';
  exception when unique_violation then
    -- A concurrent request with the same client_attempt_id won the race.
    select id into v_attempt_id
    from public.quiz_attempts
    where user_id = v_user and client_attempt_id = p_client_attempt_id;
    if not found then
      raise;
    end if;
    return jsonb_build_object('attempt_id', v_attempt_id, 'created', false);
  end;

  return jsonb_build_object('attempt_id', v_attempt_id, 'created', true);
end;
$$;

-- -------------------------------------------------------------------------------------
-- Investigation submission: correctness comes from the private expected verdict.
-- Returns { attempt_id, created }.
-- -------------------------------------------------------------------------------------

create or replace function public.submit_investigation_attempt(
  p_case_id text,
  p_verdict text,
  p_confidence_rating integer default null,
  p_client_attempt_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_case private.investigation_cases;
  v_attempt_id uuid;
  v_existing_case text;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select * into v_case from private.investigation_cases where id = p_case_id and active;
  if not found then
    raise exception 'UNKNOWN_CASE' using errcode = 'P0001';
  end if;

  if p_verdict is null or p_verdict not in ('supported', 'misleading', 'insufficient') then
    raise exception 'INVALID_VERDICT' using errcode = 'P0001';
  end if;

  if p_confidence_rating is not null and p_confidence_rating not between 1 and 5 then
    raise exception 'INVALID_CONFIDENCE' using errcode = 'P0001';
  end if;

  if p_client_attempt_id is not null then
    select id, case_id into v_attempt_id, v_existing_case
    from public.investigation_attempts
    where user_id = v_user and client_attempt_id = p_client_attempt_id;
    if found then
      if v_existing_case <> p_case_id then
        raise exception 'CLIENT_ATTEMPT_ID_CONFLICT' using errcode = 'P0001';
      end if;
      return jsonb_build_object('attempt_id', v_attempt_id, 'created', false);
    end if;
  end if;

  begin
    insert into public.investigation_attempts (user_id, case_id, selected_verdict, is_correct, confidence_rating, client_attempt_id)
    values (v_user, v_case.id, p_verdict, v_case.expected_verdict = p_verdict, p_confidence_rating, p_client_attempt_id)
    returning id into v_attempt_id;
  exception when unique_violation then
    select id into v_attempt_id
    from public.investigation_attempts
    where user_id = v_user and client_attempt_id = p_client_attempt_id;
    if not found then
      raise;
    end if;
    return jsonb_build_object('attempt_id', v_attempt_id, 'created', false);
  end;

  return jsonb_build_object('attempt_id', v_attempt_id, 'created', true);
end;
$$;

-- -------------------------------------------------------------------------------------
-- Certificate eligibility (single source of truth, used by the API and by issuance)
-- -------------------------------------------------------------------------------------

create or replace function private.certificate_progress(p_user_id uuid)
returns table (
  eligible boolean,
  completed_lessons integer,
  required_lessons integer,
  completed_cases integer,
  required_cases integer,
  missing_lesson_ids text[],
  missing_case_ids text[]
)
language sql
stable
set search_path = ''
as $$
  with required_lessons as (
    select id, sort_order from private.lessons where active and required_for_certificate
  ),
  done_lessons as (
    select lp.lesson_id
    from public.lesson_progress lp
    join required_lessons rl on rl.id = lp.lesson_id
    where lp.user_id = p_user_id and lp.completed
  ),
  required_cases as (
    select id, sort_order from private.investigation_cases where active and required_for_certificate
  ),
  done_cases as (
    select distinct ia.case_id
    from public.investigation_attempts ia
    join required_cases rc on rc.id = ia.case_id
    where ia.user_id = p_user_id
  ),
  totals as (
    select
      (select count(*) from done_lessons)::integer as completed_lessons,
      (select count(*) from required_lessons)::integer as required_lessons,
      (select count(*) from done_cases)::integer as completed_cases,
      (select count(*) from required_cases)::integer as required_cases,
      coalesce((select array_agg(id order by sort_order) from required_lessons
                where id not in (select lesson_id from done_lessons)), '{}') as missing_lesson_ids,
      coalesce((select array_agg(id order by sort_order) from required_cases
                where id not in (select case_id from done_cases)), '{}') as missing_case_ids
  )
  select
    -- An empty catalog must never make everyone eligible.
    required_lessons > 0 and required_cases > 0
      and cardinality(missing_lesson_ids) = 0 and cardinality(missing_case_ids) = 0,
    completed_lessons, required_lessons, completed_cases, required_cases,
    missing_lesson_ids, missing_case_ids
  from totals;
$$;

create or replace function public.get_certificate_eligibility()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_progress record;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  select * into v_progress from private.certificate_progress(v_user);
  return jsonb_build_object(
    'eligible', v_progress.eligible,
    'completed_lessons', v_progress.completed_lessons,
    'required_lessons', v_progress.required_lessons,
    'completed_cases', v_progress.completed_cases,
    'required_cases', v_progress.required_cases,
    'missing_lesson_ids', to_jsonb(v_progress.missing_lesson_ids),
    'missing_case_ids', to_jsonb(v_progress.missing_case_ids)
  );
end;
$$;

-- -------------------------------------------------------------------------------------
-- Certificate issuance: idempotent and safe under concurrent requests.
-- Returns { certificate_id, created }. An existing active certificate is returned as-is.
-- -------------------------------------------------------------------------------------

create or replace function public.issue_certificate(p_recipient_name text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_type constant text := 'digital-literacy-completion';
  v_user uuid := auth.uid();
  v_name text := private.normalize_name(p_recipient_name);
  v_existing uuid;
  v_progress record;
  v_id uuid;
  v_hex text;
  v_tries integer := 0;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  -- Serialize issuance per user so simultaneous requests cannot both pass the checks below.
  perform pg_advisory_xact_lock(hashtextextended('verifyit:certificate:' || v_user::text, 0));

  select id into v_existing
  from public.certificates
  where user_id = v_user and certificate_type = c_type and status = 'active';
  if found then
    return jsonb_build_object('certificate_id', v_existing, 'created', false);
  end if;

  if not private.is_valid_name(v_name) then
    raise exception 'INVALID_RECIPIENT_NAME' using errcode = 'P0001';
  end if;

  select * into v_progress from private.certificate_progress(v_user);
  if not v_progress.eligible then
    raise exception 'NOT_ELIGIBLE' using errcode = 'P0001';
  end if;

  loop
    v_tries := v_tries + 1;
    -- 64 random bits, formatted as VIT-XXXX-XXXX-XXXX-XXXX. Non-sequential and unguessable.
    v_hex := upper(encode(extensions.gen_random_bytes(8), 'hex'));
    begin
      insert into public.certificates (user_id, certificate_number, certificate_type, recipient_name)
      values (
        v_user,
        format('VIT-%s-%s-%s-%s', substr(v_hex, 1, 4), substr(v_hex, 5, 4), substr(v_hex, 9, 4), substr(v_hex, 13, 4)),
        c_type,
        v_name
      )
      returning id into v_id;
      return jsonb_build_object('certificate_id', v_id, 'created', true);
    exception when unique_violation then
      select id into v_existing
      from public.certificates
      where user_id = v_user and certificate_type = c_type and status = 'active';
      if found then
        return jsonb_build_object('certificate_id', v_existing, 'created', false);
      end if;
      -- Otherwise the random number collided; try a new one.
      if v_tries >= 5 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

-- -------------------------------------------------------------------------------------
-- Public certificate verification: returns only what is printed on the certificate.
-- Never returns user ids, emails, or progress. Returns NULL when the number is unknown.
-- -------------------------------------------------------------------------------------

create or replace function public.verify_certificate(p_certificate_number text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'certificate_number', c.certificate_number,
    'certificate_type', c.certificate_type,
    'status', c.status,
    'issued_at', c.issued_at,
    'revoked_at', c.revoked_at,
    -- The name is only disclosed while the certificate is valid.
    'recipient_name', case when c.status = 'active' then c.recipient_name end
  )
  from public.certificates c
  where c.certificate_number = upper(btrim(p_certificate_number));
$$;

-- -------------------------------------------------------------------------------------
-- Function privileges (Postgres grants EXECUTE to PUBLIC by default; reset explicitly)
-- -------------------------------------------------------------------------------------

revoke all on all functions in schema private from public, anon, authenticated;

revoke all on function public.submit_quiz_attempt(text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.submit_investigation_attempt(text, text, integer, uuid) from public, anon, authenticated;
revoke all on function public.get_certificate_eligibility() from public, anon, authenticated;
revoke all on function public.issue_certificate(text) from public, anon, authenticated;
revoke all on function public.verify_certificate(text) from public, anon, authenticated;

grant execute on function public.submit_quiz_attempt(text, jsonb, uuid) to authenticated;
grant execute on function public.submit_investigation_attempt(text, text, integer, uuid) to authenticated;
grant execute on function public.get_certificate_eligibility() to authenticated;
grant execute on function public.issue_certificate(text) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
