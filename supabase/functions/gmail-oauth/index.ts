import { allowedAppUrl, clients, corsHeaders, encryptToken, json, requireUser, sha256 } from "../_shared/common.ts";

const googleAuth = "https://accounts.google.com/o/oauth2/v2/auth";
const googleToken = "https://oauth2.googleapis.com/token";
const redirectUri = () => `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-oauth`;

function redirect(url: string, result: string) {
  const target = new URL(url);
  target.searchParams.set("gmail", result);
  return Response.redirect(target.toString(), 302);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method === "GET") {
      const requestUrl = new URL(req.url);
      const rawState = requestUrl.searchParams.get("state") || "";
      const code = requestUrl.searchParams.get("code") || "";
      if (!rawState || !code) return json({ error: "Missing OAuth callback parameters" }, 400);

      const { admin } = clients(req);
      const stateHash = await sha256(rawState);
      const { data: states, error: stateError } = await admin.rpc("service_consume_gmail_state", { target_hash: stateHash });
      const oauthState = states?.[0];
      if (stateError || !oauthState) return json({ error: "Invalid or expired OAuth state" }, 400);

      const tokenResponse = await fetch(googleToken, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get("GOOGLE_GMAIL_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_GMAIL_CLIENT_SECRET")!,
          redirect_uri: redirectUri(),
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokens.error_description || "Google token exchange failed");

      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileResponse.json();
      if (!profileResponse.ok || !profile.email) throw new Error("Could not read Gmail sender identity");

      let refreshToken = tokens.refresh_token;
      if (!refreshToken) {
        const { data: existingRows } = await admin.rpc("service_gmail_connection", { target_user: oauthState.user_id });
        if (existingRows?.[0]) {
          await admin.rpc("service_update_gmail_sender", { target_user: oauthState.user_id, sender: profile.email });
          return redirect(oauthState.app_url, "connected");
        }
        throw new Error("Google did not return offline access; disconnect the app in Google and try again");
      }

      const encrypted = await encryptToken(refreshToken);
      const { error: saveError } = await admin.rpc("service_upsert_gmail_connection", {
        target_user: oauthState.user_id, sender: profile.email, encrypted_token: encrypted.encrypted,
        iv: encrypted.iv, tag: encrypted.tag,
      });
      if (saveError) throw saveError;
      return redirect(oauthState.app_url, "connected");
    }

    const { admin, authUser } = await requireUser(req);
    const body = await req.json();
    const action = body.action;
    if (action === "status") {
      const { data: rows } = await admin.rpc("service_gmail_connection", { target_user: authUser.id });
      const data = rows?.[0];
      return json({ connected: !!data, sender_email: data?.sender_email || null, connected_at: data?.connected_at || null });
    }
    if (action === "disconnect") {
      await admin.rpc("service_delete_gmail_connection", { target_user: authUser.id });
      return json({ connected: false });
    }
    if (action !== "start") return json({ error: "Unsupported action" }, 400);

    const appUrl = allowedAppUrl(body.app_url);
    const random = crypto.getRandomValues(new Uint8Array(32));
    const rawState = [...random].map((v) => v.toString(16).padStart(2, "0")).join("");
    const { error } = await admin.rpc("service_create_gmail_state", {
      target_hash: await sha256(rawState), target_user: authUser.id, target_app_url: appUrl,
    });
    if (error) throw error;
    const authorization = new URL(googleAuth);
    authorization.search = new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_GMAIL_CLIENT_ID")!,
      redirect_uri: redirectUri(),
      response_type: "code",
      scope: "openid email https://www.googleapis.com/auth/gmail.send",
      access_type: "offline",
      prompt: "consent",
      state: rawState,
    }).toString();
    return json({ authorization_url: authorization.toString() });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
