import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/reset-password'
  
  // Validate the next parameter to prevent open redirects
  if (next && !next.startsWith('/')) {
    return NextResponse.redirect(new URL('/reset-password', request.url))
  }

  if (token_hash && type) {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redirect to the next URL (default: /reset-password)
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect to reset-password with error indicator
  const errorUrl = new URL('/reset-password?error=invalid_link', request.url)
  return NextResponse.redirect(errorUrl)
}
