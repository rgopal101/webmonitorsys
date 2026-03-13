import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://hdeeuacrbigcetgushch.supabase.co/storage/v1/object/public/email-assets/ns-logo.png";
const APP_URL = "https://webmonitorsys.lovable.app";

function buildPasswordResetEmail(opts: { email: string; resetUrl: string; logoUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:#fff;padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e8edf2;">
          <img src="${opts.logoUrl}" alt="Isitonlineornot" height="50" style="height:50px;width:auto;" />
          <p style="margin:10px 0 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2.5px;font-weight:700;">Password Reset</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:32px;text-align:center;">
          <span style="font-size:44px;">🔐</span>
          <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:800;">Reset Your Password</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.92);font-size:15px;">Click the button below to set a new password</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi,</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            We received a request to reset the password for your <strong>Isitonlineornot</strong> account associated with <strong>${opts.email}</strong>.
          </p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
            Click the button below to set a new password. This link will expire in 1 hour.
          </p>

          <table role="presentation" width="100%">
            <tr><td align="center">
              <a href="${opts.resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#fff;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Reset Password &rarr;</a>
            </td></tr>
          </table>

          <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;text-align:center;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;text-align:center;word-break:break-all;">If the button doesn't work, copy and paste this link:<br/><a href="${opts.resetUrl}" style="color:#2563eb;">${opts.resetUrl}</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f1f5f9;padding:28px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#334155;font-size:14px;font-weight:700;">Isitonlineornot</p>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">Website Monitoring & Uptime Tracking</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">Need help? Contact <a href="mailto:support@isitonlineornot.com" style="color:#2563eb;">support@isitonlineornot.com</a></p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">&copy; ${new Date().getFullYear()} Isitonlineornot. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate the appropriate auth link
    const linkType = type === "recovery" ? "recovery" : "signup";
    const redirectTo = type === "recovery"
      ? `${APP_URL}/reset-password`
      : `${APP_URL}/login?verified=true`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: linkType,
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError);
      return new Response(JSON.stringify({ error: "Failed to generate auth link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      return new Response(JSON.stringify({ error: "No action link generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch SMTP settings
    const { data: smtpSettings, error: smtpError } = await supabase
      .from("smtp_settings")
      .select("*")
      .maybeSingle();

    if (smtpError || !smtpSettings) {
      return new Response(JSON.stringify({ error: "SMTP not configured. Please configure SMTP settings in admin panel." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSSL = smtpSettings.encryption === "ssl" || smtpSettings.port === 465;
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: isSSL,
      auth: { user: smtpSettings.email, pass: smtpSettings.password },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Build email based on type
    let subject: string;
    let html: string;

    if (type === "recovery") {
      subject = "🔐 Reset your password — Isitonlineornot";
      html = buildPasswordResetEmail({ email, resetUrl: actionLink, logoUrl: LOGO_URL });
    } else {
      // Default: verification email (reuse existing welcome template pattern)
      subject = "✉️ Verify your email — Isitonlineornot";
      html = buildPasswordResetEmail({ email, resetUrl: actionLink, logoUrl: LOGO_URL });
    }

    await transporter.sendMail({
      from: `"Isitonlineornot" <${smtpSettings.email}>`,
      to: email,
      subject,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Send auth email error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});