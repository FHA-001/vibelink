"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, QrCode, MessageSquare, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1] as const;

const points = [
  { icon: QrCode, text: "A card and QR code that open your profile in one scan" },
  { icon: MessageSquare, text: "Private notes and tags that only you can see" },
  { icon: ShieldCheck, text: "Visibility controls for what each person can view" },
];

export default function WelcomePage() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <div className="page-canvas flex min-h-screen flex-col">
      <nav aria-label="Site" className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="VibeLink home" className="rounded-lg">
          <Logo />
        </Link>
        <Link href="/signin" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy transition-colors hover:text-gold">
          Sign in
        </Link>
      </nav>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl text-center">
          <motion.h1
            {...rise(0)}
            className="font-heading text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl"
          >
            Welcome to VibeLink
          </motion.h1>

          <motion.p
            {...rise(0.1)}
            className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl"
          >
            Create your digital introduction card and start building connections you will remember.
          </motion.p>

          <motion.ul
            {...rise(0.18)}
            className="mx-auto mt-10 grid max-w-xl gap-3 text-left"
          >
            {points.map((point) => (
              <li
                key={point.text}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-gold">
                  <point.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-navy sm:text-base">{point.text}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            {...rise(0.26)}
            className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "px-8" })}>
              Create an account
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/signin"
              className={buttonVariants({ variant: "outline", size: "lg", className: "px-8" })}
            >
              Sign in
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="rounded-md transition-colors hover:text-gold">
          Back to home
        </Link>
      </footer>
    </div>
  );
}
