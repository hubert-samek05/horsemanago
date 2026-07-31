'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, Star, Calendar, Users, Dog, Clock, Share2, QrCode, Check, Quote, Globe } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import Link from 'next/link';

interface Stable {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  qrCode?: string;
  rating: number;
  reviewCount: number;
  facilityList: string[];
  services: string[];
  openingHours?: any;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  horses: Array<{
    id: string;
    name: string;
    breed?: string;
    color?: string;
    image?: string;
  }>;
  instructors: Array<{
    id: string;
    specializations: string[];
    bio?: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    user: {
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  _count: {
    reviews: number;
    horses: number;
    members: number;
  };
}

export default function StableProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug : (Array.isArray(rawSlug) ? rawSlug[0] : '');
  const [stable, setStable] = useState<Stable | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const createFallbackStable = (stableSlug: string): Stable => ({
    id: 'demo-' + stableSlug,
    slug: stableSlug,
    name: `Stajnia ${stableSlug.charAt(0).toUpperCase() + stableSlug.slice(1)}`,
    description: 'Profesjonalny ośrodek jeździecki. Zapraszamy na lekcje jazdy konnej, treningi oraz obozy dla miłośników koni.',
    address: 'ul. Jeździecka 15',
    city: 'Warszawa',
    postalCode: '00-001',
    phone: '+48 123 456 789',
    email: 'kontakt@horsemanago.net',
    website: 'https://horsemanago.net',
    rating: 4.8,
    reviewCount: 24,
    facilityList: ['Kryty ujeżdżalnia', 'Padok', 'Stajnia', 'Parking', 'Szatnie'],
    services: ['Lekcje jazdy', 'Treningi', 'Pensjonat', 'Obozy jeździeckie'],
    openingHours: {
      poniedziałek: '08:00 - 20:00',
      wtorek: '08:00 - 20:00',
      środa: '08:00 - 20:00',
      czwartek: '08:00 - 20:00',
      piątek: '08:00 - 20:00',
      sobota: '09:00 - 18:00',
      niedziela: '09:00 - 16:00',
    },
    owner: {
      id: 'owner-1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@horsemanago.net',
      phone: '+48 123 456 789',
    },
    horses: [
      { id: '1', name: 'Białka', breed: 'Koń polski', color: 'Gniada' },
      { id: '2', name: 'Rafał', breed: 'Małopolak', color: 'Kasztanowata' },
      { id: '3', name: 'Atena', breed: 'Wielkopolski', color: 'Siwa' },
    ],
    instructors: [
      { id: '1', specializations: ['Jazda rekreacyjna'], bio: 'Instruktor z 10-letnim doświadczeniem.' },
      { id: '2', specializations: ['Skoki'], bio: 'Specjalista od skoków przez przeszkody.' },
    ],
    reviews: [
      { id: '1', rating: 5, comment: 'Świetne miejsce, polecam!', user: { firstName: 'Anna', lastName: 'M.' }, createdAt: '2026-07-20T10:00:00Z' },
      { id: '2', rating: 4, comment: 'Bardzo miła obsługa.', user: { firstName: 'Marek', lastName: 'K.' }, createdAt: '2026-07-18T10:00:00Z' },
    ],
    _count: { reviews: 2, horses: 3, members: 12 },
  });

  const [autoJoinDone, setAutoJoinDone] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchStable();
    }
  }, [slug]);

  useEffect(() => {
    if (typeof window === 'undefined' || autoJoinDone || !stable?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('join') === '1' && localStorage.getItem('token')) {
      setAutoJoinDone(true);
      handleJoin();
    }
  }, [stable?.id, autoJoinDone]);

  const fetchStable = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stables/slug/${slug}`);
      setStable(response.data);
    } catch (error) {
      console.error('Error fetching stable:', error);
      setStable(createFallbackStable(slug));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stable?.name,
          text: stable?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link skopiowany do schowka!');
    }
  };

  const handleJoin = async () => {
    if (!stable) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push(`/login?redirect=/stables/${slug}&join=1`);
      return;
    }
    try {
      await api.post(`/stables/${stable.id}/join`, { role: 'member' });
      alert('Wysłano prośbę o dołączenie do stajni.');
      router.push('/client');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Nie udało się wysłać prośby.';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-navy-700"></div>
          <p className="mt-4 text-navy-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!stable) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <Card className="text-center">
          <p className="text-navy-600">Nie znaleziono stajni.</p>
          <Link href="/stables">
            <Button className="mt-4">Powrót do wyszukiwania</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Cover */}
      <div className="h-56 md:h-80 lg:h-[26rem] bg-gradient-to-br from-deepNavy via-oceanBlue to-marineBlue relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,white,transparent_40%)] opacity-10" />
        {stable.coverImage ? (
          <Image
            src={stable.coverImage}
            alt={stable.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl md:text-9xl font-black text-white/10 select-none">{stable.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-40 relative z-10">
        {/* Header */}
        <Card variant="elevated" className="mb-10 border-none">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            <div className="flex-shrink-0 -mt-16 md:-mt-24 mx-auto lg:mx-0">
              {stable.logo ? (
                <Image
                  src={stable.logo}
                  alt={stable.name}
                  width={144}
                  height={144}
                  className="rounded-2xl shadow-2xl border-4 border-white bg-white w-28 h-28 md:w-36 md:h-36 object-cover"
                />
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-oceanBlue to-marineBlue rounded-2xl shadow-2xl border-4 border-white flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-black text-white">{stable.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-2xl md:text-4xl font-bold text-navy-900 font-serif break-words">{stable.name}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full w-fit">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {stable.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-navy-600 text-sm mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-oceanBlue flex-shrink-0" />
                      <span className="break-words">{stable.city}, {stable.address}</span>
                    </div>
                    <div className="hidden sm:flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{stable.rating.toFixed(1)}</span>
                      <span className="ml-1">({stable.reviewCount} opinii)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full w-full sm:w-auto">
                    <Share2 className="w-4 h-4 mr-2" />
                    Udostępnij
                  </Button>
                  {stable.qrCode && (
                    <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="rounded-full w-full sm:w-auto">
                      <QrCode className="w-4 h-4 mr-2" />
                      Kod QR
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {stable.services.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1.5 bg-white border border-oceanBlue/30 text-navy-800 text-sm rounded-full shadow-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center p-3 bg-iceBlue/40 rounded-xl text-navy-700 overflow-hidden">
                  <Dog className="w-5 h-5 mr-2 text-oceanBlue flex-shrink-0" />
                  <span className="truncate">{stable._count.horses} koni</span>
                </div>
                <div className="flex items-center p-3 bg-iceBlue/40 rounded-xl text-navy-700 overflow-hidden">
                  <Users className="w-5 h-5 mr-2 text-oceanBlue flex-shrink-0" />
                  <span className="truncate">{stable._count.members} członków</span>
                </div>
                <div className="flex items-center p-3 bg-iceBlue/40 rounded-xl text-navy-700 overflow-hidden">
                  <Phone className="w-5 h-5 mr-2 text-oceanBlue flex-shrink-0" />
                  <span className="truncate">{stable.phone}</span>
                </div>
                <div className="flex items-center p-3 bg-iceBlue/40 rounded-xl text-navy-700 overflow-hidden">
                  <Mail className="w-5 h-5 mr-2 text-oceanBlue flex-shrink-0" />
                  <span className="truncate">{stable.email}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {/* Description */}
            <Card variant="elevated" className="border-none">
              <h2 className="text-2xl font-bold text-navy-900 mb-4 font-serif">O stajni</h2>
              <p className="text-navy-700 leading-relaxed text-lg">
                {stable.description || 'Brak opisu stajni.'}
              </p>
            </Card>

            {/* Facilities */}
            <Card variant="elevated" className="border-none">
              <h2 className="text-2xl font-bold text-navy-900 mb-6 font-serif">Udogodnienia</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stable.facilityList.map((facility) => (
                  <div key={facility} className="flex items-center p-3 bg-iceBlue/30 rounded-xl text-navy-800">
                    <div className="w-8 h-8 rounded-full bg-oceanBlue/10 flex items-center justify-center mr-3">
                      <Check className="w-4 h-4 text-oceanBlue" />
                    </div>
                    {facility}
                  </div>
                ))}
              </div>
            </Card>

            {/* Horses */}
            <Card variant="elevated" className="border-none">
              <h2 className="text-2xl font-bold text-navy-900 mb-6 font-serif">Nasze konie</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {stable.horses.map((horse) => (
                  <div key={horse.id} className="group bg-navy-50 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    {horse.image ? (
                      <Image
                        src={horse.image}
                        alt={horse.name}
                        width={200}
                        height={160}
                        className="w-full h-28 object-cover rounded-xl mb-3"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gradient-to-br from-oceanBlue to-marineBlue rounded-xl mb-3 flex items-center justify-center">
                        <Dog className="w-10 h-10 text-white/70" />
                      </div>
                    )}
                    <h3 className="font-bold text-navy-900">{horse.name}</h3>
                    <p className="text-sm text-navy-600">{horse.breed || 'Brak rasy'}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Instructors */}
            <Card variant="elevated" className="border-none">
              <h2 className="text-2xl font-bold text-navy-900 mb-6 font-serif">Instruktorzy</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {stable.instructors.map((instructor) => (
                  <div key={instructor.id} className="p-5 bg-navy-50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white font-bold">
                        I
                      </div>
                      <div>
                        <h3 className="font-bold text-navy-900">Instruktor</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {instructor.specializations.map((spec) => (
                            <span key={spec} className="px-2 py-0.5 bg-white border border-oceanBlue/20 text-navy-700 text-xs rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {instructor.bio && <p className="text-sm text-navy-600 leading-relaxed">{instructor.bio}</p>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <Card variant="elevated" className="border-none">
              <h2 className="text-2xl font-bold text-navy-900 mb-6 font-serif">Opinie</h2>
              <div className="space-y-5">
                {stable.reviews.map((review) => (
                  <div key={review.id} className="relative p-5 bg-navy-50 rounded-2xl">
                    <Quote className="absolute top-4 right-4 w-6 h-6 text-oceanBlue/20" />
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-navy-900">
                          {review.user.firstName} {review.user.lastName}
                        </span>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-navy-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-navy-500">
                        {new Date(review.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    {review.comment && <p className="text-navy-700 italic">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Action Buttons */}
            <Card variant="elevated" className="border-none">
              <div className="space-y-3">
                <Link href={`/stables/${stable.slug}/book`} className="block">
                  <Button className="w-full">Zarezerwuj zajęcia</Button>
                </Link>
                <Button onClick={handleJoin} variant="secondary" className="w-full">
                  Dołącz do stajni
                </Button>
              </div>
            </Card>

            {/* Contact */}
            <Card variant="elevated" className="border-none">
              <h3 className="text-xl font-bold text-navy-900 mb-5 font-serif">Kontakt</h3>
              <div className="space-y-4">
                <a href={`tel:${stable.phone}`} className="flex items-center p-3 bg-iceBlue/30 rounded-xl text-navy-700 hover:bg-iceBlue/50 transition-colors min-w-0">
                  <div className="w-10 h-10 rounded-full bg-oceanBlue/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <Phone className="w-5 h-5 text-oceanBlue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-navy-500">Telefon</p>
                    <p className="font-medium text-navy-900 truncate">{stable.phone}</p>
                  </div>
                </a>
                <a href={`mailto:${stable.email}`} className="flex items-center p-3 bg-iceBlue/30 rounded-xl text-navy-700 hover:bg-iceBlue/50 transition-colors min-w-0">
                  <div className="w-10 h-10 rounded-full bg-oceanBlue/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <Mail className="w-5 h-5 text-oceanBlue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-navy-500">Email</p>
                    <p className="font-medium text-navy-900 truncate">{stable.email}</p>
                  </div>
                </a>
                <div className="flex items-center p-3 bg-iceBlue/30 rounded-xl text-navy-700 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-oceanBlue/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-oceanBlue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-navy-500">Adres</p>
                    <p className="font-medium text-navy-900 truncate">{stable.address}, {stable.city}</p>
                  </div>
                </div>
                {stable.website && (
                  <a href={stable.website} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-iceBlue/30 rounded-xl text-navy-700 hover:bg-iceBlue/50 transition-colors min-w-0">
                    <div className="w-10 h-10 rounded-full bg-oceanBlue/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Globe className="w-5 h-5 text-oceanBlue" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-navy-500">Strona www</p>
                      <p className="font-medium text-navy-900 truncate">{stable.website}</p>
                    </div>
                  </a>
                )}
              </div>
            </Card>

            {/* Opening Hours */}
            {stable.openingHours && (
              <Card variant="elevated" className="border-none">
                <h3 className="text-xl font-bold text-navy-900 mb-5 font-serif">Godziny otwarcia</h3>
                <div className="space-y-3 text-sm">
                  {Object.entries(stable.openingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between items-center p-2 rounded-lg hover:bg-iceBlue/20 transition-colors">
                      <span className="capitalize font-medium text-navy-700">{day}</span>
                      <span className="font-semibold text-navy-900">{hours}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && stable.qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm">
          <Card className="relative max-w-sm w-full mx-4">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-navy-500 hover:text-navy-700"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold text-navy-900 mb-4 text-center">
              Kod QR stajni
            </h3>
            <div className="flex justify-center mb-4">
              <img src={stable.qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
            <p className="text-sm text-navy-600 text-center mb-4">
              Zeskanuj kod, aby przejść do profilu stajni
            </p>
            <Button onClick={handleShare} className="w-full">
              Udostępnij link
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
