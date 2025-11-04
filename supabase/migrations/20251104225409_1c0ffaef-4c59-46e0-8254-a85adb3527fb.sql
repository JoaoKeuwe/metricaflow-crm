-- Add logo_url and system_name to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS system_name TEXT DEFAULT 'CRM Sistema';

-- Add notification preferences to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;