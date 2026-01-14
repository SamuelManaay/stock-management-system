-- After creating user through Supabase Auth UI (samsam@admin.com / samsam)
-- Replace 'USER_UUID_FROM_AUTH' with the actual UUID from auth.users table

INSERT INTO public.users (id, email, role) 
VALUES ('USER_UUID_FROM_AUTH', 'samsam@admin.com', 'admin');

-- To find the UUID, first run:
-- SELECT id, email FROM auth.users WHERE email = 'samsam@admin.com';