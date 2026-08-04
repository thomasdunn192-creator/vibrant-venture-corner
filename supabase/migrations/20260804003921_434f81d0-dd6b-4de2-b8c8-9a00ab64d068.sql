CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- Internal-only role check. Lives in `private` (not exposed to the Data API)
-- so signed-in users cannot call it via /rest/v1/rpc to probe other users' roles.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

-- Repoint the usage_events read policy at the private function.
DROP POLICY IF EXISTS "Admins can view usage events" ON public.usage_events;
CREATE POLICY "Admins can view usage events"
ON public.usage_events
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

-- usage_events intentionally has NO client-facing INSERT policy: all writes go
-- through the server-side trackEvent function using the service-role client,
-- which bypasses RLS by design. Do not add an anon/authenticated INSERT policy.

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);