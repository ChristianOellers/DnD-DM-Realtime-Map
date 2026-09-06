#!/usr/bin/env bash
# Pre-open-source secret / PII sweep. Read-only. Prints matches, never values
# of matched env files. Run from the repo root.
set -uo pipefail

EXCL=(-g '!node_modules' -g '!dist' -g '!.git' -g '!bun.lockb' -g '!*.lock' -g '!SECURITY-AUDIT.md')

hdr() { printf '\n=== %s ===\n' "$1"; }

hdr "1. .env tracked or ignored"
grep -qE '^\.env' .gitignore && echo "ok: .gitignore covers .env" || echo "BLOCKER: .env not in .gitignore"
ls -1 .env* 2>/dev/null || echo "(no .env files present)"

hdr "2. High-risk secret patterns"
rg -n --no-heading "${EXCL[@]}" \
  -e 'service_role' \
  -e 'sb_secret_' \
  -e 'SUPABASE_SERVICE_ROLE_KEY\s*=\s*["'"'"'][^"'"'"']' \
  -e 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' \
  -e '\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}' \
  -e 'gh[pousr]_[A-Za-z0-9]{20,}' \
  -e 'AKIA[0-9A-Z]{16}' \
  -e 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.' \
  -e '(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["'"'"'][^"'"'"'{$][^"'"'"']{7,}' \
  . || echo "clean"

hdr "3. PII-looking literals"
rg -n --no-heading "${EXCL[@]}" \
  -e '[A-Za-z0-9._%+-]+@(?!example\.com|test\.|localhost)[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
  -e '\+[0-9]{1,3}[ -][0-9][0-9 -]{6,}' \
  . || echo "clean"

hdr "4. Privileged client leaking to browser code"
rg -n --no-heading "${EXCL[@]}" -e 'client\.server' -e 'supabaseAdmin' src || echo "clean"
echo "-> each hit must be inside a server handler (await import) or a *.server file"

hdr "5. Unsafe DOM / eval"
rg -n --no-heading "${EXCL[@]}" -e 'dangerouslySetInnerHTML' -e '\.innerHTML' -e '\beval\(' -e 'insertAdjacentHTML' src || echo "clean"

hdr "6. Public API routes (must verify caller)"
ls -1 src/routes/api/public 2>/dev/null && rg -n --no-heading -e 'timingSafeEqual' -e 'createHmac' src/routes/api/public || echo "(none)"

hdr "7. Built client bundle check (run after: bun run build)"
if [ -d dist ]; then
  rg -l --no-heading -e 'service_role' -e 'sb_secret_' dist && echo "BLOCKER: privileged key in build output" || echo "clean"
else
  echo "no dist/ — build first to check"
fi

printf '\nSweep done. Review every non-clean section by hand.\n'
