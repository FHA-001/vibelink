"use client";

import { cn } from "@/lib/utils";

interface ProfileTagsProps {
  tags: string[];
  variant?: "primary" | "secondary";
}

export function ProfileTags({ tags, variant = "primary" }: ProfileTagsProps) {
  const variantClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium border",
            variantClasses[variant]
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}