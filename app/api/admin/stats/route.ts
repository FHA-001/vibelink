import { NextResponse } from "next/server";
import { requireAdmin, adminNotFound } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86400000;
const LAGOS_OFFSET = 3600000; // Nigeria is UTC+1 all year

const dayKey = (value: string | number) =>
  new Date(new Date(value).getTime() + LAGOS_OFFSET).toISOString().slice(0, 10);

const hasText = (v?: string | null) => !!v && v.trim() !== "";

type ProfileRow = {
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
};

// Same seven checks as the completeness meter on My Card
function isComplete(p: ProfileRow) {
  return (
    hasText(p.profile_photo) &&
    hasText(p.job_title) &&
    hasText(p.company_school) &&
    hasText(p.bio) &&
    (p.interests?.length ?? 0) > 0 &&
    [p.website, p.linkedin, p.twitter, p.github, p.instagram].some(hasText)
  );
}

function trend(keys: string[], dates: string[]) {
  const counts = new Map<string, number>(keys.map((k) => [k, 0]));
  dates.forEach((d) => {
    const k = dayKey(d);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return keys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

export async function GET(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return adminNotFound();

  const keys30 = Array.from({ length: 30 }, (_, i) => dayKey(Date.now() - (29 - i) * DAY));
  const keys7 = new Set(keys30.slice(-7));
  const todayKey = keys30[keys30.length - 1];
  const since30 = new Date(Date.now() - 31 * DAY).toISOString();

  // All sign-in accounts, with creation date and email verification
  const authUsers: { created_at: string; email_confirmed_at?: string | null }[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Admin stats: user list failed");
      return NextResponse.json({ error: "Could not load stats" }, { status: 500 });
    }
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [
    profilesRes,
    connectionsCountRes,
    connectionsRecentRes,
    acceptedRes,
    declinedRes,
    requestsTotalRes,
    waitlistRes,
    reportsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "profile_photo, job_title, company_school, bio, interests, website, linkedin, twitter, github, instagram"
      )
      .limit(5000),
    supabase.from("connections").select("id", { count: "exact", head: true }),
    supabase.from("connections").select("created_at").gte("created_at", since30).limit(5000),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
    supabase
      .from("connection_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "declined"),
    supabase.from("connection_requests").select("id", { count: "exact", head: true }),
    supabase.from("waitlist_signups").select("user_id, product").limit(5000),
    supabase.from("profile_reports").select("id", { count: "exact", head: true }),
  ]);

  const failed = [
    profilesRes,
    connectionsCountRes,
    connectionsRecentRes,
    acceptedRes,
    declinedRes,
    requestsTotalRes,
    waitlistRes,
    reportsRes,
  ].find((r) => r.error);
  if (failed?.error) {
    console.error("Admin stats query failed:", failed.error.code);
    return NextResponse.json({ error: "Could not load stats" }, { status: 500 });
  }

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const completeCount = profiles.filter(isComplete).length;

  const verified = authUsers.filter((u) => !!u.email_confirmed_at).length;
  const signupKeys = authUsers.map((u) => dayKey(u.created_at));

  const connectionsTotal = connectionsCountRes.count ?? 0;
  const accepted = acceptedRes.count ?? 0;
  const declined = declinedRes.count ?? 0;
  const requestsTotal = requestsTotalRes.count ?? 0;

  const waitlist = waitlistRes.data ?? [];

  return NextResponse.json(
    {
      users: {
        total: authUsers.length,
        withProfile: profiles.length,
        verified,
        unverified: authUsers.length - verified,
        today: signupKeys.filter((k) => k === todayKey).length,
        last7: signupKeys.filter((k) => keys7.has(k)).length,
        last30: signupKeys.filter((k) => keys30.includes(k)).length,
      },
      profiles: {
        complete: completeCount,
        incomplete: profiles.length - completeCount,
      },
      connections: {
        total: connectionsTotal,
        accepted,
        declined,
        pending: Math.max(0, requestsTotal - accepted - declined),
        avgPerUser: profiles.length > 0 ? (connectionsTotal * 2) / profiles.length : 0,
        last30: (connectionsRecentRes.data ?? []).length,
      },
      waitlist: {
        nfc_card: waitlist.filter((w) => w.product === "nfc_card").length,
        vibetags: waitlist.filter((w) => w.product === "vibetags").length,
        members: waitlist.filter((w) => w.user_id).length,
        visitors: waitlist.filter((w) => !w.user_id).length,
      },
      reports: { total: reportsRes.count ?? 0 },
      signupTrend: trend(keys30, authUsers.map((u) => u.created_at)),
      connectionTrend: trend(
        keys30,
        (connectionsRecentRes.data ?? []).map((c) => c.created_at as string)
      ),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}