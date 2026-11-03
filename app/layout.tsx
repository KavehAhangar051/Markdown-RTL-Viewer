import type { Metadata, Viewport } from 'next';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/kode-mono/400.css';
import '@fontsource/kode-mono/600.css';
import '@fontsource/kode-mono/700.css';
import 'katex/dist/katex.min.css';
import './globals.css';
import { SmoothScrollProvider } from '@/components/layout/smooth-scroll-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { MotionProvider } from '@/components/providers/motion-provider';
import { InitialAppLoader } from '@/components/ui/initial-app-loader';
import { CustomCursor } from '@/components/custom-cursor';

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const basePath = rawBasePath
  ? (rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`).replace(/\/$/, '')
  : '';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'RTL Markdown Studio',
  description: 'Markdown editor and previewer with RTL support for Persian and Arabic text.',
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RTL Studio',
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: '32x32' },
      { url: `${basePath}/icon.svg`, type: 'image/svg+xml' },
      { url: `${basePath}/icon-32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: `${basePath}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
      { url: `${basePath}/apple-icon.png`, sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'RTL Markdown Studio',
    description: 'Markdown editor and previewer with RTL support for Persian and Arabic text.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RTL Markdown Studio',
    description: 'Markdown editor and previewer with RTL support for Persian and Arabic text.',
  },
};

/**
 * Root layout that keeps typography rich without breaking static builds.
 * We avoid next/font/google here because GitHub Actions builds can fail when
 * outbound font fetches are blocked or rate-limited.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-vazir bg-black text-zinc-100 antialiased">
        <div
          id="pre-hydration-loader"
          suppressHydrationWarning
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e4e4e7',
            fontFamily: 'monospace',
            fontSize: '32px',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{
            __html: `
              <span id="pre-ascii-char">|</span>
              <script>
                (function() {
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    window.__deferredPwaPrompt = e;
                  });
                  var f = ['|', '/', '-', '\\\\'];
                  var i = 0;
                  var el = document.getElementById('pre-ascii-char');
                  if (el) {
                    window.__asciiPreInterval = setInterval(function() {
                      i = (i + 1) % f.length;
                      el.textContent = f[i];
                    }, 200);
                  }
                })();
              </script>
            `,
          }}
        />

        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MotionProvider>
            <InitialAppLoader />
            <CustomCursor />
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
