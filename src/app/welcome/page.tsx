'use client';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function WelcomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Prevent multiple redirects
    if (!isClient || !hasHydrated || isRedirecting.current) return;

    // Only redirect if we're actually on the welcome page
    if (pathname !== '/welcome') return;

    if (user) {
      isRedirecting.current = true;
      const roles = (user as any).roles;
      const hasStableRoles = !!roles && (
        (roles.STABLE_OWNER?.length > 0) ||
        (roles.INSTRUCTOR?.length > 0) ||
        (roles.STABLE_WORKER?.length > 0)
      );
      
      let targetPath = '/dashboard';
      if (hasStableRoles) {
        targetPath = '/select-stable';
      } else if (roles?.CLIENT?.length > 0 || user.role === 'CLIENT') {
        targetPath = '/client';
      }
      
      // Use replace instead of push to avoid history issues
      router.replace(targetPath);
    }
  }, [hasHydrated, user, router, isClient, pathname]);

  if (!isClient) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-lg">Ładowanie...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-lg">Przekierowywanie...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/60 z-10" />
        <img
          src="https://images.pexels.com/photos/13340062/pexels-photo-13340062.jpeg"
          alt="Background"
          className="w-full h-full object-cover brightness-60"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center px-6 w-full max-w-md h-full">
        {/* Welcome Text and Logo together */}
        <div className="flex flex-col items-center mb-4">
          <p className="text-white text-2xl md:text-3xl font-serif font-semibold drop-shadow-lg leading-none m-0 p-0">
            Witaj w
          </p>
          <div style={{ marginTop: '-7rem' }}>
            <img
              src="/zdj/horsemanagologo3"
              alt="HORSEmanago"
              className="w-72 h-72 md:w-80 md:h-80 object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-xs space-y-3">
          <Link href="/login?direct=1" className="block">
            <button className="w-full bg-white/95 backdrop-blur-sm text-deepNavy font-semibold text-base py-3 px-6 rounded-2xl shadow-2xl hover:bg-white transition-all duration-300 hover:scale-105">
              Zaloguj się
            </button>
          </Link>
          <Link href="/register?direct=1" className="block">
            <button className="w-full bg-gradient-to-r from-deepNavy to-oceanBlue text-white font-semibold text-base py-3 px-6 rounded-2xl shadow-2xl hover:from-midnightBlue hover:to-marineBlue transition-all duration-300 hover:scale-105">
              Zarejestruj się
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
