import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 2000;
const PRODUCTS = ["nfc_card", "vibetags"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Payload = {
  email?: unknown;
  product?: unknown;
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
    console.error("Waitlist route is missing a server setting");
    return fail("The waitlist is not available right now", 503);
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return fail("Invalid request", 400);
  }
  if (raw.length > MAX_BODY_CHARS) {
    return fail("Request is too large", 413);
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

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const product = typeof body.product === "string" ? body.product : "";
  const token = typeof body.token === "string" ? body.token : "";

  if (!token) {
    return fail("Please complete the security check", 400);
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return fail("Please enter a valid email address", 400);
  }
  if (!PRODUCTS.includes(product)) {
    return fail("Invalid request", 400);
  }

  const passed = await verifyTurnstile(token, secret);
  if (!passed) {
    return fail("Security check failed. Please try again.", 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("waitlist_signups").insert({ email, product });

  // 23505 = this email is already on the list. Say "ok" anyway so the form
  // never reveals who is on the list.
  if (error && error.code !== "23505") {
    console.error("Waitlist save failed:", error.code);
    return fail("Unable to join the waitlist", 400);
  }

  return NextResponse.json({ ok: true });
}