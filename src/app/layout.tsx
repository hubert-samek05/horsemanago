import type { Metadata } from 'next'
import { Inter, Playfair_Display, Manrope } from 'next/font/google'
import './globals.css'
import StoreHydration from '@/components/StoreHydration'
import Script from 'next/script'

export const dynamic = 'force-dynamic';

// Declare AppleID global type
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: (config: any) => Promise<any>;
      };
    };
  }
}

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Horsemanago - System Zarządzania Stajniami',
  description: 'Kompleksowy system do zarządzania stajniami, klubami jeździeckimi i ośrodkami jazdy konnej',
  keywords: 'stajnia, jeździectwo, zarządzanie stajnią, rezerwacje jazd konnych',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={`${inter.variable} ${playfair.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/signin.js"
          async
          onLoad={() => {
            if (window.AppleID) {
              window.AppleID.auth.init({
                clientId: 'net.horsemanago2.signin',
                scope: 'email name',
                redirectURI: 'https://horsemanago.net/login',
                state: Math.random().toString(36).substring(2, 15),
                usePopup: true,
              });
            }
          }}
        />
        <StoreHydration />
        {children}
      </body>
    </html>
  )
}
