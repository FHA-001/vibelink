# VibeLink

Break the ice. Build real connections.

VibeLink is a digital introduction platform that lets people share their profile through QR codes and build real-world connections.

## Tech Stack

- **Framework**: Next.js 16.3.8 with React 19.2.4
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for profile photos
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (base-nova theme), @base-ui/react
- **Icons**: lucide-react
- **Animations**: Framer Motion
- **QR Code**: qrcode.react
- **Fonts**: Google Fonts (Sora, Inter) via next/font/google

## Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- Supabase project URL and anon key

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd VibeLink
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project settings → API.

### 3. Database Setup

VibeLink requires Supabase database tables and RLS policies. Run the SQL migration scripts in order from your Supabase SQL Editor:

1. `supabase/setup-profiles-table.sql` - Creates profiles table with RLS
2. `supabase/setup-phase-2.sql` - Creates connections and notifications tables
3. `supabase/setup-connection-requests.sql` - Creates connection requests system
4. `supabase/setup-user-blocks.sql` - Creates blocking functionality
5. `supabase/setup-profile-reports.sql` - Creates reporting functionality
6. `supabase/harden-profile-rpc-for-blocks.sql` - Updates RPCs for block awareness
7. `supabase/extend-block-notification-cleanup.sql` - Extends block cleanup
8. `supabase/harden-notifications-for-blocks.sql` - Updates notifications for blocks
9. `supabase/make-profile-fields-optional.sql` - Makes job_title and bio nullable

See `AUTH_SETUP.md` for detailed authentication and profile system setup instructions.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- `app/` - Next.js App Router pages
  - `u/[username]/` - Public profile pages
  - `my-card/` - Authenticated user's profile card
  - `connections/` - Connection management
  - `settings/` - Account settings (including deletion, blocking)
  - `scan/` - QR code scanner
- `components/` - React components
  - `profile/` - Profile-related components (card, avatar, tags, safety menu)
  - `ui/` - shadcn/ui components
- `lib/` - Utility functions
  - `auth.ts` - Authentication and profile functions
  - `supabase-server.ts` - Supabase server client
  - `supabase.ts` - Supabase browser client
- `supabase/` - SQL migration scripts

## Key Features

- **Public Profiles**: Shareable profiles at `/u/{username}` with QR codes
- **QR Code Generation**: Unique QR codes for each user profile
- **Connection System**: Send, accept, decline, and manage connection requests
- **Blocking**: Block users to prevent interactions and clean up connections
- **Reporting**: Report inappropriate profiles with rate limiting
- **Account Deletion**: Full account deletion with data cleanup
- **Mobile-First Design**: Bottom navigation and responsive layouts
- **Security**: Row Level Security, CSP headers, rate limiting

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Security Features

- Row Level Security (RLS) on all Supabase tables
- Content Security Policy (CSP) headers
- Rate limiting on sensitive operations (reports, blocks)
- Secure RPC functions with auth.uid() validation
- Noindex/nofollow on private routes
- Input validation and sanitization

## Legal Pages

- Privacy Policy: `/privacy`
- Terms of Service: `/terms`
- Cookie Policy: `/cookies`

## Deployment

VibeLink requires a platform that supports:
- Server-side rendering (SSR) for Supabase auth
- Environment variables for Supabase credentials
- Node.js runtime

Vercel is recommended. See `DEPLOYMENT.md` for deployment guidance.

## Support

For questions or issues, contact: hello@vibelink.name.ng
