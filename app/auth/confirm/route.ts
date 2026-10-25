import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createServerClient, createServerClientWithResponse } from '@/lib/supabase-server'
import { getSafeRedirectWithFallback } from '@/lib/redirect'
import { hasCompletedProfileServer } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')
  
  // Safe diagnostic logging - no secrets
  console.log('Auth confirm diagnostics:', { 
    hasTokenHash: !!token_hash, 
    hasCode: !!code,
    confirmationType: type,
    hasNextParam: !!next,
  })
  
  // Use different fallbacks based on confirmation type
  // Signup: /my-card (normal onboarding)
  // Recovery: /reset-password (password reset flow)
  // For PKCE code flow without explicit type, assume signup
  const fallback = type === 'signup' || (code && !type) ? '/my-card' : '/reset-password'
  const safeNext = getSafeRedirectWithFallback(next, fallback)

  const supabase = await createServerClient()
  let error = null
  let userEmail = null

  // Handle PKCE code flow (Supabase email confirmation with {{ .ConfirmationURL }})
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
    if (!error && result.data.user) {
      userEmail = result.data.user.email
    }
  }
  // Handle token_hash flow (legacy OTP verification)
  else if (token_hash && type) {
    const result = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    error = result.error
    if (!error && result.data.user) {
      userEmail = result.data.user.email
    }
  }

  if (!error) {
    // For signup confirmation, redirect to login with email prefilled
    // Password recovery (type='recovery') should always go to /reset-password
    if (type === 'signup' || (code && !type)) {
      // Create response and new client with response binding for signOut
      const signinUrl = new URL('/signin', request.url)
      if (userEmail) {
        signinUrl.searchParams.set('email', userEmail)
      }
      if (next) {
        signinUrl.searchParams.set('redirect', safeNext)
      }
      const response = NextResponse.redirect(signinUrl)

      // Create new client with response binding to capture cookie changes from signOut
      const supabaseWithResponse = await createServerClientWithResponse(response)

      // Sign out to require password re-entry
      // Cookie changes are automatically applied to the response via setAll callback
      // Use local scope to only clear the current session, not other devices
      await supabaseWithResponse.auth.signOut({ scope: 'local' })

      return response
    }

    // Password recovery - redirect to reset-password with session intact
    const redirectUrl = new URL(safeNext, request.url)
    return NextResponse.redirect(redirectUrl)
  } else {
    // Verification failed - redirect to appropriate page based on type
    console.error('Auth verification failed:', { confirmationType: type, errorCategory: error.name })
    if (type === 'signup' || (code && !type)) {
      // Signup confirmation failed - redirect to signup with error
      const signupUrl = new URL('/signup', request.url)
      signupUrl.searchParams.set('error', 'confirmation_failed')
      return NextResponse.redirect(signupUrl)
    } else {
      // Recovery failed - redirect to reset-password with error
      const errorUrl = new URL('/reset-password?error=invalid_link', request.url)
      return NextResponse.redirect(errorUrl)
    }
  }
}
