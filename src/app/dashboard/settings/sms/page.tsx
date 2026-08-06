'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Menu, Smartphone, ChevronLeft, BellRing, Save } from 'lucide-react';

interface SMSReminderSettings {
  enabled: boolean;
  apiKey: string;
  senderName: string;
  reminderBeforeHours: number;
  reminderBeforeDays: number;
  reminderAfterHours: number;
  reminderAfterDays: number;
  notifications: {
    beforeLesson: boolean;
    afterLesson: boolean;
    beforeCompetition: boolean;
    afterCompetition: boolean;
    beforeVet: boolean;
    afterVet: boolean;
    beforeFarrier: boolean;
    afterFarrier: boolean;
    passExpiring: boolean;
    paymentReminder: boolean;
    bookingConfirmed: boolean;
    bookingCancelled: boolean;
  };
  templates: {
    beforeLesson: string;
    afterLesson: string;
    beforeCompetition: string;
    afterCompetition: string;
    beforeVet: string;
    afterVet: string;
    beforeFarrier: string;
    afterFarrier: string;
    passExpiring: string;
    paymentReminder: string;
    bookingConfirmed: string;
    bookingCancelled: string;
  };
}

export default function SMSSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [smsSettings, setSmsSettings] = useState<SMSReminderSettings>({
    enabled: false,
    apiKey: '',
    senderName: 'HORSEmanago',
    reminderBeforeHours: 24,
    reminderBeforeDays: 1,
    reminderAfterHours: 2,
    reminderAfterDays: 0,
    notifications: {
      beforeLesson: true,
      afterLesson: true,
      beforeCompetition: true,
      afterCompetition: true,
      beforeVet: true,
      afterVet: true,
      beforeFarrier: true,
      afterFarrier: true,
      passExpiring: true,
      paymentReminder: true,
      bookingConfirmed: true,
      bookingCancelled: true,
    },
    templates: {
      beforeLesson: 'Przypomnienie: Masz lekcję jazdy konnej {date} o {time}. Do zobaczenia!',
      afterLesson: 'Dziękujemy za lekcję! {clientName}',
      beforeCompetition: 'Przypomnienie: Zawody {date}. Powodzenia!',
      afterCompetition: 'Gratulacje za udział w zawodach!',
      beforeVet: 'Przypomnienie: Wizyta weterynarza {date}',
      afterVet: 'Wizyta weterynarza zakończona',
      beforeFarrier: 'Przypomnienie: Wizyta kowala {date}',
      afterFarrier: 'Wizyta kowala zakończona',
      passExpiring: 'Twój karnet {passName} kończy się za {days} dni',
      paymentReminder: 'Przypomnienie płatności: {amount} zł termin {dueDate}',
      bookingConfirmed: 'Rezerwacja potwierdzona na {date} o {time}',
      bookingCancelled: 'Rezerwacja anulowana',
    },
  });

  useEffect(() => {
    if (!activeStableId) return;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/settings/sms?stableId=${activeStableId}`);
        setSmsSettings(data);
      } catch (error) {
        console.error('Load SMS settings error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeStableId]);

  const handleSaveSettings = async () => {
    if (!activeStableId) return;
    try {
      setLoading(true);
      const { data } = await api.put('/settings/sms', { ...smsSettings, stableId: activeStableId });
      setSmsSettings(data);
      alert('Ustawienia SMS zapisane!');
    } catch (error) {
      console.error('Save SMS settings error:', error);
      alert('Błąd zapisywania ustawień SMS');
    } finally {
      setLoading(false);
    }
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
          <h1 className="font-serif text-lg font-bold">Przypomnienia SMS</h1>
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
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Przypomnienia SMS</h1>
              <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md">
                Zarządzaj automatycznymi przypomnieniami SMS.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Przypomnienia SMS</h2>
                <p className="text-sm text-marineBlue">Automatyczne powiadomienia dla klientów</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-iceBlue/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <BellRing className="w-5 h-5 text-oceanBlue" />
                  <div>
                    <span className="font-medium text-deepNavy">Włącz przypomnienia SMS</span>
                    <p className="text-xs text-marineBlue">Automatyczne wysyłanie powiadomień</p>
                  </div>
                </div>
                <button
                  onClick={() => setSmsSettings({ ...smsSettings, enabled: !smsSettings.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${smsSettings.enabled ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${smsSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <p className='text-sm text-marineBlue'>
                Wysyłką SMS zajmuje się automatycznie integracja SMSFly — tutaj możesz edytować treści wiadomości.
              </p>

              <div className="border-t border-iceBlue pt-4">
                <h3 className="font-medium text-deepNavy mb-3">Kiedy wysyłać powiadomienia SMS</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Przed lekcją</span>
                    <input
                      type="checkbox"
                      checked={smsSettings.notifications.beforeLesson}
                      onChange={(e) => setSmsSettings({ ...smsSettings, notifications: { ...smsSettings.notifications, beforeLesson: e.target.checked } })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Po lekcji</span>
                    <input
                      type="checkbox"
                      checked={smsSettings.notifications.afterLesson}
                      onChange={(e) => setSmsSettings({ ...smsSettings, notifications: { ...smsSettings.notifications, afterLesson: e.target.checked } })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Karnet się kończy</span>
                    <input
                      type="checkbox"
                      checked={smsSettings.notifications.passExpiring}
                      onChange={(e) => setSmsSettings({ ...smsSettings, notifications: { ...smsSettings.notifications, passExpiring: e.target.checked } })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Przypomnienie płatności</span>
                    <input
                      type="checkbox"
                      checked={smsSettings.notifications.paymentReminder}
                      onChange={(e) => setSmsSettings({ ...smsSettings, notifications: { ...smsSettings.notifications, paymentReminder: e.target.checked } })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Rezerwacja potwierdzona</span>
                    <input
                      type="checkbox"
                      checked={smsSettings.notifications.bookingConfirmed}
                      onChange={(e) => setSmsSettings({ ...smsSettings, notifications: { ...smsSettings.notifications, bookingConfirmed: e.target.checked } })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                    <span className="text-sm text-deepNavy">Rezerwacja anulowana</span>
                    <input
                      type="checkbox"
                      checked={smsSettings.notifications.bookingCancelled}
                      onChange={(e) => setSmsSettings({ ...smsSettings, notifications: { ...smsSettings.notifications, bookingCancelled: e.target.checked } })}
                      className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-iceBlue pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Przed lekcją</label>
                  <textarea
                    value={smsSettings.templates.beforeLesson}
                    onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, beforeLesson: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-marineBlue mt-1">Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Po lekcji</label>
                  <textarea
                    value={smsSettings.templates.afterLesson}
                    onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, afterLesson: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Karnet się kończy</label>
                  <textarea
                    value={smsSettings.templates.passExpiring}
                    onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, passExpiring: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-marineBlue mt-1">Dostępne zmienne: {'{days}'}, {'{passName}'}, {'{clientName}'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Przypomnienie płatności</label>
                  <textarea
                    value={smsSettings.templates.paymentReminder}
                    onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, paymentReminder: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-marineBlue mt-1">Dostępne zmienne: {'{amount}'}, {'{dueDate}'}, {'{clientName}'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Rezerwacja potwierdzona</label>
                  <textarea
                    value={smsSettings.templates.bookingConfirmed}
                    onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, bookingConfirmed: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Rezerwacja anulowana</label>
                  <textarea
                    value={smsSettings.templates.bookingCancelled}
                    onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, bookingCancelled: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Zapisz ustawienia SMS
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
