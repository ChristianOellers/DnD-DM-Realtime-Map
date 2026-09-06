# Database audit checklist

Run these read-only queries with `supabase--read_query`.

## Tables without RLS

```sql
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
```

## Grants per role

```sql
select table_name, grantee, string_agg(privilege_type, ',') as privs
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated','service_role')
group by 1,2 order by 1,2;
```

Any `anon` grant must be matched by an explicit `TO anon` policy and must not
expose personal data.

## Policies

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' order by tablename;
```

Look for: `using (true)` on user data, missing `with_check` on INSERT/UPDATE,
write policies that do not scope to `auth.uid()`.

## SECURITY DEFINER functions

```sql
select p.proname, p.prosecdef, p.proconfig,
       array(select grantee || ':' || privilege_type
             from information_schema.role_routine_grants g
             where g.routine_name = p.proname) as grants
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public';
```

Every definer function needs `search_path=public` in `proconfig` and EXECUTE
granted only to the roles that genuinely need it (trigger-only functions:
revoke from everyone).

## Reset job

```sql
select jobid, schedule, active, command from cron.job;
select jobid, status, start_time from cron.job_run_details
order by start_time desc limit 10;
```

Confirm the job is `active`, the schedule matches what the docs claim, and the
recent runs succeeded. A reset job that has never run is not a mitigation.

## Personal data sweep

For each table holding free text, sample it:

```sql
select * from public.<table> order by created_at desc limit 20;
```

Anything that looks like a real name, email, or message from a real visitor
means the mitigation is not working.
