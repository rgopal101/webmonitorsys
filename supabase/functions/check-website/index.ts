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
    const fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      };

    try {
      let response = await fetch(targetUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
        headers: fetchHeaders,
      });

      // Cloudflare blocks HEAD requests — retry with GET
      if (response.status === 403) {
        response = await fetch(targetUrl, {
          method: "GET",
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
          headers: fetchHeaders,
        });
      }

      const responseTime = Date.now() - start;

      let status: "online" | "offline" | "slow" = "online";
      let lastError: string | null = null;

      if (!response.ok) {
        status = "offline";
        // Detect Cloudflare WAF block
        if (response.status === 403) {
          const body = await response.text();
          if (body.includes("cloudflare") || body.includes("Cloudflare") || body.includes("cf-")) {
            lastError = "Blocked by Cloudflare WAF — site owner must whitelist monitoring IPs";
          } else {
            lastError = `HTTP 403 Forbidden`;
          }
        } else {
          lastError = `HTTP ${response.status} ${response.statusText}`;
        }
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
