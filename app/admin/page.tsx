"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/admin-shell";
import { fetchAdminJson } from "@/lib/auth";

type TrendPoint = { date: string; count: number };

type Stats = {
  users: {
    total: number;
    withProfile: number;
    verified: number;
    unverified: number;
    today: number;
    last7: number;
    last30: number;
  };
  profiles: { complete: number; incomplete: number };
  connections: {
    total: number;
    accepted: number;
    declined: number;
    pending: number;
    avgPerUser: number;
    last30: number;
  };
  waitlist: { nfc_card: number; vibetags: number; members: number; visitors: number };
  reports: { total: number };
  signupTrend: TrendPoint[];
  connectionTrend: TrendPoint[];
};

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-heading text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function TrendChart({
  title,
  points,
  barClass,
}: {
  title: string;
  points: TrendPoint[];
  barClass: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{total} in the last 30 days</p>
      </div>
      <div
        role="img"
        aria-label={`${title}: ${total} in the last 30 days`}
        className="mt-4 flex h-32 items-end gap-0.5"
      >
        {points.map((p) => (
          <div
            key={p.date}
            title={`${p.date}: ${p.count}`}
            className={`flex-1 rounded-t ${barClass} ${p.count === 0 ? "opacity-25" : ""}`}
            style={{ height: `${Math.max(p.count > 0 ? 6 : 2, (p.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{points[0]?.date.slice(5)}</span>
        <span>{points[points.length - 1]?.date.slice(5)}</span>
      </div>
    </section>
  );
}

export default function AdminOverviewPage() {
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    const result = await fetchAdminJson<Stats>("/api/admin/stats");
    if (result.ok && result.data) {
      setStats(result.data);
      setState("ready");
    } else if (result.status === 404 || result.status === 401) {
      setState("denied");
    } else {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Anyone who is not the admin sees the normal "page not found" page
  if (state === "denied") notFound();

  if (state === "loading") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-24" aria-busy="true">
        <div className="skeleton h-10 w-64" aria-hidden="true" />
        <div className="skeleton mt-6 h-64 w-full" aria-hidden="true" />
      </main>
    );
  }

  if (state === "error" || !stats) {
    return (
      <AdminShell>
        <p role="alert" className="text-sm text-destructive">
          Could not load the overview. Please try again.
        </p>
        <Button className="mt-4" variant="outline" onClick={load}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live figures from your VibeLink data. Days are in Nigerian time.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={load}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Section title="Users">
        <StatCard label="Registered accounts" value={stats.users.total} hint="Everyone who signed up" />
        <StatCard label="Signed up today" value={stats.users.today} />
        <StatCard label="Last 7 days" value={stats.users.last7} />
        <StatCard label="Last 30 days" value={stats.users.last30} />
        <StatCard label="Email verified" value={stats.users.verified} />
        <StatCard label="Not verified" value={stats.users.unverified} />
        <StatCard label="Profiles created" value={stats.users.withProfile} />
        <StatCard
          label="Cards 100% complete"
          value={stats.profiles.complete}
          hint={`${stats.profiles.incomplete} still incomplete`}
        />
      </Section>

      <div className="mt-6">
        <TrendChart title="New accounts per day" points={stats.signupTrend} barClass="bg-primary" />
      </div>

      <Section title="Connections">
        <StatCard label="Connections made" value={stats.connections.total} />
        <StatCard label="Pending requests" value={stats.connections.pending} />
        <StatCard label="Accepted requests" value={stats.connections.accepted} />
        <StatCard label="Declined requests" value={stats.connections.declined} />
        <StatCard
          label="Average per member"
          value={stats.connections.avgPerUser.toFixed(1)}
          hint="Connections per profile"
        />
        <StatCard label="New in 30 days" value={stats.connections.last30} />
      </Section>

      <div className="mt-6">
        <TrendChart
          title="New connections per day"
          points={stats.connectionTrend}
          barClass="bg-secondary"
        />
      </div>

      <Section title="Waitlist">
        <StatCard label="NFC Card" value={stats.waitlist.nfc_card} />
        <StatCard label="VibeTags" value={stats.waitlist.vibetags} />
        <StatCard label="From members" value={stats.waitlist.members} />
        <StatCard label="From visitors" value={stats.waitlist.visitors} />
      </Section>

      <Section title="Safety">
        <StatCard label="Profile reports" value={stats.reports.total} hint="All time" />
      </Section>
    </AdminShell>
  );
}