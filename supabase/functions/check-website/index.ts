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
      let lastError: string | null = null;

      if (!response.ok) {
        status = response.status >= 500 ? "offline" : "offline";
        lastError = `HTTP ${response.status} ${response.statusText}`;
      } else if (responseTime > 3000) {
        status = "slow";
      }

      return new Response(
        JSON.stringify({
          status,
          responseTime,
          url: targetUrl,
          httpStatusCode: response.status,
          lastError,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      let lastError = errMsg;
      if (errMsg.includes("abort") || errMsg.includes("timeout")) {
        lastError = "Connection timeout (10s)";
      } else if (errMsg.includes("dns") || errMsg.includes("getaddrinfo")) {
        lastError = "DNS resolution failed";
      } else if (errMsg.includes("ssl") || errMsg.includes("certificate")) {
        lastError = "SSL/TLS certificate error";
      } else if (errMsg.includes("refused")) {
        lastError = "Connection refused";
      }

      return new Response(
        JSON.stringify({
          status: "offline",
          responseTime: null,
          url: targetUrl,
          httpStatusCode: null,
          lastError,
        }),
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
