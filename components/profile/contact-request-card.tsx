"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Copy, Loader2, Lock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  ContactCard,
  ContactKind,
  ContactRequestStatus,
  getContactCard,
  getCurrentUser,
  requestContact,
} from "@/lib/auth";

type Props = { ownerId: string };

export function ContactRequestCard({ ownerId }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [card, setCard] = useState<ContactCard | null>(null);
  const [busyKind, setBusyKind] = useState<ContactKind | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        if (!user) {
          setSignedIn(false);
          return;
        }
        setSignedIn(true);
        const data = await getContactCard(ownerId);
        if (!cancelled) setCard(data);
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const handleRequest = async (kind: ContactKind) => {
    setBusyKind(kind);
    const result = await requestContact(ownerId, kind);

    if (result.success) {
      setCard(await getContactCard(ownerId));
      toast({ title: "Request sent", description: "You will see their answer here." });
    } else {
      toast({
        title: "Could not send the request",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
    setBusyKind(null);
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({
        title: "Could not copy",
        description: "Select the text and copy it manually.",
        variant: "destructive",
      });
    }
  };

  // Signed-out visitors, errors, blocked people and owners with nothing to share see nothing
  if (!signedIn || !card) return null;
  if (!card.email_available && !card.phone_available) return null;

  const rows: Array<{
    kind: ContactKind;
    label: string;
    available: boolean;
    status: ContactRequestStatus | null;
    value: string | null;
    href: string | null;
    Icon: typeof Mail;
  }> = [
    {
      kind: "email",
      label: "Email",
      available: card.email_available,
      status: card.email_status,
      value: card.email,
      href: card.email ? `mailto:${encodeURIComponent(card.email)}` : null,
      Icon: Mail,
    },
    {
      kind: "phone",
      label: "Phone",
      available: card.phone_available,
      status: card.phone_status,
      value: card.phone,
      href: card.phone ? `tel:${card.phone.replace(/[^0-9+]/g, "")}` : null,
      Icon: Phone,
    },
  ];

  return (
    <section
      aria-labelledby="contact-request-heading"
      className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-gold">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="contact-request-heading" className="font-heading text-base font-semibold">
            Private contact details
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shared only when they approve your request.
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {rows
          .filter((row) => row.available)
          .map((row) => (
            <li key={row.kind} className="flex items-center justify-between gap-3 py-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <row.Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {row.label}
              </span>

              {row.status === "approved" && row.value ? (
                <span className="flex min-w-0 items-center gap-2">
                  <a
                    href={row.href ?? undefined}
                    className="truncate text-sm font-semibold text-gold underline-offset-4 hover:underline"
                  >
                    {row.value}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(row.value as string, row.label)}
                    aria-label={`Copy ${row.label.toLowerCase()}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                </span>
              ) : row.status === "pending" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  Request sent
                </span>
              ) : row.status === "declined" ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Not shared</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyKind !== null}
                    onClick={() => handleRequest(row.kind)}
                  >
                    Ask again
                  </Button>
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyKind !== null}
                  onClick={() => handleRequest(row.kind)}
                >
                  {busyKind === row.kind ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  Request {row.label.toLowerCase()}
                </Button>
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}