-- Single table for all website content sections
CREATE TABLE IF NOT EXISTS public.website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  section_key text NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  content jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, section_key)
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Users manage own website content"
  ON public.website_content FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read enabled sections
CREATE POLICY "Public can read enabled website content"
  ON public.website_content FOR SELECT TO anon
  USING (is_enabled = true);
