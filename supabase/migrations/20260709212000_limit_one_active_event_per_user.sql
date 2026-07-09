-- Prevent two browser tabs from starting separate active events for one user.
create unique index if not exists events_one_active_per_user_idx
  on public.events(user_id)
  where status = 'active' and user_id is not null;
