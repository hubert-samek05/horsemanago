'use client';

export const dynamic = 'force-static';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, QrCode, Copy, Download, Share2, MapPin, Phone, Mail, Globe, Clock, Building2, Edit2, X, Save, Bell, MessageSquare, Lock, User, Settings as SettingsIcon, Shield, Key, BellRing, Mail as MailIcon, Smartphone, Check, ChevronRight, AlertCircle, Info, Zap, Database, Palette, Moon, Sun, Globe as World, Server, Wifi, RefreshCw, Upload, FileText, Trash2, Plus, Minus, ExternalLink, Calendar, CreditCard, CheckSquare, LayoutGrid } from 'lucide-react';

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
  logo?: string;
  coverImage?: string;
}

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

interface WorkingHoursSettings {
  enabled: boolean;
  timezone: string;
  hours: Record<string, { open: string; close: string; enabled: boolean }>;
  breakTime: { start: string; end: string; enabled: boolean };
  holidays: Array<{ date: string; name: string; recurring: boolean }>;
}

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

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultView: 'day' | 'week' | 'month';
  autoSave: boolean;
  compactMode: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId, activeRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'sms' | 'email' | 'hours' | 'account' | 'security' | 'app'>('account');

  const effectiveRole = activeRole || user?.role;
  const isStableOwner = effectiveRole === 'STABLE_OWNER' || effectiveRole === 'ADMIN';
  const isEmployee = effectiveRole === 'INSTRUCTOR' || effectiveRole === 'STABLE_WORKER';

  // Set default tab based on role
  useEffect(() => {
    if (isEmployee) {
      setActiveTab('account');
    } else {
      setActiveTab('profile');
    }
  }, [isEmployee]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
      beforeLesson: 'Przypomnienie: Masz zaplanowaną lekcję jazdy konnej na {date} o {time}. Nie zapomnij o odpowiednim stroju i obuwiu!',
      afterLesson: 'Dziękujemy za wizytę! Mamy nadzieję, że lekcja była udana. Zapraszamy ponownie!',
      beforeCompetition: 'Przypomnienie: Zawody {competitionName} odbędą się {date}. Powodzenia!',
      afterCompetition: 'Gratulujemy udziału w zawodach {competitionName}! Dziękujemy za udział.',
      beforeVet: 'Przypomnienie: Wizyta weterynaryjna dla {horseName} zaplanowana na {date} o {time}.',
      afterVet: 'Wizyta weterynaryjna dla {horseName} zakończona. Zalecenia: {notes}',
      beforeFarrier: 'Przypomnienie: Kowal przyjedzie {date} o {time} dla {horseName}.',
      afterFarrier: 'Kowal zakończył pracę dla {horseName}. Następna wizyta: {nextDate}',
      passExpiring: 'Przypomnienie: Twój karnet kończy się za {days} dni. Przedłuż go, aby nie stracić pozostałych przejazdów.',
      paymentReminder: 'Przypomnienie: Masz nieopłaconą rezerwację za {amount} PLN. Prosimy o uregulowanie płatności.',
      bookingConfirmed: 'Potwierdzenie: Twoja rezerwacja na {date} o {time} została potwierdzona. Do zobaczenia!',
      bookingCancelled: 'Informacja: Twoja rezerwacja na {date} o {time} została anulowana. Skontaktuj się z nami w razie pytań.',
    },
  });

  const [emailSettings, setEmailSettings] = useState<EmailReminderSettings>({
    enabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'kontakt@horsemanago.net',
    fromName: 'HORSEmanago',
    reminderBeforeHours: 24,
    reminderBeforeDays: 1,
    reminderAfterHours: 2,
    reminderAfterDays: 0,
    templates: {
      beforeLesson: 'Przypomnienie: Masz zaplanowaną lekcję jazdy konnej na {date} o {time}.',
      afterLesson: 'Dziękujemy za wizytę! Zapraszamy ponownie.',
      beforeCompetition: 'Przypomnienie: Zawody {competitionName} odbędą się {date}.',
      afterCompetition: 'Gratulujemy udziału w zawodach {competitionName}!',
      beforeVet: 'Przypomnienie: Wizyta weterynaryjna dla {horseName} zaplanowana na {date} o {time}.',
      afterVet: 'Wizyta weterynaryjna dla {horseName} zakończona.',
      beforeFarrier: 'Przypomnienie: Kowal przyjedzie {date} o {time} dla {horseName}.',
      afterFarrier: 'Kowal zakończył pracę dla {horseName}.',
    },
  });

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
    breakTime: { start: '13:00', end: '14:00', enabled: true },
    holidays: [],
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '+48 123 456 789',
    twoFactorEnabled: false,
    twoFactorMethod: 'sms',
    notificationPreferences: {
      email: true,
      sms: false,
      push: true,
      pushTopics: {
        bookings: true,
        payments: true,
        passes: true,
        news: true,
        reminders: true,
      },
    },
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'pl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    defaultView: 'week',
    autoSave: true,
    compactMode: false,
  });

  const [editForm, setEditForm] = useState<StableProfile>({ ...stableProfile });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadSettings = async () => {
      try {
        const { data } = await api.get(`/settings?stableId=${activeStableId}`);
        if (data) {
          if (data.stableProfile) setStableProfile(data.stableProfile);
          if (data.smsSettings) setSmsSettings(data.smsSettings);
          if (data.emailSettings) setEmailSettings(data.emailSettings);
          if (data.workingHours) setWorkingHours(data.workingHours);
          if (data.accountSettings) setAccountSettings(data.accountSettings);
          if (data.appSettings) setAppSettings(data.appSettings);
        }
      } catch (error) {
        console.error('Load settings error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [activeStableId]);

  const handleEdit = () => {
    setEditForm({ ...stableProfile });
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/settings/stable-profile`, { ...editForm, stableId: activeStableId });
      setStableProfile(data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Save stable profile error:', error);
      alert('Nie udało się zapisać profilu stajni');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
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

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
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

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.download = 'horsemanago-qr.png';
    link.href = qrCodeDataUrl;
    link.click();
  };

  const handleSaveSettings = async (section: string) => {
    try {
      switch (section) {
        case 'profile':
          await api.put('/settings/stable-profile', { ...stableProfile, stableId: activeStableId });
          break;
        case 'sms':
          await api.put('/settings/sms', { ...smsSettings, stableId: activeStableId });
          break;
        case 'email':
          await api.put('/settings/email', { ...emailSettings, stableId: activeStableId });
          break;
        case 'hours':
          await api.put('/settings/working-hours', { ...workingHours, stableId: activeStableId });
          break;
        case 'account':
          await api.put('/settings/account', { ...accountSettings, stableId: activeStableId });
          break;
        case 'security':
          await api.put('/settings/security', { ...securitySettings, stableId: activeStableId });
          break;
        case 'app':
          await api.put('/settings/app', { ...appSettings, stableId: activeStableId });
          break;
      }
      alert('Ustawienia zapisane!');
    } catch (error) {
      console.error('Save settings error:', error);
      alert('Nie udało się zapisać ustawień');
    }
  };

  const handleExportSettings = () => {
    const settingsData = {
      stableProfile,
      smsSettings,
      emailSettings,
      workingHours,
      accountSettings,
      appSettings,
    };
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'horsemanago-settings.json';
    link.click();
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.stableProfile) setStableProfile(data.stableProfile);
          if (data.smsSettings) setSmsSettings(data.smsSettings);
          if (data.emailSettings) setEmailSettings(data.emailSettings);
          if (data.workingHours) setWorkingHours(data.workingHours);
          if (data.accountSettings) setAccountSettings(data.accountSettings);
          if (data.appSettings) setAppSettings(data.appSettings);
          alert('Ustawienia zaimportowane!');
        } catch (error) {
          alert('Błąd importu ustawień');
        }
      };
      reader.readAsText(file);
    }
  };

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

        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-6 lg:p-10 flex flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Konfiguracja</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Ustawienia</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj konfiguracją ośrodka i preferencjami.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleExportSettings}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:bg-white/30 transition-all flex items-center justify-center"
                  title="Eksportuj ustawienia"
                >
                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <label className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:bg-white/30 transition-all flex items-center justify-center cursor-pointer" title="Importuj ustawienia">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                  <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Settings Cards Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto pb-2">
            {isStableOwner && (
              <>
                <button
                  onClick={() => router.push('/dashboard/settings/profile')}
                  className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
                >
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
                  <p className="font-semibold text-sm sm:text-base">Profil ośrodka</p>
                  <p className="text-xs mt-1 text-marineBlue">Informacje o stajni</p>
                </button>
                <button
                  onClick={() => router.push('/dashboard/settings/sms')}
                  className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
                >
                  <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
                  <p className="font-semibold text-sm sm:text-base">SMS</p>
                  <p className="text-xs mt-1 text-marineBlue">Przypomnienia</p>
                </button>
                <button
                  onClick={() => router.push('/dashboard/settings/email')}
                  className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
                >
                  <MailIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
                  <p className="font-semibold text-sm sm:text-base">Email</p>
                  <p className="text-xs mt-1 text-marineBlue">Powiadomienia</p>
                </button>
                <button
                  onClick={() => router.push('/dashboard/settings/hours')}
                  className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
                >
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
                  <p className="font-semibold text-sm sm:text-base">Godziny</p>
                  <p className="text-xs mt-1 text-marineBlue">Czas pracy</p>
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/dashboard/settings/account')}
              className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
            >
              <User className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
              <p className="font-semibold text-sm sm:text-base">Konto</p>
              <p className="text-xs mt-1 text-marineBlue">Dane osobowe</p>
            </button>
            <button
              onClick={() => router.push('/dashboard/settings/security')}
              className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
            >
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
              <p className="font-semibold text-sm sm:text-base">Bezpieczeństwo</p>
              <p className="text-xs mt-1 text-marineBlue">Hasło i 2FA</p>
            </button>
            <button
              onClick={() => router.push('/dashboard/settings/app')}
              className="p-4 sm:p-5 rounded-2xl transition-all text-left bg-white text-deepNavy hover:shadow-lg hover:scale-102 border border-iceBlue"
            >
              <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-oceanBlue" />
              <p className="font-semibold text-sm sm:text-base">Aplikacja</p>
              <p className="text-xs mt-1 text-marineBlue">Preferencje</p>
            </button>
          </div>

          {/* Main Content - Empty since all settings are now separate pages */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 text-center">
            <p className="text-marineBlue">Wybierz kategorię ustawień powyżej, aby przejść do szczegółowej konfiguracji.</p>
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
