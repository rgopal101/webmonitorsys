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
  <title>Isitonlineornot</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">

          <!-- LOGO HEADER (white background) -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px 20px;text-align:center;border-bottom:1px solid #e8edf2;">
              <img src="${opts.logoUrl}" alt="Isitonlineornot" height="50" style="height:50px;max-height:60px;width:auto;display:inline-block;" />
              <p style="margin:10px 0 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2.5px;font-weight:700;">Website Monitoring System</p>
            </td>
          </tr>

          <!-- ALERT BANNER -->
          <tr>
            <td style="background:${opts.alertGradient};padding:32px 32px;text-align:center;">
              <span style="font-size:44px;line-height:1;display:block;">${opts.statusIcon}</span>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.5px;">${opts.statusLabel}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.92);font-size:15px;font-weight:400;line-height:1.5;">${opts.statusMessage}</p>
            </td>
          </tr>

          <!-- CONTENT CARD -->
          <tr>
            <td style="background:#ffffff;padding:32px;">
              <p style="margin:0 0 16px;color:#1e293b;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;">Website Information</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Website Name</span>
                    <p style="margin:6px 0 0;color:#0f172a;font-size:16px;font-weight:600;">${opts.siteName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Website URL</span>
                    <p style="margin:6px 0 0;"><a href="${opts.siteUrl}" style="color:#2563eb;font-size:15px;text-decoration:none;font-weight:500;word-break:break-all;">${opts.siteUrl}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Status</span>
                    <p style="margin:8px 0 0;">
                      <span style="display:inline-block;background:${opts.alertColor};color:#fff;padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${opts.statusIcon} ${opts.statusLabel}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Detected At</span>
                    <p style="margin:6px 0 0;color:#0f172a;font-size:15px;">${opts.detectedAt}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;">Notification Sent To</span>
                    <p style="margin:6px 0 0;color:#0f172a;font-size:15px;">${opts.ownerEmail}</p>
                  </td>
                </tr>
              </table>

              <!-- ACTION BUTTON -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 0 0;">
                <tr>
                  <td align="center">
                    <a href="${opts.siteUrl}" target="_blank" style="display:inline-block;background:${opts.alertGradient};color:#ffffff;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Visit Website &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f1f5f9;padding:28px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#334155;font-size:14px;font-weight:700;">Nextzen Softech Monitoring System</p>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">You are receiving this alert because your website is being monitored.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px auto 0;">
                <tr>
                  <td style="padding:0 8px;"><a href="mailto:info@nextzensoftech.com" style="color:#2563eb;font-size:12px;text-decoration:none;">info@nextzensoftech.com</a></td>
                  <td style="color:#cbd5e1;font-size:12px;">|</td>
                  <td style="padding:0 8px;"><a href="https://nextzensoftech.com/" style="color:#2563eb;font-size:12px;text-decoration:none;">nextzensoftech.com</a></td>
                </tr>
              </table>
              <p style="margin:16px 0 0;color:#cbd5e1;font-size:11px;">&copy; ${new Date().getFullYear()} Nextzen Softech. All rights reserved.</p>
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
    let httpStatusCode: number | null = null;
    let lastError: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      };

      const start = performance.now();
      let res = await fetch(site.url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: fetchHeaders,
      });

      // Cloudflare blocks HEAD requests — retry with GET
      if (res.status === 403) {
        res = await fetch(site.url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: fetchHeaders,
        });
      }

      const end = performance.now();
      clearTimeout(timeout);

      responseTimeMs = Math.round(end - start);
      httpStatusCode = res.status;

      if (res.ok) {
        status = "online";
        lastError = null;
      } else {
        status = "offline";
        if (res.status === 403) {
          const body = await res.text();
          if (body.includes("cloudflare") || body.includes("Cloudflare") || body.includes("cf-")) {
            lastError = "Blocked by Cloudflare WAF — site owner must whitelist monitoring IPs";
          } else {
            lastError = `HTTP 403 Forbidden`;
          }
        } else {
          lastError = `HTTP ${res.status} ${res.statusText}`;
        }
      }
    } catch (err: unknown) {
      status = "offline";
      responseTimeMs = null;
      httpStatusCode = null;

      // Extract meaningful error reason
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("abort") || errMsg.includes("timeout")) {
        lastError = "Connection timeout (15s)";
      } else if (errMsg.includes("dns") || errMsg.includes("getaddrinfo") || errMsg.includes("NOTFOUND")) {
        lastError = "DNS resolution failed";
      } else if (errMsg.includes("ssl") || errMsg.includes("certificate") || errMsg.includes("CERT")) {
        lastError = "SSL/TLS certificate error";
      } else if (errMsg.includes("ECONNREFUSED") || errMsg.includes("refused")) {
        lastError = "Connection refused";
      } else if (errMsg.includes("ECONNRESET") || errMsg.includes("reset")) {
        lastError = "Connection reset by server";
      } else {
        lastError = errMsg.length > 200 ? errMsg.slice(0, 200) : errMsg;
      }
    }

    const previousStatus = site.last_notified_status ?? site.status;
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      status,
      response_time_ms: responseTimeMs,
      last_checked_at: now,
      http_status_code: httpStatusCode,
      last_error: lastError,
    };

    // Log every check so Activity Logs always shows fresh monitoring data.
    // Keep email alerts only for real status transitions.
    const statusChanged = previousStatus !== status;
    const reasonDetail = lastError ? ` Reason: ${lastError}` : "";

    if (statusChanged) {
      updateData.last_notified_status = status;

      const eventType = status === "online" ? "recovery" : "outage";
      await supabase.from("activity_logs").insert({
        event_type: eventType,
        message: `${site.name} (${site.url}) went ${status}. ${
          responseTimeMs ? `Response time: ${responseTimeMs}ms` : "No response"
        }${reasonDetail}`,
        website_id: site.id,
      });

      // Send email alert only on status change
      try {
        await sendAlert(smtpSettings, site, status);
      } catch (emailErr) {
        console.error(`Failed to send email for ${site.name}:`, emailErr);
      }
    } else {
      const heartbeatEvent = status === "online" ? "online" : "offline";
      await supabase.from("activity_logs").insert({
        event_type: heartbeatEvent,
        message: `${site.name} (${site.url}) check: ${status}. ${
          responseTimeMs ? `Response time: ${responseTimeMs}ms` : "No response"
        }${reasonDetail}`,
        website_id: site.id,
      });
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
      http_status_code: httpStatusCode,
      last_error: lastError,
    });
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
