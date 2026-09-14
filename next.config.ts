import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    // Fail-safe environment variable handling
    let supabaseOrigin = '';
    let supabaseHost = '';
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const url = new URL(supabaseUrl);
        supabaseOrigin = url.origin;
        supabaseHost = url.hostname;
      }
    } catch (error) {
      console.error('Invalid NEXT_PUBLIC_SUPABASE_URL in environment');
      // Continue with empty values - CSP will be more restrictive
    }
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Build CSP directives
    const cspDirectives = [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "font-src 'self'",
      "worker-src 'self'",
      "media-src 'self'",
      
      // Script-src: Next.js 16.3.4 requires 'unsafe-inline' for hydration scripts
      // Development adds 'unsafe-eval' for Next.js hot module replacement
      isDevelopment 
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline'",
      
      // Style-src: Tailwind CSS and Next.js styled-jsx require 'unsafe-inline'
      "style-src 'self' 'unsafe-inline'",
      
      // Connect-src: Allow Supabase API (REST, Auth, Realtime/WebSocket)
      supabaseOrigin && supabaseHost
        ? `connect-src 'self' ${supabaseOrigin} wss://${supabaseHost}`
        : "connect-src 'self'",
      
      // Img-src: Allow self, data: (QR download: canvas.toDataURL), and Supabase Storage
      supabaseOrigin
        ? `img-src 'self' data: ${supabaseOrigin}`
        : "img-src 'self' data:",
      
      // Production-only: upgrade insecure HTTP requests to HTTPS
      ...(isDevelopment ? [] : ["upgrade-insecure-requests"])
    ];
    
    const cspValue = cspDirectives.join('; ');
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue
          }
        ]
      },
      // Private/auth routes - noindex, nofollow
      {
        source: '/signin',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/signup',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/forgot-password',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/reset-password',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/settings/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/edit-profile/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/complete-profile/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/my-card/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/connections/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/scan/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
      {
        source: '/welcome/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
