'use client';

export const dynamic = 'force-static';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Menu, User, ChevronLeft, Shield, Save, Bell } from 'lucide-react';

interface AccountSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'email' | 'app';
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    pushTopics: {
      bookings: boolean;
      payments: boolean;
      passes: boolean;
      news: boolean;
      reminders: boolean;
    };
  };
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    twoFactorEnabled: false,
    twoFactorMethod: 'sms',
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
      pushTopics: {
        bookings: true,
        payments: true,
        passes: true,
        news: false,
        reminders: true,
      },
    },
  });

  const handleSaveSettings = () => {
    // TODO: Implement API call to save account settings
    console.log('Saving account settings:', accountSettings);
    alert('Ustawienia konta zapisane!');
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
          <h1 className="font-serif text-lg font-bold">Konto</h1>
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
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Konto</h1>
              <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md">
                Zarządzaj danymi osobowymi konta.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Konto</h2>
                <p className="text-sm text-marineBlue">Ustawienia konta użytkownika</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Imię</label>
                  <input
                    type="text"
                    value={accountSettings.firstName}
                    onChange={(e) => setAccountSettings({ ...accountSettings, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwisko</label>
                  <input
                    type="text"
                    value={accountSettings.lastName}
                    onChange={(e) => setAccountSettings({ ...accountSettings, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                <input
                  type="email"
                  value={accountSettings.email}
                  onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                <input
                  type="tel"
                  value={accountSettings.phone}
                  onChange={(e) => setAccountSettings({ ...accountSettings, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-iceBlue/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-oceanBlue" />
                  <div>
                    <span className="font-medium text-deepNavy">Uwierzytelnianie dwuetapowe</span>
                    <p className="text-xs text-marineBlue">Dodatkowe zabezpieczenie konta</p>
                  </div>
                </div>
                <button
                  onClick={() => setAccountSettings({ ...accountSettings, twoFactorEnabled: !accountSettings.twoFactorEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${accountSettings.twoFactorEnabled ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="border-t border-iceBlue pt-4">
                <h3 className="font-semibold text-deepNavy mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-oceanBlue" />
                  Powiadomienia
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Email</span>
                    <input
                      type="checkbox"
                      checked={accountSettings.notificationPreferences.email}
                      onChange={(e) => setAccountSettings({
                        ...accountSettings,
                        notificationPreferences: { ...accountSettings.notificationPreferences, email: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">SMS</span>
                    <input
                      type="checkbox"
                      checked={accountSettings.notificationPreferences.sms}
                      onChange={(e) => setAccountSettings({
                        ...accountSettings,
                        notificationPreferences: { ...accountSettings.notificationPreferences, sms: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Push</span>
                    <input
                      type="checkbox"
                      checked={accountSettings.notificationPreferences.push}
                      onChange={(e) => setAccountSettings({
                        ...accountSettings,
                        notificationPreferences: { ...accountSettings.notificationPreferences, push: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Zapisz ustawienia konta
          </button>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
