import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 5000;

type Payload = {
  username?: unknown;
  name?: unknown;
  contact?: unknown;
  message?: unknown;
  token?: unknown;
  company?: unknown; // hidden trap field: real people never fill it in
};

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // Browsers always send Origin on a POST. If it is present, it must be our own site.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      // unreadable origin: treated as a mismatch below
    }
    if (!host || originHost !== host) {
      return fail("Request not allowed", 403);
    }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !serviceKey) {
    console.error("Message route is missing a server setting");
    return fail("Messages are not available right now", 503);
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return fail("Invalid request", 400);
  }
  if (raw.length > MAX_BODY_CHARS) {
    return fail("Message is too long", 413);
  }

  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return fail("Invalid request", 400);
  }

  // Bots fill every field. Pretend it worked, and save nothing.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const name = typeof body.name === "string" ? body.name : "";
  const contact = typeof body.contact === "string" ? body.contact : "";
  const message = typeof body.message === "string" ? body.message : "";
  const token = typeof body.token === "string" ? body.token : "";

  if (!token) {
    return fail("Please complete the security check", 400);
  }
  if (!username || !name.trim() || !contact.trim() || !message.trim()) {
    return fail("Please fill in every field", 400);
  }

  const passed = await verifyTurnstile(token, secret);
  if (!passed) {
    return fail("Security check failed. Please try again.", 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.rpc("submit_visitor_message", {
    p_username: username,
    p_name: name,
    p_contact: contact,
    p_message: message,
  });

  if (error) {
    const text = error.message ?? "";
    if (text.includes("Too many messages")) {
      return fail("Too many messages today. Please try again tomorrow.", 429);
    }
    if (text.startsWith("Please ")) {
      return fail(text, 400);
    }
    // Never log the message itself, only the error code
    console.error("Message save failed:", error.code);
    return fail("Unable to send message", 400);
  }

  return NextResponse.json({ ok: true });
}