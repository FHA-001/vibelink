// Turns a typed number into international digits, or null if it is not a usable number.
// Numbers starting with 0 are treated as Nigerian (+234). Numbers typed with + are used as written.
function toInternationalDigits(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!/^\+?[0-9 ()-]{7,20}$/.test(raw)) return null;

  let digits = raw.replace(/\D/g, "");
  if (!raw.startsWith("+")) {
    if (digits.startsWith("00")) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0")) {
      digits = `234${digits.slice(1)}`;
    }
  }

  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function whatsappHref(input: string | null | undefined): string | null {
  const digits = toInternationalDigits(input);
  return digits ? `https://wa.me/${digits}` : null;
}

export function telHref(input: string | null | undefined): string | null {
  const digits = toInternationalDigits(input);
  return digits ? `tel:+${digits}` : null;
}

// Same number typed two different ways
export function sameNumber(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = toInternationalDigits(a);
  const y = toInternationalDigits(b);
  return !!x && !!y && x === y;
}