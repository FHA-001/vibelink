"use client";

import {
  User,
  QrCode,
  Share2,
  Users,
  History,
  Smartphone,
  MessageSquare,
  Tag,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";

const small = [
  {
    icon: Share2,
    title: "Share by QR or link",
    description: "Anyone with a phone camera can open your profile link, at events or in a message.",
  },
  {
    icon: Users,
    title: "Save connections",
    description: "Accept requests and keep the people you have met in one organised list.",
  },
  {
    icon: History,
    title: "Connection history",
    description: "See who you connected with and when, so context is never lost.",
  },
  {
    icon: Smartphone,
    title: "Made for phones",
    description: "Your card and your connections list are designed for small screens first.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Everything you need to be remembered
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A polished introduction on the way in, and a private memory on the way out.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-5 lg:grid-cols-6">
          {/* Lead features */}
          <StaggerItem className="card-surface relative overflow-hidden rounded-2xl p-8 text-ivory shadow-xl sm:p-10 lg:col-span-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-primary">
              <User className="size-6" />
            </span>
            <h3 className="mt-8 font-heading text-2xl font-semibold text-ivory">Digital profile</h3>
            <p className="mt-3 max-w-md leading-relaxed text-ivory/75">
              Your photo, role, bio, interests and links on one clean card. You decide what
              people can see before and after they connect.
            </p>
          </StaggerItem>

          <StaggerItem className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-card sm:p-10 lg:col-span-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-gold">
              <QrCode className="size-6" />
            </span>
            <h3 className="mt-8 font-heading text-2xl font-semibold">Personal QR code</h3>
            <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
              A unique code that always points to your current profile. Download it as an image
              for slides, badges and posters.
            </p>
          </StaggerItem>

          {/* Private memory */}
          <StaggerItem className="rounded-2xl border border-primary/30 bg-primary/[0.08] p-8 lg:col-span-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-card text-gold shadow-sm">
              <MessageSquare className="size-5" />
            </span>
            <h3 className="mt-6 font-heading text-xl font-semibold">Private notes</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Write where you met and what to follow up on. Notes are private to you and are
              never shared with the other person.
            </p>
          </StaggerItem>

          <StaggerItem className="rounded-2xl border border-secondary/40 bg-secondary/[0.09] p-8 lg:col-span-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-card text-teal-ink shadow-sm">
              <Tag className="size-5" />
            </span>
            <h3 className="mt-6 font-heading text-xl font-semibold">Personal tags</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Group people your way, such as classmates, mentors or clients. Tags are yours alone
              and show up in your connections list.
            </p>
          </StaggerItem>

          {small.map((feature) => (
            <StaggerItem
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 lg:col-span-3 xl:col-span-3"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-gold">
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
