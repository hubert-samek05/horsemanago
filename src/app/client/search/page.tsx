'use client';

export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Star, ArrowLeft, Plus, Check, Clock, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Stable {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  logo?: string;
  services: string[];
  _count: { reviews: number; horses: number };
}

export default function ClientSearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [stables, setStables] = useState<Stable[]>([]);
  const [memberships, setMemberships] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'error' | 'joining'>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    services: '',
  });

  const serviceOptions = [
    { value: '', label: 'Wszystkie usługi' },
    { value: 'Lekcje jazdy', label: 'Lekcje jazdy' },
    { value: 'Treningi', label: 'Treningi' },
    { value: 'Pensjonat', label: 'Pensjonat' },
    { value: 'Obozy jeździeckie', label: 'Obozy jeździeckie' },
    { value: 'Hipoterapia', label: 'Hipoterapia' },
    { value: 'Rekreacja', label: 'Rekreacja' },
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/client/search');
      return;
    }
    fetchStables();
    fetchMemberships();
  }, [filters, isAuthenticated, router]);

  const fetchStables = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.city) params.append('city', filters.city);
      if (filters.services) params.append('services', filters.services);
      const { data } = await api.get(`/stables?${params.toString()}`);
      setStables(data.stables);
    } catch (error) {
      console.error('Error fetching stables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberships = async () => {
    try {
      const { data } = await api.get('/stables/my/memberships');
      const map: Record<string, 'none' | 'pending' | 'accepted' | 'error' | 'joining'> = {};
      data.forEach((m: { stableId: string; status: string }) => {
        map[m.stableId] = m.status === 'accepted' ? 'accepted' : 'pending';
      });
      setMemberships(map);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const handleJoin = async (stable: Stable) => {
    if (memberships[stable.id] === 'accepted' || memberships[stable.id] === 'pending') return;
    setMemberships((prev) => ({ ...prev, [stable.id]: 'joining' }));
    try {
      await api.post(`/stables/${stable.id}/join`, { role: 'member' });
      setMemberships((prev) => ({ ...prev, [stable.id]: 'pending' }));
    } catch (error: any) {
      const msg = error.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        setMemberships((prev) => ({ ...prev, [stable.id]: 'pending' }));
      } else {
        setMemberships((prev) => ({ ...prev, [stable.id]: 'error' }));
      }
    }
  };

  const getButton = (stable: Stable) => {
    const state = memberships[stable.id];
    if (state === 'accepted') {
      return (
        <Link href="/client">
          <Button variant="secondary" className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Dołączono
          </Button>
        </Link>
      );
    }
    if (state === 'pending') {
      return (
        <Button variant="outline" className="w-full" disabled>
          <Clock className="w-4 h-4 mr-2" />
          Oczekuje
        </Button>
      );
    }
    if (state === 'joining') {
      return (
        <Button className="w-full" disabled>
          Dołączanie...
        </Button>
      );
    }
    if (state === 'error') {
      return (
        <Button onClick={() => handleJoin(stable)} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
          Spróbuj ponownie
        </Button>
      );
    }
    return (
      <Button onClick={() => handleJoin(stable)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Dołącz do stajni
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-navy-50 pb-20">
      <header className="bg-gradient-to-r from-deepNavy to-oceanBlue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/client" className="inline-flex items-center gap-2 text-navy-100 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Wróć do moich stajni
          </Link>
          <h1 className="text-3xl font-serif font-bold">Znajdź stajnię</h1>
          <p className="text-navy-100 mt-1">Wyszukaj i dołącz do wybranego ośrodka jeździeckiego.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="elevated" className="mb-8 border-none">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Szukaj po nazwie lub opisie..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Input
              placeholder="Miasto"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
            <select
              value={filters.services}
              onChange={(e) => setFilters({ ...filters, services: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-iceBlue bg-white text-deepNavy focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all"
            >
              {serviceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700"></div>
            <p className="mt-4 text-navy-600">Ładowanie stajni...</p>
          </div>
        ) : stables.length === 0 ? (
          <Card variant="elevated" className="text-center py-12 border-none">
            <Building2 className="w-12 h-12 text-oceanBlue/40 mx-auto mb-4" />
            <p className="text-navy-600">Nie znaleziono stajni spełniających kryteria.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stables.map((stable) => (
              <Card key={stable.id} variant="elevated" className="border-none flex flex-col">
                <div className="h-44 bg-navy-100 relative rounded-xl overflow-hidden mb-5">
                  {stable.logo ? (
                    <img src={stable.logo} alt={stable.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-oceanBlue to-marineBlue text-white">
                      <span className="text-5xl font-black opacity-30">{stable.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full flex items-center gap-1 text-sm shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{stable.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-navy-900 mb-2">{stable.name}</h3>
                  <div className="flex items-center text-navy-600 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {stable.city}
                  </div>
                  <p className="text-navy-600 text-sm mb-4 line-clamp-2">{stable.description || 'Brak opisu'}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {stable.services.slice(0, 3).map((service) => (
                      <span key={service} className="px-2 py-1 bg-iceBlue text-navy-700 text-xs rounded-full">
                        {service}
                      </span>
                    ))}
                    {stable.services.length > 3 && (
                      <span className="px-2 py-1 bg-iceBlue text-navy-700 text-xs rounded-full">
                        +{stable.services.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-navy-600 mb-5">
                    <span>{stable._count.horses} koni</span>
                    <span>{stable._count.reviews} opinii</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href={`/stables/${stable.slug}`}>
                    <Button variant="outline" className="w-full">
                      Zobacz profil
                    </Button>
                  </Link>
                  {getButton(stable)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
