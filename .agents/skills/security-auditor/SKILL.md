---
name: security-auditor
description: Audit this repo before making it public on GitHub and before sharing the live link. Checks for secrets, PII, unsafe DOM/SQL, RLS and GRANT gaps, privileged key leaks into client bundles, and confirms demo data is mocked or reset. Use when asked to open-source, publish, share the repo/link, or run a security/privacy review.
---

# Security auditor (pre-open-source)

Goal: the repository can be public **and** the deployed link can be public.
Two separate risk surfaces — audit both, never only the code.

Run the phases in order. Report findings as a table:
`severity (blocker / warning / note) | what | where | fix`.
Only claim "safe to publish" when zero blockers remain.

## Phase 1 — Repo secrets

```bash
bash scripts/scan-secrets.sh      # from the skill dir; see scripts/
```

Rules:
- `.env` MUST be in `.gitignore`; `.env.example` may contain only placeholder
  or publishable values.
- Publishable/anon Supabase keys and project URLs are **not** secrets.
- Service role keys, DB passwords, `sb_secret_*`, API tokens, private keys,
  webhook secrets, session tokens = **blockers**.
- `git log`/history is not rewritable here — if a real secret was ever
  committed, the fix is rotate the credential, not delete the file.
- Verify no secret is read at module scope in a client-reachable file, and
  that `client.server` / `supabaseAdmin` is only imported inside server
  handlers (`await import(...)`).

## Phase 2 — PII and personal data

Grep for anything a real person could be identified by: emails, phone
numbers, real names, addresses, IPs, avatars, uploaded files, free-text user
input persisted to the DB.

For each table that stores user input, decide one of:
1. **Mocked** — seeded fixture data only, no user writes. Preferred.
2. **Reset** — a scheduled job wipes it; confirm the job exists, its schedule,
   and that it actually runs (check `cron.job` and recent `cron.job_run_details`).
3. **Disabled** — feature turned off at DB, server and UI layer.

Anything else that accepts free-text from the public link is a blocker unless
the user explicitly accepts it.

## Phase 3 — Database exposure

For every table in `public`:
- RLS enabled?
- GRANTs match the policies (no `anon` grant without an `anon` policy)?
- No `anon`/`authenticated` read path to personal data?
- SECURITY DEFINER functions: `SET search_path`, EXECUTE granted narrowly?

Use `security--run_security_scan` and `supabase--linter`, then read the
results critically — an intentional demo decision is "not applicable", not
"fixed". Details: `references/db-checklist.md`.

## Phase 4 — Application code

- No `dangerouslySetInnerHTML` without DOMPurify, no `innerHTML`, no `eval`.
- Dynamic URLs restricted to `http:`/`https:`.
- Public API routes (`/api/public/*`) verify the caller (signature or
  timing-safe secret compare) before any write.
- No auth/permission decision made only in the client.
- Server functions that touch user data use `requireSupabaseAuth`.

## Phase 5 — Public link surface

- Anonymous visitor can only reach demo content.
- Rate/size limits on anything that writes.
- No stack traces, project ids, or dashboard links rendered to users.
- Confirm the reset job's cadence is short enough that anything a visitor
  types is short-lived.

## Phase 6 — Repo hygiene

- README states clearly: tech demo, auth intentionally disabled, data is
  wiped on a schedule, do not enter real data.
- LICENSE present.
- No internal notes, customer names, or private URLs in docs.
- `.gitignore` covers `.env*`, build output, local caches.

## Reporting

Write the result to `SECURITY-AUDIT.md` in the repo root (overwrite each run)
with the findings table, the verdict, and the date. Then summarise for the
user in plain language: what is safe, what must change before publishing.
