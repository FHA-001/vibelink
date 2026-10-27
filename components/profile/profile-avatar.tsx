"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ProfileAvatar({ src, name, size = "md", className }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-base",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl",
    xl: "w-32 h-32 text-4xl",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary font-heading font-semibold text-navy",
        sizeClasses[size],
        className
      )}
    >
      {src && src.length > 0 ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center" aria-hidden="true">
          {initials ? <span>{initials}</span> : <User className={iconSizes[size]} />}
        </div>
      )}
    </div>
  );
}
