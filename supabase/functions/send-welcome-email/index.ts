import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://hdeeuacrbigcetgushch.supabase.co/storage/v1/object/public/email-assets/ns-logo.png";

function buildWelcomeEmail(opts: { name: string; email: string; logoUrl: string; loginUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:#fff;padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e8edf2;">
          <img src="${opts.logoUrl}" alt="Nextzen Softech" height="50" style="height:50px;width:auto;" />
          <p style="margin:10px 0 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2.5px;font-weight:700;">Account Confirmation</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:32px;text-align:center;">
          <span style="font-size:44px;">🎉</span>
          <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:800;">Welcome Aboard!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.92);font-size:15px;">Your account has been created successfully.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi <strong>${opts.name}</strong>,</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            Thank you for signing up with <strong>Nextzen Softech Monitoring System</strong>. Your account is now active and ready to use.
          </p>

          <table role="presentation" width="100%" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:0 0 24px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Account Email</span>
              <p style="margin:6px 0 0;color:#0f172a;font-size:16px;font-weight:600;">${opts.email}</p>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Plan</span>
              <p style="margin:6px 0 0;color:#0f172a;font-size:16px;font-weight:600;">Free Trial (15 Days)</p>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Includes</span>
              <p style="margin:6px 0 0;color:#0f172a;font-size:16px;font-weight:600;">1 Domain • 1 Notification Email</p>
            </td></tr>
          </table>

          <table role="presentation" width="100%">
            <tr><td align="center">
              <a href="${opts.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#fff;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Go to Dashboard &rarr;</a>
            </td></tr>
          </table>

          <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;text-align:center;">If you did not create this account, please ignore this email.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f1f5f9;padding:28px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#334155;font-size:14px;font-weight:700;">Nextzen Softech Monitoring System</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Nextzen Softech. All rights reserved.</p>
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
    const { email, fullName } = await req.json();

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

    // Fetch SMTP settings from database
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

    const appUrl = "https://webmonitorsys.lovable.app";

    const html = buildWelcomeEmail({
      name: fullName || email,
      email,
      logoUrl: LOGO_URL,
      loginUrl: `${appUrl}/login`,
    });

    await transporter.sendMail({
      from: `"Nextzen Softech Monitor" <${smtpSettings.email}>`,
      to: email,
      subject: "🎉 Welcome to Nextzen Softech Monitoring — Account Confirmed!",
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
