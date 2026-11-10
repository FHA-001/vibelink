import { NextResponse } from "next/server";
import { requireAdmin, adminNotFound } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const DAY = 86400000;
const LAGOS_OFFSET = 3600000; // Nigeria is UTC+1 all year

const dayKey = (value: string | number) =>
  new Date(new Date(value).getTime() + LAGOS_OFFSET).toISOString().slice(0, 10);

type Person = { name: string | null; username: string | null };

export async function GET(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return adminNotFound();

  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  const sort = params.get("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  const [connectionsRes, profilesRes, acceptedRes, declinedRes, requestsRes] = await Promise.all([
    supabase
      .from("connections")
      .select("id, user_one_id, user_two_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20000),
    supabase.from("profiles").select("id, full_name, username").limit(5000),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "declined"),
    supabase.from("connection_requests").select("id", { count: "exact", head: true }),
  ]);

  const failed = [connectionsRes, profilesRes, acceptedRes, declinedRes, requestsRes].find(
    (r) => r.error
  );
  if (failed?.error) {
    console.error("Admin connections query failed:", failed.error.code);
    return NextResponse.json({ error: "Could not load connections" }, { status: 500 });
  }

  const connections = connectionsRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  const personMap = new Map<string, Person>();
  profiles.forEach((p) => personMap.set(p.id, { name: p.full_name, username: p.username }));
  const personOf = (id: string): Person => personMap.get(id) ?? { name: null, username: null };

  // Connections per member
  const counts = new Map<string, number>();
  connections.forEach((c) => {
    counts.set(c.user_one_id, (counts.get(c.user_one_id) ?? 0) + 1);
    counts.set(c.user_two_id, (counts.get(c.user_two_id) ?? 0) + 1);
  });

  const top = Array.from(counts.entries())
    .filter(([id]) => personMap.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count, ...personOf(id) }));

  const membersWithConnections = Array.from(counts.keys()).filter((id) =>
    personMap.has(id)
  ).length;

  // Growth over the last 30 days
  const keys30 = Array.from({ length: 30 }, (_, i) => dayKey(Date.now() - (29 - i) * DAY));
  const trendCounts = new Map<string, number>(keys30.map((k) => [k, 0]));
  connections.forEach((c) => {
    const k = dayKey(c.created_at);
    if (trendCounts.has(k)) trendCounts.set(k, (trendCounts.get(k) ?? 0) + 1);
  });

  const accepted = acceptedRes.count ?? 0;
  const declined = declinedRes.count ?? 0;
  const requestsTotal = requestsRes.count ?? 0;

  // Searchable connection records: names, usernames and dates only
  let records = connections.map((c) => ({
    id: c.id as string,
    createdAt: c.created_at as string,
    a: personOf(c.user_one_id),
    b: personOf(c.user_two_id),
  }));

  if (q) {
    const has = (p: Person) =>
      (p.name ?? "").toLowerCase().includes(q) || (p.username ?? "").toLowerCase().includes(q);
    records = records.filter((r) => has(r.a) || has(r.b));
  }

  records.sort((x, y) =>
    sort === "oldest"
      ? x.createdAt.localeCompare(y.createdAt)
      : y.createdAt.localeCompare(x.createdAt)
  );

  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return NextResponse.json(
    {
      summary: {
        total: connections.length,
        accepted,
        declined,
        pending: Math.max(0, requestsTotal - accepted - declined),
        members: profiles.length,
        membersWithConnections,
        membersWithout: Math.max(0, profiles.length - membersWithConnections),
        avgPerMember: profiles.length > 0 ? (connections.length * 2) / profiles.length : 0,
        last30: keys30.reduce((sum, k) => sum + (trendCounts.get(k) ?? 0), 0),
      },
      top,
      trend: keys30.map((date) => ({ date, count: trendCounts.get(date) ?? 0 })),
      rows: records.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      total,
      page: safePage,
      totalPages,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}