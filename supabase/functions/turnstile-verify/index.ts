// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const { token, payload } = await req.json();

    // 1) Who is calling?
    const authHeader = req.headers.get("Authorization") ?? "";
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!, // caller context
      { global: { headers: { Authorization: authHeader } } }
    );
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user } = { user: null } } = jwt
      ? await authClient.auth.getUser(jwt)
      : { data: { user: null } };

    // 2) Guests must pass Turnstile
    if (!user) {
      if (!token) {
        return new Response(JSON.stringify({ error: "missing token" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
      const form = new FormData();
      form.append("secret", Deno.env.get("TURNSTILE_SECRET_KEY") ?? "");
      form.append("response", token);
      // Optional hardening:
      // form.append("remoteip", (req.headers.get("x-forwarded-for") ?? "").split(",")[0] || "");
      const verify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body: form }
      );
      const outcome = await verify.json();
      if (!outcome?.success) {
        return new Response(
          JSON.stringify({
            error: "turnstile verification failed",
            details: outcome?.["error-codes"] ?? [],
          }),
          {
            status: 400,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 3) Only the function can write (service role bypasses RLS by design)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // server only
    );

    // Never trust client-sent user_id
    const row = { ...payload, user_id: user?.id ?? null };

    const { data, error } = await adminClient
      .from("sightings")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: data?.id }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "unknown error" }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  }
});
