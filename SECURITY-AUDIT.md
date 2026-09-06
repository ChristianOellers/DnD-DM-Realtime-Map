# Security audit — pre-open-source

Date: 2026-09-06 · Scope: repository (public GitHub) + live demo link
Verdict: **safe to publish once the two open items below are handled** (one needs your decision).

| Severity | Finding | Where | Status / fix |
| --- | --- | --- | --- |
| Blocker | Reset token readable by any signed-in or anonymous visitor (`get_demo_reset_token` was executable by `PUBLIC`/`anon`/`authenticated`), allowing anyone to trigger the demo wipe endpoint | database function + `demo_config` | **Fixed** — EXECUTE and table access revoked, now `service_role` only (migration `0003`) |
| Blocker | `.env` was not ignored by git, so local settings could be committed | `.gitignore` | **Fixed** — `.env`, `.env.local`, `.env.*.local` ignored; `.env.example` stays |
| Blocker | No LICENSE file — a repo without one is not legally open source | repo root | **Open** — pick a licence (MIT recommended) |
| Warning | Daily reset job has never executed yet (`cron.job_run_details` empty; rescheduled today) | cron job 3, `0 0 * * *` | **Open** — re-check after the first midnight UTC run |
| Note | No secrets in the repo. `.env` holds only the publishable key, project id and URL — all public by design. No service-role key, password, private key or API token anywhere | repo-wide sweep | Pass |
| Note | Built client bundle contains only the literal string `sb_secret_` used for a key-format check, not an actual key | `dist/client/assets` | Pass |
| Note | No personal data in the repo — no emails, phone numbers, names or addresses | repo-wide sweep | Pass |
| Note | Database currently holds 0 player names and 0 chat rows; chat is fully disabled (no grants for any app role) | `profiles`, `chat_messages` | Pass |
| Note | Every table has row-level security on; anonymous visitors have no direct table access; game session rows cannot be written directly (GM seat only via the guarded server call) | `public` schema | Pass |
| Note | Privileged database client is only ever loaded inside server handlers | `reset-demo.ts`, `gm.functions.ts` | Pass |
| Note | Public reset endpoint verifies its secret with a timing-safe comparison before any write | `/api/public/hooks/reset-demo` | Pass |
| Note | Only unsafe-HTML usage is the unused shadcn chart component, fed by developer-defined theme colours, never user input | `src/components/ui/chart.tsx` | Acceptable (or delete the unused file) |
| Note | Linter flags on `cron.job` policies and the seat-claim function are Supabase-internal / intentional demo decisions | database linter | Not applicable |
| Note | README already states the demo nature and that data is reset regularly | `README.md` | Pass |

## Player names

Names typed on the entry screen are the only user-supplied data that is stored.
They are visible to other signed-in players (needed for the game), are wiped by
the daily reset job, and the README warns not to enter anything important.
Shortening the reset interval would reduce exposure further.
