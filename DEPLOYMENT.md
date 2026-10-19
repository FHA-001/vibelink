# VibeLink Deployment Guide

## Deployment Requirements

VibeLink requires a platform that supports:
- **Server-Side Rendering (SSR)** for Supabase authentication
- **Environment Variables** for Supabase credentials
- **Node.js Runtime** (Node.js 20+)
- **API Routes** for auth callbacks

Vercel is the recommended deployment platform.

## Deploying to Vercel

### Prerequisites

1. A Vercel account ([vercel.com](https://vercel.com))
2. A Supabase project with database tables set up (see README.md)
3. Supabase project URL and anon key

### Step 1: Push to Git

If your code is not already in a Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will detect Next.js automatically
5. Configure environment variables in the project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Click "Deploy"

Vercel will build and deploy your application automatically.

### Step 3: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain (e.g., `vibelink.name.ng`)
4. Update DNS records as instructed by Vercel

## Environment Variables

The following environment variables are **required**:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

Get these from your Supabase project settings → API.

## Database Setup

Before deploying, ensure your Supabase database is set up with all required tables and RLS policies. Run the SQL migration scripts in order from your Supabase SQL Editor (see README.md for the full list).

## Build Configuration

The project uses Next.js 16.3.8 with Turbopack. The build command is:

```bash
npm run build
```

This creates an optimized production build with server-side rendering enabled.

## Security Headers

The application includes security headers in `next.config.ts`:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Permissions-Policy

These are automatically applied in production.

## Alternative Deployment Platforms

While Vercel is recommended, VibeLink can be deployed to any platform that supports:
- Next.js with SSR
- Environment variables
- Node.js runtime

Examples:
- Netlify (with Next.js runtime)
- Railway
- Render
- AWS Amplify
- Self-hosted with Docker

## Troubleshooting

### Build Fails

- Ensure all environment variables are set in the deployment platform
- Verify Node.js version is 20+
- Check that Supabase project is accessible

### Authentication Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure Supabase auth is enabled in your project
- Check that redirect URLs are configured in Supabase auth settings

### Database Errors

- Ensure all SQL migration scripts have been run
- Verify RLS policies are correctly configured
- Check that Supabase anon role has appropriate permissions