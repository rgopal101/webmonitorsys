import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://hdeeuacrbigcetgushch.supabase.co/storage/v1/object/public/email-assets/ns-logo.png";

function buildRenewalEmail(opts: { name: string; email: string; plan: string; expiresAt: string; daysLeft: number; renewalUrl: string; logoUrl: string }) {
  const urgencyColor = opts.daysLeft <= 1 ? "#e53e3e" : opts.daysLeft <= 3 ? "#dd6b20" : "#2563eb";
  const urgencyGradient = opts.daysLeft <= 1
    ? "linear-gradient(135deg,#e53e3e 0%,#c53030 100%)"
    : opts.daysLeft <= 3
      ? "linear-gradient(135deg,#dd6b20 0%,#c05621 100%)"
      : "linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        <tr><td style="background:#fff;padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e8edf2;">
          <img src="${opts.logoUrl}" alt="Nextzen Softech" height="50" style="height:50px;width:auto;" />
          <p style="margin:10px 0 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2.5px;font-weight:700;">Subscription Renewal</p>
        </td></tr>
        <tr><td style="background:${urgencyGradient};padding:32px;text-align:center;">
          <span style="font-size:44px;">⏰</span>
          <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:800;">Subscription Expiring ${opts.daysLeft <= 0 ? "Today!" : `in ${opts.daysLeft} Day${opts.daysLeft > 1 ? "s" : ""}`}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.92);font-size:15px;">Your <strong>${opts.plan}</strong> plan needs renewal to continue monitoring.</p>
        </td></tr>
        <tr><td style="background:#fff;padding:32px;">
          <table role="presentation" width="100%" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Account</span>
              <p style="margin:6px 0 0;color:#0f172a;font-size:16px;font-weight:600;">${opts.email}</p>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Current Plan</span>
              <p style="margin:6px 0 0;color:#0f172a;font-size:16px;font-weight:600;text-transform:capitalize;">${opts.plan}</p>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Expires On</span>
              <p style="margin:6px 0 0;color:${urgencyColor};font-size:16px;font-weight:700;">${opts.expiresAt}</p>
            </td></tr>
          </table>
          <table role="presentation" width="100%" style="padding:28px 0 0;">
            <tr><td align="center">
              <a href="${opts.renewalUrl}" style="display:inline-block;background:${urgencyGradient};color:#fff;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Renew Now &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;text-align:center;">If you don't renew, your monitoring will be automatically suspended.</p>
        </td></tr>
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();

  // Fetch all active/trialing subscriptions
  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("*")
    .in("status", ["active", "trialing"])
    .not("current_period_end", "is", null);

  // Fetch SMTP settings
  const { data: smtpSettings } = await supabase
    .from("smtp_settings")
    .select("*")
    .maybeSingle();

  // Fetch profiles for emails
  const { data: profiles } = await supabase.from("profiles").select("user_id, email, full_name");
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

  const results = { expired: 0, reminded: 0, errors: [] as string[] };

  // Get the app URL for renewal links
  const appUrl = "https://webmonitorsys.lovable.app";

  for (const sub of subs ?? []) {
    const endDate = new Date(sub.current_period_end!);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const profile = profileMap.get(sub.user_id);
    const email = profile?.email ?? "";

    // Auto-suspend expired subscriptions
    if (daysLeft <= 0) {
      await supabase
        .from("user_subscriptions")
        .update({ status: "suspended", max_domains: 0, max_emails: 0 })
        .eq("id", sub.id);

      // Disable all user's website tracking
      await supabase
        .from("websites")
        .update({ tracking_enabled: false })
        .eq("user_id", sub.user_id);

      results.expired++;

      // Send expiry notification
      if (smtpSettings && email) {
        try {
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

          const html = buildRenewalEmail({
            name: profile?.full_name ?? email,
            email,
            plan: sub.plan,
            expiresAt: endDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
            daysLeft: 0,
            renewalUrl: `${appUrl}/pricing`,
            logoUrl: LOGO_URL,
          });

          await transporter.sendMail({
            from: `"Nextzen Softech Monitor" <${smtpSettings.email}>`,
            to: email,
            subject: `🔴 Subscription Expired — Your monitoring has been suspended`,
            html,
          });
        } catch (e) {
          results.errors.push(`Email failed for ${email}: ${e.message}`);
        }
      }
      continue;
    }

    // Send reminders at 7, 3, and 1 days before expiry
    if ([7, 3, 1].includes(daysLeft) && smtpSettings && email) {
      try {
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

        const html = buildRenewalEmail({
          name: profile?.full_name ?? email,
          email,
          plan: sub.plan,
          expiresAt: endDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
          daysLeft,
          renewalUrl: `${appUrl}/pricing`,
          logoUrl: LOGO_URL,
        });

        await transporter.sendMail({
          from: `"Nextzen Softech Monitor" <${smtpSettings.email}>`,
          to: email,
          subject: `⏰ Subscription expiring in ${daysLeft} day${daysLeft > 1 ? "s" : ""} — Renew now`,
          html,
        });
        results.reminded++;
      } catch (e) {
        results.errors.push(`Reminder failed for ${email}: ${e.message}`);
      }
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
