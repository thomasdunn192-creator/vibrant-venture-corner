CREATE TABLE public.printer_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  printer_id text NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, printer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.printer_profiles TO authenticated;
GRANT ALL ON public.printer_profiles TO service_role;
ALTER TABLE public.printer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own printer profiles" ON public.printer_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.troubleshooting_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  printer_id text,
  filament_type text,
  question text,
  answer text,
  notes text,
  outcome text NOT NULL DEFAULT 'open',
  image_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, local_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.troubleshooting_log TO authenticated;
GRANT ALL ON public.troubleshooting_log TO service_role;
ALTER TABLE public.troubleshooting_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own troubleshooting log" ON public.troubleshooting_log
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX troubleshooting_log_user_occurred_idx ON public.troubleshooting_log (user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_printer_profiles_updated_at BEFORE UPDATE ON public.printer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_troubleshooting_log_updated_at BEFORE UPDATE ON public.troubleshooting_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'thomas.dunn192@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;