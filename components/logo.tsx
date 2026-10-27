import { cn } from "@/lib/utils";

/**
 * VibeLink brand lockup: the V-link mark plus the wordmark.
 * `variant="light"` is for use on navy surfaces. `markOnly` drops the wordmark.
 */
export function Logo({
  className = "",
  variant = "dark",
  markOnly = false,
}: {
  className?: string;
  variant?: "dark" | "light";
  markOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo-mark.png"
        alt={markOnly ? "VibeLink" : ""}
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
        decoding="async"
      />
      {!markOnly && (
        <span
          className={cn(
            "font-heading text-[1.35rem] font-semibold leading-none tracking-tight",
            variant === "light" ? "text-ivory" : "text-navy"
          )}
        >
          VibeLink
        </span>
      )}
    </span>
  );
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      width={48}
      height={48}
      className={cn("object-contain", className)}
      decoding="async"
    />
  );
}
