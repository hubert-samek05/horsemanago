'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, QrCode, Copy, Share2, Download, Link, Users, Calendar, Eye, Plus, X } from 'lucide-react';
import api from '@/lib/api';

interface QRCode {
  id: string;
  name: string;
  type: 'stable' | 'horse' | 'event' | 'other';
  targetId?: string;
  targetName?: string;
  url: string;
  createdAt: string;
  scans: number;
  active: boolean;
  expiryDate?: string;
}

interface ShareLink {
  id: string;
  name: string;
  type: 'client_portal' | 'booking' | 'schedule' | 'other';
  url: string;
  createdAt: string;
  clicks: number;
  active: boolean;
  expiryDate?: string;
  password?: string;
}

export default function QRCodesPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr-codes' | 'share-links'>('qr-codes');
  const [showAddQRModal, setShowAddQRModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [qrFormData, setQrFormData] = useState({
    name: '',
    type: 'stable' as QRCode['type'],
    targetId: '',
    targetName: '',
    url: '',
    active: true,
    expiryDate: '',
  });

  const [linkFormData, setLinkFormData] = useState({
    name: '',
    type: 'client_portal' as ShareLink['type'],
    url: '',
    active: true,
    expiryDate: '',
    password: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [qrRes, linksRes] = await Promise.all([
          api.get(`/qr-codes?stableId=${activeStableId}`),
          api.get(`/share-links?stableId=${activeStableId}`)
        ]);
        setQRCodes(qrRes.data || []);
        setShareLinks(linksRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setQRCodes([]);
        setShareLinks([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeStableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie kodów QR...</p>
        </div>
      </div>
    );
  }

  const qrTypes = [
    { value: 'stable', label: 'Stajnia' },
    { value: 'horse', label: 'Koń' },
    { value: 'event', label: 'Wydarzenie' },
    { value: 'other', label: 'Inne' },
  ];

  const linkTypes = [
    { value: 'client_portal', label: 'Portal klienta' },
    { value: 'booking', label: 'Rezerwacja' },
    { value: 'schedule', label: 'Harmonogram' },
    { value: 'other', label: 'Inne' },
  ];

  const handleAddQR = () => {
    setQrFormData({
      name: '',
      type: 'stable',
      targetId: '',
      targetName: '',
      url: '',
      active: true,
      expiryDate: '',
    });
    setShowAddQRModal(true);
  };

  const handleSubmitQR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/qr-codes', { ...qrFormData, stableId: activeStableId });
      setQRCodes([...qrCodes, data]);
      setShowAddQRModal(false);
    } catch (error) {
      console.error('Save QR code error:', error);
      alert('Nie udało się utworzyć kodu QR');
    }
  };

  const handleAddLink = () => {
    setLinkFormData({
      name: '',
      type: 'client_portal',
      url: '',
      active: true,
      expiryDate: '',
      password: '',
    });
    setShowAddLinkModal(true);
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/share-links', { ...linkFormData, stableId: activeStableId });
      setShareLinks([...shareLinks, data]);
      setShowAddLinkModal(false);
    } catch (error) {
      console.error('Save share link error:', error);
      alert('Nie udało się utworzyć linku');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getQRStats = () => {
    const totalQRCodes = qrCodes.length;
    const activeQRCodes = qrCodes.filter(qr => qr.active).length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
    const totalLinks = shareLinks.length;
    const totalClicks = shareLinks.reduce((sum, link) => sum + link.clicks, 0);

    return {
      totalQRCodes,
      activeQRCodes,
      totalScans,
      totalLinks,
      totalClicks,
    };
  };

  const stats = getQRStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      
      <div className="lg:ml-72 min-h-screen pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-deepNavy to-oceanBlue text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <Image
            src="/zdj/horsemanagologo3"
            alt="HORSEmanago"
            width={100}
            height={100}
            className="rounded-lg"
          />
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Kody QR i linki</h1>
              <p className="text-marineBlue">Generuj kody QR i zarządzaj linkami udostępniania</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Kody QR</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalQRCodes}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Aktywne</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.activeQRCodes}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Skanowania</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalScans}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Linki</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalLinks}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-marineBlue">Kliknięcia</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.totalClicks}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('qr-codes')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'qr-codes'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Kody QR
            </button>
            <button
              onClick={() => setActiveTab('share-links')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'share-links'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Linki udostępniania
            </button>
          </div>

          {/* QR Codes Tab */}
          {activeTab === 'qr-codes' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddQR}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nowy kod QR</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{qr.name}</h3>
                            <p className="text-xs text-marineBlue">{qrTypes.find(t => t.value === qr.type)?.label}</p>
                          </div>
                        </div>
                        {qr.targetName && (
                          <p className="text-sm text-marineBlue mb-3">{qr.targetName}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${qr.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {qr.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </div>

                    <div className="bg-iceBlue/30 rounded-xl p-4 mb-4 flex items-center justify-center">
                      <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-deepNavy" />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Skanowania:</span>
                        <span className="text-deepNavy">{qr.scans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Utworzono:</span>
                        <span className="text-deepNavy">{qr.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(qr.url)}
                        className="flex-1 px-3 py-2 rounded-lg border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Kopiuj URL
                      </button>
                      <button
                        className="flex-1 px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Pobierz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Links Tab */}
          {activeTab === 'share-links' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddLink}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nowy link</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shareLinks.map((link) => (
                  <div key={link.id} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <Link className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{link.name}</h3>
                            <p className="text-xs text-marineBlue">{linkTypes.find(t => t.value === link.type)?.label}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${link.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {link.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </div>

                    <div className="bg-iceBlue/30 rounded-xl p-3 mb-4">
                      <p className="text-xs text-marineBlue truncate">{link.url}</p>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Kliknięcia:</span>
                        <span className="text-deepNavy">{link.clicks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Utworzono:</span>
                        <span className="text-deepNavy">{link.createdAt}</span>
                      </div>
                      {link.password && (
                        <div className="flex justify-between">
                          <span className="text-marineBlue">Hasło:</span>
                          <span className="text-deepNavy">***</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(link.url)}
                        className="flex-1 px-3 py-2 rounded-lg border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Kopiuj
                      </button>
                      <button
                        className="flex-1 px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <Share2 className="w-4 h-4" />
                        Udostępnij
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add QR Modal */}
      {showAddQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Nowy kod QR</h2>
                <button
                  onClick={() => setShowAddQRModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitQR} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={qrFormData.name}
                    onChange={(e) => setQrFormData({ ...qrFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={qrFormData.type}
                    onChange={(e) => setQrFormData({ ...qrFormData, type: e.target.value as QRCode['type'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {qrTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Cel (opcjonalnie)</label>
                  <input
                    type="text"
                    value={qrFormData.targetName}
                    onChange={(e) => setQrFormData({ ...qrFormData, targetName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">URL</label>
                  <input
                    type="url"
                    value={qrFormData.url}
                    onChange={(e) => setQrFormData({ ...qrFormData, url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data wygaśnięcia (opcjonalnie)</label>
                  <input
                    type="date"
                    value={qrFormData.expiryDate}
                    onChange={(e) => setQrFormData({ ...qrFormData, expiryDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={qrFormData.active}
                      onChange={(e) => setQrFormData({ ...qrFormData, active: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Aktywny</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddQRModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    Utwórz
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Nowy link</h2>
                <button
                  onClick={() => setShowAddLinkModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={linkFormData.name}
                    onChange={(e) => setLinkFormData({ ...linkFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={linkFormData.type}
                    onChange={(e) => setLinkFormData({ ...linkFormData, type: e.target.value as ShareLink['type'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {linkTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">URL</label>
                  <input
                    type="url"
                    value={linkFormData.url}
                    onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Hasło (opcjonalnie)</label>
                  <input
                    type="password"
                    value={linkFormData.password}
                    onChange={(e) => setLinkFormData({ ...linkFormData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data wygaśnięcia (opcjonalnie)</label>
                  <input
                    type="date"
                    value={linkFormData.expiryDate}
                    onChange={(e) => setLinkFormData({ ...linkFormData, expiryDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={linkFormData.active}
                      onChange={(e) => setLinkFormData({ ...linkFormData, active: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Aktywny</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddLinkModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    Utwórz
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
