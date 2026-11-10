import { NextResponse } from "next/server";
import { requireAdmin, adminNotFound } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const MAX_ALL = 5000;

const VISIBILITY_KEYS = [
  "full_name",
  "job_title",
  "company_school",
  "bio",
  "interests",
  "profile_photo",
  "website",
  "linkedin",
  "twitter",
  "github",
  "instagram",
];

const hasText = (v?: string | null) => !!v && v.trim() !== "";

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  profile_photo: string | null;
  job_title: string | null;
  company_school: string | null;
  bio: string | null;
  interests: string[] | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  instagram: string | null;
  profile_visibility: unknown;
};

export async function GET(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return adminNotFound();

  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  const verifiedFilter = params.get("verified") ?? "all";
  const profileFilter = params.get("profile") ?? "all";
  const sort = params.get("sort") ?? "newest";
  const wantAll = params.get("all") === "1";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  // Sign-in accounts: email, creation date, verification
  const authUsers: {
    id: string;
    email?: string | null;
    created_at: string;
    email_confirmed_at?: string | null;
  }[] = [];
  for (let p = 1; p <= 20; p++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: p, perPage: 1000 });
    if (error) {
      console.error("Admin users: user list failed");
      return NextResponse.json({ error: "Could not load users" }, { status: 500 });
    }
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [profilesRes, connectionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, username, profile_photo, job_title, company_school, bio, interests, website, linkedin, twitter, github, instagram, profile_visibility"
      )
      .limit(5000),
    supabase.from("connections").select("user_one_id, user_two_id").limit(20000),
  ]);
  if (profilesRes.error || connectionsRes.error) {
    console.error("Admin users query failed:", (profilesRes.error ?? connectionsRes.error)?.code);
    return NextResponse.json({ error: "Could not load users" }, { status: 500 });
  }

  const profileMap = new Map<string, ProfileRow>();
  ((profilesRes.data ?? []) as ProfileRow[]).forEach((p) => profileMap.set(p.id, p));

  const connectionCount = new Map<string, number>();
  (connectionsRes.data ?? []).forEach((c) => {
    connectionCount.set(c.user_one_id, (connectionCount.get(c.user_one_id) ?? 0) + 1);
    connectionCount.set(c.user_two_id, (connectionCount.get(c.user_two_id) ?? 0) + 1);
  });

  let rows = authUsers.map((u) => {
    const p = profileMap.get(u.id);

    // Same seven checks as the completeness meter on My Card
    const checks = p
      ? [
          true,
          hasText(p.profile_photo),
          hasText(p.job_title),
          hasText(p.company_school),
          hasText(p.bio),
          (p.interests?.length ?? 0) > 0,
          [p.website, p.linkedin, p.twitter, p.github, p.instagram].some(hasText),
        ]
      : [];
    const completion = p ? Math.round((checks.filter(Boolean).length / 7) * 100) : 0;

    const vis = p?.profile_visibility;
    const visibleFields =
      vis && typeof vis === "object"
        ? VISIBILITY_KEYS.filter((k) => (vis as Record<string, unknown>)[k] === true).length
        : 0;

    return {
      id: u.id,
      name: p?.full_name ?? null,
      username: p?.username ?? null,
      email: u.email ?? null,
      verified: !!u.email_confirmed_at,
      createdAt: u.created_at,
      hasProfile: !!p,
      completion,
      visibleFields,
      connections: connectionCount.get(u.id) ?? 0,
    };
  });

  if (q) {
    rows = rows.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.username ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
    );
  }
  if (verifiedFilter === "verified") rows = rows.filter((r) => r.verified);
  if (verifiedFilter === "unverified") rows = rows.filter((r) => !r.verified);
  if (profileFilter === "complete") rows = rows.filter((r) => r.hasProfile && r.completion === 100);
  if (profileFilter === "incomplete") rows = rows.filter((r) => r.hasProfile && r.completion < 100);
  if (profileFilter === "none") rows = rows.filter((r) => !r.hasProfile);

  const label = (r: (typeof rows)[number]) => (r.name || r.username || r.email || "").toLowerCase();
  rows.sort((a, b) => {
    if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    if (sort === "name") return label(a).localeCompare(label(b));
    if (sort === "connections") return b.connections - a.connections;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = wantAll
    ? rows.slice(0, MAX_ALL)
    : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return NextResponse.json(
    { rows: pageRows, total, page: wantAll ? 1 : page, totalPages: wantAll ? 1 : totalPages },
    { headers: { "Cache-Control": "no-store" } }
  );
}