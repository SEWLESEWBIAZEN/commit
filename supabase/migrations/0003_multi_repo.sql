-- Commit — multiple tracked repos
-- Run after 0002. Replaces the single selected_repo with an array of repos;
-- a push to ANY tracked repo counts toward the (still single) streak.

alter table public.github_connections
  add column if not exists selected_repos text[] not null default '{}';

-- Backfill the array from the legacy single column for existing users.
update public.github_connections
   set selected_repos = array[selected_repo]
 where selected_repo is not null
   and coalesce(array_length(selected_repos, 1), 0) = 0;

-- Expose the array (no tokens) to the owner via the existing safe view.
-- Drop first: `create or replace view` cannot insert a new column before an
-- existing one (selected_repos goes ahead of updated_at), which errors with
-- SQLSTATE 42P16. Dropping and recreating sidesteps the column-order rule.
drop view if exists public.my_github_connection;
create view public.my_github_connection
  with (security_invoker = true) as
  select user_id, selected_repo, selected_repos, updated_at
  from public.github_connections
  where user_id = auth.uid();
