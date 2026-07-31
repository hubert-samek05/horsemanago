'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, QrCode, Copy, Download, Share2, MapPin, Phone, Mail, Globe, Clock, Building2, Edit2, X, Save, Bell, MessageSquare, Lock, User, Settings as SettingsIcon, Shield, Key, BellRing, Mail as MailIcon, Smartphone, Check, ChevronRight, AlertCircle, Info, Zap, Database, Palette, Moon, Sun, Globe as World, Server, Wifi, RefreshCw, Upload, FileText, Trash2, Plus, Minus, ExternalLink, Calendar, CreditCard, CheckSquare } from 'lucide-react';

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
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'sms' | 'email' | 'hours' | 'account' | 'security' | 'app'>('account');

  const isStableOwner = user?.role === 'STABLE_OWNER' || user?.role === 'ADMIN';
  const isEmployee = user?.role === 'INSTRUCTOR' || user?.role === 'STABLE_WORKER';

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

        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Ustawienia</h1>
              <p className="text-marineBlue">Zarządzaj konfiguracją ośrodka</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportSettings}
                className="px-4 py-2 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Eksportuj
              </button>
              <label className="px-4 py-2 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Importuj
                <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4 sticky top-4">
                <nav className="space-y-1">
                  {isStableOwner && (
                    <>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === 'profile'
                            ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                            : 'text-deepNavy hover:bg-iceBlue'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium">Profil ośrodka</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('sms')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === 'sms'
                            ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                            : 'text-deepNavy hover:bg-iceBlue'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="font-medium">Przypomnienia SMS</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('email')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === 'email'
                            ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                            : 'text-deepNavy hover:bg-iceBlue'
                        }`}
                      >
                        <MailIcon className="w-5 h-5" />
                        <span className="font-medium">Przypomnienia Email</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('hours')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === 'hours'
                            ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                            : 'text-deepNavy hover:bg-iceBlue'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Godziny pracy</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === 'account'
                        ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                        : 'text-deepNavy hover:bg-iceBlue'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Konto</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === 'security'
                        ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                        : 'text-deepNavy hover:bg-iceBlue'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Bezpieczeństwo</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('app')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === 'app'
                        ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                        : 'text-deepNavy hover:bg-iceBlue'
                    }`}
                  >
                    <SettingsIcon className="w-5 h-5" />
                    <span className="font-medium">Aplikacja</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && isStableOwner && (
                <div className="space-y-6">
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
                      <button
                        onClick={handleEdit}
                        className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
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
                        onClick={() => setShowQRModal(true)}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-5 h-5" />
                        Pokaż kod QR
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

                  <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
                    <div className="flex items-center gap-3 mb-4">
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
                        <ExternalLink className="w-4 h-4" />
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

                  <button
                    onClick={() => handleSaveSettings('profile')}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz ustawienia profilu
                  </button>
                </div>
              )}

              {/* SMS Tab */}
              {activeTab === 'sms' && isStableOwner && (
                <div className="space-y-6">
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
                            placeholder="Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}"
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
                            placeholder="Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Karnet się kończy</label>
                          <textarea
                            value={smsSettings.templates.passExpiring}
                            onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, passExpiring: e.target.value } })}
                            className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                            rows={3}
                            placeholder="Dostępne zmienne: {'{days}'}, {'{passName}'}, {'{clientName}'}"
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
                            placeholder="Dostępne zmienne: {'{amount}'}, {'{dueDate}'}, {'{clientName}'}"
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
                            placeholder="Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}"
                          />
                          <p className="text-xs text-marineBlue mt-1">Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Rezerwacja anulowana</label>
                          <textarea
                            value={smsSettings.templates.bookingCancelled}
                            onChange={(e) => setSmsSettings({ ...smsSettings, templates: { ...smsSettings.templates, bookingCancelled: e.target.value } })}
                            className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                            rows={3}
                            placeholder="Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}, {'{reason}'}"
                          />
                          <p className="text-xs text-marineBlue mt-1">Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}, {'{reason}'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('sms')}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz ustawienia SMS
                  </button>
                </div>
              )}

              {/* Email Tab */}
              {activeTab === 'email' && isStableOwner && (
                <div className="space-y-6">
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
                          placeholder="Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Szablon - Po lekcji</label>
                        <textarea
                          value={emailSettings.templates.afterLesson}
                          onChange={(e) => setEmailSettings({ ...emailSettings, templates: { ...emailSettings.templates, afterLesson: e.target.value } })}
                          className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                          rows={3}
                          placeholder="Dostępne zmienne: {'{date}'}, {'{time}'}, {'{clientName}'}"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('email')}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz ustawienia Email
                  </button>
                </div>
              )}

              {/* Working Hours Tab */}
              {activeTab === 'hours' && isStableOwner && (
                <div className="space-y-6">
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
                    onClick={() => handleSaveSettings('hours')}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz godziny pracy
                  </button>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
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

                      {accountSettings.twoFactorEnabled && (
                        <div>
                          <label className="block text-sm font-medium text-deepNavy mb-2">Metoda uwierzytelniania</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setAccountSettings({ ...accountSettings, twoFactorMethod: 'sms' })}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                accountSettings.twoFactorMethod === 'sms'
                                  ? 'border-oceanBlue bg-oceanBlue/10'
                                  : 'border-iceBlue hover:border-oceanBlue'
                              }`}
                            >
                              <Smartphone className="w-5 h-5 mx-auto mb-1 text-oceanBlue" />
                              <span className="text-xs font-medium text-deepNavy">SMS</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountSettings({ ...accountSettings, twoFactorMethod: 'email' })}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                accountSettings.twoFactorMethod === 'email'
                                  ? 'border-oceanBlue bg-oceanBlue/10'
                                  : 'border-iceBlue hover:border-oceanBlue'
                              }`}
                            >
                              <MailIcon className="w-5 h-5 mx-auto mb-1 text-oceanBlue" />
                              <span className="text-xs font-medium text-deepNavy">Email</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountSettings({ ...accountSettings, twoFactorMethod: 'app' })}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                accountSettings.twoFactorMethod === 'app'
                                  ? 'border-oceanBlue bg-oceanBlue/10'
                                  : 'border-iceBlue hover:border-oceanBlue'
                              }`}
                            >
                              <Key className="w-5 h-5 mx-auto mb-1 text-oceanBlue" />
                              <span className="text-xs font-medium text-deepNavy">Aplikacja</span>
                            </button>
                          </div>
                          {accountSettings.twoFactorMethod === 'sms' && (
                            <p className="text-xs text-marineBlue mt-2">Kod weryfikacyjny zostanie wysłany SMS na numer telefonu</p>
                          )}
                          {accountSettings.twoFactorMethod === 'email' && (
                            <p className="text-xs text-marineBlue mt-2">Kod weryfikacyjny zostanie wysłany na adres email</p>
                          )}
                          {accountSettings.twoFactorMethod === 'app' && (
                            <p className="text-xs text-marineBlue mt-2">Użyj aplikacji autoryzacyjnej (Google Authenticator, Authy, itp.)</p>
                          )}
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold text-deepNavy mb-3">Preferencje powiadomień</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                            <div className="flex items-center gap-3">
                              <MailIcon className="w-5 h-5 text-oceanBlue" />
                              <span className="font-medium text-deepNavy">Powiadomienia email</span>
                            </div>
                            <button
                              onClick={() => setAccountSettings({
                                ...accountSettings,
                                notificationPreferences: { ...accountSettings.notificationPreferences, email: !accountSettings.notificationPreferences.email }
                              })}
                              className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.email ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.email ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                            <div className="flex items-center gap-3">
                              <Smartphone className="w-5 h-5 text-oceanBlue" />
                              <span className="font-medium text-deepNavy">Powiadomienia SMS</span>
                            </div>
                            <button
                              onClick={() => setAccountSettings({
                                ...accountSettings,
                                notificationPreferences: { ...accountSettings.notificationPreferences, sms: !accountSettings.notificationPreferences.sms }
                              })}
                              className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.sms ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.sms ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                            <div className="flex items-center gap-3">
                              <Bell className="w-5 h-5 text-oceanBlue" />
                              <span className="font-medium text-deepNavy">Powiadomienia push</span>
                            </div>
                            <button
                              onClick={() => setAccountSettings({
                                ...accountSettings,
                                notificationPreferences: { ...accountSettings.notificationPreferences, push: !accountSettings.notificationPreferences.push }
                              })}
                              className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.push ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.push ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                  {accountSettings.notificationPreferences.push && (
                    <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <BellRing className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="font-serif text-xl font-bold text-deepNavy">Konfiguracja powiadomień push</h2>
                          <p className="text-sm text-marineBlue">Wybierz jakie powiadomienia chcesz otrzymywać</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-oceanBlue" />
                            <div>
                              <span className="font-medium text-deepNavy">Rezerwacje</span>
                              <p className="text-xs text-marineBlue">Nowe rezerwacje, zmiany, anulowania</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAccountSettings({
                              ...accountSettings,
                              notificationPreferences: {
                                ...accountSettings.notificationPreferences,
                                pushTopics: {
                                  ...accountSettings.notificationPreferences.pushTopics,
                                  bookings: !accountSettings.notificationPreferences.pushTopics.bookings
                                }
                              }
                            })}
                            className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.pushTopics.bookings ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.pushTopics.bookings ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-oceanBlue" />
                            <div>
                              <span className="font-medium text-deepNavy">Płatności</span>
                              <p className="text-xs text-marineBlue">Przypomnienia o płatnościach, potwierdzenia</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAccountSettings({
                              ...accountSettings,
                              notificationPreferences: {
                                ...accountSettings.notificationPreferences,
                                pushTopics: {
                                  ...accountSettings.notificationPreferences.pushTopics,
                                  payments: !accountSettings.notificationPreferences.pushTopics.payments
                                }
                              }
                            })}
                            className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.pushTopics.payments ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.pushTopics.payments ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <CheckSquare className="w-5 h-5 text-oceanBlue" />
                            <div>
                              <span className="font-medium text-deepNavy">Karnety</span>
                              <p className="text-xs text-marineBlue">Przypomnienia o wygasających karnetach</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAccountSettings({
                              ...accountSettings,
                              notificationPreferences: {
                                ...accountSettings.notificationPreferences,
                                pushTopics: {
                                  ...accountSettings.notificationPreferences.pushTopics,
                                  passes: !accountSettings.notificationPreferences.pushTopics.passes
                                }
                              }
                            })}
                            className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.pushTopics.passes ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.pushTopics.passes ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-oceanBlue" />
                            <div>
                              <span className="font-medium text-deepNavy">Aktualności</span>
                              <p className="text-xs text-marineBlue">Nowości, promocje, wydarzenia</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAccountSettings({
                              ...accountSettings,
                              notificationPreferences: {
                                ...accountSettings.notificationPreferences,
                                pushTopics: {
                                  ...accountSettings.notificationPreferences.pushTopics,
                                  news: !accountSettings.notificationPreferences.pushTopics.news
                                }
                              }
                            })}
                            className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.pushTopics.news ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.pushTopics.news ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-iceBlue/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <BellRing className="w-5 h-5 text-oceanBlue" />
                            <div>
                              <span className="font-medium text-deepNavy">Przypomnienia</span>
                              <p className="text-xs text-marineBlue">Przypomnienia o lekcjach, wizytach</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAccountSettings({
                              ...accountSettings,
                              notificationPreferences: {
                                ...accountSettings.notificationPreferences,
                                pushTopics: {
                                  ...accountSettings.notificationPreferences.pushTopics,
                                  reminders: !accountSettings.notificationPreferences.pushTopics.reminders
                                }
                              }
                            })}
                            className={`w-12 h-6 rounded-full transition-colors ${accountSettings.notificationPreferences.pushTopics.reminders ? 'bg-oceanBlue' : 'bg-iceBlue'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${accountSettings.notificationPreferences.pushTopics.reminders ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('account')}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz ustawienia konta
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl font-bold text-deepNavy">Bezpieczeństwo</h2>
                        <p className="text-sm text-marineBlue">Zmień hasło i ustawienia bezpieczeństwa</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Aktualne hasło</label>
                        <input
                          type="password"
                          value={securitySettings.currentPassword}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Nowe hasło</label>
                        <input
                          type="password"
                          value={securitySettings.newPassword}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Potwierdź nowe hasło</label>
                        <input
                          type="password"
                          value={securitySettings.confirmPassword}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                      </div>

                      <div className="p-4 bg-iceBlue/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-oceanBlue mt-0.5" />
                          <div>
                            <p className="text-sm text-deepNavy font-medium">Wymagania hasła:</p>
                            <ul className="text-xs text-marineBlue mt-1 space-y-1">
                              <li>• Minimum 8 znaków</li>
                              <li>• Co najmniej jedna wielka litera</li>
                              <li>• Co najmniej jedna cyfra</li>
                              <li>• Co najmniej jeden znak specjalny</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (securitySettings.newPassword !== securitySettings.confirmPassword) {
                        alert('Hasła nie są zgodne!');
                        return;
                      }
                      handleSaveSettings('security');
                      setSecuritySettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zmień hasło
                  </button>
                </div>
              )}

              {/* App Tab */}
              {activeTab === 'app' && (
                <div className="space-y-6">
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
                    onClick={() => handleSaveSettings('app')}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz ustawienia aplikacji
                  </button>
                </div>
              )}
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
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
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

                <div className="grid grid-cols-2 gap-4">
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

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Kod QR wizytówki</h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="bg-iceBlue/30 rounded-xl p-6 mb-6 flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Kod QR wizytówki"
                    className="w-64 h-64 bg-white rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <QrCode className="w-56 h-56 text-deepNavy" />
                  </div>
                )}
              </div>

              <p className="text-sm text-marineBlue text-center mb-6">
                Zeskanuj kod, aby przejść do wizytówki ośrodka
              </p>

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
          </div>
        </div>
      )}

      <MobileNav user={user} />
    </div>
  );
}
