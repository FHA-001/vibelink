"use client";

import type { ComponentType } from "react";
import {
  Briefcase,
  Building2,
  Camera,
  Globe,
  Info,
  Lock,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileVisibility } from "@/lib/auth";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "./brand-icons";

type IconProps = { className?: string };

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

const CONTACT_FIELDS: Field[] = [
  {
    key: "phone",
    label: "Phone number",
    description: "Public: anyone can see and call it. Private: people ask and you approve.",
    Icon: Phone,
  },
  {
    key: "whatsapp",
    label: "WhatsApp number",
    description: "Public: anyone can message you. Private: only people you are connected with.",
    Icon: MessageCircle,
  },
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
  children,
}: {
  title: string;
  fields: Field[];
  value: ProfileVisibility;
  disabled?: boolean;
  onToggle: (key: keyof ProfileVisibility, next: boolean) => void;
  children?: React.ReactNode;
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
      {children}
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

  const allFields = [...ABOUT_FIELDS, ...LINK_FIELDS, ...CONTACT_FIELDS];
  const publicCount = allFields.filter((field) => !!value[field.key]).length;
  const contactPublic = !!value.phone || !!value.whatsapp;

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
              <p className="text-xs text-ivory/70">
                Hidden from strangers. Your phone number is shared only when you approve a request.
              </p>
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
        <FieldGroup
          title="Contact numbers"
          fields={CONTACT_FIELDS}
          value={value}
          disabled={disabled}
          onToggle={toggle}
        >
          {contactPublic && (
            <div
              role="note"
              className="mt-3 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3"
            >
              <Info className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
              <p className="text-xs text-foreground">
                Anyone who visits your profile, even without an account, can see and copy a public
                number. Public numbers are often used for spam and scams. You can switch it back
                to private at any time. Save your number in Contact details above, then press Save
                Changes below.
              </p>
            </div>
          )}
        </FieldGroup>
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