'use client';

export const dynamic = 'force-static';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Menu, Settings as SettingsIcon, ChevronLeft, Save, Zap, Palette } from 'lucide-react';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultView: 'day' | 'week' | 'month';
  autoSave: boolean;
  compactMode: boolean;
}

export default function AppSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'pl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    defaultView: 'week',
    autoSave: true,
    compactMode: false,
  });

  const handleSaveSettings = () => {
    // TODO: Implement API call to save app settings
    console.log('Saving app settings:', appSettings);
    alert('Ustawienia aplikacji zapisane!');
  };

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      
      <div className="lg:ml-72 min-h-screen pb-20 lg:pb-0">
        <div className="lg:hidden bg-gradient-to-r from-deepNavy to-oceanBlue text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => router.push('/dashboard/settings')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-serif text-lg font-bold">Aplikacja</h1>
          <div className="w-10" />
        </div>

        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          <button onClick={() => router.push('/dashboard/settings')} className="hidden lg:flex items-center gap-2 text-marineBlue hover:text-deepNavy transition-colors mb-4">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Powrót do ustawień</span>
          </button>

          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-6 lg:p-10">
              <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Konfiguracja</p>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Aplikacja</h1>
              <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md">
                Zarządzaj preferencjami aplikacji.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Ustawienia aplikacji</h2>
                <p className="text-sm text-marineBlue">Preferencje interfejsu</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Motyw</label>
                  <select
                    value={appSettings.theme}
                    onChange={(e) => setAppSettings({ ...appSettings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="light">Jasny</option>
                    <option value="dark">Ciemny</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Język</label>
                  <select
                    value={appSettings.language}
                    onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="pl">Polski</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Format daty</label>
                  <select
                    value={appSettings.dateFormat}
                    onChange={(e) => setAppSettings({ ...appSettings, dateFormat: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Format czasu</label>
                  <select
                    value={appSettings.timeFormat}
                    onChange={(e) => setAppSettings({ ...appSettings, timeFormat: e.target.value as '12h' | '24h' })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="12h">12h</option>
                    <option value="24h">24h</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Domyślny widok kalendarza</label>
                <select
                  value={appSettings.defaultView}
                  onChange={(e) => setAppSettings({ ...appSettings, defaultView: e.target.value as 'day' | 'week' | 'month' })}
                  className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                >
                  <option value="day">Dzień</option>
                  <option value="week">Tydzień</option>
                  <option value="month">Miesiąc</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-iceBlue/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <span className="font-medium text-deepNavy">Auto-zapis</span>
                      <p className="text-xs text-marineBlue">Automatyczne zapisywanie zmian</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAppSettings({ ...appSettings, autoSave: !appSettings.autoSave })}
                    className={`w-12 h-6 rounded-full transition-colors ${appSettings.autoSave ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${appSettings.autoSave ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-iceBlue/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <span className="font-medium text-deepNavy">Tryb kompaktowy</span>
                      <p className="text-xs text-marineBlue">Mniejszy interfejs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAppSettings({ ...appSettings, compactMode: !appSettings.compactMode })}
                    className={`w-12 h-6 rounded-full transition-colors ${appSettings.compactMode ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${appSettings.compactMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Zapisz ustawienia aplikacji
          </button>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
