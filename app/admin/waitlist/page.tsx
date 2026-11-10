"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { AdminShell } from "@/components/admin/admin-shell";
import { fetchAdminWaitlist, sendAdminJson, AdminWaitlistRow } from "@/lib/auth";

type Filter = "all" | "nfc_card" | "vibetags";

const PAGE_SIZE = 25;

const PRODUCT_LABELS: Record<string, string> = {
  nfc_card: "NFC Card",
  vibetags: "VibeTags",
};

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "converted", label: "Converted" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

const statusLabel = (value: string) => STATUSES.find((s) => s.value === value)?.label ?? value;

const selectClass =
  "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

// Stops spreadsheet programs from running typed "=formula" text as a formula
function csvCell(value: string | null): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminWaitlistPage() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [rows, setRows] = useState<AdminWaitlistRow[]>([]);
  const [product, setProduct] = useState<Filter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (product !== "all" && r.product !== product) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const haystack = `${r.name ?? ""} ${r.username ?? ""} ${r.email ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, product, statusFilter, search]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const save = async (id: string, body: { status?: string; note?: string }) => {
    setSavingId(id);
    const result = await sendAdminJson("/api/admin/waitlist", "PATCH", { id, ...body });
    setSavingId(null);

    if (!result.ok) {
      toast({
        title: "Could not save",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    }

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r };
        if (body.status !== undefined) next.status = body.status;
        if (body.note !== undefined) next.adminNote = body.note.trim() === "" ? null : body.note.trim();
        return next;
      })
    );
    return true;
  };

  const openNote = (row: AdminWaitlistRow) => {
    setEditingId(row.id);
    setNoteDraft(row.adminNote ?? "");
  };

  const saveNote = async (id: string) => {
    const ok = await save(id, { note: noteDraft });
    if (ok) {
      setEditingId(null);
      toast({ title: "Note saved" });
    }
  };

  const downloadCsv = () => {
    const header = ["Product", "Type", "Name", "Username", "Email", "Status", "Note", "Joined"];
    const lines = filtered.map((r) =>
      [
        PRODUCT_LABELS[r.product] ?? r.product,
        r.kind,
        r.name,
        r.username,
        r.email,
        statusLabel(r.status),
        r.adminNote,
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
    a.download = "vibelink-waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const productFilters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "nfc_card", label: "NFC Card" },
    { key: "vibetags", label: "VibeTags" },
  ];

  return (
    <AdminShell>
      <h1 className="font-heading text-3xl font-semibold">Waitlist</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everyone who asked to hear about the NFC card and VibeTags. Only you can see this page.
        Mark people as Unsubscribed when they ask to be removed, and do not contact them.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {productFilters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setProduct(f.key);
              setPage(1);
            }}
            aria-pressed={product === f.key}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              product === f.key
                ? "border-primary bg-primary/15 text-navy"
                : "border-border text-muted-foreground hover:text-navy"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, username or email"
          aria-label="Search the waitlist"
          className="w-full sm:w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          className="sm:ml-auto"
          onClick={downloadCsv}
          disabled={filtered.length === 0}
        >
          <Download aria-hidden="true" />
          Download CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No signups yet." : "No signups match these filters."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Profile</th>
                <th className="px-4 py-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      {r.name || <span className="text-muted-foreground">Visitor</span>}
                    </td>
                    <td className="break-all px-4 py-3">{r.email || "-"}</td>
                    <td className="px-4 py-3">{PRODUCT_LABELS[r.product] ?? r.product}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => save(r.id, { status: e.target.value })}
                        disabled={savingId === r.id}
                        aria-label={`Status for ${r.email ?? r.name ?? "signup"}`}
                        className={selectClass}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
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
                        <span className="text-muted-foreground">No account</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => (editingId === r.id ? setEditingId(null) : openNote(r))}
                        className="text-sm font-medium text-gold underline underline-offset-4"
                      >
                        {r.adminNote ? "View note" : "Add note"}
                      </button>
                    </td>
                  </tr>
                  {editingId === r.id && (
                    <tr className="border-b border-border bg-muted/40">
                      <td colSpan={7} className="px-4 py-4">
                        <label htmlFor={`note-${r.id}`} className="text-xs font-semibold text-navy">
                          Internal note (only you can see this)
                        </label>
                        <Textarea
                          id={`note-${r.id}`}
                          rows={3}
                          maxLength={1000}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          className="mt-2"
                        />
                        <div className="mt-3 flex items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveNote(r.id)}
                            disabled={savingId === r.id}
                          >
                            Save note
                          </Button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </AdminShell>
  );
}