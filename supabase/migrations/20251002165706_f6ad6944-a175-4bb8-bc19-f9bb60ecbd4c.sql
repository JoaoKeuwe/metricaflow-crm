-- Add new value to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_owner';

-- Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user_limit_adicionais INTEGER DEFAULT 10;

-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  role public.app_role NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Create audit log table for ownership transfers
CREATE TABLE IF NOT EXISTS public.ownership_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  from_user_id UUID REFERENCES auth.users(id) NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) NOT NULL,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  transferred_by UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;