import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    const start = Date.now();
    try {
      const response = await fetch(targetUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });
      const responseTime = Date.now() - start;

      let status: "online" | "offline" | "slow" = "online";
      if (!response.ok && response.status >= 500) {
        status = "offline";
      } else if (responseTime > 3000) {
        status = "slow";
      }

      return new Response(
        JSON.stringify({ status, responseTime, url: targetUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      return new Response(
        JSON.stringify({ status: "offline", responseTime: null, url: targetUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
