'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

// Declare AppleID global type
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: (config: any) => Promise<any>;
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, user, token } = useAuthStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const direct = urlParams.get('direct');
      // Only redirect to welcome if user is already logged in and not explicitly accessing login page
      if (!direct && user && token) {
        router.replace('/welcome');
      }
    }
  }, [router, user, token]);

  // Load Apple JS SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if already loaded
      if (window.AppleID) {
        console.log('Apple SDK already loaded');
        return;
      }

      console.log('Loading Apple SDK...');
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('Apple SDK script loaded');
        // Wait a bit for SDK to initialize
        setTimeout(() => {
          if (window.AppleID) {
            console.log('AppleID available, initializing...');
            try {
              window.AppleID.auth.init({
                clientId: 'net.horsemanago2.signin',
                scope: 'email name',
                redirectURI: 'https://horsemanago.net/login',
                state: Math.random().toString(36).substring(2, 15),
                usePopup: true,
              });
              console.log('Apple SDK initialized successfully');
            } catch (err) {
              console.error('Apple SDK initialization error:', err);
            }
          } else {
            console.error('AppleID not available after script load');
          }
        }, 500);
      };

      script.onerror = () => {
        console.error('Failed to load Apple SDK script');
      };

      document.head.appendChild(script);
    }
  }, []);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    role: 'CLIENT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');

  const images = [
    'https://t4.ftcdn.net/jpg/01/14/99/69/360_F_114996970_eAOcRbAP1KaD0fFw9l4Xl9izTvYu0DVU.jpg',
    'https://t4.ftcdn.net/jpg/01/67/29/17/360_F_167291732_Trf94buPoyYduWrwN6OYysmUGCga5cnO.jpg',
    'https://t4.ftcdn.net/jpg/05/68/89/67/360_F_568896778_JRbqfQijqggvpa3itgV233iGxYjqpDYt.jpg',
    'https://img.freepik.com/premium-photo/riding-girl-horse_87557-16695.jpg',
  ];

  const carouselTexts = [
    'Zarządzaj swoją stajnią',
    'Rozwiń swoją stajnię',
    'Profesjonalne narzędzia',
    'Nowoczesna platforma',
  ];

  const carouselDescriptions = [
    'Kompleksowe narzędzia do zarządzania rezerwacjami, końmi i klientami w jednym miejscu',
    'Nowoczesne narzędzia do zarządzania, które pomogą Ci zautomatyzować procesy i zwiększyć efektywność',
    'System stworzony z myślą o potrzebach profesjonalnych stajni i ośrodków jeździeckich',
    'Intuicyjny interfejs i zaawansowane funkcje dla maksymalnej wygody użytkownika',
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'register') {
        setActiveTab('register');
      } else {
        setActiveTab('login');
      }
      const redirect = urlParams.get('redirect');
      if (redirect) {
        setRedirectTarget(redirect + (urlParams.get('join') ? '?join=1' : ''));
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', loginData);
      const { token, user } = response.data;

      console.log('Login response user:', user);
      console.log('User roles:', user.roles);

      setAuth(user, token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (redirectTarget) {
        router.replace(redirectTarget);
      } else {
        // Check for pending invitations first
        api.get('/employees/invitations/pending')
          .then(({ data }) => {
            if (Array.isArray(data) && data.length > 0) {
              console.log('Has pending invitations, redirecting to invitations page');
              router.replace('/invitations');
            } else if (user.roles) {
              // Count total stables across all roles
              const ownerStables = user.roles.STABLE_OWNER || [];
              const instructorStables = user.roles.INSTRUCTOR || [];
              const workerStables = user.roles.STABLE_WORKER || [];
              const clientStables = user.roles.CLIENT || [];
              
              const totalStables = ownerStables.length + instructorStables.length + workerStables.length + clientStables.length;
              const hasStableRole = ownerStables.length > 0 || instructorStables.length > 0 || workerStables.length > 0;
              
              console.log('Total stables:', totalStables, 'Has stable role:', hasStableRole);
              
              if (hasStableRole && totalStables === 1) {
                // User has only one stable - redirect directly to dashboard
                const stable = ownerStables[0] || instructorStables[0] || workerStables[0];
                const role = ownerStables[0] ? 'STABLE_OWNER' : (instructorStables[0] ? 'INSTRUCTOR' : 'STABLE_WORKER');
                console.log('Redirecting directly to dashboard with stable:', stable.stableId, 'role:', role);
                router.replace(`/dashboard?stableId=${stable.stableId}`);
              } else if (hasStableRole) {
                // User has multiple stables - redirect to stable selection
                console.log('Redirecting to select-stable (multiple stable roles)');
                router.replace('/select-stable');
              } else if (clientStables.length > 0) {
                // User is only a client - redirect to client panel
                console.log('Redirecting to client (client role)');
                router.replace('/client');
              } else if (user.role === 'CLIENT') {
                // Fallback for old users without roles object
                console.log('Redirecting to client (fallback)');
                router.replace('/client');
              } else {
                console.log('Redirecting to dashboard, user.role:', user.role);
                router.replace('/dashboard');
              }
            } else if (user.role === 'CLIENT') {
              // Fallback for old users without roles object
              console.log('Redirecting to client (fallback)');
              router.replace('/client');
            } else {
              console.log('Redirecting to dashboard, user.role:', user.role);
              router.replace('/dashboard');
            }
          })
          .catch((err) => {
            console.error('Failed to check pending invitations:', err);
            // Fallback to normal redirect logic
            if (user.roles) {
              const ownerStables = user.roles.STABLE_OWNER || [];
              const instructorStables = user.roles.INSTRUCTOR || [];
              const workerStables = user.roles.STABLE_WORKER || [];
              const clientStables = user.roles.CLIENT || [];
              
              const totalStables = ownerStables.length + instructorStables.length + workerStables.length + clientStables.length;
              const hasStableRole = ownerStables.length > 0 || instructorStables.length > 0 || workerStables.length > 0;
              
              if (hasStableRole && totalStables === 1) {
                const stable = ownerStables[0] || instructorStables[0] || workerStables[0];
                router.push(`/dashboard?stableId=${stable.stableId}`);
              } else if (hasStableRole) {
                router.push('/select-stable');
              } else if (clientStables.length > 0) {
                router.push('/client');
              } else if (user.role === 'CLIENT') {
                router.push('/client');
              } else {
                router.push('/dashboard');
              }
            } else if (user.role === 'CLIENT') {
              router.push('/client');
            } else {
              router.push('/dashboard');
            }
          });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log('Apple Sign-In clicked');
    setError('');

    // For registration, require role selection
    if (activeTab === 'register' && !registerData.role) {
      console.log('No role selected for registration');
      setError('Proszę wybrać rolę przed rejestracją przez Apple');
      return;
    }

    console.log('Starting Apple Sign-In...');
    setLoading(true);
    try {
      let id_token: string;
      let firstName: string | undefined;
      let lastName: string | undefined;

      if (Capacitor.getPlatform() === 'ios') {
        // Native iOS Sign in with Apple
        console.log('Apple Sign-In using native iOS');
        const result = await SignInWithApple.authorize({
          clientId: 'net.horsemanago2',
          redirectURI: 'https://horsemanago.net/login',
          scopes: 'email name',
          state: Math.random().toString(36).substring(2, 15),
          nonce: Math.random().toString(36).substring(2, 15),
        });
        console.log('Apple Sign-In result:', result);
        id_token = result.response.identityToken;
        firstName = result.response.givenName || undefined;
        lastName = result.response.familyName || undefined;
      } else {
        // Use Apple JS SDK for web and Android
        console.log('Apple Sign-In using JS SDK');
        if (!window.AppleID) {
          throw new Error('Apple Sign-In SDK nie jest załadowany. Proszę odświeżyć stronę.');
        }
        const data = await window.AppleID.auth.signIn({
          clientId: 'net.horsemanago2.signin',
          scope: 'email name',
          redirectURI: 'https://horsemanago.net/login',
          state: Math.random().toString(36).substring(2, 15),
          usePopup: true,
        });

        console.log('Apple Sign-In result:', data);
        const { authorization, user } = data;
        const { id_token: webIdToken } = authorization;
        const { name } = user || {};

        id_token = webIdToken;
        firstName = name?.firstName;
        lastName = name?.lastName;
      }

      if (!id_token) {
        throw new Error('Brak tokenu Apple');
      }

      const response = await api.post('/auth/apple', {
        identityToken: id_token,
        firstName,
        lastName,
        role: activeTab === 'register' ? registerData.role : undefined,
      });
      const { token, user: authUser } = response.data;

      setAuth(authUser, token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(authUser));

      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (authUser.roles) {
        // Count total stables across all roles
        const ownerStables = authUser.roles.STABLE_OWNER || [];
        const instructorStables = authUser.roles.INSTRUCTOR || [];
        const workerStables = authUser.roles.STABLE_WORKER || [];
        const clientStables = authUser.roles.CLIENT || [];
        
        const totalStables = ownerStables.length + instructorStables.length + workerStables.length + clientStables.length;
        const hasStableRole = ownerStables.length > 0 || instructorStables.length > 0 || workerStables.length > 0;
        
        if (hasStableRole && totalStables === 1) {
          // User has only one stable - redirect directly to dashboard
          const stable = ownerStables[0] || instructorStables[0] || workerStables[0];
          router.push(`/dashboard?stableId=${stable.stableId}`);
        } else if (hasStableRole) {
          // User has multiple stables - redirect to stable selection
          router.push('/select-stable');
        } else if (clientStables.length > 0) {
          // User is only a client - redirect to client panel
          router.push('/client');
        } else if (authUser.role === 'CLIENT') {
          // Client role with no specific stables - go to client panel
          router.push('/client');
        } else {
          router.push('/dashboard');
        }
      } else if (authUser.role === 'CLIENT') {
        // Client role with no specific stables - go to client panel
        router.push('/client');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Apple Sign-In error:', err);
      setError(err.response?.data?.error || 'Wystąpił błąd podczas logowania przez Apple');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', registerData);

      const loginResponse = await api.post('/auth/login', {
        email: registerData.email,
        password: registerData.password,
      });
      const { token, user } = loginResponse.data;

      setAuth(user, token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (user.roles) {
        // Count total stables across all roles
        const ownerStables = user.roles.STABLE_OWNER || [];
        const instructorStables = user.roles.INSTRUCTOR || [];
        const workerStables = user.roles.STABLE_WORKER || [];
        const clientStables = user.roles.CLIENT || [];
        
        const totalStables = ownerStables.length + instructorStables.length + workerStables.length + clientStables.length;
        const hasStableRole = ownerStables.length > 0 || instructorStables.length > 0 || workerStables.length > 0;
        
        if (hasStableRole && totalStables === 1) {
          // User has only one stable - redirect directly to dashboard
          const stable = ownerStables[0] || instructorStables[0] || workerStables[0];
          router.push(`/dashboard?stableId=${stable.stableId}`);
        } else if (hasStableRole) {
          // User has multiple stables - redirect to stable selection
          router.push('/select-stable');
        } else if (clientStables.length > 0) {
          // User is only a client - redirect to client panel
          router.push('/client');
        } else if (user.role === 'CLIENT') {
          // Client role with no specific stables - go to client panel
          router.push('/client');
        } else {
          router.push('/dashboard');
        }
      } else if (user.role === 'CLIENT') {
        // Client role with no specific stables - go to client panel
        router.push('/client');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas rejestracji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <div className="min-h-screen flex">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/zdj/logohorsemanago2"
                  alt="HORSEmanago"
                  width={300}
                  height={112}
                  className="h-auto w-64 object-contain"
                />
              </Link>
              <h1 className="font-serif text-2xl font-bold text-deepNavy mb-2">
                {activeTab === 'login' ? 'Witaj ponownie' : 'Utwórz konto'}
              </h1>
              <p className="text-marineBlue text-base">
                {activeTab === 'login' ? 'Zaloguj się, aby kontynuować' : 'Dołącz do HORSEmanago już dziś'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 bg-white rounded-2xl p-1 border border-iceBlue">
              <Link
                href="/login?tab=login"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl font-medium transition-all text-sm sm:text-base text-center ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-deepNavy to-oceanBlue text-white shadow-md'
                    : 'text-marineBlue hover:text-deepNavy'
                }`}
              >
                Logowanie
              </Link>
              <Link
                href="/login?tab=register"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl font-medium transition-all text-sm sm:text-base text-center ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-deepNavy to-oceanBlue text-white shadow-md'
                    : 'text-marineBlue hover:text-deepNavy'
                }`}
              >
                Rejestracja
              </Link>
            </div>

            {/* Role Selector (for registration) */}
            {activeTab === 'register' && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterData({ ...registerData, role: 'CLIENT' })}
                    className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
                      registerData.role === 'CLIENT'
                        ? 'border-oceanBlue bg-oceanBlue/10 text-oceanBlue'
                        : 'border-iceBlue bg-white text-deepNavy hover:border-oceanBlue/50'
                    }`}
                  >
                    Klient / Jeździec
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterData({ ...registerData, role: 'STABLE_OWNER' })}
                    className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
                      registerData.role === 'STABLE_OWNER'
                        ? 'border-oceanBlue bg-oceanBlue/10 text-oceanBlue'
                        : 'border-iceBlue bg-white text-deepNavy hover:border-oceanBlue/50'
                    }`}
                  >
                    Właściciel stajni
                  </button>
                </div>
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log('Apple button clicked directly');
                  handleAppleSignIn();
                }}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-iceBlue bg-white hover:bg-iceBlue/50 transition-all text-deepNavy font-medium text-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                Apple
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Google button clicked');
                  // Google Sign-In handler - to be implemented
                }}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-iceBlue bg-white hover:bg-iceBlue/50 transition-all text-deepNavy font-medium text-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-iceBlue"></div>
              <span className="text-sm text-marineBlue">lub</span>
              <div className="flex-1 h-px bg-iceBlue"></div>
            </div>

            {/* Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="twoj@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all text-deepNavy bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">
                    Hasło
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all text-deepNavy bg-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-oceanBlue focus:ring-oceanBlue border-iceBlue rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-deepNavy">
                      Zapamiętaj mnie
                    </label>
                  </div>

                  <Link href="/forgot-password" className="text-sm text-oceanBlue hover:text-deepNavy font-medium">
                    Zapomniałeś hasła?
                  </Link>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-deepNavy to-oceanBlue hover:from-midnightBlue hover:to-marineBlue text-white shadow-lg" disabled={loading}>
                  {loading ? 'Logowanie...' : 'Zaloguj się'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="twoj@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all text-deepNavy bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">
                    Hasło
                  </label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Min. 8 znaków"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:border-oceanBlue focus:ring-2 focus:ring-oceanBlue/20 outline-none transition-all text-deepNavy bg-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full bg-gradient-to-r from-deepNavy to-oceanBlue hover:from-midnightBlue hover:to-marineBlue text-white shadow-lg" disabled={loading}>
                  {loading ? 'Rejestracja...' : 'Zarejestruj się'}
                </Button>

                <p className="text-xs text-marineBlue text-center">
                  Rejestrując się, akceptujesz nasz{' '}
                  <Link href="/terms" className="text-oceanBlue hover:text-deepNavy">
                    regulamin
                  </Link>{' '}
                  i{' '}
                  <Link href="/privacy" className="text-oceanBlue hover:text-deepNavy">
                    politykę prywatności
                  </Link>
                </p>
              </form>
            )}

            <div className="mt-8 text-center">
              <Link href="/" className="text-sm text-marineBlue hover:text-deepNavy">
                Powrót do strony głównej
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Image Carousel */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={images[currentImageIndex]}
              alt="Horse stable"
              fill
              className="object-cover transition-opacity duration-1000"
              priority
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
          
          {/* Carousel Indicators */}
          <div className="absolute top-6 right-6 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Text in bottom corner */}
          <div className="absolute bottom-12 left-12 right-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="font-serif text-3xl font-bold text-white mb-2">
                {carouselTexts[currentImageIndex]}
              </h2>
              <p className="text-white/90 text-base">
                {carouselDescriptions[currentImageIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
