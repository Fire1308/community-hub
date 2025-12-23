import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
  password: string;
}

// Rate limiting configuration
const RATE_LIMIT_SEND = {
  maxAttempts: 3, // Max OTP send requests per window
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
};

const RATE_LIMIT_VERIFY = {
  maxAttempts: 5, // Max verify attempts per window
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
};

// In-memory rate limit store (resets on function restart)
// For production, consider using a database table or Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, config: { maxAttempts: number; windowMs: number }): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    // First request, create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (current.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  return { allowed: true };
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otp: string): Promise<string> {
  return await hash(otp);
}

async function verifyOTP(otp: string, hashedOTP: string): Promise<boolean> {
  return await compare(otp, hashedOTP);
}

// Get client IP from request headers
function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
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
    const clientIP = getClientIP(req);

    if (action === "send") {
      const { email, username, password }: OTPRequest = await req.json();

      // Validate inputs
      if (!email || !username || !password) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Rate limit check - by email and IP
      const emailRateKey = `send:email:${email.toLowerCase()}`;
      const ipRateKey = `send:ip:${clientIP}`;

      const emailRateCheck = checkRateLimit(emailRateKey, RATE_LIMIT_SEND);
      const ipRateCheck = checkRateLimit(ipRateKey, { ...RATE_LIMIT_SEND, maxAttempts: 10 }); // Higher limit for IP

      if (!emailRateCheck.allowed) {
        console.log(`Rate limit exceeded for email: ${email}`);
        return new Response(
          JSON.stringify({ 
            error: "Too many requests. Please try again later.",
            retryAfter: emailRateCheck.retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json", 
              "Retry-After": String(emailRateCheck.retryAfter),
              ...corsHeaders 
            } 
          }
        );
      }

      if (!ipRateCheck.allowed) {
        console.log(`Rate limit exceeded for IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: "Too many requests from your network. Please try again later.",
            retryAfter: ipRateCheck.retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json", 
              "Retry-After": String(ipRateCheck.retryAfter),
              ...corsHeaders 
            } 
          }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate password length
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate username
      if (username.length < 3 || username.length > 30) {
        return new Response(
          JSON.stringify({ error: "Username must be between 3 and 30 characters" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

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

      // Generate and hash OTP
      const otp = generateOTP();
      const hashedOTP = await hashOTP(otp);

      // Delete any existing verification for this email
      await supabase
        .from("email_verifications")
        .delete()
        .eq("email", email);

      // Store verification data with HASHED OTP
      const { error: insertError } = await supabase
        .from("email_verifications")
        .insert({
          email,
          otp_code: hashedOTP,
          username,
          password_hash: "REDACTED",
        });

      if (insertError) {
        console.error("Insert error:", insertError);
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

      console.log("OTP sent successfully to:", email, "from IP:", clientIP);

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "verify") {
      const { email, otp, password }: VerifyOTPRequest = await req.json();

      // Validate inputs
      if (!email || !otp || !password) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Rate limit check for verification attempts
      const verifyRateKey = `verify:email:${email.toLowerCase()}`;
      const verifyRateCheck = checkRateLimit(verifyRateKey, RATE_LIMIT_VERIFY);

      if (!verifyRateCheck.allowed) {
        console.log(`Verify rate limit exceeded for email: ${email}`);
        return new Response(
          JSON.stringify({ 
            error: "Too many verification attempts. Please request a new code.",
            retryAfter: verifyRateCheck.retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json", 
              "Retry-After": String(verifyRateCheck.retryAfter),
              ...corsHeaders 
            } 
          }
        );
      }

      // Get verification record
      const { data: verification, error: verifyError } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("email", email)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (verifyError || !verification) {
        console.log("Verification lookup failed:", verifyError);
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify OTP against stored hash
      const isValidOTP = await verifyOTP(otp, verification.otp_code);
      if (!isValidOTP) {
        console.log("OTP verification failed for:", email, "from IP:", clientIP);
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Clear rate limit on successful verification
      rateLimitStore.delete(`verify:email:${email.toLowerCase()}`);

      // Create the actual user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: verification.email,
        password: password,
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

      // Delete the verification record
      await supabase
        .from("email_verifications")
        .delete()
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

      console.log("Account created successfully for:", email);

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