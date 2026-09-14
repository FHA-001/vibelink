import { LogoIcon } from "@/components/logo";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LogoIcon className="w-12 h-12 animate-pulse" />
        <p className="text-foreground/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}
