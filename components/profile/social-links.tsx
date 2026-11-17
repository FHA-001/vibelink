"use client";

import type { ComponentType } from "react";
import { Globe } from "lucide-react";
import { ConnectedProfile, PublicProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/safe-url";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "./brand-icons";

type IconProps = { className?: string };

interface SocialLinksProps {
  profile: ConnectedProfile | PublicProfile;
  className?: string;
  // Icon-only buttons, for the one-screen card
  compact?: boolean;
}

const LINKS: {
  key: "website" | "linkedin" | "twitter" | "github" | "instagram";
  label: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { key: "website", label: "Website", Icon: Globe },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "twitter", label: "X (Twitter)", Icon: XIcon },
  { key: "github", label: "GitHub", Icon: GitHubIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
];

export function SocialLinks({ profile, className, compact = false }: SocialLinksProps) {
  // Every saved link is checked again here, so an unsafe or broken value is never shown
  const items = LINKS.flatMap(({ key, label, Icon }) => {
    const href = safeHref(profile[key]);
    return href ? [{ key, label, Icon, href }] : [];
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn("flex flex-wrap justify-center", compact ? "gap-2" : "gap-2.5", className)}>
      {items.map(({ key, label, Icon, href }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={`${label} (opens in a new tab)`}
            className={cn(
              "border border-border bg-background font-medium text-navy transition-[border-color,background-color,transform] duration-200 hover:border-primary/60 hover:bg-primary/10 active:scale-[0.97]",
              compact
                ? "flex size-10 items-center justify-center rounded-xl"
                : "inline-flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm"
            )}
          >
            <Icon className={cn("text-gold", compact ? "size-5" : "size-4")} />
            {!compact && label}
          </a>
        </li>
      ))}
    </ul>
  );
}