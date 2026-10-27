"use client";

import { UserPlus, QrCode, HeartHandshake } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";

const steps = [
  {
    icon: UserPlus,
    title: "Create your card",
    description:
      "Add your photo, role, bio and links. Choose what each person can see before you share.",
  },
  {
    icon: QrCode,
    title: "Share your QR code",
    description:
      "Show your code at events, meetings or in a hallway. Anyone with a phone camera can open your profile.",
  },
  {
    icon: HeartHandshake,
    title: "Connect and remember",
    description:
      "Send and accept connection requests, then add private notes and personal tags so you remember who is who.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-card px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            From first hello to a follow-up you remember
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps, no business cards to run out of.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {steps.map((step, index) => (
            <StaggerItem key={step.title} className="bg-background p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="font-heading text-5xl font-semibold leading-none text-gold/30"
                >
                  {index + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-gold">
                  <step.icon className="size-6" />
                </span>
              </div>
              <h3 className="mt-8 font-heading text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{step.description}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
