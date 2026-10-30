import type { PublicProfile } from "@/lib/auth";

// Escape special characters for the vCard text format
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

// Uses only the fields already present on the profile object, so it never
// includes anything the viewer is not allowed to see.
export function buildVCard(profile: PublicProfile, profileUrl: string): string {
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

  const note = profile.bio ? `${profile.bio}\n\nMet on VibeLink` : "Met on VibeLink";
  lines.push(`NOTE:${esc(note)}`);
  lines.push("END:VCARD");

  return lines.join("\r\n") + "\r\n";
}

export function downloadVCard(profile: PublicProfile, profileUrl: string): void {
  const blob = new Blob([buildVCard(profile, profileUrl)], {
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