'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Shield, Wrench, LogOut, ChevronRight, Search, MapPin, Star } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface RoleStable {
  stableId: string;
  stableName: string;
  city?: string;
  rating?: number;
  logo?: string;
}

interface UserRoles {
  STABLE_OWNER?: RoleStable[];
  INSTRUCTOR?: RoleStable[];
  STABLE_WORKER?: RoleStable[];
  CLIENT?: RoleStable[];
}

export default function SelectStablePage() {
  const router = useRouter();
  const { user, token, setAuth, logout, hasHydrated, setActiveStable } = useAuthStore();
  const [roles, setRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user || !token) {
      router.replace('/login');
      return;
    }

    // Use cached roles from store immediately for fast loading
    const cachedRoles = (user as any).roles || {};
    setRoles(cachedRoles);
    setLoading(false);

    // Then fetch fresh roles from backend in background
    api.get('/auth/me')
      .then(({ data }) => {
        console.log('Fetched roles from /auth/me:', data.roles);
        const freshUser = { ...user, ...data };
        setAuth(freshUser, token);
        setRoles(data.roles || {});
      })
      .catch((err) => {
        console.error('Failed to fetch fresh user roles:', err);
        // Keep using cached roles
      });
  }, [hasHydrated, user, token, router, setAuth]);

  const handleSelectStable = (stableId: string, role: string) => {
    console.log('handleSelectStable called:', { stableId, role });
    try {
      setActiveStable(stableId, role);
      if (role === 'CLIENT') {
        router.push(`/client?stableId=${stableId}`);
      } else {
        router.push(`/dashboard?stableId=${stableId}`);
      }
    } catch (error) {
      console.error('Error in handleSelectStable:', error);
    }
  };

  if (loading || !roles) {
    return (
      <div className="min-h-screen bg-arcticBlue flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-iceBlue border-t-oceanBlue" />
          <p className="mt-4 text-sm text-steelBlue">Ładowanie...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STABLE_OWNER': return <Building2 className="w-7 h-7" />;
      case 'INSTRUCTOR': return <User className="w-7 h-7" />;
      case 'STABLE_WORKER': return <Wrench className="w-7 h-7" />;
      case 'CLIENT': return <Shield className="w-7 h-7" />;
      default: return <Shield className="w-7 h-7" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STABLE_OWNER': return 'Właściciel';
      case 'INSTRUCTOR': return 'Instruktor';
      case 'STABLE_WORKER': return 'Pracownik';
      case 'CLIENT': return 'Klient';
      default: return role;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'STABLE_OWNER': return 'bg-blue-100 text-blue-700';
      case 'INSTRUCTOR': return 'bg-purple-100 text-purple-700';
      case 'STABLE_WORKER': return 'bg-amber-100 text-amber-700';
      default: return 'bg-iceBlue text-oceanBlue';
    }
  };

  const allOptions = [
    ...(roles.STABLE_OWNER?.map(s => ({ ...s, role: 'STABLE_OWNER' })) || []),
    ...(roles.INSTRUCTOR?.map(s => ({ ...s, role: 'INSTRUCTOR' })) || []),
    ...(roles.STABLE_WORKER?.map(s => ({ ...s, role: 'STABLE_WORKER' })) || []),
    ...(roles.CLIENT?.map(s => ({ ...s, role: 'CLIENT' })) || []),
  ];

  console.log('All options:', allOptions);

  const fullName = user?.firstName || user?.email?.split('@')[0] || 'Użytkowniku';

  return (
    <div className="min-h-screen bg-arcticBlue">
      <header className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white pb-20">
        <div className="max-w-3xl mx-auto px-5 pt-10 pb-14">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-mistBlue">Witaj z powrotem</p>
                <p className="font-semibold text-white">{fullName}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/welcome');
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">Wybierz stajnię</h1>
          <p className="text-mistBlue text-sm sm:text-base max-w-md">Masz dostęp do wielu stajni i ról. Wybierz, do której chcesz przejść.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5">
        <div className="flex items-center justify-between mb-4 mt-8">
          <h2 className="text-xl font-bold text-deepNavy">Twoje stajnie</h2>
          <span className="text-sm text-steelBlue">{allOptions.length}</span>
        </div>

        {allOptions.length === 0 ? (
          <div className="text-center py-14 px-6 rounded-2xl bg-white shadow-sm border border-iceBlue">
            <Building2 className="w-14 h-14 text-mistBlue mx-auto mb-4" />
            <h3 className="text-lg font-bold text-deepNavy mb-2">Nie masz jeszcze przypisanych stajni</h3>
            <p className="text-sm text-steelBlue mb-6">Znajdź stajnię i wyślij prośbę o dołączenie.</p>
            <button
              onClick={() => router.push('/client/search')}
              className="inline-flex items-center gap-2 rounded-xl bg-oceanBlue text-white px-5 py-3 text-sm font-medium hover:bg-marineBlue transition-colors"
            >
              <Search className="w-4 h-4" />
              Przeglądaj stajnie
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {allOptions.map((option) => (
              <button
                key={`${option.stableId}-${option.role}`}
                onClick={() => handleSelectStable(option.stableId, option.role)}
                className="w-full text-left rounded-2xl bg-white border border-iceBlue shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-mistBlue transition-all group"
              >
                <div className="h-14 w-14 rounded-2xl bg-iceBlue flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {option.logo ? (
                    <img src={option.logo} alt={option.stableName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-oceanBlue">{getRoleIcon(option.role)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-deepNavy truncate">{option.stableName}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${getRoleBadgeStyle(option.role)}`}>
                      {getRoleLabel(option.role)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-sm text-steelBlue">
                    {option.city && (
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {option.city}
                      </span>
                    )}
                    {typeof option.rating === 'number' && (
                      <span className="flex items-center">
                        <Star className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" />
                        {option.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-mistBlue group-hover:text-oceanBlue transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
