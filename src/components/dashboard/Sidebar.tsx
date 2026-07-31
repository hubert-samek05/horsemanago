'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { canAccess, normalizeRole, type Role } from '@/lib/permissions';
import { 
  Home, 
  Calendar, 
  Users, 
  Dog, 
  DollarSign, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  User,
  MapPin,
  Clock,
  Heart,
  Utensils,
  Activity,
  FileText,
  Tent,
  ClipboardCheck,
  Trophy,
  FileCheck,
  FolderOpen,
  Stethoscope,
  Wrench,
  QrCode,
  BarChart3,
  Wifi,
  Dumbbell,
  Ticket,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [horsesExpanded, setHorsesExpanded] = useState(false);
  const role = normalizeRole(user?.role);

  const allMenuItems: ({
    id: string;
    icon: any;
    label: string;
    href: string;
    hasSubmenu?: boolean;
    submenu?: { icon: any; label: string; href: string }[];
  })[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
    { id: 'calendar', icon: Calendar, label: 'Kalendarz', href: '/dashboard/calendar' },
    { id: 'clients', icon: Users, label: 'Klienci', href: '/dashboard/clients' },
    { id: 'employees', icon: User, label: 'Pracownicy', href: '/dashboard/employees' },
    { id: 'services', icon: Clock, label: 'Usługi', href: '/dashboard/services' },
    { id: 'locations', icon: MapPin, label: 'Miejsca', href: '/dashboard/locations' },
    { 
      id: 'horses',
      icon: Dog, 
      label: 'Konie', 
      href: '/dashboard/horses',
      hasSubmenu: true,
      submenu: [
        { icon: Dog, label: 'Lista koni', href: '/dashboard/horses' },
        { icon: Heart, label: 'Zdrowie', href: '/dashboard/horses?tab=health' },
        { icon: Utensils, label: 'Karmienie', href: '/dashboard/horses?tab=feeding' },
        { icon: Dumbbell, label: 'Trening', href: '/dashboard/horses?tab=training' },
        { icon: Activity, label: 'Obciążenie', href: '/dashboard/horses?tab=workload' },
      ]
    },
    { id: 'veterinarians', icon: Stethoscope, label: 'Weterynarze', href: '/dashboard/veterinarians' },
    { id: 'farriers', icon: Wrench, label: 'Kowale', href: '/dashboard/farriers' },
    { id: 'boarding', icon: FolderOpen, label: 'Pensjonat', href: '/dashboard/boarding' },
    { id: 'camps', icon: Tent, label: 'Obozy', href: '/dashboard/camps' },
    { id: 'forms', icon: FileText, label: 'Formularze', href: '/dashboard/forms' },
    { id: 'consents', icon: FileCheck, label: 'Zgody', href: '/dashboard/consents' },
    { id: 'checklists', icon: ClipboardCheck, label: 'Listy kontrolne', href: '/dashboard/checklists' },
    { id: 'competitions', icon: Trophy, label: 'Zawody', href: '/dashboard/competitions' },
    { id: 'passes', icon: Ticket, label: 'Karnety', href: '/dashboard/passes' },
    { id: 'ride-payments', icon: CreditCard, label: 'Płatności za jazdy', href: '/dashboard/ride-payments' },
    { id: 'statistics', icon: BarChart3, label: 'Statystyki', href: '/dashboard/statistics' },
    { id: 'finances', icon: DollarSign, label: 'Finanse', href: '/dashboard/finances' },
  ];

  const menuItems = allMenuItems.filter(item => canAccess(role, item.id));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-72 bg-gradient-to-b from-deepNavy to-midnightBlue
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-center p-6 border-b border-white/10 shrink-0 relative">
            <Link href="/" className="flex items-center justify-center">
              <Image
                src="/zdj/horsemanagologo3"
                alt="HORSEmanago"
                width={180}
                height={180}
                className="rounded-lg"
              />
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden text-white/70 hover:text-white absolute right-6"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-white/60 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto pb-20">
            {menuItems.map((item) => (
              <div key={item.href}>
                {item.hasSubmenu ? (
                  <>
                    <button
                      onClick={() => setHorsesExpanded(!horsesExpanded)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${isActive(item.href)
                          ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-lg'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      <ChevronDown className={`w-5 h-5 ml-auto transition-transform ${horsesExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {horsesExpanded && item.submenu && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => onClose()}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm
                              ${pathname === subItem.href
                                ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                              }
                            `}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => onClose()}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isActive(item.href)
                        ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive(item.href) && <ChevronRight className="w-5 h-5 ml-auto" />}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-white/10 space-y-2 shrink-0 pb-8">
            <Link
              href="/dashboard/settings"
              onClick={() => onClose()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Ustawienia</span>
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Wyloguj się</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
