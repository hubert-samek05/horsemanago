'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/welcome');
  };

  const navLinks = [
    { href: '/', label: 'Strona główna' },
    { href: '/stables', label: 'Stajnie' },
    { href: '/about', label: 'O nas' },
    { href: '/contact', label: 'Kontakt' },
  ];

  return (
    <nav className="bg-white border-b border-navy-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/zdj/logohorsemanago"
              alt="Horsemanago"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-navy-900">Horsemanago</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-navy-700'
                    : 'text-navy-600 hover:text-navy-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated() ? (
              <>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    Panel
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Wyloguj
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Zaloguj
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Zarejestruj</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
