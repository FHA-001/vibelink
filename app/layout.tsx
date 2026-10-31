import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { Providers } from "@/components/providers";

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Runs before first paint so a saved dark choice never flashes white
const themeScript = `try{if(localStorage.getItem('vibelink-theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}`;

export const viewport: Viewport = {
  themeColor: "#F8F7F3",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://vibelink.name.ng'),
  title: {
    default: 'VibeLink - Break the ice. Build real connections.',
    template: '%s | VibeLink',
  },
  description: 'VibeLink lets people share their profile through QR codes and build real-world connections.',
  applicationName: 'VibeLink',
  keywords: ['digital introduction', 'QR code', 'networking', 'connections', 'business cards', 'social networking'],
  authors: [{ name: 'VibeLink' }],
  creator: 'VibeLink',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VibeLink',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vibelink.name.ng',
    title: 'VibeLink - Break the ice. Build real connections.',
    description: 'VibeLink lets people share their profile through QR codes and build real-world connections.',
    siteName: 'VibeLink',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VibeLink - Break the ice. Build real connections.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeLink - Break the ice. Build real connections.',
    description: 'VibeLink lets people share their profile through QR codes and build real-world connections.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: [
      { url: '/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/apple-touch-icon.jpg', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
            className={`${sora.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
