"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";
import { fetchAdminJson } from "@/lib/auth";

type UserRow = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  verified: boolean;
  createdAt: string;
  hasProfile: boolean;
  completion: number;
  visibleFields: number;
  connections: number;
};

type UsersResponse = { rows: UserRow[]; total: number; page: number; totalPages: number };

const selectClass =
  "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// Stops spreadsheet programs from running typed "=formula" text as a formula
function csvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "good" | "warn" }) {
  const toneClass =
    tone === "good"
      ? "border-secondary/40 bg-secondary/10 text-teal-ink"
      : tone === "warn"
        ? "border-primary/40 bg-primary/10 text-navy"
        : "border-border text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

export default function AdminUsersPage() {
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState("all");
  const [profile, setProfile] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Wait until the person stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryString = useCallback(
    (extra: string) =>
      `/api/admin/users?q=${encodeURIComponent(q)}&verified=${verified}&profile=${profile}&sort=${sort}${extra}`,
    [q, verified, profile, sort]
  );

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    fetchAdminJson<UsersResponse>(queryString(`&page=${page}`)).then((result) => {
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
  }, [queryString, page]);

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
          Could not load users. Please try again.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setPage((p) => p)}>
          Try again
        </Button>
      </AdminShell>
    );
  }

  const exportCsv = async () => {
    setExporting(true);
    const result = await fetchAdminJson<UsersResponse>(queryString("&all=1"));
    setExporting(false);
    if (!result.ok || !result.data) return;

    const header = [
      "Name",
      "Username",
      "Email",
      "Email verified",
      "Signed up",
      "Card complete (%)",
      "Public profile fields (of 11)",
      "Connections",
    ];
    const lines = result.data.rows.map((r) =>
      [
        r.name,
        r.username,
        r.email,
        r.verified ? "Yes" : "No",
        new Date(r.createdAt).toISOString(),
        r.hasProfile ? r.completion : null,
        r.hasProfile ? r.visibleFields : null,
        r.connections,
      ]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vibelink-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const profileLink = (r: UserRow) =>
    r.username ? (
      <Link
        href={`/u/${r.username}`}
        className="font-medium text-gold underline underline-offset-4"
      >
        @{r.username}
      </Link>
    ) : (
      <span className="text-muted-foreground">No profile</span>
    );

  return (
    <AdminShell>
      <h1 className="font-heading text-3xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.total} {data.total === 1 ? "account" : "accounts"} match. Passwords, private notes and
        tags are never shown here.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, username or email"
          aria-label="Search users"
          className="w-full sm:w-72"
        />
        <select
          value={verified}
          onChange={(e) => {
            setVerified(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by email verification"
          className={selectClass}
        >
          <option value="all">All emails</option>
          <option value="verified">Verified</option>
          <option value="unverified">Not verified</option>
        </select>
        <select
          value={profile}
          onChange={(e) => {
            setProfile(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by profile completion"
          className={selectClass}
        >
          <option value="all">All profiles</option>
          <option value="complete">Complete card</option>
          <option value="incomplete">Incomplete card</option>
          <option value="none">No profile yet</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Sort users"
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A to Z</option>
          <option value="connections">Most connections</option>
        </select>
        <Button
          type="button"
          variant="outline"
          className="sm:ml-auto"
          onClick={exportCsv}
          disabled={exporting || data.total === 0}
        >
          <Download aria-hidden="true" />
          {exporting ? "Preparing..." : "Download CSV"}
        </Button>
      </div>

      <div className={busy ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {data.rows.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No users match these filters.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Signed up</th>
                    <th className="px-4 py-3 font-semibold">Card</th>
                    <th className="px-4 py-3 font-semibold">Public fields</th>
                    <th className="px-4 py-3 font-semibold">Connections</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{r.name || "-"}</div>
                        <div className="text-xs">{profileLink(r)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="break-all">{r.email || "-"}</div>
                        <div className="mt-1">
                          {r.verified ? (
                            <Chip tone="good">Verified</Chip>
                          ) : (
                            <Chip tone="warn">Not verified</Chip>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{r.hasProfile ? `${r.completion}%` : "No profile"}</td>
                      <td className="px-4 py-3">{r.hasProfile ? `${r.visibleFields} of 11` : "-"}</td>
                      <td className="px-4 py-3">{r.connections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone cards */}
            <ul className="mt-6 space-y-3 md:hidden">
              {data.rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="font-medium text-navy">{r.name || "No name yet"}</p>
                  <p className="text-sm">{profileLink(r)}</p>
                  <p className="mt-2 break-all text-sm text-muted-foreground">{r.email || "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.verified ? (
                      <Chip tone="good">Verified</Chip>
                    ) : (
                      <Chip tone="warn">Not verified</Chip>
                    )}
                    <Chip>{r.hasProfile ? `Card ${r.completion}%` : "No profile"}</Chip>
                    <Chip>{r.connections} connections</Chip>
                    {r.hasProfile && <Chip>{r.visibleFields} of 11 public</Chip>}
                    <Chip>Joined {new Date(r.createdAt).toLocaleDateString()}</Chip>
                  </div>
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
            disabled={page <= 1 || busy}
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
            disabled={page >= data.totalPages || busy}
          >
            Next
          </Button>
        </div>
      )}
    </AdminShell>
  );
}