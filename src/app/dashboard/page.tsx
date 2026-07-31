'use client';

export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import { Menu, Calendar, Zap, Users, CreditCard, Settings, CheckSquare, FileText, Plus, Bell, X, Calendar as CalendarIcon, CreditCard as CreditCardIcon, CheckSquare as CheckSquareIcon, Zap as ZapIcon, BellRing } from 'lucide-react';

const WEEKDAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'booking', title: 'Nowa rezerwacja', message: 'Anna Kowalska zarezerwowała lekcję na 15.08 o 14:00', time: '5 min temu', read: false },
    { id: 2, type: 'payment', title: 'Przypomnienie o płatności', message: 'Płatność za karnet wisi do uregulowania', time: '1 godz temu', read: false },
    { id: 3, type: 'pass', title: 'Karnet wygasa', message: 'Karnet Piotra Nowskiego wygasa za 3 dni', time: '2 godz temu', read: true },
    { id: 4, type: 'news', title: 'Nowa promocja', message: 'Zimowa promocja na karnety -20%', time: '1 dzień temu', read: true },
  ]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    setToday(new Date());
  }, []);

  if (!user) {
    return null;
  }

  const isStableOwner = user.role === 'STABLE_OWNER' || user.role === 'ADMIN';
  const isEmployee = user.role === 'INSTRUCTOR' || user.role === 'STABLE_WORKER';
  const dateLabel = today
    ? `${WEEKDAYS[today.getDay()]}, ${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}`
    : '';

  const getRoleLabel = () => {
    if (isStableOwner) return 'Właściciel';
    if (isEmployee) return user.role === 'INSTRUCTOR' ? 'Instruktor' : 'Pracownik';
    return 'Klient';
  };

  const getPanelLabel = () => {
    if (isStableOwner) return 'Panel zarządzania stajnią';
    if (isEmployee) return 'Panel pracownika';
    return 'Panel klienta';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="lg:ml-72 min-h-screen pb-24 lg:pb-0">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-iceBlue">
          <div className="lg:hidden bg-gradient-to-r from-deepNavy to-oceanBlue text-white px-4 py-3 flex items-center justify-between">
            <Image
              src="/zdj/horsemanagologo3"
              alt="HORSEmanago"
              width={120}
              height={120}
              className="rounded-lg"
            />
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Otwórz menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="hidden lg:flex items-center justify-between px-8 py-3">
            <div className="flex items-center gap-2 text-sm text-marineBlue">
              <span className="font-serif font-semibold text-deepNavy">Dashboard</span>
              <span className="text-mistBlue">/</span>
              <span>{getPanelLabel()}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-deepNavy" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-iceBlue z-50">
                    <div className="p-4 border-b border-iceBlue flex items-center justify-between">
                      <h3 className="font-semibold text-deepNavy">Powiadomienia</h3>
                      <button
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                        className="text-xs text-oceanBlue hover:underline"
                      >
                        Oznacz wszystkie jako przeczytane
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-marineBlue">
                          Brak powiadomień
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const Icon = notification.type === 'booking' ? CalendarIcon :
                                       notification.type === 'payment' ? CreditCardIcon :
                                       notification.type === 'pass' ? CheckSquareIcon :
                                       notification.type === 'news' ? ZapIcon :
                                       BellRing;
                          return (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-iceBlue hover:bg-iceBlue/30 cursor-pointer transition-colors ${!notification.read ? 'bg-arcticBlue/30' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  notification.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                                  notification.type === 'payment' ? 'bg-green-100 text-green-600' :
                                  notification.type === 'pass' ? 'bg-yellow-100 text-yellow-600' :
                                  notification.type === 'news' ? 'bg-purple-100 text-purple-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-deepNavy text-sm">{notification.title}</span>
                                    {!notification.read && <span className="w-2 h-2 bg-oceanBlue rounded-full" />}
                                  </div>
                                  <p className="text-xs text-marineBlue mt-1">{notification.message}</p>
                                  <span className="text-xs text-marineBlue/60 mt-1">{notification.time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-3 border-t border-iceBlue">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="w-full text-center text-sm text-oceanBlue hover:underline"
                      >
                        Zamknij
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-marineBlue/70">{dateLabel}</span>
              <span className="px-3 py-1 rounded-full bg-arcticBlue border border-iceBlue text-deepNavy font-medium">
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-6 lg:py-10 space-y-8">
          <DashboardMasthead
            firstName={user.firstName}
            isStableOwner={isStableOwner}
            isEmployee={isEmployee}
            stats={
              isStableOwner
                ? [
                    { label: 'Klienci', value: '0' },
                    { label: 'Konie', value: '0' },
                    { label: 'Jazdy / tydz.', value: '0' },
                    { label: 'Przychód', value: '0' },
                  ]
                : isEmployee
                ? [
                    { label: 'Lekcje dzisiaj', value: '0' },
                    { label: 'Konie', value: '0' },
                    { label: 'Godziny', value: '0' },
                  ]
                : [
                    { label: 'Nadchodzące', value: '0' },
                    { label: 'W tym miesiącu', value: '0' },
                    { label: 'Karnet', value: '0' },
                  ]
            }
          />

          {/* Mobile Quick Access Grid */}
          <div className="lg:hidden">
            <MobileQuickGrid isStableOwner={isStableOwner} isEmployee={isEmployee} />
          </div>

          {isStableOwner ? <StableOwnerDashboard /> : isEmployee ? <EmployeeDashboard /> : <ClientDashboard />}
        </main>
      </div>

      <MobileNav user={user} />
    </div>
  );
}

function DashboardMasthead({ firstName, isStableOwner, isEmployee, stats }: any) {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3">
            {isStableOwner ? 'Zarządzanie stajnią' : isEmployee ? 'Panel pracownika' : 'Twój panel'}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Witaj, {firstName}
          </h1>
          <p className="text-white/75 text-sm sm:text-base mt-3 max-w-md">
            {isStableOwner
              ? 'Podsumowanie dnia, rezerwacji i kondycji stajni w jednym miejscu.'
              : isEmployee
              ? 'Twoje lekcje, konie i zadania zebrane w jednym miejscu.'
              : 'Twoje rezerwacje, konie i karnety zebrane w jednym miejscu.'}
          </p>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-white/15 bg-black/10">
          <div className="grid grid-cols-2 h-full">
            {stats.map((stat: any, index: number) => (
              <div
                key={stat.label}
                className={`p-5 sm:p-6 flex flex-col justify-center ${
                  index % 2 === 0 ? 'border-r border-white/10' : ''
                } ${index < stats.length - 2 ? 'border-b border-white/10' : ''}`}
              >
                <p className="font-serif text-2xl sm:text-3xl font-bold">{stat.value}</p>
                <p className="text-white/70 text-xs uppercase tracking-wide mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileQuickGrid({ isStableOwner, isEmployee }: any) {
  const ownerItems = [
    { icon: Calendar, label: 'Grafik', href: '/dashboard/calendar' },
    { icon: Users, label: 'Klienci', href: '/dashboard/clients' },
    { icon: Zap, label: 'Konie', href: '/dashboard/horses' },
    { icon: CreditCard, label: 'Płatności', href: '/dashboard/ride-payments' },
    { icon: CheckSquare, label: 'Karnety', href: '/dashboard/passes' },
    { icon: FileText, label: 'Formularze', href: '/dashboard/forms' },
  ];

  const employeeItems = [
    { icon: Calendar, label: 'Grafik', href: '/dashboard/calendar' },
    { icon: Zap, label: 'Konie', href: '/dashboard/horses' },
    { icon: Users, label: 'Klienci', href: '/dashboard/clients' },
    { icon: CheckSquare, label: 'Karnety', href: '/dashboard/passes' },
  ];

  const clientItems = [
    { icon: Calendar, label: 'Grafik', href: '/dashboard/calendar' },
    { icon: Zap, label: 'Konie', href: '/dashboard/horses' },
    { icon: CreditCard, label: 'Karnety', href: '/dashboard/passes' },
    { icon: Plus, label: 'Rezerwuj', href: '/dashboard/bookings/new' },
  ];

  const items = isStableOwner ? ownerItems : isEmployee ? employeeItems : clientItems;

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Link
            key={index}
            href={item.href}
            className="bg-white rounded-3xl p-5 shadow-lg border border-iceBlue hover:shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center text-center"
          >
            <Icon className="w-8 h-8 mb-3 text-marineBlue/70" />
            <p className="font-serif text-sm font-medium text-deepNavy">{item.label}</p>
          </Link>
        );
      })}
    </div>
  );
}

function SectionHeading({ eyebrow, title }: any) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h3 className="font-serif text-xl lg:text-2xl font-bold text-deepNavy">{title}</h3>
      {eyebrow && <span className="text-xs uppercase tracking-wide text-marineBlue/60">{eyebrow}</span>}
    </div>
  );
}

function StableOwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, rides: 0, clients: 0, horses: 0 });
  const [schedule, setSchedule] = useState<Array<{ time: string; title: string; subtitle: string; type: string }>>([]);

  useEffect(() => {
    // TODO: Fetch real data from API
    // For now, show empty state
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-marineBlue">Ładowanie danych...</div>;
  }

  return (
    <div className="space-y-8">
      <FeatureBento
        feature={{ title: 'Przychód', value: '0', subtitle: 'PLN w tym miesiącu', delta: 'Brak danych', rows: [
          { label: 'Jazdy indywidualne', value: '0' },
          { label: 'Karnety i pakiety', value: '0' },
          { label: 'Pensjonat', value: '0' },
        ] }}
        tiles={[
          { title: 'Klienci', value: stats.clients.toString(), subtitle: '0 w tym tygodniu', tone: 'steel' },
          { title: 'Konie', value: stats.horses.toString(), subtitle: '0 nowych przyjęć', tone: 'mist' },
          { title: 'Jazdy / tydz.', value: stats.rides.toString(), subtitle: 'Brak danych', tone: 'slate' },
          { title: 'Obciążenie koni', value: '0%', subtitle: 'Brak danych', tone: 'ice' },
          { title: 'Pakiet SMS', value: '0', subtitle: 'Brak danych', tone: 'bluegray' },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ScheduleRail title="Dzisiejszy harmonogram" eyebrow="Plan dnia" events={schedule} />
        </div>
        <NotificationList
          title="Powiadomienia"
          eyebrow="Wymaga uwagi"
          alerts={[]}
        />
      </div>

      <BookingKanban
        title="Rezerwacje w toku"
        eyebrow="Kanban"
        columns={[
          { title: 'Nowe', tone: 'steel', items: [] },
          { title: 'Potwierdzone', tone: 'slate', items: [] },
          { title: 'Do rozliczenia', tone: 'deep', items: [] },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        <div className="space-y-5">
          <ActivityFeed
            title="Aktywność"
            eyebrow="Na żywo"
            items={[]}
          />
          <RideCarousel
            title="Popularne rodzaje jazd"
            eyebrow="Ostatnie 30 dni"
            items={[]}
          />
        </div>

        <div className="space-y-5">
          <ChecklistCard
            title="Dzisiaj do zrobienia"
            items={[]}
          />
          <InfoAccordion
            title="Szybkie kontrole"
            sections={[
              { label: 'Stajnia', content: 'Weryfikacja czystości boksów i harmonogramu karmienia.' },
              { label: 'Personel', content: 'Sprawdzenie dostępności instruktorów na weekend.' },
              { label: 'Sprzęt', content: 'Kontrola siodeł i przygotowanie listy serwisowej.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ ridesRemaining: 0, ridesUsed: 0, upcoming: 0, horses: 0 });
  const [schedule, setSchedule] = useState<Array<{ time: string; title: string; subtitle: string; type: string }>>([]);
  const [horses, setHorses] = useState<Array<{ name: string; breed: string; status: string; note: string }>>([]);

  useEffect(() => {
    // TODO: Fetch real data from API
    // For now, show empty state
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-marineBlue">Ładowanie danych...</div>;
  }

  return (
    <div className="space-y-8">
      <FeatureBento
        feature={{ title: 'Karnet', value: stats.ridesRemaining.toString(), subtitle: 'jazdy pozostały', delta: 'Brak danych', rows: [
          { label: 'Wykorzystane w tym miesiącu', value: stats.ridesUsed.toString() },
          { label: 'Rezerwacje nadchodzące', value: stats.upcoming.toString() },
        ] }}
        tiles={[
          { title: 'Nadchodzące', value: stats.upcoming.toString(), subtitle: 'Brak danych', tone: 'steel' },
          { title: 'W tym miesiącu', value: stats.ridesUsed.toString(), subtitle: 'zrealizowanych jazd', tone: 'mist' },
          { title: 'Moje konie', value: stats.horses.toString(), subtitle: 'przypisane profile', tone: 'slate' },
        ]}
      />

      <QuickAccessStrip
        actions={[
          { title: 'Zarezerwuj', subtitle: 'Nowa jazda', href: '/dashboard/bookings/new', tone: 'deep' },
          { title: 'Kalendarz', subtitle: 'Moje rezerwacje', href: '/dashboard/calendar', tone: 'steel' },
          { title: 'Karnety', subtitle: 'Kup nowy', href: '/dashboard/subscriptions', tone: 'slate' },
          { title: 'Konie', subtitle: 'Moje konie', href: '/dashboard/horses', tone: 'mist' },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <ScheduleRail
          title="Nadchodzące rezerwacje"
          eyebrow="Twój plan"
          events={schedule}
        />
        <HorseMasonry
          title="Moje konie"
          horses={horses.length > 0 ? horses : [{ name: 'Brak koni', breed: '-', status: '-', note: 'Brak przypisanych koni' }]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        <div className="space-y-5">
          <ActivityFeed
            title="Powiadomienia"
            eyebrow="Ostatnie"
            items={[]}
          />
          <RideCarousel
            title="Twoje najczęstsze aktywności"
            eyebrow="Ostatnie 30 dni"
            items={[]}
          />
        </div>

        <div className="space-y-5">
          <ChecklistCard
            title="Na ten tydzień"
            items={[]}
          />
          <InfoAccordion
            title="Szybka pomoc"
            sections={[
              { label: 'Zmiana terminu', content: 'Wybierz rezerwację i użyj opcji „Przełóż”.' },
              { label: 'Płatności', content: 'Wszystkie płatności znajdziesz w zakładce Karnety.' },
              { label: 'Kontakt ze stajnią', content: 'Skorzystaj z wiadomości w profilu rezerwacji.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ lessonsToday: 0, lessonsCompleted: 0, hoursWorked: 0, horsesAssigned: 0 });
  const [schedule, setSchedule] = useState<Array<{ time: string; title: string; subtitle: string; type: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ type: string; text: string; meta: string }>>([]);
  const [horses, setHorses] = useState<Array<{ name: string; breed: string; status: string; note: string }>>([]);

  useEffect(() => {
    // TODO: Fetch real data from API
    // For now, show empty state
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-marineBlue">Ładowanie danych...</div>;
  }

  return (
    <div className="space-y-8">
      <FeatureBento
        feature={{ title: 'Lekcje', value: stats.lessonsToday.toString(), subtitle: 'zaplanowane dzisiaj', delta: `${stats.lessonsCompleted} zakończone`, rows: [
          { label: 'Godziny pracy', value: stats.hoursWorked.toString() },
          { label: 'Konie przydzielone', value: stats.horsesAssigned.toString() },
        ] }}
        tiles={[
          { title: 'Konie', value: horses.length.toString(), subtitle: 'pod Twoją opieką', tone: 'steel' },
          { title: 'Klienci', value: '0', subtitle: 'aktywnych', tone: 'mist' },
          { title: 'Godziny', value: stats.hoursWorked.toString(), subtitle: 'w tym tygodniu', tone: 'slate' },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ScheduleRail title="Dzisiejszy harmonogram" eyebrow="Plan dnia" events={schedule} />
        </div>
        <NotificationList
          title="Powiadomienia"
          eyebrow="Wymaga uwagi"
          alerts={notifications.length > 0 ? notifications : [{ type: 'info', text: 'Brak powiadomień', meta: '' }]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        <div className="space-y-5">
          <ActivityFeed
            title="Aktywność"
            eyebrow="Na żywo"
            items={[]}
          />
          <HorseMasonry
            title="Konie pod opieką"
            horses={horses.length > 0 ? horses : [{ name: 'Brak koni', breed: '-', status: '-', note: 'Brak przypisanych koni' }]}
          />
        </div>

        <div className="space-y-5">
          <ChecklistCard
            title="Dzisiaj do zrobienia"
            items={[]}
          />
          <InfoAccordion
            title="Szybkie kontrole"
            sections={[
              { label: 'Konie', content: 'Sprawdź stan zdrowia i przygotowanie do lekcji.' },
              { label: 'Sprzęt', content: 'Weryfikacja siodeł i uprzęży przed lekcjami.' },
              { label: 'Klienci', content: 'Przypomnienia o nadchodzących rezerwacjach.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

const TONE_STYLES: Record<string, string> = {
  deep: 'bg-deepNavy text-white',
  midnight: 'bg-midnightBlue text-white',
  ocean: 'bg-oceanBlue text-white',
  marine: 'bg-marineBlue text-white',
  steel: 'bg-steelBlue text-white',
  slate: 'bg-slateBlue text-white',
  bluegray: 'bg-blueGray text-white',
  mist: 'bg-mistBlue text-deepNavy',
  ice: 'bg-iceBlue text-deepNavy',
  arctic: 'bg-arcticBlue text-deepNavy',
};

function FeatureBento({ feature, tiles }: any) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[130px]">
      <div className="col-span-2 lg:col-span-2 lg:row-span-2 rounded-2xl bg-deepNavy text-white p-5 lg:p-7 flex flex-col justify-between">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wide">{feature.subtitle}</p>
          <p className="font-serif text-4xl lg:text-5xl font-bold mt-1">{feature.value}</p>
          <p className="font-serif text-base text-white/80 mt-1">{feature.title}</p>
          <p className="text-xs text-white/50 mt-2">{feature.delta}</p>
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
          {feature.rows.map((row: any) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-white/60">{row.label}</span>
              <span className="font-serif font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {tiles.map((tile: any, index: number) => (
        <div
          key={tile.title}
          className={`col-span-1 rounded-2xl p-4 lg:p-5 flex flex-col justify-center ${TONE_STYLES[tile.tone] || TONE_STYLES.steel} ${index === 0 ? 'lg:col-span-2' : ''}`}
        >
          <p className="font-serif text-2xl lg:text-3xl font-bold">{tile.value}</p>
          <p className="text-sm font-serif opacity-90 mt-1">{tile.title}</p>
          <p className="text-xs opacity-60 mt-1">{tile.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

function ScheduleRail({ title, eyebrow, events }: any) {
  const typeTone: Record<string, string> = {
    lesson: 'border-oceanBlue text-oceanBlue',
    training: 'border-marineBlue text-marineBlue',
    veterinary: 'border-deepNavy text-deepNavy',
  };

  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue h-full">
      <SectionHeading title={title} eyebrow={eyebrow} />

      <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden -mx-1 px-1">
        {events.map((event: any, index: number) => (
          <div key={index} className={`flex-shrink-0 w-48 rounded-xl border-l-4 ${typeTone[event.type] || typeTone.lesson} bg-arcticBlue/40 p-4`}>
            <p className="font-serif text-sm font-semibold text-deepNavy">{event.time}</p>
            <p className="font-serif text-sm text-deepNavy mt-1">{event.title}</p>
            <p className="text-xs text-marineBlue/70 mt-1">{event.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="hidden sm:block space-y-0">
        {events.map((event: any, index: number) => (
          <div key={index} className="flex gap-4 py-3 border-b border-iceBlue last:border-b-0">
            <div className="w-20 shrink-0 font-serif text-sm text-marineBlue pt-0.5">{event.time}</div>
            <div className={`w-0.5 shrink-0 rounded-full ${typeTone[event.type]?.replace('text-', 'bg-') || 'bg-oceanBlue'}`} />
            <div className="flex-1 pl-2">
              <p className="font-serif text-base font-semibold text-deepNavy">{event.title}</p>
              <p className="text-sm text-marineBlue/70">{event.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationList({ title, eyebrow, alerts }: any) {
  const typeTone: Record<string, string> = {
    warning: 'border-amber-400 bg-amber-50',
    info: 'border-oceanBlue bg-arcticBlue/50',
    success: 'border-emerald-400 bg-emerald-50',
  };

  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue h-full">
      <SectionHeading title={title} eyebrow={eyebrow} />
      <div className="space-y-2.5">
        {alerts.map((alert: any, index: number) => (
          <div key={index} className={`border-l-4 rounded-r-xl p-3 ${typeTone[alert.type] || typeTone.info}`}>
            <p className="font-serif text-sm text-deepNavy">{alert.text}</p>
            <p className="text-xs text-marineBlue/60 mt-0.5">{alert.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingKanban({ title, eyebrow, columns }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue">
      <SectionHeading title={title} eyebrow={eyebrow} />
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {columns.map((column: any, index: number) => (
          <div key={index} className="flex-shrink-0 w-64 lg:w-auto rounded-xl border border-iceBlue bg-arcticBlue/30 p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${TONE_STYLES[column.tone]?.split(' ')[0] || 'bg-oceanBlue'}`} />
              <p className="font-serif text-sm font-semibold text-marineBlue">{column.title}</p>
              <span className="text-xs text-marineBlue/50 ml-auto">{column.items.length}</span>
            </div>
            <div className="space-y-2">
              {column.items.map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="rounded-lg bg-white border border-iceBlue p-3">
                  <p className="font-serif text-sm text-deepNavy">{item.name}</p>
                  <p className="text-xs text-marineBlue/60 mt-0.5">{item.meta}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ title, eyebrow, items }: any) {
  const tones = ['steel', 'slate', 'bluegray', 'mist'];

  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue">
      <SectionHeading title={title} eyebrow={eyebrow} />
      <div className="space-y-3">
        {items.map((item: any, index: number) => {
          const tone = tones[index % tones.length];
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm font-semibold ${TONE_STYLES[tone]}`}>
                {item.text.charAt(0)}
              </div>
              <div className="flex-1 pt-0.5 pb-3 border-b border-iceBlue last:border-b-0">
                <p className="font-serif text-sm text-deepNavy">{item.text}</p>
                <p className="text-xs text-marineBlue/60 mt-0.5">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RideCarousel({ title, eyebrow, items }: any) {
  const maxCount = Math.max(...items.map((item: any) => item.count));
  const trendLabel: Record<string, string> = { up: 'Wzrost', down: 'Spadek', stable: 'Stabilny' };
  const trendTone: Record<string, string> = { up: 'text-emerald-600', down: 'text-red-500', stable: 'text-marineBlue/60' };

  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue">
      <SectionHeading title={title} eyebrow={eyebrow} />
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex-shrink-0 w-40 snap-start rounded-xl border border-iceBlue p-4 flex flex-col justify-between">
            <div>
              <p className="font-serif text-2xl font-bold text-deepNavy">{item.count}</p>
              <p className="font-serif text-sm text-marineBlue mt-0.5">{item.name}</p>
            </div>
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-iceBlue overflow-hidden">
                <div className="h-full bg-oceanBlue rounded-full" style={{ width: `${(item.count / maxCount) * 100}%` }} />
              </div>
              <p className={`text-xs mt-2 ${trendTone[item.trend]}`}>{trendLabel[item.trend]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistCard({ title, items }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue">
      <SectionHeading title={title} />
      <ul className="space-y-2.5">
        {items.map((item: string, index: number) => (
          <li key={index} className="flex items-start gap-3 text-sm text-deepNavy">
            <span className="mt-0.5 w-4 h-4 rounded-sm border-2 border-oceanBlue/40 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoAccordion({ title, sections }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue">
      <SectionHeading title={title} />
      <div className="divide-y divide-iceBlue">
        {sections.map((section: any, index: number) => (
          <details key={index} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex items-center gap-3 cursor-pointer list-none">
              <span className="font-serif text-xs text-marineBlue/50 w-6 shrink-0">{(index + 1).toString().padStart(2, '0')}</span>
              <span className="flex-1 font-serif text-sm font-semibold text-deepNavy">{section.label}</span>
              <span className="relative w-3 h-3 shrink-0">
                <span className="absolute inset-y-1/2 inset-x-0 h-0.5 bg-marineBlue/60" />
                <span className="absolute inset-x-1/2 inset-y-0 w-0.5 bg-marineBlue/60 transition-transform group-open:rotate-90" />
              </span>
            </summary>
            <p className="text-sm text-marineBlue mt-2 pl-9">{section.content}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function QuickAccessStrip({ actions }: any) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
      {actions.map((action: any, index: number) => (
        <Link key={index} href={action.href} className="flex-shrink-0 w-40 sm:w-auto">
          <div className={`rounded-2xl p-4 lg:p-5 h-full transition-transform hover:scale-[1.02] ${TONE_STYLES[action.tone] || TONE_STYLES.steel}`}>
            <p className="text-xs opacity-60 font-serif">{(index + 1).toString().padStart(2, '0')}</p>
            <h3 className="font-serif text-base lg:text-lg font-bold mt-2">{action.title}</h3>
            <p className="text-sm opacity-80 mt-1">{action.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function HorseMasonry({ title, horses }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-iceBlue">
      <SectionHeading title={title} />
      <div className="columns-1 sm:columns-2 gap-4">
        {horses.map((horse: any, index: number) => (
          <div
            key={index}
            className={`break-inside-avoid mb-4 rounded-xl border border-iceBlue p-4 ${index % 2 === 0 ? 'bg-arcticBlue/40' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif text-base font-semibold text-deepNavy">{horse.name}</h4>
              <span className="text-xs px-3 py-1 bg-oceanBlue/10 text-oceanBlue rounded-full font-medium">{horse.status}</span>
            </div>
            <p className="text-sm text-marineBlue">{horse.breed}</p>
            <p className="text-xs text-marineBlue/60 mt-2">{horse.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
