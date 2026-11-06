"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Check, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/turnstile";
import {
  getCurrentUser,
  getMyWaitlist,
  joinWaitlist,
  leaveWaitlist,
  WaitlistProduct,
} from "@/lib/auth";

type Status = "loading" | "signed_out" | "off" | "on";

type Props = {
  product: WaitlistProduct;
  onDark?: boolean;
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function VisitorSignup({ product, onDark = false }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [trap, setTrap] = useState("");

  const darkButton = onDark
    ? "bg-transparent border-white/30 text-ivory hover:bg-white/10 hover:text-ivory hover:border-white/50"
    : "";
  const mutedText = onDark ? "text-ivory/70" : "text-muted-foreground";

  // Without the security check, fall back to the old link
  if (!TURNSTILE_SITE_KEY) {
    return (
      <Link
        href="/signup"
        className={buttonVariants({ variant: "outline", size: "lg", className: darkButton })}
      >
        <BellRing aria-hidden="true" />
        Create an account to join the waitlist
      </Link>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!token) {
      setError("Please wait for the security check to finish.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, product, token, company: trap }),
      });

      if (res.ok) {
        setSent(true);
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Could not join the waitlist. Please try again.");
    } catch {
      setError("Could not join the waitlist. Please check your connection and try again.");
    } finally {
      setBusy(false);
      // Each security token works only once
      setResetSignal((n) => n + 1);
    }
  };

  if (sent) {
    return (
      <span
        role="status"
        className={`inline-flex items-center gap-2 text-sm font-semibold ${
          onDark ? "text-ivory" : "text-teal-ink"
        }`}
      >
        <Check className="size-4" aria-hidden="true" />
        You are on the waitlist. We will email you at launch.
      </span>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        className={darkButton}
        onClick={() => setOpen(true)}
      >
        <BellRing aria-hidden="true" />
        Notify me at launch
      </Button>
    );
  }

  const idBase = `wl-${product}`;

  return (
    <form onSubmit={handleSubmit} className="relative max-w-sm space-y-3" noValidate>
      {/* Trap for bots: invisible to people, never filled in by them */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${idBase}-extra`}>Leave this field empty</label>
        <input
          id={`${idBase}-extra`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className={`text-sm ${onDark ? "text-red-300" : "text-destructive"}`}>
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idBase}-email`} className={onDark ? "text-ivory" : ""}>
          Your email address
        </Label>
        <Input
          id={`${idBase}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </div>

      <Turnstile onToken={setToken} resetSignal={resetSignal} />

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <BellRing aria-hidden="true" />
          )}
          Notify me at launch
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className={`text-sm underline underline-offset-4 disabled:opacity-50 ${mutedText} ${
            onDark ? "hover:text-ivory" : "hover:text-foreground"
          }`}
        >
          Cancel
        </button>
      </div>

      <p className={`text-xs ${mutedText}`}>
        We will only use your email to tell you when this launches.{" "}
        <Link href="/signin" className="underline underline-offset-4">
          Have an account? Sign in
        </Link>
      </p>
    </form>
  );
}

export function WaitlistButton({ product, onDark = false }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          if (!cancelled) setStatus("signed_out");
          return;
        }
        const list = await getMyWaitlist();
        if (!cancelled) setStatus(list.includes(product) ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("signed_out");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product]);

  const handleJoin = async () => {
    setBusy(true);
    const result = await joinWaitlist(product);
    setBusy(false);

    if (result.success) {
      setStatus("on");
      toast({ title: "You are on the list", description: "We will let you know when it launches." });
    } else {
      toast({
        title: "Could not join the waitlist",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    const result = await leaveWaitlist(product);
    setBusy(false);

    if (result.success) {
      setStatus("off");
      toast({ title: "You have left the waitlist" });
    } else {
      toast({
        title: "Could not update the waitlist",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const darkButton = onDark
    ? "bg-transparent border-white/30 text-ivory hover:bg-white/10 hover:text-ivory hover:border-white/50"
    : "";

  if (status === "loading") {
    return <div className="h-11" aria-hidden="true" />;
  }

  if (status === "signed_out") {
    return <VisitorSignup product={product} onDark={onDark} />;
  }

  if (status === "on") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`inline-flex items-center gap-2 text-sm font-semibold ${
            onDark ? "text-ivory" : "text-teal-ink"
          }`}
        >
          <Check className="size-4" aria-hidden="true" />
          You are on the waitlist
        </span>
        <button
          type="button"
          onClick={handleLeave}
          disabled={busy}
          className={`text-sm underline underline-offset-4 disabled:opacity-50 ${
            onDark ? "text-ivory/70 hover:text-ivory" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Leave the list
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className={darkButton}
      onClick={handleJoin}
      disabled={busy}
    >
      {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellRing aria-hidden="true" />}
      Notify me at launch
    </Button>
  );
}