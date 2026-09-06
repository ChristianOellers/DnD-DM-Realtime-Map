-- is_gm no longer needs elevated rights: game_sessions is readable by signed-in users.
CREATE OR REPLACE FUNCTION public.is_gm(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = _session_id AND s.gm_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_gm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gm(uuid) TO authenticated, service_role;

-- claim_gm stays SECURITY DEFINER (it must bypass the "no direct session updates"
-- policy) but is no longer callable by signed-in users. It is invoked only by the
-- trusted server function, which verifies the caller and passes the verified id.
DROP FUNCTION IF EXISTS public.claim_gm(uuid);

CREATE OR REPLACE FUNCTION public.claim_gm(_session_id uuid, _user_id uuid)
RETURNS public.game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE result public.game_sessions;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  UPDATE public.game_sessions
     SET gm_user_id = _user_id, gm_claimed_at = now()
   WHERE id = _session_id
     AND (gm_user_id IS NULL OR gm_user_id = _user_id)
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    SELECT * INTO result FROM public.game_sessions WHERE id = _session_id;
    IF result.id IS NULL THEN RAISE EXCEPTION 'session not found'; END IF;
    RAISE EXCEPTION 'game master seat already taken';
  END IF;

  RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.claim_gm(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_gm(uuid, uuid) TO service_role;

-- Trigger-only helper: callable by nobody.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;