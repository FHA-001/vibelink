import Link from "next/link";
import { Logo } from "./logo";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "How it works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "FAQ", href: "/faq" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy text-ivory">
      <div className="gold-rule" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="VibeLink home" className="inline-block rounded-lg">
              <Logo variant="light" />
            </Link>
            <p className="mt-5 text-lg font-heading leading-snug text-ivory">
              Break the ice. Build real connections.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ivory/70">
              A digital card, a QR code and a private place to remember the people you meet.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h2 className="font-heading text-sm font-semibold text-ivory">{group}</h2>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-ivory/70 transition-colors hover:text-primary focus-visible:text-primary"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-ivory/15 pt-6 text-sm text-ivory/60 sm:flex-row">
          <p>© {currentYear} VibeLink. All rights reserved.</p>
          <p>Made by FHA</p>
        </div>
      </div>
    </footer>
  );
}
