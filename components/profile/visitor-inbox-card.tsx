"use client";

import { useEffect, useState } from "react";
import { Inbox, Mail, Phone, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  deleteVisitorMessage,
  getMyMessageSettings,
  getMyVisitorMessages,
  markVisitorMessageRead,
  setAcceptsMessages,
  VisitorMessage,
} from "@/lib/auth";

// Only real emails and phone numbers become links. Message text is never linked.
function contactLink(contact: string): { href: string; kind: "email" | "phone" } | null {
  const value = contact.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return { href: `mailto:${encodeURIComponent(value)}`, kind: "email" };
  }
  if (/^\+?[0-9 ()-]{7,20}$/.test(value)) {
    return { href: `tel:${value.replace(/[^0-9+]/g, "")}`, kind: "phone" };
  }
  return null;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VisitorInboxCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [pendingDelete, setPendingDelete] = useState<VisitorMessage | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getMyMessageSettings(), getMyVisitorMessages()]).then(([on, list]) => {
      if (cancelled) return;
      setEnabled(on);
      setMessages(list);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (enabled === null) return null;

  const unread = messages.filter((m) => !m.read_at).length;

  const handleToggle = async () => {
    if (saving) return;
    const next = !enabled;
    setSaving(true);
    const result = await setAcceptsMessages(next);
    setSaving(false);

    if (result.success) {
      setEnabled(next);
      toast({
        title: next ? "Messages are on" : "Messages are off",
        description: next
          ? "People without an account can now leave you a message from your profile."
          : "The message form is hidden from your profile.",
      });
    } else {
      toast({
        title: "Could not update the setting",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkRead = async (message: VisitorMessage) => {
    const result = await markVisitorMessageRead(message.id);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, read_at: new Date().toISOString() } : m))
      );
    } else {
      toast({
        title: "Could not update the message",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const performDelete = async () => {
    const target = pendingDelete;
    if (!target) return;

    const result = await deleteVisitorMessage(target.id);
    if (result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== target.id));
      toast({ title: "Message deleted" });
    } else {
      toast({
        title: "Could not delete the message",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
    setPendingDelete(null);
  };

  return (
    <section
      aria-labelledby="visitor-inbox-heading"
      className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-gold">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="visitor-inbox-heading" className="font-heading text-base font-semibold">
              Messages from visitors
            </h2>
            {unread > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {unread} new
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {enabled
              ? "People without an account can leave you a message from your profile."
              : "Want people to be able to leave you a message, even without an account? Turn it on."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Let people without an account leave me a message"
          disabled={saving}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
            enabled ? "border-primary bg-primary" : "border-input bg-muted"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none block size-5 rounded-full shadow-sm transition-transform duration-200",
              enabled
                ? "translate-x-[1.375rem] bg-primary-foreground"
                : "translate-x-1 bg-white ring-1 ring-black/10"
            )}
          />
        </button>
      </div>

      {messages.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            These come from people you may not know. Be careful with links and requests for money
            or personal details. Messages are deleted after 90 days.
          </p>

          {messages.map((message) => {
            const link = contactLink(message.sender_contact);
            const isNew = !message.read_at;

            return (
              <article
                key={message.id}
                className={cn(
                  "rounded-xl border p-3",
                  isNew ? "border-primary/40 bg-primary/[0.06]" : "border-border bg-muted/30"
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-foreground">{message.sender_name}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(message.created_at)}</p>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-xs">
                  {link?.kind === "phone" ? (
                    <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  {link ? (
                    <a href={link.href} className="break-all font-semibold text-gold hover:underline">
                      {message.sender_contact}
                    </a>
                  ) : (
                    <span className="break-all text-muted-foreground">{message.sender_contact}</span>
                  )}
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
                  {message.message}
                </p>

                <div className="mt-3 flex items-center gap-4">
                  {isNew && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(message)}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingDelete(message)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        enabled && <p className="mt-4 text-sm text-muted-foreground">No messages yet.</p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this message?"
        description="It will be removed for good. You cannot undo this."
        confirmLabel="Delete message"
        destructive
        onConfirm={performDelete}
      />
    </section>
  );
}