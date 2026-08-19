-- handle_new_user is a trigger-only function: no client should call it
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- claim_gm: only allow taking a free GM seat (or re-claiming your own)
CREATE OR REPLACE FUNCTION public.claim_gm(_session_id uuid)
RETURNS game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result public.game_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  UPDATE public.game_sessions
     SET gm_user_id = auth.uid(), gm_claimed_at = now()
   WHERE id = _session_id
     AND (gm_user_id IS NULL OR gm_user_id = auth.uid())
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    SELECT * INTO result FROM public.game_sessions WHERE id = _session_id;
    IF result.id IS NULL THEN RAISE EXCEPTION 'session not found'; END IF;
    RAISE EXCEPTION 'game master seat already taken';
  END IF;
  RETURN result;
END; $function$;

REVOKE ALL ON FUNCTION public.claim_gm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_gm(uuid) TO authenticated;

-- is_gm is a read-only ownership check used by RLS policies; keep it callable
-- by signed-in users but never by anonymous ones.
REVOKE ALL ON FUNCTION public.is_gm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gm(uuid) TO authenticated;