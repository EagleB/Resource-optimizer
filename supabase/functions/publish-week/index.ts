import { allowedAppUrl, corsHeaders, decryptToken, json, requireUser } from "../_shared/common.ts";

type Shift = { start: number; end: number };
type Person = { id: string; name: string; email: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dayNames: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

function validSnapshot(snapshot: any) {
  if (!snapshot || !snapshot.settings || !Array.isArray(snapshot.people) || !snapshot.schedule) throw new Error("Invalid planner payload");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.settings.weekLabel || "")) throw new Error("A valid week date is required");
  if (!snapshot.people.length || snapshot.people.length > 50) throw new Error("A publication must contain between 1 and 50 recipients");
  const emails = new Set<string>();
  for (const person of snapshot.people as Person[]) {
    person.email = String(person.email || "").trim().toLowerCase();
    if (!emailPattern.test(person.email)) throw new Error(`${person.name || "A recipient"} needs a valid email address`);
    if (emails.has(person.email)) throw new Error(`Duplicate recipient email: ${person.email}`);
    emails.add(person.email);
  }
}

function assignmentRows(snapshot: any) {
  return snapshot.people.map((person: Person) => ({
    recipient_email: person.email,
    person_name: person.name,
    assignment_payload: {
      shifts: snapshot.schedule[person.id] || {},
      working_days: snapshot.settings.workingDays,
      window_start: snapshot.settings.windowStart,
      window_end: snapshot.settings.windowEnd,
    },
  }));
}

async function gmailAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_GMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_GMAIL_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description || "Gmail authorization has expired");
  return body.access_token as string;
}

function base64url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function message(sender: string, recipient: string, name: string, weekStart: string, payload: any, link: string) {
  const shifts: Record<string, Shift> = payload.shifts || {};
  const lines = Object.keys(dayNames).map((day) => {
    const shift = shifts[day];
    return `${dayNames[day]}: ${shift ? `${String(shift.start).padStart(2, "0")}:00–${String(shift.end).padStart(2, "0")}:00` : "Off"}`;
  });
  const subject = `Your work schedule for the week of ${weekStart}`;
  const body = `Hello ${name},\r\n\r\nYour published assignment for the week of ${weekStart}:\r\n\r\n${lines.join("\r\n")}\r\n\r\nView the latest secure assignment:\r\n${link}\r\n`;
  return base64url([
    `From: ${sender}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n"));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userClient, admin, authUser } = await requireUser(req);
    const { week_id, app_url, retry_only = false } = await req.json();
    if (!week_id) throw new Error("week_id is required");

    const { data: week, error: weekError } = await userClient.from("weeks").select("id,week_start,draft_payload")
      .eq("id", week_id).eq("owner_id", authUser.id).single();
    if (weekError || !week) throw new Error("Week not found or not owned by caller");

    if (!retry_only) {
      validSnapshot(week.draft_payload);
      const { error: publishError } = await userClient.rpc("publish_week_snapshot", {
        target_week_id: week.id,
        snapshot: week.draft_payload,
        assignments: assignmentRows(week.draft_payload),
      });
      if (publishError) throw publishError;
    }

    const { data: connectionRows } = await admin.rpc("service_gmail_connection", { target_user: authUser.id });
    const connection = connectionRows?.[0];
    if (!connection) throw new Error("Connect Gmail before publishing");
    const accessToken = await gmailAccessToken(await decryptToken(connection.encrypted_refresh_token, connection.token_iv));

    let query = userClient.from("week_assignments").select("id,recipient_email,person_name,assignment_payload,week_start,notification_status")
      .eq("week_id", week.id).eq("owner_id", authUser.id);
    if (retry_only) query = query.eq("notification_status", "failed");
    const { data: assignments, error: assignmentError } = await query;
    if (assignmentError) throw assignmentError;

    const base = new URL(allowedAppUrl(String(app_url)));
    let sent = 0, failed = 0;
    for (const assignment of assignments || []) {
      try {
        const link = new URL(base.toString());link.searchParams.set("assignment", week.id);
        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ raw: message(connection.sender_email, assignment.recipient_email, assignment.person_name, assignment.week_start, assignment.assignment_payload, link.toString()) }),
        });
        const responseBody = await response.json();
        if (!response.ok) throw new Error(responseBody.error?.message || "Gmail send failed");
        await userClient.from("week_assignments").update({ notification_status: "sent", notification_error: null, notified_at: new Date().toISOString() }).eq("id", assignment.id);
        sent++;
      } catch (error) {
        await userClient.from("week_assignments").update({ notification_status: "failed", notification_error: error instanceof Error ? error.message.slice(0, 500) : "Send failed" }).eq("id", assignment.id);
        failed++;
      }
    }
    return json({ sent, failed, total: (assignments || []).length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 400);
  }
});
