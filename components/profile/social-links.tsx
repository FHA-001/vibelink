"use client";

import { Globe, Link } from "lucide-react";
import { Profile } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SocialLinksProps {
  profile: Profile;
  className?: string;
}

export function SocialLinks({ profile, className }: SocialLinksProps) {
  const links = [];

  if (profile.website) {
    links.push({
      icon: Globe,
      href: profile.website,
      label: "Website",
    });
  }

  if (profile.linkedin) {
    links.push({
      icon: Link,
      href: profile.linkedin,
      label: "LinkedIn",
    });
  }

  if (profile.twitter) {
    links.push({
      icon: Link,
      href: profile.twitter,
      label: "Twitter",
    });
  }

  if (profile.github) {
    links.push({
      icon: Link,
      href: profile.github,
      label: "GitHub",
    });
  }

  if (profile.instagram) {
    links.push({
      icon: Link,
      href: profile.instagram,
      label: "Instagram",
    });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex justify-center gap-3", className)}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors"
          aria-label={link.label}
        >
          <link.icon className="w-5 h-5 text-foreground/70" />
        </a>
      ))}
    </div>
  );
}