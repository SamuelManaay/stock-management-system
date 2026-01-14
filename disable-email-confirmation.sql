-- Disable email confirmation in Supabase
-- Run this in Supabase SQL Editor

-- This will allow users to login immediately without email confirmation
-- Go to: Supabase Dashboard > Authentication > Settings
-- Turn OFF "Enable email confirmations"

-- Or update existing users to confirmed status:
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;