import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vibelink.name.ng',
    title: 'VibeLink - Break the ice. Build real connections.',
    description: 'VibeLink lets people share their profile through QR codes and build real-world connections.',
    siteName: 'VibeLink',
  },
  twitter: {
    card: 'summary',
    title: 'VibeLink - Break the ice. Build real connections.',
    description: 'VibeLink lets people share their profile through QR codes and build real-world connections.',
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
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
