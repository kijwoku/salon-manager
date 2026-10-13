create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee' check (role in ('manager', 'employee')),
  created_at timestamptz not null default now()
);
create table if not exists public.task_lists (
  id bigint generated always as identity primary key,
  title text not null,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  list_id bigint not null references public.task_lists(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists task_lists_employee_idx on public.task_lists(employee_id);
create index if not exists tasks_list_idx on public.tasks(list_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'manager');
$$;

create or replace function public.set_task_done(task_id bigint, done boolean)
returns public.tasks language plpgsql security definer set search_path = public as $$
declare result public.tasks;
begin
  update public.tasks t
     set done_at = case when done then coalesce(t.done_at, now()) else null end
   where t.id = task_id
     and exists (select 1 from public.task_lists l where l.id = t.list_id
                 and (l.employee_id = auth.uid() or public.is_manager()))
  returning t.* into result;
  if result.id is null then raise exception 'Brak dostępu do tego zadania'; end if;
  return result;
end $$;

alter table public.profiles enable row level security;
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager());
drop policy if exists "task_lists_select" on public.task_lists;
create policy "task_lists_select" on public.task_lists for select to authenticated
  using (employee_id = auth.uid() or public.is_manager());
drop policy if exists "task_lists_manager_write" on public.task_lists;
create policy "task_lists_manager_write" on public.task_lists for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks for select to authenticated
  using (public.is_manager() or exists (select 1 from public.task_lists l
         where l.id = list_id and l.employee_id = auth.uid()));
drop policy if exists "tasks_manager_write" on public.tasks;
create policy "tasks_manager_write" on public.tasks for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

revoke all on function public.set_task_done(bigint, boolean) from public, anon;
grant execute on function public.set_task_done(bigint, boolean) to authenticated;
grant execute on function public.is_manager() to authenticated;
