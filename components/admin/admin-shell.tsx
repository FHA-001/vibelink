"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/connections", label: "Connections" },
  { href: "/admin/waitlist", label: "Waitlist" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-canvas flex min-h-screen flex-col pb-24 md:pb-28">
      <AppHeader />
      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <nav
            aria-label="Admin sections"
            className="mb-8 flex gap-2 overflow-x-auto border-b border-border pb-3"
          >
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/15 text-navy"
                      : "border-transparent text-muted-foreground hover:text-navy"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}