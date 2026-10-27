"use client";

import { cn } from "@/lib/utils";

interface ProfileTagsProps {
  tags: string[];
  variant?: "primary" | "secondary";
}

export function ProfileTags({ tags, variant = "primary" }: ProfileTagsProps) {
  const variantClasses = {
    primary: "bg-primary/12 text-gold border-primary/30",
    secondary: "bg-secondary/12 text-teal-ink border-secondary/30",
  };

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <li
          key={index}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium",
            variantClasses[variant]
          )}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
