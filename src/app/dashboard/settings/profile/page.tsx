'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Building2, Edit2, MapPin, Phone, Mail, Globe, Clock, QrCode, Share2, Copy, Download, X, Save, ChevronLeft } from 'lucide-react';

interface StableProfile {
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  openingHours?: Record<string, string>;
  qrCodeUrl: string;
  qrScans: number;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stableProfile, setStableProfile] = useState<StableProfile>({
    slug: 'horsemanago',
    name: 'Stajnia Horsemanago',
    description: 'Profesjonalna stajnia jeździecka oferująca lekcje jazdy konnej, obozy jeździeckie i kompleksową opiekę nad końmi.',
    address: 'ul. Jeździecka 15',
    city: 'Warszawa',
    postalCode: '00-001',
    phone: '+48 123 456 789',
    email: 'kontakt@horsemanago.net',
    website: 'https://horsemanago.net',
    openingHours: {
      'Poniedziałek': '8:00 - 20:00',
      'Wtorek': '8:00 - 20:00',
      'Środa': '8:00 - 20:00',
      'Czwartek': '8:00 - 20:00',
      'Piątek': '8:00 - 20:00',
      'Sobota': '9:00 - 18:00',
      'Niedziela': '9:00 - 16:00',
    },
    qrCodeUrl: 'https://horsemanago.net/stables/horsemanago',
    qrScans: 156,
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editForm, setEditForm] = useState<StableProfile>(stableProfile);
  const [activeStableId, setActiveStableId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const { data } = await api.get('/settings/stable-profile');
        setStableProfile(data);
        setEditForm(data);
        setActiveStableId(data.id);
      } catch (error) {
        console.error('Load settings error:', error);
      }
    };

    loadSettings();
  }, [isAuthenticated, router]);

  useEffect(() => {
    const generateQR = async () => {
      if (!stableProfile.qrCodeUrl) return;
      try {
        const QRCode = (await import('qrcode')).default;
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, stableProfile.qrCodeUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1e3a5f',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(canvas.toDataURL());
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    generateQR();
  }, [stableProfile.qrCodeUrl]);

  const handleEdit = () => {
    setEditForm(stableProfile);
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/settings/stable-profile', { ...editForm, stableId: activeStableId });
      setStableProfile(data);
      setShowEditModal(false);
      alert('Profil zaktualizowany!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Nie udało się zapisać profilu');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stableProfile.name,
          text: stableProfile.description,
          url: stableProfile.qrCodeUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(stableProfile.qrCodeUrl);
      alert('Link skopiowany do schowka!');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Skopiowano do schowka!');
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.download = 'horsemanago-qr.png';
    link.href = qrCodeDataUrl;
    link.click();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      
      <div className="lg:ml-72 min-h-screen pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-deepNavy to-oceanBlue text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-serif text-lg font-bold">Profil ośrodka</h1>
          <div className="w-10" />
        </div>

        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Desktop Back Button */}
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="hidden lg:flex items-center gap-2 text-marineBlue hover:text-deepNavy transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Powrót do ustawień</span>
          </button>

          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-6 lg:p-10 flex flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Konfiguracja</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Profil ośrodka</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj wizytówką publiczną ośrodka.
                </p>
              </div>
              <button
                onClick={handleEdit}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:bg-white/30 transition-all flex items-center justify-center"
                title="Edytuj profil"
              >
                <Edit2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-deepNavy">Profil ośrodka</h2>
                  <p className="text-sm text-marineBlue">Wizytówka publiczna</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-deepNavy mb-2">{stableProfile.name}</h3>
                <p className="text-sm text-marineBlue">{stableProfile.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-deepNavy">
                  <MapPin className="w-4 h-4 text-oceanBlue" />
                  <span>{stableProfile.address}, {stableProfile.postalCode} {stableProfile.city}</span>
                </div>
                <div className="flex items-center gap-2 text-deepNavy">
                  <Phone className="w-4 h-4 text-oceanBlue" />
                  <span>{stableProfile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-deepNavy">
                  <Mail className="w-4 h-4 text-oceanBlue" />
                  <span>{stableProfile.email}</span>
                </div>
                {stableProfile.website && (
                  <div className="flex items-center gap-2 text-deepNavy">
                    <Globe className="w-4 h-4 text-oceanBlue" />
                    <a href={stableProfile.website} target="_blank" rel="noopener noreferrer" className="hover:text-oceanBlue">
                      {stableProfile.website}
                    </a>
                  </div>
                )}
              </div>

              {stableProfile.openingHours && (
                <div>
                  <h4 className="font-semibold text-deepNavy mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-oceanBlue" />
                    Godziny otwarcia
                  </h4>
                  <div className="space-y-1 text-sm text-marineBlue">
                    {Object.entries(stableProfile.openingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span>{day}</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Kod QR wizytówki</h2>
                <p className="text-sm text-marineBlue">Prowadzi do profilu ośrodka</p>
              </div>
            </div>

            <div className="bg-iceBlue/30 rounded-xl p-6 mb-6 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl shadow-lg" />
              ) : (
                <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <QrCode className="w-40 h-40 text-deepNavy" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-marineBlue">Skanowania:</span>
                <span className="text-deepNavy font-semibold">{stableProfile.qrScans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-marineBlue">Link:</span>
                <span className="text-deepNavy truncate max-w-[200px]">{stableProfile.qrCodeUrl}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleShare}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Udostępnij link
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopy(stableProfile.qrCodeUrl)}
                  className="px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Kopiuj link
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Pobierz
                </button>
              </div>
            </div>
          </div>

          {/* Public Business Card Link */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Wizytówka publiczna</h2>
                <p className="text-sm text-marineBlue">Strona widoczna dla klientów</p>
              </div>
            </div>
            <p className="text-sm text-deepNavy mb-4 break-all">
              {stableProfile.qrCodeUrl}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => window.open(`/stables/${stableProfile.slug}`, '_blank')}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Otwórz
              </button>
              <button
                onClick={() => handleCopy(stableProfile.qrCodeUrl)}
                className="px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Kopiuj
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Edytuj profil ośrodka</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa ośrodka</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Adres</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Kod pocztowy</label>
                    <input
                      type="text"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Miasto</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Strona www</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Link do wizytówki</label>
                  <input
                    type="url"
                    value={editForm.qrCodeUrl}
                    onChange={(e) => setEditForm({ ...editForm, qrCodeUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Zapisz zmiany
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <MobileNav user={user} />
    </div>
  );
}
