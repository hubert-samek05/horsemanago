'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Wifi, WifiOff, Download, Upload, RefreshCw, Check, AlertCircle, Clock, Database } from 'lucide-react';

interface OfflineData {
  lastSync: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  cachedItems: number;
  pendingChanges: number;
  storageUsed: number;
  storageLimit: number;
}

export default function OfflinePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [offlineData, setOfflineData] = useState<OfflineData>({
    lastSync: new Date().toISOString(),
    syncStatus: 'synced',
    cachedItems: 156,
    pendingChanges: 0,
    storageUsed: 45.2,
    storageLimit: 100,
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setOfflineData({ ...offlineData, syncStatus: 'syncing' });
    
    setTimeout(() => {
      setOfflineData({
        ...offlineData,
        lastSync: new Date().toISOString(),
        syncStatus: 'synced',
        pendingChanges: 0,
      });
      setIsSyncing(false);
    }, 2000);
  };

  const handleClearCache = () => {
    setOfflineData({
      ...offlineData,
      cachedItems: 0,
      storageUsed: 0,
    });
  };

  const storagePercentage = (offlineData.storageUsed / offlineData.storageLimit) * 100;

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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Tryb offline</h1>
              <p className="text-marineBlue">Zarządzaj synchronizacją i danymi offline</p>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-xl">
                  <Wifi className="w-5 h-5" />
                  <span className="font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-xl">
                  <WifiOff className="w-5 h-5" />
                  <span className="font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Zapisane dane</span>
              </div>
              <p className="text-3xl font-bold text-deepNavy">{offlineData.cachedItems}</p>
              <p className="text-xs text-marineBlue mt-1">elementów</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Ostatnia synchronizacja</span>
              </div>
              <p className="text-3xl font-bold text-deepNavy">
                {new Date(offlineData.lastSync).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-marineBlue mt-1">{new Date(offlineData.lastSync).toLocaleDateString('pl-PL')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Zmiany do wysłania</span>
              </div>
              <p className="text-3xl font-bold text-deepNavy">{offlineData.pendingChanges}</p>
              <p className="text-xs text-marineBlue mt-1">elementów</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-marineBlue">Użycie pamięci</span>
              </div>
              <p className="text-3xl font-bold text-deepNavy">{offlineData.storageUsed.toFixed(1)}%</p>
              <p className="text-xs text-marineBlue mt-1">{offlineData.storageUsed} MB / {offlineData.storageLimit} MB</p>
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-deepNavy">Status synchronizacji</h2>
              <button
                onClick={handleSync}
                disabled={isSyncing || !isOnline}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isSyncing || !isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizacja...' : 'Synchronizuj teraz'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-iceBlue/30">
              {offlineData.syncStatus === 'synced' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-deepNavy">Wszystkie dane są zsynchronizowane</p>
                    <p className="text-sm text-marineBlue">Ostatnia synchronizacja: {new Date(offlineData.lastSync).toLocaleString('pl-PL')}</p>
                  </div>
                </>
              )}
              {offlineData.syncStatus === 'syncing' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium text-deepNavy">Synchronizacja w toku...</p>
                    <p className="text-sm text-marineBlue">Proszę czekać</p>
                  </div>
                </>
              )}
              {offlineData.syncStatus === 'error' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-deepNavy">Błąd synchronizacji</p>
                    <p className="text-sm text-marineBlue">Sprawdź połączenie internetowe i spróbuj ponownie</p>
                  </div>
                </>
              )}
              {offlineData.syncStatus === 'offline' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <WifiOff className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-deepNavy">Tryb offline</p>
                    <p className="text-sm text-marineBlue">Dane zostaną zsynchronizowane po przywróceniu połączenia</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Storage Usage */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-deepNavy">Użycie pamięci</h2>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
              >
                Wyczyść cache
              </button>
            </div>

            <div className="mb-4">
              <div className="w-full bg-iceBlue rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue h-full rounded-full transition-all duration-500"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-marineBlue">
                <span>{offlineData.storageUsed.toFixed(1)} MB użyte</span>
                <span>{offlineData.storageLimit} MB limit</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-iceBlue/20 rounded-xl">
                <p className="text-2xl font-bold text-deepNavy">45.2</p>
                <p className="text-xs text-marineBlue">MB - Dane</p>
              </div>
              <div className="p-4 bg-iceBlue/20 rounded-xl">
                <p className="text-2xl font-bold text-deepNavy">12.8</p>
                <p className="text-xs text-marineBlue">MB - Obrazy</p>
              </div>
              <div className="p-4 bg-iceBlue/20 rounded-xl">
                <p className="text-2xl font-bold text-deepNavy">8.5</p>
                <p className="text-xs text-marineBlue">MB - Cache</p>
              </div>
              <div className="p-4 bg-iceBlue/20 rounded-xl">
                <p className="text-2xl font-bold text-deepNavy">2.1</p>
                <p className="text-xs text-marineBlue">MB - Inne</p>
              </div>
            </div>
          </div>

          {/* Offline Features */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <h2 className="font-serif text-xl font-bold text-deepNavy mb-4">Funkcje offline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 bg-iceBlue/20 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-deepNavy">Dostęp do kalendarza</p>
                  <p className="text-sm text-marineBlue">Przeglądaj harmonogram bez internetu</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-iceBlue/20 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-deepNavy">Dane koni</p>
                  <p className="text-sm text-marineBlue">Informacje o koniach są dostępne offline</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-iceBlue/20 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-deepNavy">Lista klientów</p>
                  <p className="text-sm text-marineBlue">Dostęp do danych kontaktowych offline</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-iceBlue/20 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-deepNavy">Automatyczna synchronizacja</p>
                  <p className="text-sm text-marineBlue">Dane synchronizują się po przywróceniu połączenia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
