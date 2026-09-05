begin;

create extension if not exists pgcrypto;

alter table public.members
  alter column fixed_rent type bigint using fixed_rent::bigint,
  add column if not exists version integer not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.monthly_cycles
  alter column electricity_amount type bigint using electricity_amount::bigint,
  alter column water_amount type bigint using water_amount::bigint,
  add column if not exists version integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.monthly_overrides
  alter column parking_fee type bigint using parking_fee::bigint,
  add column if not exists is_paid boolean not null default false,
  add column if not exists is_excluded boolean not null default false,
  add column if not exists version integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.global_settings
  alter column value type text using value::text,
  add column if not exists version integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

update public.members
set version = greatest(coalesce(version, 1), 1);

update public.monthly_cycles
set electricity_amount = coalesce(electricity_amount, 0),
    water_amount = coalesce(water_amount, 0),
    version = greatest(coalesce(version, 1), 1);

update public.monthly_overrides
set parking_fee = coalesce(parking_fee, 173000),
    is_paid = coalesce(is_paid, false),
    is_excluded = coalesce(is_excluded, false),
    version = greatest(coalesce(version, 1), 1);

update public.global_settings
set version = greatest(coalesce(version, 1), 1);

-- Production cũ đã từng seed lại 7 lần. Chọn bản ghi đang được dữ liệu tháng
-- tham chiếu làm bản chuẩn, chuyển mọi liên kết rồi lưu trữ các bản trùng.
create temporary table _member_canonical on commit drop as
with usage_counts as (
  select
    member.id,
    lower(btrim(member.name)) as name_key,
    (select count(*) from public.monthly_overrides item where item.member_id = member.id)
      + (select count(*) from public.extra_expenses item where item.buyer_id = member.id) as reference_count
  from public.members member
)
select
  id as source_id,
  first_value(id) over (
    partition by name_key
    order by reference_count desc, id
  ) as canonical_id
from usage_counts;

do $$
begin
  if exists (
    select 1
    from public.monthly_overrides item
    join _member_canonical mapping on mapping.source_id = item.member_id
    group by item.cycle_id, mapping.canonical_id
    having count(*) > 1
  ) then
    raise exception 'MEMBER_DEDUPE_OVERRIDE_COLLISION';
  end if;
end $$;

update public.monthly_overrides item
set member_id = mapping.canonical_id
from _member_canonical mapping
where item.member_id = mapping.source_id
  and mapping.source_id <> mapping.canonical_id;

update public.extra_expenses item
set buyer_id = mapping.canonical_id
from _member_canonical mapping
where item.buyer_id = mapping.source_id
  and mapping.source_id <> mapping.canonical_id;

update public.members member
set archived_at = coalesce(member.archived_at, now()),
    updated_at = now()
from _member_canonical mapping
where member.id = mapping.source_id
  and mapping.source_id <> mapping.canonical_id;

alter table public.monthly_cycles
  alter column electricity_amount set default 0,
  alter column electricity_amount set not null,
  alter column water_amount set default 0,
  alter column water_amount set not null;

alter table public.monthly_overrides
  alter column parking_fee set default 173000,
  alter column parking_fee set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'members_name_length_check') then
    alter table public.members add constraint members_name_length_check
      check (char_length(btrim(name)) between 1 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'members_fixed_rent_range_check') then
    alter table public.members add constraint members_fixed_rent_range_check
      check (fixed_rent between 0 and 100000000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'monthly_cycles_year_range_check') then
    alter table public.monthly_cycles add constraint monthly_cycles_year_range_check
      check (year between 2024 and 2100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'monthly_cycles_electricity_range_check') then
    alter table public.monthly_cycles add constraint monthly_cycles_electricity_range_check
      check (electricity_amount between 0 and 100000000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'monthly_cycles_water_range_check') then
    alter table public.monthly_cycles add constraint monthly_cycles_water_range_check
      check (water_amount between 0 and 100000000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'monthly_overrides_parking_range_check') then
    alter table public.monthly_overrides add constraint monthly_overrides_parking_range_check
      check (parking_fee between 0 and 10000000);
  end if;
  alter table public.global_settings drop constraint if exists global_settings_key_check;
  alter table public.global_settings add constraint global_settings_key_check
    check (key in ('service_fee', 'admin_pin_hash', 'admin_pin'));
end $$;

create unique index if not exists members_active_name_ci_unique
  on public.members (lower(btrim(name)))
  where archived_at is null;

create unique index if not exists monthly_cycles_month_year_unique
  on public.monthly_cycles (month, year);

create unique index if not exists monthly_overrides_cycle_member_unique
  on public.monthly_overrides (cycle_id, member_id);

alter table public.monthly_overrides
  drop constraint if exists monthly_overrides_member_id_fkey,
  add constraint monthly_overrides_member_id_fkey
    foreign key (member_id) references public.members(id) on delete restrict;

alter table public.extra_expenses
  drop constraint if exists extra_expenses_buyer_id_fkey,
  add constraint extra_expenses_buyer_id_fkey
    foreign key (buyer_id) references public.members(id) on delete restrict;

create table if not exists public.mutation_receipts (
  idempotency_key uuid primary key,
  operation text not null,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.extra_expenses is
  'LEGACY_DISABLED: dữ liệu lịch sử, không còn được API hoặc công thức chốt sổ sử dụng';

alter table public.members enable row level security;
alter table public.monthly_cycles enable row level security;
alter table public.monthly_overrides enable row level security;
alter table public.global_settings enable row level security;
alter table public.mutation_receipts enable row level security;
alter table public.extra_expenses enable row level security;

revoke all on table public.members from anon, authenticated;
revoke all on table public.monthly_cycles from anon, authenticated;
revoke all on table public.monthly_overrides from anon, authenticated;
revoke all on table public.global_settings from anon, authenticated;
revoke all on table public.mutation_receipts from anon, authenticated;
revoke all on table public.extra_expenses from anon, authenticated;

grant select, insert, update, delete on table public.members to service_role;
grant select, insert, update, delete on table public.monthly_cycles to service_role;
grant select, insert, update, delete on table public.monthly_overrides to service_role;
grant select, insert, update, delete on table public.global_settings to service_role;
grant select, insert, update, delete on table public.mutation_receipts to service_role;

create or replace function public.update_monthly_utilities_v2(
  p_month integer,
  p_year integer,
  p_electricity bigint,
  p_water bigint,
  p_expected_version integer,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation constant text := 'update_monthly_utilities_v2';
  v_hash text;
  v_existing_hash text;
  v_existing_operation text;
  v_response jsonb;
  v_cycle public.monthly_cycles%rowtype;
begin
  if p_month is null or p_year is null or p_electricity is null or p_water is null
     or p_expected_version is null or p_idempotency_key is null
     or p_month not between 1 and 12 or p_year not between 2024 and 2100
     or p_electricity not between 0 and 100000000
     or p_water not between 0 and 100000000
     or p_expected_version < 0 then
    raise exception 'INVALID_INPUT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('idem:' || p_idempotency_key::text, 0));
  v_hash := encode(extensions.digest(concat_ws('|', p_month, p_year, p_electricity, p_water, p_expected_version)::bytea, 'sha256'), 'hex');

  select operation, request_hash, response
  into v_existing_operation, v_existing_hash, v_response
  from public.mutation_receipts
  where idempotency_key = p_idempotency_key;

  if found then
    if v_existing_operation <> v_operation or v_existing_hash <> v_hash then
      raise exception 'IDEMPOTENCY_KEY_REUSED';
    end if;
    return v_response;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('cycle:' || p_year::text || ':' || p_month::text, 0));
  select * into v_cycle from public.monthly_cycles
  where month = p_month and year = p_year for update;

  if not found then
    if p_expected_version <> 0 then raise exception 'VERSION_CONFLICT'; end if;
    insert into public.monthly_cycles(month, year, electricity_amount, water_amount, version, updated_at)
    values (p_month, p_year, p_electricity, p_water, 1, now())
    returning * into v_cycle;
  else
    if v_cycle.version <> p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
    update public.monthly_cycles
    set electricity_amount = p_electricity,
        water_amount = p_water,
        version = version + 1,
        updated_at = now()
    where id = v_cycle.id
    returning * into v_cycle;
  end if;

  v_response := jsonb_build_object('id', v_cycle.id, 'version', v_cycle.version);
  insert into public.mutation_receipts(idempotency_key, operation, request_hash, response)
  values (p_idempotency_key, v_operation, v_hash, v_response);
  return v_response;
end;
$$;

create or replace function public.update_member_override_v2(
  p_member_id uuid,
  p_month integer,
  p_year integer,
  p_parking_fee bigint,
  p_is_excluded boolean,
  p_expected_version integer,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation constant text := 'update_member_override_v2';
  v_hash text;
  v_existing_hash text;
  v_existing_operation text;
  v_response jsonb;
  v_cycle public.monthly_cycles%rowtype;
  v_override public.monthly_overrides%rowtype;
begin
  if p_member_id is null or p_month is null or p_year is null or p_parking_fee is null
     or p_is_excluded is null or p_expected_version is null or p_idempotency_key is null
     or p_month not between 1 and 12 or p_year not between 2024 and 2100
     or p_parking_fee not between 0 and 10000000 or p_expected_version < 0 then
    raise exception 'INVALID_INPUT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('idem:' || p_idempotency_key::text, 0));
  v_hash := encode(extensions.digest(concat_ws('|', p_member_id, p_month, p_year, p_parking_fee, p_is_excluded, p_expected_version)::bytea, 'sha256'), 'hex');
  select operation, request_hash, response into v_existing_operation, v_existing_hash, v_response
  from public.mutation_receipts where idempotency_key = p_idempotency_key;
  if found then
    if v_existing_operation <> v_operation or v_existing_hash <> v_hash then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
    return v_response;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('cycle:' || p_year::text || ':' || p_month::text, 0));
  select * into v_cycle from public.monthly_cycles where month = p_month and year = p_year for update;
  if not found then
    insert into public.monthly_cycles(month, year, version) values (p_month, p_year, 1) returning * into v_cycle;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('override:' || v_cycle.id::text || ':' || p_member_id::text, 0));
  select * into v_override from public.monthly_overrides
  where cycle_id = v_cycle.id and member_id = p_member_id for update;

  if not found then
    if p_expected_version <> 0 then raise exception 'VERSION_CONFLICT'; end if;
    insert into public.monthly_overrides(cycle_id, member_id, parking_fee, is_excluded, is_paid, version, updated_at)
    values (v_cycle.id, p_member_id, p_parking_fee, p_is_excluded, false, 1, now())
    returning * into v_override;
  else
    if v_override.version <> p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
    update public.monthly_overrides
    set parking_fee = p_parking_fee,
        is_excluded = p_is_excluded,
        version = version + 1,
        updated_at = now()
    where id = v_override.id
    returning * into v_override;
  end if;

  v_response := jsonb_build_object('id', v_override.id, 'version', v_override.version);
  insert into public.mutation_receipts(idempotency_key, operation, request_hash, response)
  values (p_idempotency_key, v_operation, v_hash, v_response);
  return v_response;
end;
$$;

create or replace function public.update_payment_status_v2(
  p_member_id uuid,
  p_month integer,
  p_year integer,
  p_is_paid boolean,
  p_expected_version integer,
  p_idempotency_key uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation constant text := 'update_payment_status_v2';
  v_hash text;
  v_existing_hash text;
  v_existing_operation text;
  v_response jsonb;
  v_cycle public.monthly_cycles%rowtype;
  v_override public.monthly_overrides%rowtype;
begin
  if p_member_id is null or p_month is null or p_year is null or p_is_paid is null
     or p_expected_version is null or p_idempotency_key is null
     or p_month not between 1 and 12 or p_year not between 2024 and 2100 or p_expected_version < 0 then
    raise exception 'INVALID_INPUT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('idem:' || p_idempotency_key::text, 0));
  v_hash := encode(extensions.digest(concat_ws('|', p_member_id, p_month, p_year, p_is_paid, p_expected_version)::bytea, 'sha256'), 'hex');
  select operation, request_hash, response into v_existing_operation, v_existing_hash, v_response
  from public.mutation_receipts where idempotency_key = p_idempotency_key;
  if found then
    if v_existing_operation <> v_operation or v_existing_hash <> v_hash then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
    return v_response;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('cycle:' || p_year::text || ':' || p_month::text, 0));
  select * into v_cycle from public.monthly_cycles where month = p_month and year = p_year for update;
  if not found then
    insert into public.monthly_cycles(month, year, version) values (p_month, p_year, 1) returning * into v_cycle;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('override:' || v_cycle.id::text || ':' || p_member_id::text, 0));
  select * into v_override from public.monthly_overrides
  where cycle_id = v_cycle.id and member_id = p_member_id for update;

  if not found then
    if p_expected_version <> 0 then raise exception 'VERSION_CONFLICT'; end if;
    insert into public.monthly_overrides(cycle_id, member_id, parking_fee, is_excluded, is_paid, version, updated_at)
    values (v_cycle.id, p_member_id, 173000, false, p_is_paid, 1, now())
    returning * into v_override;
  else
    if v_override.version <> p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
    update public.monthly_overrides
    set is_paid = p_is_paid,
        version = version + 1,
        updated_at = now()
    where id = v_override.id
    returning * into v_override;
  end if;

  v_response := jsonb_build_object('id', v_override.id, 'version', v_override.version);
  insert into public.mutation_receipts(idempotency_key, operation, request_hash, response)
  values (p_idempotency_key, v_operation, v_hash, v_response);
  return v_response;
end;
$$;

revoke all on function public.update_monthly_utilities_v2(integer, integer, bigint, bigint, integer, uuid) from public, anon, authenticated;
revoke all on function public.update_member_override_v2(uuid, integer, integer, bigint, boolean, integer, uuid) from public, anon, authenticated;
revoke all on function public.update_payment_status_v2(uuid, integer, integer, boolean, integer, uuid) from public, anon, authenticated;

grant execute on function public.update_monthly_utilities_v2(integer, integer, bigint, bigint, integer, uuid) to service_role;
grant execute on function public.update_member_override_v2(uuid, integer, integer, bigint, boolean, integer, uuid) to service_role;
grant execute on function public.update_payment_status_v2(uuid, integer, integer, boolean, integer, uuid) to service_role;

commit;
