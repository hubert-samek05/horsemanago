'use client';

export const dynamic = 'force-static';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Menu, Mail as MailIcon, ChevronLeft, BellRing, Save } from 'lucide-react';

interface EmailReminderSettings {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  reminderBeforeHours: number;
  reminderBeforeDays: number;
  reminderAfterHours: number;
  reminderAfterDays: number;
  templates: {
    beforeLesson: string;
    afterLesson: string;
    beforeCompetition: string;
    afterCompetition: string;
    beforeVet: string;
    afterVet: string;
    beforeFarrier: string;
    afterFarrier: string;
  };
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [emailSettings, setEmailSettings] = useState<EmailReminderSettings>({
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'HORSEmanago',
    reminderBeforeHours: 24,
    reminderBeforeDays: 1,
    reminderAfterHours: 2,
    reminderAfterDays: 0,
    templates: {
      beforeLesson: 'Przypomnienie: Masz lekcję jazdy konnej {date} o {time}. Do zobaczenia!',
      afterLesson: 'Dziękujemy za lekcję! {clientName}',
      beforeCompetition: 'Przypomnienie: Zawody {date}. Powodzenia!',
      afterCompetition: 'Gratulacje za udział w zawodach!',
      beforeVet: 'Przypomnienie: Wizyta weterynarza {date}',
      afterVet: 'Wizyta weterynarza zakończona',
      beforeFarrier: 'Przypomnienie: Wizyta kowala {date}',
      afterFarrier: 'Wizyta kowala zakończona',
    },
  });

  const handleSaveSettings = () => {
    // TODO: Implement API call to save email settings
    console.log('Saving email settings:', emailSettings);
    alert('Ustawienia Email zapisane!');
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
          <h1 className="font-serif text-lg font-bold">Przypomnienia Email</h1>
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
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Przypomnienia Email</h1>
              <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md">
                Zarządzaj automatycznymi powiadomieniami email.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                <MailIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-deepNavy">Przypomnienia Email</h2>
                <p className="text-sm text-marineBlue">Automatyczne powiadomienia email</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-iceBlue/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <BellRing className="w-5 h-5 text-oceanBlue" />
                  <div>
                    <span className="font-medium text-deepNavy">Włącz przypomnienia Email</span>
                    <p className="text-xs text-marineBlue">Automatyczne wysyłanie powiadomień</p>
                  </div>
                </div>
                <button
                  onClick={() => setEmailSettings({ ...emailSettings, enabled: !emailSettings.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${emailSettings.enabled ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${emailSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <p className='text-sm text-marineBlue'>
                Wysyłką e-mail zajmuje się automatycznie skonfigurowana integracja — tutaj możesz edytować treści wiadomości.
              </p>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Przed lekcją</label>
                <textarea
                  value={emailSettings.templates.beforeLesson}
                  onChange={(e) => setEmailSettings({ ...emailSettings, templates: { ...emailSettings.templates, beforeLesson: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Po lekcji</label>
                <textarea
                  value={emailSettings.templates.afterLesson}
                  onChange={(e) => setEmailSettings({ ...emailSettings, templates: { ...emailSettings.templates, afterLesson: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Zapisz ustawienia Email
          </button>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
