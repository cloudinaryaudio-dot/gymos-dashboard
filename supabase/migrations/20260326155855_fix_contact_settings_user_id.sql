-- Add user_id column to contact_settings for consistency
ALTER TABLE public.contact_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Make gym_id nullable since not all setups use gyms
ALTER TABLE public.contact_settings ALTER COLUMN gym_id DROP NOT NULL;
-- Drop old unique constraint and add new one on user_id
ALTER TABLE public.contact_settings DROP CONSTRAINT IF EXISTS contact_settings_gym_id_key;
ALTER TABLE public.contact_settings ADD CONSTRAINT contact_settings_user_id_key UNIQUE (user_id);
