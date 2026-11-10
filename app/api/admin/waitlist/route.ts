import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Everyone who is not the admin gets the same empty 404
function notFound() {
  return new NextResponse(null, { status: 404 });
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Admin route is missing a server setting");
    return notFound();
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return notFound();

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Who is asking?
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return notFound();

  // Are they the admin?
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!me || me.is_admin !== true) return notFound();

  const { data: signups, error: signupsError } = await supabase
    .from("waitlist_signups")
    .select("id, user_id, email, product, created_at")
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
    };
  });

  return NextResponse.json(
    { rows: result },
    { headers: { "Cache-Control": "no-store" } }
  );
}