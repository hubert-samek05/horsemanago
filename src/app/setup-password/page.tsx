'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Brak tokenu w linku. Proszę skorzystać z linku z emaila.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Brak tokenu w linku.');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/setup-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nie udało się ustawić hasła. Token może być nieprawidłowy lub wygasły.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-deepNavy mb-2">Błąd</h2>
            <p className="text-marineBlue mb-6">{error}</p>
            <Link href="/login" className="inline-block px-6 py-3 bg-deepNavy text-white rounded-xl font-medium hover:bg-oceanBlue transition-colors">
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-deepNavy mb-2">Hasło ustawione!</h2>
            <p className="text-marineBlue mb-6">Twoje hasło zostało pomyślnie ustawione. Przekierowywanie do strony logowania...</p>
            <Link href="/login" className="inline-block px-6 py-3 bg-deepNavy text-white rounded-xl font-medium hover:bg-oceanBlue transition-colors">
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/zdj/horsemanagologo3"
                alt="HORSEmanago"
                width={120}
                height={120}
                className="rounded-lg mx-auto"
              />
            </Link>
            <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Ustaw hasło</h1>
            <p className="text-marineBlue text-sm">Ustaw swoje hasło aby rozpocząć pracę w systemie</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-deepNavy mb-2">
                Nowe hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all"
                placeholder="Wprowadź hasło (min. 6 znaków)"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-deepNavy mb-2">
                Potwierdź hasło
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all"
                placeholder="Powtórz hasło"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-deepNavy to-oceanBlue text-white rounded-xl font-medium hover:from-oceanBlue hover:to-marineBlue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ustawianie hasła...' : 'Ustaw hasło'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-marineBlue hover:text-deepNavy transition-colors">
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
