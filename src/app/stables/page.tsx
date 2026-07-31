'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';

import { Search, MapPin, Filter, Star } from 'lucide-react';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Link from 'next/link';
import Image from 'next/image';

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
  _count: {
    reviews: number;
    horses: number;
  };
}

export default function StablesPage() {
  const [stables, setStables] = useState<Stable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    services: '',
  });

  const serviceOptions = [
    { value: '', label: 'Wszystkie usługi' },
    { value: 'pensjonat', label: 'Pensjonat koni' },
    { value: 'nauka jazdy', label: 'Nauka jazdy' },
    { value: 'zawody', label: 'Zawody' },
    { value: 'obozy', label: 'Obozy jeździeckie' },
    { value: 'trening', label: 'Treningi' },
  ];

  useEffect(() => {
    fetchStables();
  }, [filters]);

  const fetchStables = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.city) params.append('city', filters.city);
      if (filters.services) params.append('services', filters.services);

      const response = await api.get(`/stables?${params.toString()}`);
      setStables(response.data.stables);
    } catch (error) {
      console.error('Error fetching stables:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Wyszukaj stajnię</h1>
          <p className="text-navy-100 text-lg">
            Znajdź idealną stajnię dla siebie w Twojej okolicy
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
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
            <Select
              value={filters.services}
              onChange={(e) => setFilters({ ...filters, services: e.target.value })}
              options={serviceOptions}
            />
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700"></div>
            <p className="mt-4 text-navy-600">Ładowanie stajni...</p>
          </div>
        ) : stables.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-navy-600">Nie znaleziono stajni spełniających kryteria.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stables.map((stable) => (
              <StableCard key={stable.id} stable={stable} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StableCard({ stable }: { stable: Stable }) {
  return (
    <Card variant="elevated" className="hover:shadow-xl transition-shadow overflow-hidden">
      <div className="h-48 bg-navy-100 relative">
        {stable.logo ? (
          <Image
            src={stable.logo}
            alt={stable.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-navy-400">
            <span className="text-4xl font-bold">{stable.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">{stable.rating.toFixed(1)}</span>
          <span className="text-sm text-navy-600">({stable.reviewCount})</span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-navy-900 mb-2">{stable.name}</h3>
        <div className="flex items-center text-navy-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{stable.city}</span>
        </div>
        <p className="text-navy-600 text-sm mb-4 line-clamp-2">
          {stable.description || 'Brak opisu'}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {stable.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="px-2 py-1 bg-navy-100 text-navy-700 text-xs rounded-full"
            >
              {service}
            </span>
          ))}
          {stable.services.length > 3 && (
            <span className="px-2 py-1 bg-navy-100 text-navy-700 text-xs rounded-full">
              +{stable.services.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-navy-600 mb-4">
          <span>{stable._count.horses} koni</span>
          <span>{stable._count.reviews} opinii</span>
        </div>

        <Link href={`/stables/${stable.slug}`}>
          <Button className="w-full">Zobacz profil</Button>
        </Link>
      </div>
    </Card>
  );
}
