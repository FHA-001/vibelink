"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";
import { fetchAdminJson } from "@/lib/auth";

type Person = { name: string | null; username: string | null };

type Response = {
  summary: {
    total: number;
    accepted: number;
    declined: number;
    pending: number;
    members: number;
    membersWithConnections: number;
    membersWithout: number;
    avgPerMember: number;
    last30: number;
  };
  top: { id: string; count: number; name: string | null; username: string | null }[];
  trend: { date: string; count: number }[];
  rows: { id: string; createdAt: string; a: Person; b: Person }[];
  total: number;
  page: number;
  totalPages: number;
};

const selectClass =
  "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PersonLink({ person }: { person: Person }) {
  const label = person.name || (person.username ? `@${person.username}` : "Unknown");
  if (!person.username) return <span>{label}</span>;
  return (
    <span>
      <span className="font-medium text-navy">{person.name || `@${person.username}`}</span>{" "}
      <Link
        href={`/u/${person.username}`}
        className="text-xs text-gold underline underline-offset-4"
      >
        @{person.username}
      </Link>
    </span>
  );
}

export default function AdminConnectionsPage() {
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Response | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  // Wait until the person stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    fetchAdminJson<Response>(
      `/api/admin/connections?q=${encodeURIComponent(q)}&sort=${sort}&page=${page}`
    ).then((result) => {
      if (cancelled) return;
      setBusy(false);
      if (result.ok && result.data) {
        setData(result.data);
        setState("ready");
      } else if (result.status === 404 || result.status === 401) {
        setState("denied");
      } else {
        setState("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [q, sort, page, reload]);

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

  if (state === "error" || !data) {
    return (
      <AdminShell>
        <p role="alert" className="text-sm text-destructive">
          Could not load connections. Please try again.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setReload((n) => n + 1)}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </AdminShell>
    );
  }

  const { summary, top, trend } = data;
  const maxTrend = Math.max(1, ...trend.map((p) => p.count));

  return (
    <AdminShell>
      <h1 className="font-heading text-3xl font-semibold">Connections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Names, usernames and dates only. Private notes and personal tags are never shown here.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Connections made" value={summary.total} />
        <StatCard label="Pending requests" value={summary.pending} />
        <StatCard label="Accepted requests" value={summary.accepted} />
        <StatCard label="Declined requests" value={summary.declined} />
        <StatCard
          label="Average per member"
          value={summary.avgPerMember.toFixed(1)}
          hint={`Across ${summary.members} profiles`}
        />
        <StatCard label="New in 30 days" value={summary.last30} />
        <StatCard label="Members with a connection" value={summary.membersWithConnections} />
        <StatCard label="Members with none yet" value={summary.membersWithout} />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-base font-semibold">New connections per day</h2>
          <p className="text-xs text-muted-foreground">{summary.last30} in the last 30 days</p>
        </div>
        <div
          role="img"
          aria-label={`New connections per day: ${summary.last30} in the last 30 days`}
          className="mt-4 flex h-32 items-end gap-0.5"
        >
          {trend.map((p) => (
            <div
              key={p.date}
              title={`${p.date}: ${p.count}`}
              className={`flex-1 rounded-t bg-secondary ${p.count === 0 ? "opacity-25" : ""}`}
              style={{ height: `${Math.max(p.count > 0 ? 6 : 2, (p.count / maxTrend) * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{trend[0]?.date.slice(5)}</span>
          <span>{trend[trend.length - 1]?.date.slice(5)}</span>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-heading text-lg font-semibold">Most connected members</h2>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No connections yet.</p>
        ) : (
          <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
            {top.map((member, index) => (
              <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <PersonLink person={member} />
                </span>
                <span className="text-sm font-semibold text-navy">{member.count}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">All connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? "connection" : "connections"} match.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or username"
            aria-label="Search connections"
            className="w-full sm:w-72"
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort connections"
            className={selectClass}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className={busy ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {data.rows.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No connections match this search.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">Connected with</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3">
                          <PersonLink person={r.a} />
                        </td>
                        <td className="px-4 py-3">
                          <PersonLink person={r.b} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phone cards */}
              <ul className="mt-4 space-y-3 md:hidden">
                {data.rows.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-sm">
                      <PersonLink person={r.a} />
                    </p>
                    <p className="my-1 text-xs text-muted-foreground">connected with</p>
                    <p className="text-sm">
                      <PersonLink person={r.b} />
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1 || busy}
            >
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={data.page >= data.totalPages || busy}
            >
              Next
            </Button>
          </div>
        )}
      </section>
    </AdminShell>
  );
}