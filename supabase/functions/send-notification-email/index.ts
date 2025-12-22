import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  type: "reply" | "mention" | "reaction";
  recipientEmail: string;
  recipientName: string;
  actorName: string;
  threadTitle: string;
  threadSlug: string;
  content?: string;
  reactionType?: string;
}

const getEmailContent = (data: NotificationEmailRequest): { subject: string; html: string } => {
  const baseUrl = Deno.env.get("SITE_URL") || "https://your-forum.com";
  const threadUrl = `${baseUrl}/thread/${data.threadSlug}`;

  switch (data.type) {
    case "reply":
      return {
        subject: `${data.actorName} replied to your post`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">New Reply to Your Post</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hi ${data.recipientName},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${data.actorName}</strong> replied to your post in "<strong>${data.threadTitle}</strong>":
            </p>
            ${data.content ? `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <p style="color: #333; margin: 0;">${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}</p>
              </div>
            ` : ''}
            <a href="${threadUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Reply
            </a>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              You're receiving this because you have email notifications enabled.
            </p>
          </div>
        `,
      };

    case "mention":
      return {
        subject: `${data.actorName} mentioned you`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">You Were Mentioned</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hi ${data.recipientName},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${data.actorName}</strong> mentioned you in "<strong>${data.threadTitle}</strong>":
            </p>
            ${data.content ? `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
                <p style="color: #333; margin: 0;">${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}</p>
              </div>
            ` : ''}
            <a href="${threadUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Post
            </a>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              You're receiving this because you have email notifications enabled.
            </p>
          </div>
        `,
      };

    case "reaction":
      return {
        subject: `${data.actorName} reacted to your post`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">New Reaction to Your Post</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hi ${data.recipientName},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              <strong>${data.actorName}</strong> reacted with ${data.reactionType || 'a reaction'} to your post in "<strong>${data.threadTitle}</strong>".
            </p>
            <a href="${threadUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Post
            </a>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              You're receiving this because you have email notifications enabled.
            </p>
          </div>
        `,
      };

    default:
      return {
        subject: "New notification from Forum",
        html: `<p>You have a new notification.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification-email function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationEmailRequest = await req.json();
    console.log("Notification data:", JSON.stringify(data));

    // Validate required fields
    if (!data.recipientEmail || !data.type || !data.actorName || !data.threadTitle) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = getEmailContent(data);

    console.log("Sending email to:", data.recipientEmail);
    const emailResponse = await resend.emails.send({
      from: "Forum Notifications <onboarding@resend.dev>",
      to: [data.recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
