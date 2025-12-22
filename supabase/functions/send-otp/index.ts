import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email: string;
  username: string;
  password: string;
}

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "send") {
      const { email, username, password }: OTPRequest = await req.json();

      // Check if email already registered
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const emailExists = existingUser?.users?.some(u => u.email === email);
      if (emailExists) {
        return new Response(
          JSON.stringify({ error: "Email already registered" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if username already taken
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Username already taken" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Generate OTP
      const otp = generateOTP();

      // Delete any existing verification for this email
      await supabase
        .from("email_verifications")
        .delete()
        .eq("email", email);

      // Store verification data
      const { error: insertError } = await supabase
        .from("email_verifications")
        .insert({
          email,
          otp_code: otp,
          username,
          password_hash: password, // Will be used by Supabase Auth
        });

      if (insertError) {
        throw insertError;
      }

      // Send OTP email
      const { error: emailError } = await resend.emails.send({
        from: "Forum <onboarding@resend.dev>",
        to: [email],
        subject: "Your Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Email Verification</h1>
            <p style="color: #666; text-align: center;">Your verification code is:</p>
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #999; text-align: center; font-size: 14px;">This code expires in 10 minutes.</p>
            <p style="color: #999; text-align: center; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      if (emailError) {
        console.error("Email error:", emailError);
        throw new Error("Failed to send email");
      }

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "verify") {
      const { email, otp }: VerifyOTPRequest = await req.json();

      // Get verification record
      const { data: verification, error: verifyError } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (verifyError || !verification) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Create the actual user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: verification.email,
        password: verification.password_hash,
        email_confirm: true,
        user_metadata: {
          username: verification.username,
          display_name: verification.username,
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark as verified
      await supabase
        .from("email_verifications")
        .update({ verified: true })
        .eq("id", verification.id);

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          username: verification.username,
          display_name: verification.username,
        });

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Account created" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
