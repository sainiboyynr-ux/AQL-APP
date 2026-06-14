-- AQL Finished Goods Inspection App - Supabase Database Schema
-- Paste this script into your Supabase SQL Editor and click "Run".

-- 1. Create Profiles Table (for Employee details linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'qa_executive',
  department TEXT NOT NULL DEFAULT 'Finished Goods QA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Create Inspections Table
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  total_production INTEGER NOT NULL,
  sample_size INTEGER NOT NULL,
  override_reason TEXT,
  critical_defects JSONB NOT NULL DEFAULT '[]'::jsonb,
  major_defects JSONB NOT NULL DEFAULT '[]'::jsonb,
  minor_defects JSONB NOT NULL DEFAULT '[]'::jsonb,
  defect_pct_critical NUMERIC NOT NULL DEFAULT 0,
  defect_pct_major NUMERIC NOT NULL DEFAULT 0,
  defect_pct_minor NUMERIC NOT NULL DEFAULT 0,
  overall_decision TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  mfd_date TIMESTAMP WITH TIME ZONE,
  exp_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on Inspections
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Inspections Policies
CREATE POLICY "Allow users to read their own inspections" ON public.inspections
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Allow users to insert their own inspections" ON public.inspections
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to update their own draft inspections" ON public.inspections
  FOR UPDATE USING (auth.uid() = created_by AND status = 'draft');

-- 3. Automatic User Profile Trigger
-- Whenever a new user is created in auth.users, automatically add their profile info to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, employee_id, full_name, role, department)
  VALUES (
    new.id,
    COALESCE(UPPER(new.raw_user_meta_data->>'employee_id'), UPPER(SPLIT_PART(new.email, '@', 1))),
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'qa_executive'),
    COALESCE(new.raw_user_meta_data->>'department', 'Finished Goods QA')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create Mock/Demo Users (EMP001 and EMP002) with Password 'Password123'
-- Check and insert Amit Sharma (EMP001)
INSERT INTO auth.users (id, instance_id, id_status, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '00000000-0000-0000-0000-000000000000', 'validated', 'emp001@esme.com', crypt('Password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amit Sharma", "employee_id":"EMP001", "role":"qa_executive", "department":"Finished Goods QA"}', now(), now(), 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Check and insert Priyanka Patel (EMP002)
INSERT INTO auth.users (id, instance_id, id_status, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', '00000000-0000-0000-0000-000000000000', 'validated', 'emp002@esme.com', crypt('Password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priyanka Patel", "employee_id":"EMP002", "role":"qa_manager", "department":"Quality Control"}', now(), now(), 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;
