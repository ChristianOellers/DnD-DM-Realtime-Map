-- 1) Anonymous (unauthenticated) role must not reach any game table.
--    The demo signs players in anonymously, which uses the `authenticated`
--    role, so gameplay is unaffected.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- 2) Signed-in players only get the CRUD verbs the app needs
--    (no TRUNCATE/REFERENCES/TRIGGER). RLS still gates every row.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_positions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.effects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fog_cells TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_chapters TO authenticated;

-- 3) GM seat: readable by players, but never writable directly.
--    The only way to take the seat is public.claim_gm(), which is
--    SECURITY DEFINER and refuses an occupied seat.
GRANT SELECT ON public.game_sessions TO authenticated;
COMMENT ON TABLE public.game_sessions IS
  'GM seat is claimed exclusively through public.claim_gm(). Direct INSERT/UPDATE/DELETE is denied by both privileges and the absence of RLS policies.';

-- Explicit, self-documenting deny policies for direct seat writes.
DROP POLICY IF EXISTS "no direct session inserts" ON public.game_sessions;
DROP POLICY IF EXISTS "no direct session updates" ON public.game_sessions;
DROP POLICY IF EXISTS "no direct session deletes" ON public.game_sessions;
CREATE POLICY "no direct session inserts" ON public.game_sessions
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no direct session updates" ON public.game_sessions
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no direct session deletes" ON public.game_sessions
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- 4) Service role keeps full access for server-side/admin work.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 5) SECURITY DEFINER functions: locked to signed-in players only.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_gm(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_gm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_gm(uuid) TO authenticated;