const MAX_LENGTH = 300;

// Returns a safe https link, or null if the text is not a normal web address.
export function normalizeWebUrl(input: string | null | undefined): string | null {
  if (!input) return null;

  const raw = input.trim();
  if (!raw || raw.length > MAX_LENGTH || /\s/.test(raw)) return null;

  let candidate = raw;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    // Blocks javascript:, data:, file: and anything else that is not a web link
    if (name !== "http" && name !== "https") return null;
  } else {
    candidate = `https://${raw.replace(/^\/\//, "")}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;

  url.protocol = "https:";
  return url.toString();
}

// Used when showing a saved link, so old or hand-edited data is checked again
export function safeHref(value: string | null | undefined): string | null {
  return normalizeWebUrl(value);
}