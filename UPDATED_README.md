# VibeLink: UI/UX redesign

This is the VibeLink project with a full visual and interaction redesign. Routes, Supabase calls, authorization, privacy rules and business logic are unchanged. No new dependencies were added. No SQL or migrations are included or needed.

## Setup

Requires Node.js 20 or newer.

```bash
npm install
```

Create `.env.local` (not included) with these variables, using your own values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build
npm run start
```

The build uses `next/font/google` (Sora and Inter), so the first build needs internet access, as before.

## Major changes

**Design system** (`app/globals.css`)
- Champagne gold, emerald teal, midnight navy and warm ivory kept as the identity, with navy-tinted shadows and hairline gold rules.
- Accessible colour: white on gold (2.4:1) and on teal (2.9:1) failed WCAG AA, so buttons now use navy text on gold (about 6:1). Deeper `gold-ink` / `teal-ink` tones (`text-gold`, `text-teal-ink`) are used for text on light surfaces. Low-opacity grey text was moved to a compliant `muted-foreground`.
- Skip-to-content link, visible gold focus rings, `id="main-content"` on every `<main>`.

**Motion** (`components/motion.tsx`, `providers.tsx`, `app/template.tsx`)
- Scroll reveals, staggered grids, a short page fade, spring nav indicator, a tilting example card in the hero.
- `MotionConfig reducedMotion="user"` plus a CSS reduced-motion block disable movement for people who ask for it.

**Components**
- New: `AppHeader`, `EmptyState`, `ConfirmDialog`, `Skeleton`, `Textarea`, `Providers`, `Reveal/Stagger`.
- Rebuilt: Navigation (active states, no auth-loading layout shift, focus and Escape handling), Footer, BottomNav (floating dock on desktop), Logo (mark plus wordmark), Button, Input, Card, Alert, Dialog, Dropdown, Toast styling.
- Landing page: new hero, how it works, features, audiences, physical products, CTA.

**Screens**: landing, welcome, sign in, sign up, password screens, My Card (QR dialog with copy link), connections, public profiles, settings, scan, edit/complete profile, 404 and loading.

**Behaviour polish (no logic changes)**
- All `alert()` and `confirm()` calls replaced by toasts and an accessible confirm dialog.
- Autocomplete attributes on auth forms.
- Product images and logo converted to small optimized files (`public/logo-mark.png`, `public/images/*.webp`). Original images were kept.

**Copy**: em dashes removed from website copy. Removed unsupported claims ("thousands of professionals", one-tap save to phone). NFC card and VibeTags are labelled Coming soon.

## Deployment notes
- No database changes. CSP in `next.config.ts` is untouched.
- `AUDIT_README.md` from the audit package was left out as obsolete.
- Line endings were normalized to LF.

## Testing status (honest disclosure)
The sandbox had no network access, so `npm install` could not run. Therefore **`npm run build`, `npm run lint` and a full `tsc` type-check were NOT run**. What was run: a TypeScript syntax parse of every `.ts/.tsx` file (0 errors), a missing-import scan on JSX components, and WCAG contrast calculations for the palette. Please run `npm run build` and `npm run lint` before deploying and expect possible small type or lint fixes.

## Known gaps
- Static marketing pages (about, features, pricing, FAQ, contact, careers, legal), scan, settings, edit-profile and complete-profile received the global token/primitive upgrades and class-level fixes, not individual layout rewrites.
- Dark mode tokens exist but there is no theme toggle.
- Not visually checked in a browser, so responsive behaviour is unverified.
