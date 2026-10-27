import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CircleCheckIcon, InfoIcon } from "lucide-react";

type AlertVariant = "default" | "destructive" | "success";

const icons = {
  default: InfoIcon,
  destructive: AlertCircle,
  success: CircleCheckIcon,
} as const;

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }
>(({ className, variant = "default", children, ...props }, ref) => {
  const Icon = icons[variant];
  return (
    <div
      ref={ref}
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border p-4",
        variant === "destructive" &&
          "border-destructive/30 bg-destructive/[0.06] text-destructive",
        variant === "success" &&
          "border-teal-ink/30 bg-secondary/10 text-teal-ink",
        variant === "default" && "border-border bg-card text-foreground",
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
});
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
