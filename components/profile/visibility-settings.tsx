"use client";

import type { ComponentType } from "react";
import {
  Briefcase,
  Building2,
  Camera,
  Globe,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileVisibility } from "@/lib/auth";

type IconProps = { className?: string };

function GitHubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

type Field = {
  key: keyof ProfileVisibility;
  label: string;
  description: string;
  Icon: ComponentType<IconProps>;
};

const ABOUT_FIELDS: Field[] = [
  { key: "profile_photo", label: "Profile photo", description: "The picture on your card", Icon: Camera },
  { key: "full_name", label: "Full name", description: "Your name as written on your card", Icon: User },
  { key: "job_title", label: "Job title", description: "Your role or profession", Icon: Briefcase },
  { key: "company_school", label: "Company / School", description: "Where you work or study", Icon: Building2 },
  { key: "bio", label: "Bio", description: "Your short introduction", Icon: MessageSquare },
  { key: "interests", label: "Interests", description: "Topics you care about", Icon: Sparkles },
];

const LINK_FIELDS: Field[] = [
  { key: "website", label: "Website", description: "Your personal or business site", Icon: Globe },
  { key: "linkedin", label: "LinkedIn", description: "Your LinkedIn profile link", Icon: LinkedInIcon },
  { key: "github", label: "GitHub", description: "Your GitHub profile link", Icon: GitHubIcon },
  { key: "twitter", label: "Twitter / X", description: "Your X profile link", Icon: XIcon },
  { key: "instagram", label: "Instagram", description: "Your Instagram profile link", Icon: InstagramIcon },
];

function Switch({
  id,
  checked,
  onChange,
  disabled,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-primary bg-primary" : "border-input bg-muted"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-5 rounded-full shadow-sm transition-transform duration-200",
          checked
            ? "translate-x-[1.375rem] bg-primary-foreground"
            : "translate-x-1 bg-white ring-1 ring-black/10"
        )}
      />
    </button>
  );
}

function VisibilityRow({
  field,
  isPublic,
  disabled,
  onToggle,
}: {
  field: Field;
  isPublic: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  const id = `visibility-${field.key}`;
  const { Icon } = field;

  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          isPublic ? "bg-primary/15 text-gold" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
      </span>

      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-semibold text-foreground">{field.label}</span>
        <span className="block text-xs text-muted-foreground">{field.description}</span>
      </label>

      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors sm:px-2.5",
          isPublic ? "bg-secondary/15 text-teal-ink" : "bg-muted text-muted-foreground"
        )}
      >
        {isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
        <span className="hidden sm:inline">{isPublic ? "Public" : "Private"}</span>
      </span>

      <Switch
        id={id}
        checked={isPublic}
        onChange={onToggle}
        disabled={disabled}
        label={`Make ${field.label} public`}
      />
    </li>
  );
}

function FieldGroup({
  title,
  fields,
  value,
  disabled,
  onToggle,
}: {
  title: string;
  fields: Field[];
  value: ProfileVisibility;
  disabled?: boolean;
  onToggle: (key: keyof ProfileVisibility, next: boolean) => void;
}) {
  return (
    <div className="mt-2">
      <h3 className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
        {fields.map((field) => (
          <VisibilityRow
            key={field.key}
            field={field}
            isPublic={!!value[field.key]}
            disabled={disabled}
            onToggle={(next) => onToggle(field.key, next)}
          />
        ))}
      </ul>
    </div>
  );
}

type Props = {
  value: ProfileVisibility;
  onChange: (next: ProfileVisibility) => void;
  disabled?: boolean;
};

export function VisibilitySettings({ value, onChange, disabled = false }: Props) {
  const toggle = (key: keyof ProfileVisibility, next: boolean) => {
    onChange({ ...value, [key]: next });
  };

  const allFields = [...ABOUT_FIELDS, ...LINK_FIELDS];
  const publicCount = allFields.filter((field) => !!value[field.key]).length;

  return (
    <section
      aria-labelledby="visibility-heading"
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-md"
    >
      {/* Header */}
      <div className="card-surface px-5 py-6 sm:px-7">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-primary ring-1 ring-white/15">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="visibility-heading" className="font-heading text-xl font-semibold text-ivory">
              Profile Visibility
            </h2>
            <p className="mt-1 text-sm text-ivory/75">
              Choose which information is visible to people who haven&apos;t connected with you yet.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <Globe className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ivory">Public</p>
              <p className="text-xs text-ivory/70">Visible to anyone who visits your profile.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <Users className="mt-0.5 size-5 shrink-0 text-ivory/80" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ivory">Private</p>
              <p className="text-xs text-ivory/70">Visible only to people you have connected with.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="px-2 py-3 sm:px-3">
        <p aria-live="polite" className="px-3 pb-1 text-xs font-medium text-muted-foreground">
          {publicCount} of {allFields.length} fields are public
        </p>
        <FieldGroup title="About you" fields={ABOUT_FIELDS} value={value} disabled={disabled} onToggle={toggle} />
        <FieldGroup title="Links" fields={LINK_FIELDS} value={value} disabled={disabled} onToggle={toggle} />
      </div>

      {/* Reassurance */}
      <div className="mx-4 mb-4 flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4 sm:mx-5 sm:mb-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-ink" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-foreground">Your Privacy, Your Control</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You&apos;re in control of your information. You can change these visibility settings at any
            time. Press Save Changes below to apply your changes.
          </p>
        </div>
      </div>
    </section>
  );
}