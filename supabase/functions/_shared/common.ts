import { createClient } from "npm:@supabase/supabase-js@2.95.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function key(name: "publishable" | "secret") {
  const modern = Deno.env.get(name === "publishable" ? "SUPABASE_PUBLISHABLE_KEYS" : "SUPABASE_SECRET_KEYS");
  if (modern) return JSON.parse(modern).default;
  return Deno.env.get(name === "publishable" ? "SUPABASE_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY")!;
}

export function clients(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const authorization = req.headers.get("Authorization") || "";
  return {
    user: createClient(url, key("publishable"), { global: { headers: { Authorization: authorization } } }),
    admin: createClient(url, key("secret"), { auth: { persistSession: false } }),
  };
}

export async function requireUser(req: Request) {
  const { user, admin } = clients(req);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Authentication required");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid or expired session");
  return { userClient: user, admin, authUser: data.user };
}

export function allowedAppUrl(value: string) {
  const url = new URL(value);
  const allowed = (Deno.env.get("APP_ORIGINS") || "").split(",").map((v) => v.trim()).filter(Boolean);
  if (!allowed.includes(url.origin)) throw new Error("Unapproved application origin");
  return `${url.origin}${url.pathname}`;
}

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

async function encryptionKey() {
  const raw = base64ToBytes(Deno.env.get("TOKEN_ENCRYPTION_KEY") || "");
  if (raw.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value));
  return { encrypted: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv), tag: "aes-gcm-v1" };
}

export async function decryptToken(encrypted: string, iv: string) {
  const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, await encryptionKey(), base64ToBytes(encrypted));
  return new TextDecoder().decode(clear);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
