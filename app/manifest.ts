import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VibeLink - Break the ice. Build real connections.',
    short_name: 'VibeLink',
    description: 'VibeLink lets people share their profile through QR codes and build real-world connections.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8F7F3',
    theme_color: '#C9A52B',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icon-512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  }
}
