-- Add unique constraint on username in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create email_verifications table for OTP
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookup
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_otp ON public.email_verifications(otp_code);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for signup)
CREATE POLICY "Anyone can create verification" 
ON public.email_verifications 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to select (for verification check)
CREATE POLICY "Anyone can view verification" 
ON public.email_verifications 
FOR SELECT 
USING (true);

-- Allow updates for verification
CREATE POLICY "Anyone can update verification" 
ON public.email_verifications 
FOR UPDATE 
USING (true);