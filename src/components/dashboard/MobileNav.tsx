'use client';

export const dynamic = 'force-dynamic';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { canAccess, normalizeRole } from '@/lib/permissions';
import { useAuthStore } from '@/lib/store';
import {
  Home,
  Users,
  Dog, 
  Settings,
  Plus
} from 'lucide-react';

interface MobileNavProps {
  user: any;
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const { activeRole } = useAuthStore();
  const role = normalizeRole(activeRole || user?.role);

  const leftMenuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
    { id: 'clients', icon: Users, label: 'Klienci', href: '/dashboard/clients' },
  ];

  const rightMenuItems = [
    { id: 'horses', icon: Dog, label: 'Konie', href: '/dashboard/horses' },
    { id: 'settings', icon: Settings, label: 'Ustawienia', href: '/dashboard/settings' },
  ];

  const leftItems = leftMenuItems.filter(item => canAccess(role, item.id));
  const rightItems = rightMenuItems.filter(item => canAccess(role, item.id));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-iceBlue/30 rounded-3xl shadow-xl lg:hidden z-40">
      <div className="flex items-center justify-between px-3 py-3">
        {/* Left Side */}
        <div className="flex items-center gap-1 flex-1">
          {leftItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all flex-1
                ${isActive(item.href)
                  ? 'text-oceanBlue bg-arcticBlue/30'
                  : 'text-marineBlue hover:text-deepNavy'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Center Plus Button */}
        <Link
          href="/dashboard/calendar?add=true"
          className="flex items-center justify-center px-3 py-2"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-1 flex-1">
          {rightItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all flex-1
                ${isActive(item.href)
                  ? 'text-oceanBlue bg-arcticBlue/30'
                  : 'text-marineBlue hover:text-deepNavy'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
