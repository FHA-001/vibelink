"use client";

import {
  GraduationCap,
  Briefcase,
  Code,
  Rocket,
  PenTool,
  Building2,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";

const audiences = [
  {
    icon: GraduationCap,
    title: "Students",
    description: "Stay in touch with peers, lecturers and mentors long after the semester ends.",
  },
  {
    icon: Briefcase,
    title: "Professionals",
    description: "Hand over your details at conferences without fumbling for a card.",
  },
  {
    icon: Code,
    title: "Developers",
    description: "Share your GitHub and portfolio at hackathons and meetups in one scan.",
  },
  {
    icon: Rocket,
    title: "Founders",
    description: "Make a clear first impression with investors, partners and early customers.",
  },
  {
    icon: PenTool,
    title: "Freelancers",
    description: "Give prospective clients one place to see your work and reach you.",
  },
  {
    icon: Building2,
    title: "Business owners",
    description: "Meet suppliers and partners, then remember who said what and when.",
  },
];

export function WhoIsItFor() {
  return (
    <section id="who-is-it-for" className="bg-card px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.4fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Built for people who meet people
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            If introductions are part of your week, VibeLink keeps them tidy.
          </p>
        </Reveal>

        <Stagger className="grid gap-x-10 sm:grid-cols-2">
          {audiences.map((audience) => (
            <StaggerItem
              key={audience.title}
              className="flex gap-4 border-t border-border py-7"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-teal-ink">
                <audience.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-heading text-lg font-semibold">{audience.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {audience.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
