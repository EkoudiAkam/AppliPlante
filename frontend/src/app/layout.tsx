import type { Metadata } from 'next';
import './globals.css';

import { Providers } from '@/components/providers/Providers';
import { PWARegister } from '@/components/PWARegister';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Plant Care - Gestion de vos plantes d\'intérieur',
  description: 'Application de gestion et de suivi de vos plantes d\'intérieur avec rappels d\'arrosage',
  keywords: ['plantes', 'jardinage', 'arrosage', 'suivi', 'notifications'],
  authors: [{ name: 'Plant Care Team' }],
  viewport: 'width=device-width, initial-scale=1',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PlantCare',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PlantCare" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className="antialiased">
        <Providers>
          <PWARegister />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
