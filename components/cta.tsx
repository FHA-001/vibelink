"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { Reveal } from "./motion";

export function CTA() {
  return (
    <section className="bg-card px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="card-surface relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-16 text-center shadow-2xl sm:px-12 lg:py-20">
        <div className="gold-rule absolute inset-x-12 top-0" aria-hidden="true" />
        <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold text-ivory sm:text-4xl lg:text-5xl">
          Make your next introduction easy to remember
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ivory/75">
          Set up your card in a few minutes, then share it with a scan.
        </p>
        <div className="mt-9 flex justify-center">
          <Link href="/welcome" className={buttonVariants({ size: "lg", className: "px-8" })}>
            Create your VibeLink
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
