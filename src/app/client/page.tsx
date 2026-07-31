'use client';

export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Star, ChevronRight, Building2, LogOut, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Stable {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  services: string[];
}

interface Membership {
  id: string;
  stableId: string;
  status: 'pending' | 'accepted';
  role: string;
  stable: Stable;
}

export default function ClientHubPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, setActiveStable } = useAuthStore();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/client');
      return;
    }
    fetchMemberships();
  }, [isAuthenticated, router]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/stables/my/memberships');
      setMemberships(data);
    } catch (error) {
      console.error('Error loading memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setActiveStable(id);
    router.push('/client/dashboard');
  };

  const fullName = user?.firstName || user?.email?.split('@')[0] || 'Jeźdźcu';

  if (loading) {
    return (
      <div className="min-h-screen bg-arcticBlue flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-iceBlue border-t-oceanBlue" />
          <p className="mt-4 text-sm text-steelBlue">Ładowanie...</p>
        </div>
      </div>
    );
  }

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
                router.push('/login');
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">Panel klienta</h1>
          <p className="text-mistBlue text-sm sm:text-base max-w-md">Wybierz stajnię, aby przejść do jej dashboardu.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 -mt-12">
        <Link href="/client/search" className="block mb-10">
          <div className="rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white p-5 shadow-lg hover:shadow-xl transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-mistBlue uppercase tracking-wider">Nowa stajnia</p>
                <h2 className="text-lg font-bold">Znajdź stajnię</h2>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-mistBlue" />
          </div>
        </Link>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-deepNavy">Twoje stajnie</h2>
          <span className="text-sm text-steelBlue">{memberships.length}</span>
        </div>

        {memberships.length === 0 ? (
          <div className="text-center py-14 px-6 rounded-2xl bg-white shadow-sm border border-iceBlue">
            <Building2 className="w-14 h-14 text-mistBlue mx-auto mb-4" />
            <h3 className="text-lg font-bold text-deepNavy mb-2">Nie dołączyłeś jeszcze do żadnej stajni</h3>
            <p className="text-sm text-steelBlue mb-6">Znajdź stajnię i wyślij prośbę o dołączenie.</p>
            <Link
              href="/client/search"
              className="inline-flex items-center gap-2 rounded-xl bg-oceanBlue text-white px-5 py-3 text-sm font-medium hover:bg-marineBlue transition-colors"
            >
              <Search className="w-4 h-4" />
              Znajdź stajnię
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership) => (
              <button
                key={membership.id}
                onClick={() => handleSelect(membership.stableId)}
                className="w-full text-left rounded-2xl bg-white border border-iceBlue shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-mistBlue transition-all group"
              >
                <div className="h-14 w-14 rounded-2xl bg-iceBlue flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-oceanBlue" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-deepNavy truncate">{membership.stable.name}</h3>
                    {membership.status === 'accepted' ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 flex-shrink-0">
                        Aktywna
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 flex-shrink-0">
                        Oczekuje
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-sm text-steelBlue">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {membership.stable.city}
                    </span>
                    <span className="flex items-center">
                      <Star className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" />
                      {membership.stable.rating.toFixed(1)}
                    </span>
                  </div>

                  {membership.stable.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {membership.stable.services.slice(0, 2).map((service) => (
                        <span key={service} className="px-2 py-0.5 rounded-full bg-iceBlue text-oceanBlue text-xs font-medium">
                          {service}
                        </span>
                      ))}
                      {membership.stable.services.length > 2 && (
                        <span className="px-2 py-0.5 rounded-full bg-iceBlue text-steelBlue text-xs font-medium">
                          +{membership.stable.services.length - 2}
                        </span>
                      )}
                    </div>
                  )}
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
