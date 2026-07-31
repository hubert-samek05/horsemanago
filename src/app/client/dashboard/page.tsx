'use client';

export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Star,
  Clock,
  CreditCard,
  Megaphone,
  Building2,
  LayoutDashboard,
  ChevronLeft,
  LogOut,
  Phone,
  Mail,
  X,
  Loader2,
  ChevronRight,
  Briefcase,
  Ticket,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Stable {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  services: string[];
  openingHours?: Record<string, string>;
}

interface Membership {
  id: string;
  stableId: string;
  status: 'pending' | 'accepted';
  role: string;
  stable: Stable;
}

interface Booking {
  id: string;
  startTime: string;
  endTime?: string;
  status: string;
  type?: string;
  notes?: string;
  stable?: { name: string; city: string };
  instructor?: { specializations: string[] } | null;
  horse?: { name: string } | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  method?: string;
  subscription?: { id: string; stableId: string; name?: string } | null;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface EventItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  location?: string;
  price?: number;
  maxParticipants?: number;
  spotsLeft?: number | null;
  isPublic?: boolean;
  isRegistered?: boolean;
  formTemplate?: FormField[] | null;
}

interface Subscription {
  id: string;
  stableId: string;
  name: string;
  type: string;
  ridesIncluded: number;
  ridesUsed: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  price: number;
  stable?: { name: string; slug: string };
}

const tabs = [
  { id: 'dashboard', label: 'Kokpit', icon: LayoutDashboard },
  { id: 'rezerwacje', label: 'Rezerwacje', icon: Calendar },
  { id: 'wizyty', label: 'Wizyty', icon: Clock },
  { id: 'karnety', label: 'Karnety', icon: Ticket },
  { id: 'platnosci', label: 'Płatności', icon: CreditCard },
  { id: 'aktualnosci', label: 'Aktualności', icon: Megaphone },
  { id: 'uslugi', label: 'Usługi', icon: Briefcase },
  { id: 'stajnia', label: 'Stajnia', icon: Building2 },
];

const mobileTabIds = ['dashboard', 'rezerwacje', 'karnety', 'aktualnosci', 'uslugi'];

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, activeStableId, setActiveStable, isAuthenticated, logout } = useAuthStore();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    service: '',
    notes: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/client/dashboard');
      return;
    }
    loadMemberships();
  }, [isAuthenticated, router]);

  const activeMembership = useMemo(
    () => memberships.find((m) => m.stableId === activeStableId) || memberships[0],
    [memberships, activeStableId]
  );

  useEffect(() => {
    if (!activeMembership) return;
    setActiveStable(activeMembership.stableId);
    setSelectedEvent(null);
    setFormValues({});
    loadData(activeMembership.stableId);
  }, [activeMembership?.stableId]);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/stables/my/memberships');
      setMemberships(data);
      if (!activeStableId && data.length > 0) {
        const accepted = data.find((m: Membership) => m.status === 'accepted');
        if (accepted) setActiveStable(accepted.stableId);
      }
    } catch (error) {
      setMessage('Nie udało się pobrać listy stajni.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (stableId: string) => {
    setBusy(true);
    try {
      const [bookingsRes, paymentsRes, eventsRes, subscriptionsRes] = await Promise.all([
        api.get(`/bookings?stableId=${stableId}`),
        api.get(`/payments?stableId=${stableId}`),
        api.get(`/stables/${stableId}/events`),
        api.get(`/subscriptions?stableId=${stableId}`),
      ]);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
      setEvents(eventsRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setBusy(false);
    }
  };

  const handleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveStable(id);
    setMessage('');
  };

  const handleTabChange = (tab: string) => {
    setSelectedEvent(null);
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Anulować tę rezerwację?')) return;
    try {
      await api.put(`/bookings/${id}`, { status: 'CANCELLED' });
      if (activeMembership) loadData(activeMembership.stableId);
      setMessage('Rezerwacja anulowana.');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Nie udało się anulować rezerwacji.');
    }
  };

  const handleRegisterEvent = async (eventId: string, stableId: string, details?: Record<string, any>) => {
    try {
      await api.post(`/stables/${stableId}/events/${eventId}/register`, { details });
      setMessage('Zapisano na wydarzenie.');
      setSelectedEvent(null);
      setFormValues({});
      loadData(stableId);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Nie udało się zapisać na wydarzenie.');
    }
  };

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.isActive && new Date(s.validTo) >= new Date()),
    [subscriptions]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-arcticBlue flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-oceanBlue" />
      </div>
    );
  }

  if (!activeMembership) {
    return (
      <div className="min-h-screen bg-arcticBlue flex items-center justify-center px-6">
        <div className="text-center max-w-sm bg-white rounded-2xl shadow-sm border border-iceBlue p-8">
          <Building2 className="w-12 h-12 text-steelBlue mx-auto mb-4" />
          <h2 className="text-xl font-bold text-deepNavy mb-2">Brak stajni</h2>
          <p className="text-sm text-steelBlue mb-6">Najpierw dołącz do stajni, aby zobaczyć dashboard.</p>
          <Link href="/client" className="inline-block rounded-xl bg-oceanBlue text-white px-5 py-2.5 text-sm font-medium hover:bg-marineBlue transition-colors">
            Wróć do panelu
          </Link>
        </div>
      </div>
    );
  }

  const stable = activeMembership.stable;
  const acceptedOnly = memberships.filter((m) => m.status === 'accepted');
  const upcoming = bookings.filter((b) => new Date(b.startTime) > new Date() && b.status !== 'CANCELLED');
  const past = bookings.filter((b) => new Date(b.startTime) <= new Date() || b.status === 'CANCELLED');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  const statusLabel: Record<string, string> = {
    CONFIRMED: 'Potwierdzona',
    PENDING: 'Oczekuje',
    CANCELLED: 'Anulowana',
    COMPLETED: 'Zakończona',
    PAID: 'Opłacona',
  };
  const statusStyle: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-oceanBlue/10 text-oceanBlue',
    PAID: 'bg-green-100 text-green-700',
  };

  const Section = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
    <section className={`bg-white rounded-2xl border border-iceBlue shadow-sm p-5 sm:p-6 ${className}`}>
      <h3 className="text-sm uppercase tracking-wider text-steelBlue font-semibold mb-4">{title}</h3>
      {children}
    </section>
  );

  const Stat = ({ icon: Icon, value, label }: { icon: any; value: string; label: string }) => (
    <div className="bg-white rounded-2xl border border-iceBlue shadow-sm p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-oceanBlue/10 flex items-center justify-center text-oceanBlue">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-deepNavy">{value}</p>
        <p className="text-xs text-steelBlue">{label}</p>
      </div>
    </div>
  );

  const openRegister = (e: EventItem) => {
    setSelectedEvent(e);
    setFormValues({});
  };

  const submitForm = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);
    await handleRegisterEvent(selectedEvent.id, stable.id, formValues);
    setSubmitting(false);
  };

  const renderEventForm = () => {
    if (!selectedEvent) return null;
    const fields = selectedEvent.formTemplate || [];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deepNavy/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-deepNavy">{selectedEvent.title}</h3>
            <button onClick={() => setSelectedEvent(null)} className="p-2 rounded-lg hover:bg-iceBlue">
              <X className="w-5 h-5 text-steelBlue" />
            </button>
          </div>
          <p className="text-sm text-steelBlue mb-6">
            {formatDate(selectedEvent.startDate)} {selectedEvent.endDate && `– ${formatDate(selectedEvent.endDate)}`}
          </p>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-deepNavy mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formValues[field.id] || ''}
                    onChange={(ev) => setFormValues((prev) => ({ ...prev, [field.id]: ev.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-xl border border-iceBlue bg-arcticBlue text-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue/30"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formValues[field.id] || ''}
                    onChange={(ev) => setFormValues((prev) => ({ ...prev, [field.id]: ev.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-iceBlue bg-arcticBlue text-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue/30"
                  >
                    <option value="">Wybierz</option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-1">
                    {field.options?.map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm text-steelBlue">
                        <input
                          type="checkbox"
                          checked={((formValues[field.id] as string[]) || []).includes(o)}
                          onChange={(ev) => {
                            const prev = (formValues[field.id] as string[]) || [];
                            const next = ev.target.checked ? [...prev, o] : prev.filter((x) => x !== o);
                            setFormValues((v) => ({ ...v, [field.id]: next }));
                          }}
                          className="rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'radio' ? (
                  <div className="space-y-1">
                    {field.options?.map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm text-steelBlue">
                        <input
                          type="radio"
                          name={field.id}
                          value={o}
                          checked={formValues[field.id] === o}
                          onChange={(ev) => setFormValues((prev) => ({ ...prev, [field.id]: ev.target.value }))}
                          className="border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={formValues[field.id] || ''}
                    onChange={(ev) => setFormValues((prev) => ({ ...prev, [field.id]: ev.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-xl border border-iceBlue bg-arcticBlue text-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue/30"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={submitForm}
              disabled={submitting}
              className="flex-1 rounded-xl bg-oceanBlue text-white px-4 py-2.5 text-sm font-medium hover:bg-marineBlue transition-colors disabled:opacity-50"
            >
              {submitting ? 'Zapisywanie...' : 'Zapisz się'}
            </button>
            <button
              onClick={() => setSelectedEvent(null)}
              className="rounded-xl border border-iceBlue px-4 py-2.5 text-sm font-medium text-steelBlue hover:bg-iceBlue transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderKokpit = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat icon={Calendar} value={String(upcoming.length)} label="Nadchodzące" />
        <Stat icon={Clock} value={String(past.length)} label="Wizyty" />
        <Stat icon={CreditCard} value={`${payments.reduce((s, p) => s + p.amount, 0)} zł`} label="Płatności" />
        <Stat icon={Ticket} value={String(activeSubscriptions.length)} label="Karnety" />
        <Stat icon={Megaphone} value={String(events.length)} label="Wydarzenia" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Najbliższa rezerwacja">
          {upcoming.length === 0 ? (
            <p className="text-sm text-steelBlue">Brak nadchodzących rezerwacji.</p>
          ) : (
            <button
              onClick={() => handleTabChange('rezerwacje')}
              className="w-full text-left group flex items-center justify-between py-2"
            >
              <div>
                <p className="font-semibold text-deepNavy">{upcoming[0].type || 'Jazda'}</p>
                <p className="text-xs text-steelBlue mt-0.5">
                  {formatDate(upcoming[0].startTime)} · {formatTime(upcoming[0].startTime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {statusLabel[upcoming[0].status] || upcoming[0].status}
                </span>
                <ChevronRight className="w-4 h-4 text-mistBlue group-hover:text-oceanBlue" />
              </div>
            </button>
          )}
        </Section>

        <Section title="Aktywny karnet">
          {activeSubscriptions.length === 0 ? (
            <p className="text-sm text-steelBlue">Brak aktywnego karnetu.</p>
          ) : (
            <button
              onClick={() => handleTabChange('uslugi')}
              className="w-full text-left group flex items-center justify-between py-2"
            >
              <div>
                <p className="font-semibold text-deepNavy">{activeSubscriptions[0].name}</p>
                <p className="text-xs text-steelBlue mt-0.5">
                  {activeSubscriptions[0].ridesUsed} / {activeSubscriptions[0].ridesIncluded} jazd
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-mistBlue group-hover:text-oceanBlue" />
            </button>
          )}
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Ostatnia płatność">
          {payments.length === 0 ? (
            <p className="text-sm text-steelBlue">Brak płatności.</p>
          ) : (
            <button
              onClick={() => handleTabChange('platnosci')}
              className="w-full text-left group flex items-center justify-between py-2"
            >
              <div>
                <p className="font-semibold text-deepNavy">{payments[0].amount} PLN</p>
                <p className="text-xs text-steelBlue mt-0.5">{formatDate(payments[0].createdAt)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-mistBlue group-hover:text-oceanBlue" />
            </button>
          )}
        </Section>

        <Section title="Aktualności">
          {events.length === 0 ? (
            <p className="text-sm text-steelBlue">Brak aktualnych ogłoszeń.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleTabChange('aktualnosci')}
                  className="w-full text-left group flex items-center justify-between py-1"
                >
                  <div>
                    <p className="font-medium text-deepNavy text-sm">{e.title}</p>
                    <p className="text-xs text-steelBlue">{e.type} · {formatDate(e.startDate)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-mistBlue group-hover:text-oceanBlue" />
                </button>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );

  const renderRezerwacje = () => (
    <Section title="Nadchodzące rezerwacje">
      {upcoming.length === 0 ? (
        <p className="text-sm text-steelBlue">Brak nadchodzących rezerwacji.</p>
      ) : (
        <div className="space-y-0">
          {upcoming.map((b) => (
            <div key={b.id} className="py-4 border-b border-iceBlue last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-deepNavy text-sm">{b.type || 'Jazda'}</p>
                  <p className="text-xs text-steelBlue mt-0.5">
                    {formatDate(b.startTime)} · {formatTime(b.startTime)} {b.horse ? `· ${b.horse.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[b.status] || 'bg-iceBlue text-steelBlue'}`}>
                    {statusLabel[b.status] || b.status}
                  </span>
                  {b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Anuluj
                    </button>
                  )}
                </div>
              </div>
              {b.notes && <p className="text-xs text-steelBlue mt-2">{b.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </Section>
  );

  const renderWizyty = () => (
    <Section title="Historia wizyt">
      {past.length === 0 ? (
        <p className="text-sm text-steelBlue">Brak zakończonych wizyt.</p>
      ) : (
        <div className="space-y-0">
          {past.map((b) => (
            <div key={b.id} className="py-4 border-b border-iceBlue last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-deepNavy text-sm">{b.type || 'Jazda'}</p>
                  <p className="text-xs text-steelBlue mt-0.5">
                    {formatDate(b.startTime)} · {formatTime(b.startTime)} {b.horse ? `· ${b.horse.name}` : ''}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[b.status] || 'bg-iceBlue text-steelBlue'}`}>
                  {statusLabel[b.status] || b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );

  const renderKarnety = () => (
    <Section title="Twoje karnety">
      {activeSubscriptions.length === 0 ? (
        <p className="text-sm text-steelBlue">Brak aktywnych karnetów w tej stajni.</p>
      ) : (
        <div className="space-y-0">
          {activeSubscriptions.map((s) => (
            <div key={s.id} className="py-4 border-b border-iceBlue last:border-0 flex items-center justify-between">
              <div>
                <p className="font-semibold text-deepNavy text-sm">{s.name}</p>
                <p className="text-xs text-steelBlue mt-0.5">
                  {s.ridesUsed} / {s.ridesIncluded} jazd · ważny do {formatDate(s.validTo)}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Aktywny
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );

  const renderPlatnosci = () => (
    <Section title="Płatności">
      {payments.length === 0 ? (
        <p className="text-sm text-steelBlue">Brak płatności.</p>
      ) : (
        <div className="space-y-0">
          {payments.map((p) => (
            <div key={p.id} className="py-4 border-b border-iceBlue last:border-0 flex items-center justify-between">
              <div>
                <p className="font-semibold text-deepNavy text-sm">{p.amount} PLN</p>
                <p className="text-xs text-steelBlue">{formatDate(p.createdAt)}</p>
                {p.subscription?.name && <p className="text-xs text-steelBlue">{p.subscription.name}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[p.status] || 'bg-iceBlue text-steelBlue'}`}>
                {p.status === 'COMPLETED' ? 'Opłacona' : statusLabel[p.status] || p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );

  const renderAktualnosci = () => (
    <Section title="Aktualności i zapisy">
      {events.length === 0 ? (
        <p className="text-sm text-steelBlue">Brak aktualnych wydarzeń.</p>
      ) : (
        <div className="space-y-0">
          {events.map((e) => (
            <div key={e.id} className="py-5 border-b border-iceBlue last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-full bg-iceBlue text-oceanBlue text-xs font-medium">{e.type}</span>
                    {e.isPublic && <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Publiczne</span>}
                    {e.price !== undefined && <span className="text-xs font-semibold text-deepNavy">{e.price} PLN</span>}
                    {e.spotsLeft !== undefined && e.spotsLeft !== null && (
                      <span className="text-xs text-steelBlue">Wolne miejsca: {e.spotsLeft}</span>
                    )}
                  </div>
                  <p className="font-semibold text-deepNavy">{e.title}</p>
                  <p className="text-xs text-steelBlue mt-1">
                    {formatDate(e.startDate)} {e.endDate && `– ${formatDate(e.endDate)}`}
                  </p>
                  {e.location && <p className="text-xs text-steelBlue mt-1">{e.location}</p>}
                  {e.description && <p className="text-xs text-steelBlue mt-2 leading-relaxed">{e.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {e.isRegistered ? (
                    <span className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-medium">Zapisano</span>
                  ) : (
                    <button
                      onClick={() => (e.formTemplate && e.formTemplate.length ? openRegister(e) : handleRegisterEvent(e.id, stable.id))}
                      className="rounded-xl bg-oceanBlue text-white px-4 py-2 text-xs font-medium hover:bg-marineBlue transition-colors whitespace-nowrap"
                    >
                      Zapisz się
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );

  const renderUslugi = () => {
    const services = activeMembership?.stable?.services || [];
    return (
      <Section title={`Usługi — ${activeMembership?.stable?.name || 'Wybierz stajnię'}`}>
        {!activeMembership ? (
          <p className="text-sm text-steelBlue">Wybierz stajnię, aby zobaczyć jej usługi.</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-steelBlue">Ta stajnia nie ma zdefiniowanych usług.</p>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <div
                key={service}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-arcticBlue border border-iceBlue"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-oceanBlue/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-oceanBlue" />
                  </div>
                  <p className="font-semibold text-deepNavy">{service}</p>
                </div>
                <button
                  onClick={() => {
                    setBookingForm({ ...bookingForm, service });
                    setShowBookingModal(true);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-oceanBlue text-white px-4 py-2 text-xs font-medium hover:bg-marineBlue transition-colors"
                >
                  Zarezerwuj
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    );
  };

  const renderStajnia = () => (
    <div className="grid md:grid-cols-2 gap-6">
      <Section title="Dane kontaktowe">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 text-steelBlue">
            <MapPin className="w-4 h-4 mt-0.5 text-oceanBlue" />
            <span>{stable.address}, {stable.city}</span>
          </div>
          <div className="flex items-center gap-3 text-steelBlue">
            <Phone className="w-4 h-4 text-oceanBlue" />
            <a href={`tel:${stable.phone}`} className="hover:text-oceanBlue">{stable.phone}</a>
          </div>
          <div className="flex items-center gap-3 text-steelBlue">
            <Mail className="w-4 h-4 text-oceanBlue" />
            <a href={`mailto:${stable.email}`} className="hover:text-oceanBlue">{stable.email}</a>
          </div>
          <div className="flex items-center gap-3 text-steelBlue">
            <Star className="w-4 h-4 text-oceanBlue" />
            <span>{stable.rating.toFixed(1)} / 5 ({stable.reviewCount} opinii)</span>
          </div>
        </div>
      </Section>

      <Section title="Godziny otwarcia">
        {stable.openingHours ? (
          <div className="space-y-2 text-sm">
            {Object.entries(stable.openingHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between py-1 border-b border-iceBlue last:border-0">
                <span className="text-steelBlue">{day}</span>
                <span className="font-medium text-deepNavy">{hours}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-steelBlue">Brak danych.</p>
        )}
      </Section>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'rezerwacje':
        return renderRezerwacje();
      case 'wizyty':
        return renderWizyty();
      case 'karnety':
        return renderKarnety();
      case 'platnosci':
        return renderPlatnosci();
      case 'aktualnosci':
        return renderAktualnosci();
      case 'uslugi':
        return renderUslugi();
      case 'stajnia':
        return renderStajnia();
      default:
        return renderKokpit();
    }
  };

  return (
    <div className="min-h-screen bg-arcticBlue flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-oceanBlue to-marineBlue text-white shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <Link href="/client" className="inline-flex items-center gap-2 text-xs text-mistBlue hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Wróć do stajni
          </Link>
          <h1 className="mt-4 text-xl font-serif font-bold">Panel klienta</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-mistBlue">Aktywna stajnia</p>
          <p className="text-sm font-semibold truncate">{stable.name}</p>
          <p className="text-[10px] text-blueGray">{stable.city}</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden bg-oceanBlue text-white px-4 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3">
            <Link href="/client" className="p-2 -ml-2 rounded-lg hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold truncate flex-1 text-center">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2 -mr-2 rounded-lg hover:bg-white/10"
              aria-label="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          {acceptedOnly.length > 1 && (
            <select
              value={activeMembership.stableId}
              onChange={handleSwitch}
              className="mt-4 w-full px-3 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {acceptedOnly.map((m) => (
                <option key={m.stableId} value={m.stableId} className="text-deepNavy">
                  {m.stable.name}
                </option>
              ))}
            </select>
          )}
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-iceBlue">
          <div>
            <p className="text-xs text-steelBlue">Witaj z powrotem</p>
            <h2 className="text-2xl font-serif font-bold text-deepNavy">{tabs.find((t) => t.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            {acceptedOnly.length > 1 && (
              <select
                value={activeMembership.stableId}
                onChange={handleSwitch}
                className="px-4 py-2.5 rounded-xl bg-arcticBlue border border-iceBlue text-sm text-deepNavy focus:outline-none focus:ring-2 focus:ring-oceanBlue/30"
              >
                {acceptedOnly.map((m) => (
                  <option key={m.stableId} value={m.stableId}>
                    {m.stable.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2.5 rounded-xl bg-arcticBlue hover:bg-iceBlue text-deepNavy"
              aria-label="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        {message && (
          <div className="mx-4 md:mx-8 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="p-1 hover:bg-red-100 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {busy && (
          <div className="mx-4 md:mx-8 mt-4 flex items-center gap-2 text-xs text-steelBlue">
            <Loader2 className="w-4 h-4 animate-spin" />
            Odświeżanie...
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-bold text-deepNavy">Zapytanie o rezerwację</h2>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!activeMembership) return;
                  setSubmitting(true);
                  try {
                    const start = new Date(`${bookingForm.date}T${bookingForm.time}`);
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    await api.post('/bookings', {
                      stableId: activeMembership.stableId,
                      type: bookingForm.service,
                      startTime: start.toISOString(),
                      endTime: end.toISOString(),
                      notes: bookingForm.notes,
                    });
                    setMessage('Zapytanie o rezerwację wysłane!');
                    setShowBookingModal(false);
                    setBookingForm({ date: '', time: '', service: '', notes: '' });
                    if (activeMembership) loadData(activeMembership.stableId);
                  } catch (error: any) {
                    setMessage(error.response?.data?.error || 'Nie udało się wysłać zapytania.');
                  } finally {
                    setSubmitting(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Usługa</label>
                    <input
                      type="text"
                      value={bookingForm.service}
                      disabled
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl text-deepNavy"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data</label>
                      <input
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Godzina</label>
                      <input
                        type="time"
                        value={bookingForm.time}
                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Uwagi (opcjonalne)</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy resize-none"
                      placeholder="Dodatkowe informacje..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 px-4 py-3 border border-iceBlue rounded-2xl text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                    >
                      {submitting ? 'Wysyłanie...' : 'Wyślij zapytanie'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl">
            <div className="mb-6 md:hidden">
              <p className="text-xs text-steelBlue">Witaj z powrotem</p>
              <h2 className="text-xl font-serif font-bold text-deepNavy">{user?.firstName || 'Klient'}</h2>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-oceanBlue text-white flex justify-around pt-3 pb-5 z-20">
        {tabs
          .filter((t) => mobileTabIds.includes(t.id))
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 flex-1 ${
                activeTab === tab.id ? 'text-white' : 'text-white/70'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
      </nav>

      {selectedEvent && renderEventForm()}
    </div>
  );
}
