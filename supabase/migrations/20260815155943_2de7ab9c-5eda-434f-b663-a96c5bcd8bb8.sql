REVOKE ALL ON FUNCTION public.is_gm(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_gm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_gm(uuid) TO authenticated;