import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendAlert(smtpSettings: any, site: any, status: string) {
  if (!smtpSettings) return;

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.encryption === "ssl",
    auth: {
      user: smtpSettings.email,
      pass: smtpSettings.password,
    },
  });

  const isDown = status === "offline";
  const subject = isDown
    ? `🔴 ALERT: ${site.name} is DOWN`
    : `🟢 RECOVERY: ${site.name} is back ONLINE`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${isDown ? '#dc2626' : '#16a34a'}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${isDown ? '⚠️ Website Down' : '✅ Website Recovered'}</h2>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>Website:</strong> ${site.name}</p>
        <p><strong>URL:</strong> <a href="${site.url}">${site.url}</a></p>
        <p><strong>Status:</strong> ${status.toUpperCase()}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Owner:</strong> ${site.owner_email}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="color: #6b7280; font-size: 12px;">This alert was sent by Website Monitoring System</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Website Monitor" <${smtpSettings.email}>`,
    to: site.owner_email,
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

    const previousStatus = site.status;
    const now = new Date().toISOString();

    await supabase
      .from("websites")
      .update({
        status,
        response_time_ms: responseTimeMs,
        last_checked_at: now,
      })
      .eq("id", site.id);

    // Log and send email on status change
    if (previousStatus !== status && previousStatus !== "unknown") {
      const eventType = status === "online" ? "recovery" : "outage";
      const message = `${site.name} (${site.url}) went ${status}. ${
        responseTimeMs ? `Response time: ${responseTimeMs}ms` : "No response"
      }`;

      await supabase.from("activity_logs").insert({
        event_type: eventType,
        message,
        website_id: site.id,
      });

      // Send email alert
      try {
        await sendAlert(smtpSettings, site, status);
      } catch (emailErr) {
        console.error(`Failed to send email for ${site.name}:`, emailErr);
      }
    }

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
