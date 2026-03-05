import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://hdeeuacrbigcetgushch.supabase.co/storage/v1/object/public/email-assets/ns-logo.png";

interface EmailTemplateOptions {
  logoUrl: string;
  alertColor: string;
  alertGradient: string;
  statusIcon: string;
  statusLabel: string;
  statusMessage: string;
  siteName: string;
  siteUrl: string;
  ownerEmail: string;
  detectedAt: string;
}

function buildEmailTemplate(opts: EmailTemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nextzen Softech Monitoring</title>
</head>
<body style="margin:0;padding:0;background-color:#edf2f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#edf2f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a202c 0%,#2d3748 100%);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;border-bottom:3px solid ${opts.alertColor};">
              <img src="${opts.logoUrl}" alt="Nextzen Softech" height="50" style="height:50px;max-height:60px;width:auto;display:inline-block;" />
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Monitoring System</p>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              <!-- ALERT BANNER -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${opts.alertGradient};padding:24px 32px;text-align:center;">
                    <span style="font-size:32px;line-height:1;">${opts.statusIcon}</span>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">${opts.statusLabel}</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-weight:400;">${opts.statusMessage}</p>
                  </td>
                </tr>
              </table>

              <!-- CONTENT BOX -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 32px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border-radius:10px;border:1px solid #e2e8f0;">
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#a0aec0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Website</span>
                          <p style="margin:4px 0 0;color:#1a202c;font-size:16px;font-weight:600;">${opts.siteName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#a0aec0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">URL</span>
                          <p style="margin:4px 0 0;"><a href="${opts.siteUrl}" style="color:#3182ce;font-size:15px;text-decoration:none;font-weight:500;word-break:break-all;">${opts.siteUrl}</a></p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#a0aec0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Status</span>
                          <p style="margin:6px 0 0;">
                            <span style="display:inline-block;background:${opts.alertColor};color:#fff;padding:5px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${opts.statusLabel}</span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#a0aec0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Detected At</span>
                          <p style="margin:4px 0 0;color:#1a202c;font-size:15px;">${opts.detectedAt}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;">
                          <span style="color:#a0aec0;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Notify To</span>
                          <p style="margin:4px 0 0;color:#1a202c;font-size:15px;">${opts.ownerEmail}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ACTION BUTTON -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:0 32px 28px;">
                <tr>
                  <td align="center">
                    <a href="${opts.siteUrl}" target="_blank" style="display:inline-block;background:${opts.alertGradient};color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">View Website &rarr;</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f7fafc;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#4a5568;font-size:13px;font-weight:600;">Nextzen Softech Monitoring System</p>
              <p style="margin:4px 0 0;color:#a0aec0;font-size:12px;">Website Monitoring Alerts</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto 0;">
                <tr>
                  <td style="padding:0 8px;"><a href="mailto:info@nextzensoftech.com" style="color:#3182ce;font-size:12px;text-decoration:none;">info@nextzensoftech.com</a></td>
                  <td style="color:#cbd5e0;font-size:12px;">|</td>
                  <td style="padding:0 8px;"><a href="https://nextzensoftech.com/" style="color:#3182ce;font-size:12px;text-decoration:none;">nextzensoftech.com</a></td>
                </tr>
              </table>
              <p style="margin:14px 0 0;color:#cbd5e0;font-size:11px;">&copy; ${new Date().getFullYear()} Nextzen Softech. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendAlert(smtpSettings: any, site: any, status: string) {
  if (!smtpSettings) return;

  const isSSL = smtpSettings.encryption === "ssl" || smtpSettings.port === 465;

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: isSSL,
    auth: {
      user: smtpSettings.email,
      pass: smtpSettings.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const isDown = status === "offline";
  const alertColor = isDown ? "#e53e3e" : "#38a169";
  const alertGradient = isDown
    ? "linear-gradient(135deg,#e53e3e 0%,#c53030 100%)"
    : "linear-gradient(135deg,#38a169 0%,#2f855a 100%)";
  const statusIcon = isDown ? "⚠️" : "✅";
  const statusLabel = isDown ? "Website Down" : "Website Online";
  const statusMessage = isDown
    ? "We detected that the following website is currently unreachable."
    : "Great news! The following website has recovered and is back online.";

  const subject = isDown
    ? `🔴 ALERT: ${site.name} is DOWN — Nextzen Softech Monitoring`
    : `🟢 RECOVERY: ${site.name} is back ONLINE — Nextzen Softech Monitoring`;

  const html = buildEmailTemplate({
    logoUrl: LOGO_URL,
    alertColor,
    alertGradient,
    statusIcon,
    statusLabel,
    statusMessage,
    siteName: site.name,
    siteUrl: site.url,
    ownerEmail: site.owner_email,
    detectedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  });

  const recipients = site.owner_email.split(",").map((e: string) => e.trim()).filter(Boolean);

  await transporter.sendMail({
    from: `"Nextzen Softech Monitor" <${smtpSettings.email}>`,
    to: recipients,
    subject,
    html,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: websites, error: fetchError } = await supabase
    .from("websites")
    .select("*")
    .eq("tracking_enabled", true);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch SMTP settings for email alerts
  const { data: smtpSettings } = await supabase
    .from("smtp_settings")
    .select("*")
    .maybeSingle();

  const results = [];

  for (const site of websites ?? []) {
    let status = "offline";
    let responseTimeMs: number | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const start = performance.now();
      const res = await fetch(site.url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      const end = performance.now();
      clearTimeout(timeout);

      responseTimeMs = Math.round(end - start);
      status = res.ok ? "online" : "offline";
    } catch {
      status = "offline";
      responseTimeMs = null;
    }

    const previousStatus = site.last_notified_status ?? site.status;
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      status,
      response_time_ms: responseTimeMs,
      last_checked_at: now,
    };

    // Only log and email on actual status change
    const statusChanged = previousStatus !== status;
    
    if (statusChanged) {
      updateData.last_notified_status = status;

      const eventType = status === "online" ? "recovery" : "outage";
      await supabase.from("activity_logs").insert({
        event_type: eventType,
        message: `${site.name} (${site.url}) went ${status}. ${
          responseTimeMs ? `Response time: ${responseTimeMs}ms` : "No response"
        }`,
        website_id: site.id,
      });

      // Send email alert only on status change
      try {
        await sendAlert(smtpSettings, site, status);
      } catch (emailErr) {
        console.error(`Failed to send email for ${site.name}:`, emailErr);
      }
    }

    await supabase
      .from("websites")
      .update(updateData)
      .eq("id", site.id);

    results.push({
      id: site.id,
      name: site.name,
      url: site.url,
      status,
      response_time_ms: responseTimeMs,
    });
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
