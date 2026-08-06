import type { Metadata } from 'next'
import { Inter, Playfair_Display, Manrope } from 'next/font/google'
import './globals.css'
import StoreHydration from '@/components/StoreHydration'

export const dynamic = 'force-static';

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
        <StoreHydration />
        {children}
      </body>
    </html>
  )
}
