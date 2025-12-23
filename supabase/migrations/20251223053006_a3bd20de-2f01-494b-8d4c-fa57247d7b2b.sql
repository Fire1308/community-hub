-- Fix Critical: Remove public access to email_verifications table
-- This table contains sensitive data (OTP codes, passwords) and should only be accessed via service role

-- Drop all public RLS policies
DROP POLICY IF EXISTS "Anyone can view verification" ON public.email_verifications;
DROP POLICY IF EXISTS "Anyone can create verification" ON public.email_verifications;
DROP POLICY IF EXISTS "Anyone can update verification" ON public.email_verifications;
DROP POLICY IF EXISTS "Anyone can delete verification" ON public.email_verifications;

-- Keep RLS enabled but with NO public policies
-- The edge function uses service role key which bypasses RLS
-- This ensures no client-side access to this sensitive table