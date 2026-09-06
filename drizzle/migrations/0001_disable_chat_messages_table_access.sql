-- Demo hardening: chat feature disabled (compliance/security/PII risk).
-- Revoke all Data API access to the chat table; RLS policies remain in place.
REVOKE ALL ON public.chat_messages FROM anon;
REVOKE ALL ON public.chat_messages FROM authenticated;