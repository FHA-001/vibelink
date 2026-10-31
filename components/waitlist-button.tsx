"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Check, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
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

  const darkOutline = onDark ? "border-white/30 text-ivory hover:bg-white/10 hover:text-ivory" : "";
  const darkButton = onDark ? "bg-transparent border-white/30 text-ivory hover:bg-white/10 hover:text-ivory hover:border-white/50" : "";

  if (status === "loading") {
    return <div className="h-11" aria-hidden="true" />;
  }

  if (status === "signed_out") {
    return (
      <Link
        href="/signup"
        className={buttonVariants({ variant: "outline", size: "lg", className: onDark ? darkButton : "" })}
      >
        <BellRing aria-hidden="true" />
        Create an account to join the waitlist
      </Link>
    );
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
      className={onDark ? darkButton : ""}
      onClick={handleJoin}
      disabled={busy}
    >
      {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellRing aria-hidden="true" />}
      Notify me at launch
    </Button>
  );
}