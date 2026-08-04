-- RLS policy expressions run as the calling role, so authenticated needs USAGE
-- on the private schema + EXECUTE on the function. This is still NOT reachable
-- via /rest/v1/rpc because the Data API only exposes the public schema.
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;