
-- Tighten gyms INSERT: only allow if user doesn't already have a gym linked in profiles
DROP POLICY "Authenticated users can insert gyms" ON public.gyms;
CREATE POLICY "Authenticated users can insert gyms" ON public.gyms FOR INSERT TO authenticated WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.gym_id IS NOT NULL)
);

-- Tighten leads INSERT: require user_id to be set (anon inserts go through the app which sets user_id)
DROP POLICY "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NOT NULL);
