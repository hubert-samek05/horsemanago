'use client';

export const dynamic = 'force-static';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Menu, Clock, ChevronLeft, Save } from 'lucide-react';

interface WorkingHoursSettings {
  enabled: boolean;
  timezone: string;
  hours: Record<string, { open: string; close: string; enabled: boolean }>;
  breakTime: { start: string; end: string; enabled: boolean };
  holidays: Array<{ date: string; name: string; recurring: boolean }>;
}

export default function HoursSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [workingHours, setWorkingHours] = useState<WorkingHoursSettings>({
    enabled: true,
    timezone: 'Europe/Warsaw',
    hours: {
      'Poniedziałek': { open: '08:00', close: '20:00', enabled: true },
      'Wtorek': { open: '08:00', close: '20:00', enabled: true },
      'Środa': { open: '08:00', close: '20:00', enabled: true },
      'Czwartek': { open: '08:00', close: '20:00', enabled: true },
      'Piątek': { open: '08:00', close: '20:00', enabled: true },
      'Sobota': { open: '09:00', close: '18:00', enabled: true },
      'Niedziela': { open: '09:00', close: '16:00', enabled: true },
    },
    breakTime: { start: '12:00', end: '13:00', enabled: false },
    holidays: [],
  });

  const handleSaveSettings = () => {
    // TODO: Implement API call to save working hours settings
    console.log('Saving working hours settings:', workingHours);
    alert('Ustawienia godzin pracy zapisane!');
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
          <h1 className="font-serif text-lg font-bold">Godziny pracy</h1>
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
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Godziny pracy</h1>
              <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md">
                Zarządzaj godzinami otwarcia ośrodka.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Godziny pracy</h2>
                <p className="text-sm text-marineBlue">Ustaw dostępność ośrodka</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-iceBlue/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-oceanBlue" />
                  <div>
                    <span className="font-medium text-deepNavy">Włącz godziny pracy</span>
                    <p className="text-xs text-marineBlue">Ogranicz rezerwacje do godzin pracy</p>
                  </div>
                </div>
                <button
                  onClick={() => setWorkingHours({ ...workingHours, enabled: !workingHours.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${workingHours.enabled ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${workingHours.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Strefa czasowa</label>
                <select
                  value={workingHours.timezone}
                  onChange={(e) => setWorkingHours({ ...workingHours, timezone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                >
                  <option value="Europe/Warsaw">Warszawa (UTC+1)</option>
                  <option value="Europe/Berlin">Berlin (UTC+1)</option>
                  <option value="Europe/London">Londyn (UTC+0)</option>
                  <option value="Europe/Paris">Paryż (UTC+1)</option>
                  <option value="America/New_York">Nowy Jork (UTC-5)</option>
                  <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-deepNavy mb-3">Godziny pracy - dni tygodnia</h3>
                <div className="space-y-3">
                  {Object.entries(workingHours.hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-3 p-3 bg-iceBlue/30 rounded-xl">
                      <button
                        onClick={() => setWorkingHours({
                          ...workingHours,
                          hours: { ...workingHours.hours, [day]: { ...hours, enabled: !hours.enabled } }
                        })}
                        className={`w-6 h-6 rounded-full transition-colors ${hours.enabled ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${hours.enabled ? 'translate-x-0.5' : 'translate-x-0'}`} />
                      </button>
                      <span className="flex-1 font-medium text-deepNavy">{day}</span>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setWorkingHours({
                          ...workingHours,
                          hours: { ...workingHours.hours, [day]: { ...hours, open: e.target.value } }
                        })}
                        className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        disabled={!hours.enabled}
                      />
                      <span className="text-marineBlue">-</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setWorkingHours({
                          ...workingHours,
                          hours: { ...workingHours.hours, [day]: { ...hours, close: e.target.value } }
                        })}
                        className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        disabled={!hours.enabled}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-iceBlue/30 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-oceanBlue" />
                    <span className="font-medium text-deepNavy">Przerwa obiadowa</span>
                  </div>
                  <button
                    onClick={() => setWorkingHours({
                      ...workingHours,
                      breakTime: { ...workingHours.breakTime, enabled: !workingHours.breakTime.enabled }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${workingHours.breakTime.enabled ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${workingHours.breakTime.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={workingHours.breakTime.start}
                    onChange={(e) => setWorkingHours({
                      ...workingHours,
                      breakTime: { ...workingHours.breakTime, start: e.target.value }
                    })}
                    className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    disabled={!workingHours.breakTime.enabled}
                  />
                  <span className="text-marineBlue">-</span>
                  <input
                    type="time"
                    value={workingHours.breakTime.end}
                    onChange={(e) => setWorkingHours({
                      ...workingHours,
                      breakTime: { ...workingHours.breakTime, end: e.target.value }
                    })}
                    className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    disabled={!workingHours.breakTime.enabled}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Zapisz ustawienia godzin
          </button>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
