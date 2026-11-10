import { NextResponse } from "next/server";
import { requireAdmin, adminNotFound } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "interested", "converted", "unsubscribed"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return adminNotFound();

  const { data: signups, error: signupsError } = await supabase
    .from("waitlist_signups")
    .select("id, user_id, email, product, created_at, status, admin_note")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (signupsError) {
    console.error("Admin waitlist load failed:", signupsError.code);
    return NextResponse.json({ error: "Could not load the list" }, { status: 500 });
  }

  const rows = signups ?? [];
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))
  );

  // Names and usernames of members
  const profileMap = new Map<string, { full_name: string | null; username: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds);
    (profiles ?? []).forEach((p) =>
      profileMap.set(p.id, { full_name: p.full_name, username: p.username })
    );
  }

  // Account emails of members
  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      if (data?.user?.email) emailMap.set(id, data.user.email);
    })
  );

  const result = rows.map((r) => {
    const profile = r.user_id ? profileMap.get(r.user_id) : undefined;
    return {
      id: r.id as string,
      product: r.product as string,
      createdAt: r.created_at as string,
      kind: r.user_id ? "member" : "visitor",
      name: profile?.full_name ?? null,
      username: profile?.username ?? null,
      email: r.user_id ? emailMap.get(r.user_id) ?? null : (r.email as string | null),
      status: (r.status as string) ?? "new",
      adminNote: (r.admin_note as string | null) ?? null,
    };
  });

  return NextResponse.json({ rows: result }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return adminNotFound();

  let body: { id?: unknown; status?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.note !== undefined) {
    if (typeof body.note !== "string" || body.note.length > 1000) {
      return NextResponse.json({ error: "Note is too long" }, { status: 400 });
    }
    const trimmed = body.note.trim();
    update.admin_note = trimmed === "" ? null : trimmed;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("waitlist_signups")
    .update(update)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Admin waitlist update failed:", error.code);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}