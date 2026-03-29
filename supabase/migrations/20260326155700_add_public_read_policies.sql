-- Allow anonymous users to read plans (for landing page)
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT TO anon USING (true);

-- Allow anonymous users to read contact_settings (for floating buttons)
-- (already has anon policy from previous migration, but ensure it exists)
