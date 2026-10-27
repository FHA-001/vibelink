import { LogoIcon } from "@/components/logo";

export default function Loading() {
  return (
    <div
      className="page-canvas flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <LogoIcon className="size-12 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading</p>
      </div>
    </div>
  );
}
