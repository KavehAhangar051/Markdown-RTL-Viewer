import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import { SmoothScrollProvider } from '@/components/layout/smooth-scroll-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { MotionProvider } from '@/components/providers/motion-provider';
import { InitialAppLoader } from '@/components/ui/initial-app-loader';
import { CustomCursor } from '@/components/custom-cursor';

export const metadata: Metadata = {
  title: 'RTL Markdown Studio',
  description: 'Markdown editor and previewer with RTL support for Persian and Arabic text.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
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
          }}
          dangerouslySetInnerHTML={{
            __html: `
              <span id="pre-ascii-char">|</span>
              <script>
                (function() {
                  var f = ['|', '/', '-', '\\'];
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
