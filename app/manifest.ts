/**
 * @file app/manifest.ts
 * @description Web App Manifest configuration for Progressive Web App (PWA) installability and offline support.
 */

import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/**
 * Generates the W3C Web App Manifest at `/manifest.webmanifest`.
 *
 * @returns {MetadataRoute.Manifest} Compliant PWA manifest metadata.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'RTL Markdown Studio',
    short_name: 'RTL Studio',
    description:
      'ویرایشگر و پیش‌نمایش مارک‌داون راست‌چین با پشتیبانی کامل آفلاین | Offline-ready RTL Markdown Editor & Previewer',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    dir: 'rtl',
    lang: 'fa',
    background_color: '#000000',
    theme_color: '#10b981',
    categories: ['productivity', 'developer tools', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
