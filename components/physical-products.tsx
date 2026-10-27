"use client";

import { Clock, Wifi, Tag } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./motion";

function ComingSoon() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/12 px-3 py-1.5 text-xs font-semibold text-gold">
      <Clock className="size-3.5" aria-hidden="true" />
      Coming soon
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </li>
  );
}

export function PhysicalProducts() {
  return (
    <section id="physical-products" className="bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Your connections, beyond the screen
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Two physical products are on the way. Your digital card is available today.
          </p>
        </Reveal>

        <div className="mt-14 space-y-6">
          {/* NFC card */}
          <Reveal>
            <article className="grid items-center gap-10 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10 lg:grid-cols-2 lg:gap-14">
              <div className="relative mx-auto w-full max-w-md">
                <img
                  src="/images/vibelink-nfc-card.webp"
                  alt="Concept design of the VibeLink NFC card with a printed QR code"
                  width={1200}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-gold">
                    <Wifi className="size-6" aria-hidden="true" />
                  </span>
                  <ComingSoon />
                </div>
                <h3 className="mt-6 font-heading text-2xl font-semibold sm:text-3xl">
                  VibeLink NFC Card
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Tap to share your profile with any NFC-enabled phone. A printed QR code on the
                  same card covers everyone else.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="NFC card details">
                  <Chip>NFC tap to share</Chip>
                  <Chip>Printed QR code</Chip>
                  <Chip>Premium finish</Chip>
                </ul>
              </div>
            </article>
          </Reveal>

          {/* VibeTags */}
          <Reveal>
            <article className="grid items-center gap-10 overflow-hidden rounded-3xl bg-navy p-6 text-ivory shadow-xl sm:p-10 lg:grid-cols-2 lg:gap-14">
              <div className="order-2 lg:order-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-primary">
                    <Tag className="size-6" aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-[#E9CF72]">
                    <Clock className="size-3.5" aria-hidden="true" />
                    Coming soon
                  </span>
                </div>
                <h3 className="mt-6 font-heading text-2xl font-semibold text-ivory sm:text-3xl">
                  VibeTags
                </h3>
                <p className="mt-4 leading-relaxed text-ivory/75">
                  Branded tags for bags, lanyards and other personal items. Each one carries your
                  QR code so people can connect with you wherever you go.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="VibeTags uses">
                  {["Bags and backpacks", "Lanyards", "Clothing accessories"].map((label) => (
                    <li
                      key={label}
                      className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-ivory/80"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 mx-auto w-full max-w-lg lg:order-2">
                <img
                  src="/images/vibetags-showcase.webp"
                  alt="Concept designs for the VibeTags family: Classic, Circle and Loop"
                  width={1200}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>
            </article>
          </Reveal>
        </div>

        <Reveal className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Want to hear when they launch?{" "}
            <Link
              href="/contact"
              className="font-semibold text-gold underline underline-offset-4 transition-colors hover:text-navy"
            >
              Contact us for launch updates
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
