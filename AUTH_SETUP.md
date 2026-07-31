# VibeLink Authentication & Profile System Setup

## Database Setup Required

The authentication and profile system requires an updated `profiles` table in your Supabase database. Follow these steps to set it up:

### 1. Create/Update the Profiles Table

**If this is a fresh installation:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase/setup-profiles-table.sql`

**If you already have a profiles table:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration script from `supabase/migrate-profiles-table.sql`

The migration script will:
- Add new columns to existing table
- Update RLS policies
- Add indexes and triggers
- Preserve all existing data

The script will:
- Create/update the `profiles` table with expanded fields
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Add username validation triggers
- Ensure users can only access their own profiles
- Allow public profile viewing by username

### 2. New Profile Fields

The updated profile system includes:
- `username` (required, unique, 3-20 chars, letters/numbers/underscores only)
- `full_name` (required)
- `job_title` (required)
- `company_school` (optional)
- `bio` (required)
- `profile_photo` (optional)
- `interests` (array of strings, comma-separated in form)
- `website` (optional)
- `linkedin` (optional)
- `twitter` (optional)
- `github` (optional)
- `instagram` (optional)

## How the New Authentication Flow Works

### Sign Up Flow
1. User signs up with email/password
2. Supabase creates user in `auth.users`
3. Application checks if profile exists in `profiles` table
4. If no profile or incomplete profile → redirect to `/complete-profile`
5. If profile exists and is complete → redirect to `/my-card`

### Sign In Flow
1. User signs in with email/password
2. Application checks if profile exists in `profiles` table
3. If no profile or incomplete profile → redirect to `/complete-profile`
4. If profile exists and is complete → redirect to `/my-card`

### Profile Completion Flow
1. User fills out comprehensive profile form with all new fields
2. Username is validated for uniqueness and format
3. Application saves to `profiles` table using user's `auth.uid()`
4. User is redirected to `/my-card`
5. Future logins will skip profile completion

## New Features

### My Card Page
- Replaces the old dashboard as the authenticated user's home
- Displays premium profile card with all user information
- Includes QR code generation for public profile
- Share and download functionality
- Beautiful mobile-first design

### Public Profiles
- Every user has a public profile at `/u/{username}`
- No authentication required to view public profiles
- Displays same premium card design
- Shareable via QR code or direct link

### QR Code System
- Each user gets a unique QR code pointing to their public profile
- QR code format: `https://your-domain.com/u/{username}`
- No profile data stored in QR code (always valid even if profile changes)
- Downloadable for offline sharing

### Bottom Navigation
- Premium mobile-first navigation with 4 tabs:
  - My Card (active tab)
  - Scan (QR code scanner placeholder)
  - Connections (connection history placeholder)
  - Settings (account settings placeholder)
- Active tab highlighting
- Fixed position at bottom of screen

### Username System
- Required field for all users
- Unique across all users
- 3-20 characters, letters/numbers/underscores only
- Real-time availability checking
- Database-level validation
- Can only be changed from Settings (placeholder)

## Key Features

- **Profile Persistence**: User profiles are stored in Supabase database
- **Security**: Row Level Security ensures users can only access their own data
- **One-time Setup**: Profile completion only happens once per user
- **Data Validation**: Profile must have meaningful data to be considered complete
- **User Linking**: Profiles are linked to authenticated users via `auth.uid()`
- **Public Access**: Public profiles accessible without authentication
- **QR Code System**: Unique QR codes for each user pointing to public profile
- **Mobile-First**: Premium mobile-first design with bottom navigation

## Environment Variables

Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Profile keeps redirecting to completion page
- Check that the `profiles` table exists in Supabase with new schema
- Verify RLS policies are correctly set up
- Check browser console for any Supabase errors
- Ensure the user's profile data is being saved correctly
- Verify username is set and valid

### Username validation errors
- Ensure username is 3-20 characters
- Only letters, numbers, and underscores allowed
- Check if username is already taken
- Verify database triggers are working

### Permission errors
- Verify that the RLS policies allow authenticated users to insert/update their own profiles
- Check that the user is properly authenticated before trying to save profile
- Ensure public policy allows viewing profiles by username

### Table doesn't exist errors
- Run the updated SQL setup script in your Supabase SQL Editor
- Verify the table was created with all new fields
- Check that triggers were created successfully

### QR code not generating
- Ensure username is set in profile
- Check that QR code library is installed (`qrcode.react`)
- Verify the public profile URL is correctly formatted

## Pages Overview

- `/` - Landing page
- `/welcome` - Welcome page for new users
- `/signup` - Sign up page
- `/signin` - Sign in page
- `/complete-profile` - Profile completion form (redirects to My Card after completion)
- `/my-card` - **New authenticated user home page** (replaces dashboard)
- `/u/[username]` - **New public profile page** (no auth required)
- `/scan` - QR code scanner placeholder
- `/connections` - Connection history placeholder
- `/settings` - Account settings placeholder
- `/dashboard` - Redirects to `/my-card` (deprecated)