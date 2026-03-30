-- Ensure tables required by admin Settings/Contact/Website Builder exist

CREATE TABLE IF NOT EXISTS public.gym_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  gym_name text NOT NULL DEFAULT 'GymOS',
  logo_url text,
  primary_color text NOT NULL DEFAULT '142 71% 45%',
  secondary_color text NOT NULL DEFAULT '220 25% 8%',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gym_settings' AND policyname = 'Users manage own gym settings'
  ) THEN
    CREATE POLICY "Users manage own gym settings"
      ON public.gym_settings
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gym_settings' AND policyname = 'Public can read gym settings'
  ) THEN
    CREATE POLICY "Public can read gym settings"
      ON public.gym_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.contact_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  gym_id uuid,
  whatsapp_number text,
  whatsapp_message text,
  instagram_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_settings' AND policyname = 'Users manage own contact settings'
  ) THEN
    CREATE POLICY "Users manage own contact settings"
      ON public.contact_settings
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_settings' AND policyname = 'Public can read contact settings'
  ) THEN
    CREATE POLICY "Public can read contact settings"
      ON public.contact_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_key)
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'website_content' AND policyname = 'Users manage own website content'
  ) THEN
    CREATE POLICY "Users manage own website content"
      ON public.website_content
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'website_content' AND policyname = 'Public read enabled website content'
  ) THEN
    CREATE POLICY "Public read enabled website content"
      ON public.website_content
      FOR SELECT
      TO anon, authenticated
      USING (is_enabled = true);
  END IF;
END
$$;

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to newly ensured tables if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gym_settings_updated_at') THEN
    CREATE TRIGGER update_gym_settings_updated_at
    BEFORE UPDATE ON public.gym_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contact_settings_updated_at') THEN
    CREATE TRIGGER update_contact_settings_updated_at
    BEFORE UPDATE ON public.contact_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_website_content_updated_at') THEN
    CREATE TRIGGER update_website_content_updated_at
    BEFORE UPDATE ON public.website_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;