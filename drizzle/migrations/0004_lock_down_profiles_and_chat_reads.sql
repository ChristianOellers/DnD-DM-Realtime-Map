DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Chat is intentionally disabled for the demo: remove every access rule.
DROP POLICY IF EXISTS "chat readable by authenticated" ON public.chat_messages;
DROP POLICY IF EXISTS "authors insert own chat" ON public.chat_messages;
DROP POLICY IF EXISTS "gm logs events" ON public.chat_messages;
REVOKE ALL ON public.chat_messages FROM anon, authenticated;