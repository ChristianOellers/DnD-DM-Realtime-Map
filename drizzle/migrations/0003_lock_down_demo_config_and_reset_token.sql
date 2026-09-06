-- The reset token must never be readable by app clients.
REVOKE ALL ON FUNCTION public.get_demo_reset_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_demo_reset_token() TO service_role;

-- demo_config holds the reset token row; only the server role needs it.
REVOKE ALL ON TABLE public.demo_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.demo_config TO service_role;