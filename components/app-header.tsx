import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

/** Sticky header for signed-in screens. `right` holds page-level actions such as Sign out. */
export function AppHeader({
  right,
  homeHref = "/",
}: {
  right?: ReactNode;
  homeHref?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href={homeHref} aria-label="VibeLink home" className="rounded-lg">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {right}
        </div>
      </div>
    </header>
  );
}
