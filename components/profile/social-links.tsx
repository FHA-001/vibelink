"use client";

import type { ComponentType } from "react";
import { Globe, MessageCircle, Phone } from "lucide-react";
import { ConnectedProfile, PublicProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/safe-url";
import { sameNumber, telHref, whatsappHref } from "@/lib/phone";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "./brand-icons";

type IconProps = { className?: string };

interface SocialLinksProps {
  profile: ConnectedProfile | PublicProfile;
  className?: string;
  // Icon-only buttons, for the one-screen card
  compact?: boolean;
  // Numbers to show. Only pass numbers the person made public.
  phone?: string | null;
  whatsapp?: string | null;
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

const hoverClasses =
  "border border-border bg-background font-medium text-navy transition-[border-color,background-color,transform] duration-200 hover:border-primary/60 hover:bg-primary/10 active:scale-[0.97]";

export function SocialLinks({
  profile,
  className,
  compact = false,
  phone,
  whatsapp,
}: SocialLinksProps) {
  // Every saved link is checked again here, so an unsafe or broken value is never shown
  const items = LINKS.flatMap(({ key, label, Icon }) => {
    const href = safeHref(profile[key]);
    return href ? [{ key, label, Icon, href }] : [];
  });

  const callHref = telHref(phone);
  const waHref = whatsappHref(whatsapp);
  const same = !!callHref && !!waHref && sameNumber(phone, whatsapp);

  if (items.length === 0 && !callHref && !waHref) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-2" : "gap-3", className)}>
      {items.length > 0 && (
        <ul className={cn("flex flex-wrap justify-center", compact ? "gap-2" : "gap-2.5")}>
          {items.map(({ key, label, Icon, href }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                aria-label={`${label} (opens in a new tab)`}
                className={cn(
                  hoverClasses,
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
      )}

      {(callHref || waHref) && (
        <ul className="flex flex-wrap justify-center gap-2">
          {callHref && (
            <li>
              <a
                href={callHref}
                aria-label={`Call ${phone}`}
                className={cn(hoverClasses, "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs")}
              >
                <Phone className="size-4 text-gold" aria-hidden="true" />
                {phone}
              </a>
            </li>
          )}
          {waHref && (
            <li>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${whatsapp} (opens in a new tab)`}
                title="WhatsApp"
                className={cn(
                  hoverClasses,
                  "inline-flex h-9 items-center gap-1.5 rounded-xl text-xs",
                  same ? "w-9 justify-center" : "px-3"
                )}
              >
                <MessageCircle className="size-4 text-gold" aria-hidden="true" />
                {!same && whatsapp}
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}