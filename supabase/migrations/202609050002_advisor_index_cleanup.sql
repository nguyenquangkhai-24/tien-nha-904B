begin;

-- Các UNIQUE constraint cũ đã có sẵn index tương đương; bỏ hai index lặp do
-- migration hardening tạo ra sau khi Supabase Advisor phát hiện.
drop index if exists public.monthly_cycles_month_year_unique;
drop index if exists public.monthly_overrides_cycle_member_unique;

-- Bao phủ foreign key để kiểm tra RESTRICT và join không phải quét toàn bảng.
create index if not exists monthly_overrides_member_id_idx
  on public.monthly_overrides (member_id);

create index if not exists extra_expenses_buyer_id_idx
  on public.extra_expenses (buyer_id);

create index if not exists extra_expenses_cycle_id_idx
  on public.extra_expenses (cycle_id);

commit;
