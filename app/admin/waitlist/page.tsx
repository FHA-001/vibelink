
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAdminWaitlist, AdminWaitlistRow } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

type Filter = "all" | "nfc_card" | "vibetags";

const PRODUCT_LABELS: Record<string, string> = {
  nfc_card: "NFC Card",
  vibetags: "VibeTags",
};

// Stops spreadsheet programs from running a visitor-typed "=formula" as a formula
function csvCell(value: string | null): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminWaitlistPage() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [rows, setRows] = useState<AdminWaitlistRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;

    fetchAdminWaitlist().then((data) => {
      if (cancelled) return;

      if (!data) {
        setState("denied");
        return;
      }

      setRows(data);
      setState("ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.product === filter)),
    [rows, filter]
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      nfc_card: rows.filter((r) => r.product === "nfc_card").length,
      vibetags: rows.filter((r) => r.product === "vibetags").length,
    }),
    [rows]
  );

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

  const downloadCsv = () => {
    const header = ["Product", "Type", "Name", "Username", "Email", "Joined"];

    const lines = shown.map((r) =>
      [
        PRODUCT_LABELS[r.product] ?? r.product,
        r.kind,
        r.name,
        r.username,
        r.email,
        new Date(r.createdAt).toISOString(),
      ]
        .map((cell) => csvCell(cell))
        .join(",")
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `vibelink-waitlist-${filter}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "nfc_card", label: "NFC Card" },
    { key: "vibetags", label: "VibeTags" },
  ];

  return (
    <AdminShell>
      <h1 className="font-heading text-3xl font-semibold">Waitlist</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Everyone who asked to hear about the NFC card and VibeTags. Only you can
        see this page.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "border-primary bg-primary/15 text-navy"
                : "border-border text-muted-foreground hover:text-navy"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}

        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          onClick={downloadCsv}
          disabled={shown.length === 0}
        >
          <Download aria-hidden="true" />
          Download CSV
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No signups yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Profile</th>
              </tr>
            </thead>

            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3">
                    {r.name || (
                      <span className="text-muted-foreground">Visitor</span>
                    )}
                  </td>

                  <td className="px-4 py-3 break-all">{r.email || "-"}</td>

                  <td className="px-4 py-3">
                    {PRODUCT_LABELS[r.product] ?? r.product}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    {r.username ? (
                      <Link
                        href={`/u/${r.username}`}
                        className="font-medium text-gold underline underline-offset-4"
                      >
                        @{r.username}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        No account
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
