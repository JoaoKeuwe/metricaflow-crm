-- Add must_change_password column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean DEFAULT false;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.profiles.must_change_password IS 'When true, user must change password before accessing the system. Set to true for users created via Stripe webhook.';
