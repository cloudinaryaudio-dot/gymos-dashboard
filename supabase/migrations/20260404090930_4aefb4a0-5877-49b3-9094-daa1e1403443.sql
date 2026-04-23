
-- Add category, benefits, and is_highlighted to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS benefits text[] DEFAULT '{}';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_highlighted boolean DEFAULT false;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  text text,
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read reviews" ON public.reviews FOR SELECT TO anon USING (true);

-- Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text,
  contact text,
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own branches" ON public.branches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read branches" ON public.branches FOR SELECT TO anon USING (true);
