"use client";

import { Globe, Link } from "lucide-react";
import { ConnectedProfile, PublicProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SocialLinksProps {
  profile: ConnectedProfile | PublicProfile;
  className?: string;
  compact?: boolean;
}

export function SocialLinks({ profile, className, compact = false }: SocialLinksProps) {
  const links = [];

  if (profile.website) {
    links.push({ icon: Globe, href: profile.website, label: "Website" });
  }
  if (profile.linkedin) {
    links.push({ icon: Link, href: profile.linkedin, label: "LinkedIn" });
  }
  if (profile.twitter) {
    links.push({ icon: Link, href: profile.twitter, label: "Twitter" });
  }
  if (profile.github) {
    links.push({ icon: Link, href: profile.github, label: "GitHub" });
  }
  if (profile.instagram) {
    links.push({ icon: Link, href: profile.instagram, label: "Instagram" });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <ul className={cn("flex flex-wrap justify-center", compact ? "gap-1.5" : "gap-2.5", className)}>
      {links.map((link, index) => (
        <li key={index}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center rounded-xl border border-border bg-background font-medium text-navy transition-[border-color,background-color,transform] duration-200 hover:border-primary/60 hover:bg-primary/10 active:scale-[0.97]",
              compact ? "h-8 gap-1.5 px-2.5 text-xs" : "h-11 gap-2 px-3.5 text-sm"
            )}
            aria-label={`${link.label} (opens in a new tab)`}
          >
            {!compact && <link.icon className="size-4 text-gold" aria-hidden="true" />}
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}