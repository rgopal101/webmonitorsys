import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://hdeeuacrbigcetgushch.supabase.co/storage/v1/object/public/email-assets/ns-logo.png";

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
  const subject = isDown
    ? `🔴 ALERT: ${site.name} is DOWN — Nextzen Softech Monitoring`
    : `🟢 RECOVERY: ${site.name} is back ONLINE — Nextzen Softech Monitoring`;

  const accentColor = isDown ? '#e53e3e' : '#38a169';
  const accentGradient = isDown 
    ? 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' 
    : 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)';
  const statusIcon = isDown ? '⚠️' : '✅';
  const statusTitle = isDown ? 'Website Down' : 'Website Recovered';
  const statusMessage = isDown 
    ? 'We detected that the following website is currently unreachable.' 
    : 'Great news! The following website has recovered and is back online.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
              
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 24px 0 16px;">
                  <img src="${LOGO_URL}" alt="Nextzen Softech" width="200" style="max-width: 200px; height: auto;" />
                </td>
              </tr>

              <!-- Main Card -->
              <tr>
                <td style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Status Banner -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: ${accentGradient}; padding: 28px 32px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">
                          ${statusIcon} ${statusTitle}
                        </h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                          ${statusMessage}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Details Section -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 32px;">
                    <tr>
                      <td>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                          <tr>
                            <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Website</span>
                              <p style="margin: 4px 0 0; color: #1a202c; font-size: 16px; font-weight: 600;">${site.name}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">URL</span>
                              <p style="margin: 4px 0 0;"><a href="${site.url}" style="color: #3182ce; font-size: 15px; text-decoration: none; font-weight: 500;">${site.url}</a></p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</span>
                              <p style="margin: 4px 0 0;">
                                <span style="display: inline-block; background: ${accentColor}; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">${status.toUpperCase()}</span>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Detected At</span>
                              <p style="margin: 4px 0 0; color: #1a202c; font-size: 15px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 24px;">
                              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Notify To</span>
                              <p style="margin: 4px 0 0; color: #1a202c; font-size: 15px;">${site.owner_email}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 24px 16px 8px;">
                  <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                    Powered by <strong style="color: #718096;">Nextzen Softech Monitoring System</strong>
                  </p>
                  <p style="margin: 6px 0 0; color: #cbd5e0; font-size: 11px;">
                    © ${new Date().getFullYear()} Nextzen Softech. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

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
