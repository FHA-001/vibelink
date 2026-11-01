"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/turnstile";
import { getMessageFormStatus } from "@/lib/auth";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

type Props = { username: string };

export function VisitorMessageForm({ username }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [trap, setTrap] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMessageFormStatus(username).then((status) => {
      if (!cancelled) setEnabled(status);
    });

    return () => {
      cancelled = true;
    };
  }, [username]);

  // The form is hidden unless the owner switched it on
  if (!enabled || !TURNSTILE_SITE_KEY) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const contact = form.contact.trim();
    const message = form.message.trim();

    if (!name || !contact || !message) {
      setError("Please fill in every field.");
      return;
    }
    if (!EMAIL_PATTERN.test(contact) && !PHONE_PATTERN.test(contact)) {
      setError("Please enter a valid email address or phone number.");
      return;
    }
    if (message.length < 2) {
      setError("Please write a short message.");
      return;
    }
    if (!token) {
      setError("Please wait for the security check to finish.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, contact, message, token, company: trap }),
      });

      if (res.ok) {
        setSent(true);
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Could not send your message. Please try again.");
    } catch {
      setError("Could not send your message. Please check your connection and try again.");
    } finally {
      setIsSending(false);
      // Each security token works only once
      setResetSignal((n) => n + 1);
    }
  };

  return (
    <section
      aria-labelledby="visitor-message-heading"
      className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-gold">
          <MessageSquare className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="visitor-message-heading" className="font-heading text-base font-semibold">
            Leave a message
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No account needed. Share how to reach you and say hello.
          </p>
        </div>
      </div>

      {sent ? (
        <div role="status" className="mt-4 flex items-start gap-3 rounded-xl bg-secondary/10 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-ink" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Message sent</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              They will reply using the contact details you shared.
            </p>
          </div>
        </div>
      ) : !open ? (
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <MessageSquare aria-hidden="true" />
            Leave a message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative mt-4 space-y-4" noValidate>
          {/* Trap for bots: invisible to people, never filled in by them */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="vm-extra">Leave this field empty</label>
            <input
              id="vm-extra"
              name="contact_extra"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="vm-name">Your name</Label>
            <Input
              id="vm-name"
              type="text"
              autoComplete="name"
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vm-contact">Your email or phone</Label>
            <Input
              id="vm-contact"
              type="text"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={120}
              placeholder="you@example.com or +234 801 234 5678"
              value={form.contact}
              onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vm-message">Message</Label>
            <Textarea
              id="vm-message"
              rows={4}
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              disabled={isSending}
            />
            <p className="text-right text-xs text-muted-foreground">{form.message.length}/1000</p>
          </div>

          <Turnstile onToken={setToken} resetSignal={resetSignal} />

          <p className="text-xs text-muted-foreground">
            Only the owner of this profile sees your name, contact details and message. Messages
            are deleted after 90 days.
          </p>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
              Send message
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSending}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}