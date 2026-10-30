"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/auth";

type Props = {
  profile: Profile;
  onEdit: () => void;
};

export function ProfileCompleteness({ profile, onEdit }: Props) {
  const hasLink = [
    profile.website,
    profile.linkedin,
    profile.twitter,
    profile.github,
    profile.instagram,
  ].some((value) => !!value && value.trim() !== "");

  const items = [
    { label: "Name and username", done: true },
    { label: "Add a profile photo", done: !!profile.profile_photo },
    { label: "Add your job title", done: !!profile.job_title?.trim() },
    { label: "Add your company or school", done: !!profile.company_school?.trim() },
    { label: "Write a short bio", done: !!profile.bio?.trim() },
    { label: "Add a few interests", done: (profile.interests?.length ?? 0) > 0 },
    { label: "Add a website or social link", done: hasLink },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  if (percent === 100) return null;

  const next = items.find((item) => !item.done);

  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.08] p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">Your card is {percent}% complete</p>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completeness"
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          {next && (
            <p className="mt-2 text-sm text-muted-foreground">Next step: {next.label.toLowerCase()}.</p>
          )}
          <Button size="sm" className="mt-3" onClick={onEdit}>
            Complete your card
          </Button>
        </div>
      </div>
    </div>
  );
}