import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all websites with tracking enabled
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

    // Update website record
    const { error: updateError } = await supabase
      .from("websites")
      .update({
        status,
        response_time_ms: responseTimeMs,
        last_checked_at: now,
      })
      .eq("id", site.id);

    // Log status changes
    if (previousStatus !== status && previousStatus !== "unknown") {
      await supabase.from("activity_logs").insert({
        event_type: status === "online" ? "recovery" : "outage",
        message: `${site.name} (${site.url}) went ${status}. ${
          responseTimeMs ? `Response time: ${responseTimeMs}ms` : "No response"
        }`,
        website_id: site.id,
      });
    }

    results.push({
      id: site.id,
      name: site.name,
      url: site.url,
      status,
      response_time_ms: responseTimeMs,
      error: updateError?.message ?? null,
    });
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
