"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, MessageCircle, Phone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { getMyContactDetails, saveMyContactDetails } from "@/lib/auth";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const NUMBER_ERROR =
  "Use 7 to 20 characters: digits, spaces, ( ) or -, with an optional + at the start";

type Values = { email: string; phone: string; whatsapp: string };
type Errors = { email?: string; phone?: string; whatsapp?: string };

export function ContactDetailsCard() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saved, setSaved] = useState<Values>({ email: "", phone: "", whatsapp: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    let cancelled = false;

    getMyContactDetails().then((raw) => {
      if (cancelled) return;
      const details = raw as { email?: string | null; phone?: string | null; whatsapp?: string | null } | null;
      const next = {
        email: details?.email ?? "",
        phone: details?.phone ?? "",
        whatsapp: details?.whatsapp ?? "",
      };
      setEmail(next.email);
      setPhone(next.phone);
      setWhatsapp(next.whatsapp);
      setSaved(next);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty =
    email.trim() !== saved.email ||
    phone.trim() !== saved.phone ||
    whatsapp.trim() !== saved.whatsapp;

  const handleSave = async () => {
    const nextEmail = email.trim();
    const nextPhone = phone.trim();
    const nextWhatsapp = whatsapp.trim();

    const nextErrors: Errors = {};
    if (nextEmail && (nextEmail.length > 254 || !EMAIL_PATTERN.test(nextEmail))) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (nextPhone && !PHONE_PATTERN.test(nextPhone)) {
      nextErrors.phone = NUMBER_ERROR;
    }
    if (nextWhatsapp && !PHONE_PATTERN.test(nextWhatsapp)) {
      nextErrors.whatsapp = NUMBER_ERROR;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    const result = await saveMyContactDetails(nextEmail, nextPhone, nextWhatsapp);
    setIsSaving(false);

    if (result.success) {
      const lowered = nextEmail.toLowerCase();
      setEmail(lowered);
      setSaved({ email: lowered, phone: nextPhone, whatsapp: nextWhatsapp });
      toast({
        title: "Contact details saved",
        description: "Check Profile Visibility below to choose what the public can see.",
      });
    } else {
      toast({
        title: "Could not save your contact details",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enter saves this card only, instead of submitting the whole profile form
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isDirty && !isSaving) void handleSave();
    }
  };

  const clearError = (field: keyof Errors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <section
      aria-labelledby="contact-details-heading"
      className="rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-gold">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="contact-details-heading" className="font-heading text-lg font-semibold">
            Contact details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Private by default. People ask for your email or phone, and you approve each request.
            To show your phone or WhatsApp number publicly, use Profile Visibility below.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-email" className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden="true" />
            Email to share
          </Label>
          <Input
            id="contact-email"
            type="text"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSaving}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email && (
            <p id="contact-email-error" className="text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-phone" className="flex items-center gap-2">
            <Phone className="size-4" aria-hidden="true" />
            Phone to share
          </Label>
          <Input
            id="contact-phone"
            type="text"
            inputMode="tel"
            autoComplete="off"
            maxLength={20}
            placeholder="+234 801 234 5678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSaving}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
          />
          {errors.phone && (
            <p id="contact-phone-error" className="text-sm text-destructive">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-whatsapp" className="flex items-center gap-2">
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp number
          </Label>
          <Input
            id="contact-whatsapp"
            type="text"
            inputMode="tel"
            autoComplete="off"
            maxLength={20}
            placeholder="+234 801 234 5678"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              clearError("whatsapp");
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSaving}
            aria-invalid={!!errors.whatsapp}
            aria-describedby={errors.whatsapp ? "contact-whatsapp-error" : "contact-whatsapp-hint"}
          />
          {errors.whatsapp ? (
            <p id="contact-whatsapp-error" className="text-sm text-destructive">
              {errors.whatsapp}
            </p>
          ) : (
            <p id="contact-whatsapp-hint" className="text-xs text-muted-foreground">
              Numbers starting with 0 are treated as Nigerian (+234). Use a + for other countries.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Leave a field empty to remove it. If you change a value, people you already approved will
        see the new one.
      </p>

      <div className="mt-4">
        <Button type="button" onClick={handleSave} disabled={isLoading || isSaving || !isDirty}>
          {isSaving ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          Save contact details
        </Button>
      </div>
    </section>
  );
}