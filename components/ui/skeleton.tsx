import { cn } from "@/lib/utils";

/** Shimmering placeholder. Hidden from assistive tech; pair with an sr-only status message. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton", className)} {...props} />;
}
