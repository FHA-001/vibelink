import type { PublicProfile } from "@/lib/auth";

// Escape special characters for the vCard text format
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

// Keeps digits and a leading plus, drops spaces, dashes and brackets
function cleanNumber(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const cleaned = (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
  return cleaned.replace("+", "").length >= 5 ? cleaned : null;
}

// Numbers a viewer may see but that are not on the profile object,
// for example a private number the owner approved through a request.
export type VCardExtras = {
  phone?: string | null;
  whatsapp?: string | null;
};

// Uses only the fields already present on the profile object (plus anything the
// caller passes in extras), so it never includes anything the viewer is not
// allowed to see.
export function buildVCard(
  profile: PublicProfile,
  profileUrl: string,
  extras: VCardExtras = {}
): string {
  const name = profile.full_name?.trim() || profile.username;
  const parts = name.split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(name)}`,
    `N:${esc(last)};${esc(first)};;;`,
  ];

  if (profile.company_school) lines.push(`ORG:${esc(profile.company_school)}`);
  if (profile.job_title) lines.push(`TITLE:${esc(profile.job_title)}`);

  const phone = cleanNumber(extras.phone ?? profile.phone);
  const whatsapp = cleanNumber(extras.whatsapp ?? profile.whatsapp);

  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  if (whatsapp && whatsapp !== phone) lines.push(`TEL;TYPE=CELL:${whatsapp}`);

  const urls = [
    profileUrl,
    profile.website,
    profile.linkedin,
    profile.twitter,
    profile.github,
    profile.instagram,
  ];
  for (const url of urls) {
    if (url) lines.push(`URL:${url}`);
  }

  const noteParts: string[] = [];
  if (profile.bio) noteParts.push(profile.bio);
  if (whatsapp) noteParts.push(`WhatsApp: ${whatsapp}`);
  noteParts.push("Met on VibeLink");
  lines.push(`NOTE:${esc(noteParts.join("\n\n"))}`);
  lines.push("END:VCARD");

  return lines.join("\r\n") + "\r\n";
}

export function downloadVCard(
  profile: PublicProfile,
  profileUrl: string,
  extras: VCardExtras = {}
): void {
  const blob = new Blob([buildVCard(profile, profileUrl, extras)], {
    type: "text/vcard;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${profile.username}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}