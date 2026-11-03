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
  const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const normalizedBasePath = rawBasePath
    ? (rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`).replace(/\/$/, '')
    : '';
  const rootPath = normalizedBasePath ? `${normalizedBasePath}/` : '/';

  return {
    id: rootPath,
    name: 'RTL Markdown Studio',
    short_name: 'RTL Studio',
    description:
      'ویرایشگر و پیش‌نمایش مارک‌داون راست‌چین با پشتیبانی کامل آفلاین | Offline-ready RTL Markdown Editor & Previewer',
    start_url: rootPath,
    scope: rootPath,
    display: 'standalone',
    orientation: 'any',
    dir: 'rtl',
    lang: 'fa',
    background_color: '#000000',
    theme_color: '#10b981',
    categories: ['productivity', 'developer tools', 'utilities'],
    icons: [
      {
        src: `${normalizedBasePath}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${normalizedBasePath}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${normalizedBasePath}/icon-maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
