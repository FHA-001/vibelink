import { Eye, QrCode } from "lucide-react";
import type { ViewStats } from "@/lib/auth";

export function ProfileActivity({ stats }: { stats: ViewStats | null }) {
  if (!stats) return null;

  const rows = [
    { label: "Last 7 days", views: stats.views_7d, scans: stats.scans_7d },
    { label: "Last 30 days", views: stats.views_30d, scans: stats.scans_30d },
    { label: "All time", views: stats.views_total, scans: stats.scans_total },
  ];

  const hasActivity = stats.views_total > 0;

  return (
    <section aria-labelledby="activity-heading" className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Eye className="size-5 text-gold" aria-hidden="true" />
        <h2 id="activity-heading" className="font-heading text-base font-semibold">
          Profile activity
        </h2>
      </div>

      {hasActivity ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-navy">
                {row.views.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">views</p>
              <p className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-teal-ink">
                <QrCode className="size-3" aria-hidden="true" />
                {row.scans.toLocaleString()} via QR
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No visits yet. Share your QR code or profile link to get started.
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Only you can see this. We count visits, never who visited. Your own visits are not counted.
      </p>
    </section>
  );
}