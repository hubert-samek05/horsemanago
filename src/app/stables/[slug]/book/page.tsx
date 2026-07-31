'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Check, Clock, Loader2, MessageSquare, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Instructor {
  id: string;
  user?: { firstName?: string; lastName?: string };
  specializations?: string[];
  hourlyRate?: number;
}

interface Horse {
  id: string;
  name: string;
  breed?: string;
}

interface Stable {
  id: string;
  name: string;
  slug: string;
  services: string[];
  instructors: Instructor[];
  horses: Horse[];
}

export default function BookLessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuthStore();
  const [stable, setStable] = useState<Stable | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    date: '',
    time: '',
    service: '',
    instructor: '',
    horse: '',
    notes: '',
  });

  useEffect(() => {
    const fetchStable = async () => {
      try {
        const { data } = await api.get(`/stables/slug/${slug}`);
        setStable(data);
        setForm((prev) => ({
          ...prev,
          service: data.services?.[0] || '',
        }));
      } catch (e) {
        setError('Nie udało się pobrać danych stajni.');
      } finally {
        setLoading(false);
      }
    };
    fetchStable();
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stable) return;

    if (!isAuthenticated() || !user) {
      router.push(`/login?redirect=/stables/${slug}/book`);
      return;
    }

    const start = new Date(`${form.date}T${form.time}`);
    if (isNaN(start.getTime())) {
      setError('Wybierz poprawną datę i godzinę.');
      return;
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        stableId: stable.id,
        type: form.service,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: form.notes,
      };
      if (form.instructor) payload.instructorId = form.instructor;
      if (form.horse) payload.horseId = form.horse;

      await api.post('/bookings', payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-900' />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className='min-h-screen bg-slate-50 py-12 px-4'>
        <div className='max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-8 text-center'>
          <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6'>
            <Check className='w-8 h-8 text-green-600' />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 mb-2'>Rezerwacja przyjęta</h1>
          <p className='text-slate-600 mb-6'>
            Twoja rezerwacja w <strong>{stable?.name}</strong> została zapisana. Potwierdzenie znajdziesz w panelu klienta.
          </p>
          <Link href='/client/dashboard' className='inline-block px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors'>
            Przejdź do panelu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 py-10 px-4'>
      <div className='max-w-2xl mx-auto'>
        <Link href={`/stables/${slug}`} className='inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6'>
          <ArrowLeft className='w-4 h-4' />
          Wróć do wizytówki
        </Link>

        <div className='bg-white rounded-3xl shadow-xl overflow-hidden'>
          <div className='bg-slate-900 p-8 text-white'>
            <h1 className='text-3xl font-bold mb-2'>Zarezerwuj jazdę</h1>
            <p className='text-slate-300'>{stable?.name}</p>
            {error && <p className='text-red-300 mt-2 text-sm'>{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className='p-8 space-y-6'>
            {!isAuthenticated() && (
              <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm'>
                Aby dokończyć rezerwację, <Link href={`/login?redirect=/stables/${slug}/book`} className='underline font-medium'>zaloguj się</Link> lub <Link href={`/register?redirect=/stables/${slug}/book`} className='underline font-medium'>załóż konto</Link>.
              </div>
            )}

            {isAuthenticated() && (
              <div className='p-4 bg-slate-100 rounded-xl flex items-center gap-3'>
                <User className='w-5 h-5 text-slate-600' />
                <div>
                  <p className='text-sm text-slate-500'>Rezerwujesz jako</p>
                  <p className='font-medium text-slate-900'>
                    {user?.firstName} {user?.lastName} ({user?.email})
                  </p>
                </div>
              </div>
            )}

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Data</label>
                <div className='relative'>
                  <Calendar className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
                  <input
                    type='date'
                    name='date'
                    value={form.date}
                    onChange={handleChange}
                    required
                    className='w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Godzina</label>
                <div className='relative'>
                  <Clock className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
                  <input
                    type='time'
                    name='time'
                    value={form.time}
                    onChange={handleChange}
                    required
                    className='w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900'
                  />
                </div>
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Rodzaj zajęć</label>
                <select
                  name='service'
                  value={form.service}
                  onChange={handleChange}
                  required
                  disabled={!stable}
                  className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white disabled:bg-slate-100'
                >
                  {stable?.services?.map((service: string) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>Instruktor</label>
                <select
                  name='instructor'
                  value={form.instructor}
                  onChange={handleChange}
                  disabled={!stable}
                  className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white disabled:bg-slate-100'
                >
                  <option value=''>Dowolny</option>
                  {stable?.instructors?.map((i: Instructor) => (
                    <option key={i.id} value={i.id}>
                      {i.user?.firstName} {i.user?.lastName} {i.specializations ? `– ${i.specializations.join(', ')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>Koń (opcjonalnie)</label>
              <select
                name='horse'
                value={form.horse}
                onChange={handleChange}
                disabled={!stable}
                className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white disabled:bg-slate-100'
              >
                <option value=''>Wybierz konia</option>
                {stable?.horses?.map((h: Horse) => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.breed ? `(${h.breed})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>Uwagi</label>
              <div className='relative'>
                <MessageSquare className='absolute left-4 top-4 w-4 h-4 text-slate-400' />
                <textarea
                  name='notes'
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className='w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none'
                  placeholder='Dodatkowe informacje, poziom zaawansowania, specjalne potrzeby...'
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={submitting || !stable}
              className='w-full py-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? 'Rezerwowanie...' : 'Zarezerwuj zajęcia'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
