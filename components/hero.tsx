"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, Globe, Link as LinkIcon, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { Logo } from "./logo";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The hero's one memorable moment: an example profile card that settles into place,
 * then gets scanned once. It tilts gently toward a mouse pointer. The QR code is real
 * and points at vibelink.name.ng.
 */
function ExampleCard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 140, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 140, damping: 18 });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="relative mx-auto w-full max-w-[22rem] sm:max-w-[24rem] [perspective:1200px]"
    >
      {/* Card stacked behind */}
      <motion.div
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, rotate: 0, y: 24 }}
        animate={{ opacity: 1, rotate: -6, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        className="absolute inset-x-3 -bottom-5 top-6 rounded-[1.75rem] border border-border bg-card shadow-xl"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 36, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="card-surface relative overflow-hidden rounded-[1.75rem] p-6 text-ivory shadow-2xl ring-1 ring-white/10 sm:p-7"
      >
        {/* Sheen, passes across once in a while */}
        {!reduce && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        )}

        <div className="flex items-center justify-between">
          <Logo variant="light" markOnly className="[&_img]:h-7 [&_img]:w-7" />
          <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-medium text-ivory/80">
            Example profile
          </span>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-heading text-xl font-semibold text-navy ring-4 ring-white/15"
          >
            AE
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-xl font-semibold leading-tight text-ivory">
              Ada Eze
            </p>
            <p className="text-sm text-ivory/70">@adaeze</p>
          </div>
        </div>

        <div className="gold-rule my-5 opacity-80" aria-hidden="true" />

        <p className="text-sm font-semibold text-ivory">Product Designer</p>
        <p className="text-sm text-ivory/70">Studio Nine</p>
        <p className="mt-3 text-sm leading-relaxed text-ivory/80">
          Designing calm, useful software. Always happy to swap notes over coffee.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interests">
          {["Design systems", "Mentoring", "Fintech"].map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-[#E9CF72]"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="flex gap-2" aria-hidden="true">
            {[Globe, LinkIcon, Mail].map((Icon, i) => (
              <span
                key={i}
                className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-ivory/80"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>

          <div className="relative rounded-xl bg-ivory p-2">
            <QRCodeSVG
              value="https://vibelink.name.ng"
              size={84}
              level="M"
              bgColor="#F8F7F3"
              fgColor="#182D3A"
              title="Example QR code linking to vibelink.name.ng"
            />
            {!reduce && (
              <motion.span
                aria-hidden="true"
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: [0, 76, 0], opacity: [0, 1, 1, 0] }}
                transition={{ delay: 1.6, duration: 2.2, ease: "easeInOut", times: [0, 0.5, 0.9, 1] }}
                className="absolute inset-x-1.5 top-2 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_rgb(201_165_43/0.7)]"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section className="page-canvas relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <motion.h1
            {...rise(0.05)}
            className="font-heading text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-navy sm:text-6xl lg:text-[4.25rem]"
          >
            Your identity.
            <br />
            One link.
            <br />
            Every connection.
          </motion.h1>

          <motion.div
            {...rise(0.15)}
            aria-hidden="true"
            className="gold-rule mx-auto mt-7 w-24 lg:mx-0"
          />

          <motion.p
            {...rise(0.22)}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0"
          >
            Build a digital card people can open with one scan. Then keep private notes and
            tags about the people you meet, visible only to you.
          </motion.p>

          <motion.div
            {...rise(0.3)}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link href="/welcome" className={buttonVariants({ size: "lg", className: "sm:w-auto" })}>
              Create your card
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/how-it-works"
              className={buttonVariants({ variant: "outline", size: "lg", className: "sm:w-auto" })}
            >
              See how it works
            </Link>
          </motion.div>
        </div>

        <ExampleCard />
      </div>
    </section>
  );
}
