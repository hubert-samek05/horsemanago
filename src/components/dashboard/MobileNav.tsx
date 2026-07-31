'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { canAccess, normalizeRole } from '@/lib/permissions';
import { 
  Home, 
  Calendar, 
  Users, 
  Dog, 
  DollarSign,
  Settings
} from 'lucide-react';

interface MobileNavProps {
  user: any;
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const role = normalizeRole(user?.role);

  const allMenuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
    { id: 'calendar', icon: Calendar, label: 'Kalendarz', href: '/dashboard/calendar' },
    { id: 'clients', icon: Users, label: 'Klienci', href: '/dashboard/clients' },
    { id: 'horses', icon: Dog, label: 'Konie', href: '/dashboard/horses' },
    { id: 'settings', icon: Settings, label: 'Ustawienia', href: '/dashboard/settings' },
  ];

  const menuItems = allMenuItems.filter(item => canAccess(role, item.id));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-iceBlue lg:hidden z-40">
      <div className="flex items-center justify-around py-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
              ${isActive(item.href)
                ? 'text-oceanBlue'
                : 'text-marineBlue hover:text-deepNavy'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
