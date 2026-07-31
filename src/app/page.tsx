'use client';

export const dynamic = 'force-dynamic';
import Link from 'next/link';

import Image from 'next/image';
import Button from '@/components/ui/Button';
import { Menu, X, Check } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-iceBlue sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/zdj/logohorsemanago2"
                alt="HORSEmanago"
                width={800}
                height={300}
                className="h-auto w-48 object-contain"
              />
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-deepNavy hover:text-oceanBlue transition-colors font-medium">
                Funkcje
              </Link>
              <Link href="#solutions" className="text-deepNavy hover:text-oceanBlue transition-colors font-medium">
                Rozwiązania
              </Link>
              <Link href="#pricing" className="text-deepNavy hover:text-oceanBlue transition-colors font-medium">
                Cennik
              </Link>
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-deepNavy hover:bg-iceBlue">
                  Zaloguj się
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-deepNavy to-oceanBlue hover:from-midnightBlue hover:to-marineBlue text-white shadow-lg">
                  Zarejestruj się
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-deepNavy hover:bg-iceBlue rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-deepNavy/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-iceBlue">
              <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src="/zdj/logohorsemanago2"
                  alt="HORSEmanago"
                  width={150}
                  height={50}
                  className="h-10 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-deepNavy hover:bg-iceBlue rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 p-6 space-y-4">
              <Link
                href="#features"
                className="block text-lg font-medium text-deepNavy hover:text-oceanBlue transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funkcje
              </Link>
              <Link
                href="#solutions"
                className="block text-lg font-medium text-deepNavy hover:text-oceanBlue transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Rozwiązania
              </Link>
              <Link
                href="#pricing"
                className="block text-lg font-medium text-deepNavy hover:text-oceanBlue transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cennik
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="p-6 space-y-3 border-t border-iceBlue">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="lg" className="w-full border-oceanBlue text-deepNavy hover:bg-iceBlue">
                  Zaloguj się
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="lg" className="w-full bg-gradient-to-r from-deepNavy to-oceanBlue hover:from-midnightBlue hover:to-marineBlue text-white shadow-lg">
                  Zarejestruj się
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-arcticBlue via-white to-iceBlue"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-oceanBlue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-marineBlue/10 rounded-full blur-3xl"></div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fadeIn text-center lg:text-left">
              <h1 className="font-serif text-5xl lg:text-7xl font-bold text-deepNavy leading-tight">
                Nowoczesne zarządzanie
                <span className="block bg-gradient-to-r from-oceanBlue to-marineBlue bg-clip-text text-transparent">
                  stajnią
                </span>
              </h1>
              <p className="text-xl text-marineBlue leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Kompleksowy system dla stajni, klubów jeździeckich i ośrodków jazdy konnej.
                Zarządzaj końmi, rezerwacjami, finansami i klientami w jednym miejscu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-deepNavy to-oceanBlue hover:from-midnightBlue hover:to-marineBlue text-white shadow-xl px-8 py-4">
                    Rozpocznij za darmo
                  </Button>
                </Link>
                <Link href="/stables">
                  <Button variant="outline" size="lg" className="border-oceanBlue text-deepNavy hover:bg-iceBlue px-8 py-4">
                    Wyszukaj stajnię
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Banner Image */}
            <div className="relative animate-slideUp">
              <div className="absolute inset-0 bg-gradient-to-br from-oceanBlue/20 to-marineBlue/20 rounded-3xl blur-2xl"></div>
              <div className="relative">
                <Image
                  src="/zdj/banerhorsemanago1"
                  alt="HORSEmanago Platform"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-b from-white to-arcticBlue">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-deepNavy mb-6">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-xl text-marineBlue max-w-2xl mx-auto">
              Pełna integracja wszystkich procesów w Twojej stajni
            </p>
          </div>

          {/* Main Features in Boxes */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              title="Rezerwacje online"
              description="System rezerwacji jazd i lekcji z automatycznym kalendarzem i powiadomieniami"
              accent="oceanBlue"
            />
            <FeatureCard
              title="Zarządzanie klientami"
              description="Kompleksowy CRM z historią kontaktów, płatnościami i preferencjami"
              accent="marineBlue"
            />
            <FeatureCard
              title="Ewidencja koni"
              description="Pełna dokumentacja koni, historii zdrowotnej i treningowej"
              accent="steelBlue"
            />
            <FeatureCard
              title="Raporty i analityka"
              description="Szczegółowe raporty finansowe, wykorzystania i statystyki"
              accent="slateBlue"
            />
            <FeatureCard
              title="Aplikacja mobilna"
              description="Dostęp do wszystkich funkcji z telefonu, w trybie offline"
              accent="blueGray"
            />
            <FeatureCard
              title="Widoczność w sieci"
              description="Profil stajni z kodem QR do łatwego udostępniania klientom"
              accent="mistBlue"
            />
          </div>

          {/* Additional Features as Transparent Round Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <TransparentButton title="Karnety i pakiety" />
            <TransparentButton title="Przypomnienia SMS" />
            <TransparentButton title="Płatności online" />
            <TransparentButton title="Kalendarz stajni" />
            <TransparentButton title="Powiadomienia email" />
            <TransparentButton title="Dokumentacja" />
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-deepNavy mb-6">
              Rozwiązania dla Twojej stajni
            </h2>
            <p className="text-xl text-marineBlue max-w-2xl mx-auto">
              Kompleksowe narzędzia dostosowane do potrzeb każdego ośrodka jeździeckiego
            </p>
          </div>

          {/* Solution 1: Text Left, Image Right */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="space-y-6">
              <h3 className="font-serif text-3xl font-bold text-deepNavy">
                Panel zarządzania stajnią
              </h3>
              <p className="text-lg text-marineBlue leading-relaxed">
                Intuicyjny panel, który pozwala na pełną kontrolę nad wszystkimi aspektami działalności Twojej stajni. Od zarządzania końmi, przez rezerwacje, aż po finanse.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-oceanBlue rounded-full mr-3"></div>
                  Szybki dostęp do wszystkich funkcji
                </li>
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-oceanBlue rounded-full mr-3"></div>
                  Automatyczne raporty i statystyki
                </li>
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-oceanBlue rounded-full mr-3"></div>
                  Bezpieczne przechowywanie danych
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-oceanBlue/20 to-marineBlue/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-iceBlue to-arcticBlue rounded-3xl p-8 border border-iceBlue">
                <div className="aspect-[4/3] bg-white/50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-oceanBlue/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-oceanBlue/40"></div>
                    </div>
                    <p className="text-marineBlue font-medium">Zdjęcie aplikacji</p>
                    <p className="text-sm text-blueGray">Panel zarządzania</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solution 2: Text Right, Image Left */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-marineBlue/20 to-steelBlue/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-arcticBlue to-iceBlue rounded-3xl p-8 border border-iceBlue">
                <div className="aspect-[4/3] bg-white/50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-marineBlue/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-marineBlue/40"></div>
                    </div>
                    <p className="text-marineBlue font-medium">Zdjęcie aplikacji</p>
                    <p className="text-sm text-blueGray">Kalendarz rezerwacji</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h3 className="font-serif text-3xl font-bold text-deepNavy">
                Inteligentny kalendarz rezerwacji
              </h3>
              <p className="text-lg text-marineBlue leading-relaxed">
                Automatyzacja procesu rezerwacji z systemem powiadomień i synchronizacją w czasie rzeczywistym. Koniec z podwójnymi rezerwacjami i nieporozumieniami.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-marineBlue rounded-full mr-3"></div>
                  Automatyczne powiadomienia SMS
                </li>
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-marineBlue rounded-full mr-3"></div>
                  Synchronizacja z kalendarzem Google
                </li>
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-marineBlue rounded-full mr-3"></div>
                  Historia wszystkich rezerwacji
                </li>
              </ul>
            </div>
          </div>

          {/* Solution 3: Text Left, Image Right */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h3 className="font-serif text-3xl font-bold text-deepNavy">
                Aplikacja mobilna dla klientów
              </h3>
              <p className="text-lg text-marineBlue leading-relaxed">
                Własna aplikacja mobilna dla Twoich klientów z kodem QR do łatwego udostępniania. Pełny dostęp do rezerwacji, informacji o koniach i komunikacji ze stajnią.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-steelBlue rounded-full mr-3"></div>
                  Łatwe udostępnianie kodem QR
                </li>
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-steelBlue rounded-full mr-3"></div>
                  Powiadomienia push
                </li>
                <li className="flex items-center text-deepNavy">
                  <div className="w-2 h-2 bg-steelBlue rounded-full mr-3"></div>
                  Dostęp offline
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-steelBlue/20 to-slateBlue/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-iceBlue to-arcticBlue rounded-3xl p-8 border border-iceBlue">
                <div className="aspect-[4/3] bg-white/50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-steelBlue/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-steelBlue/40"></div>
                    </div>
                    <p className="text-marineBlue font-medium">Zdjęcie aplikacji</p>
                    <p className="text-sm text-blueGray">Aplikacja mobilna</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-gradient-to-b from-white to-arcticBlue">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-deepNavy mb-6">
              Wybierz plan dla siebie
            </h2>
            <p className="text-xl text-marineBlue max-w-2xl mx-auto mb-8">
              Elastyczne ceny dopasowane do potrzeb Twojej stajni
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!annualBilling ? 'text-deepNavy' : 'text-marineBlue'}`}>
                Miesięcznie
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  annualBilling ? 'bg-oceanBlue' : 'bg-blueGray'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    annualBilling ? 'left-9' : 'left-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${annualBilling ? 'text-deepNavy' : 'text-marineBlue'}`}>
                Rocznie
              </span>
              <span className="text-xs text-oceanBlue font-medium bg-oceanBlue/10 px-3 py-1 rounded-full">
                -20%
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border border-iceBlue shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="font-serif text-2xl font-bold text-deepNavy mb-1">Bezpłatny</h3>
              <p className="text-sm text-marineBlue mb-6">Dla małych stajni</p>
              <div className="mb-8 pb-6 border-b border-iceBlue">
                <span className="text-5xl font-bold text-deepNavy">0 zł</span>
                <span className="text-marineBlue">/miesiąc</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-blueGray mr-3 mt-0.5 flex-shrink-0" />
                  <span>Do 5 koni</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-blueGray mr-3 mt-0.5 flex-shrink-0" />
                  <span>Kalendarz rezerwacji</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-blueGray mr-3 mt-0.5 flex-shrink-0" />
                  <span>Ewidencja klientów</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-blueGray mr-3 mt-0.5 flex-shrink-0" />
                  <span>Wizytówka stajni</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-blueGray mr-3 mt-0.5 flex-shrink-0" />
                  <span>Kod QR stajni</span>
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full border-iceBlue text-deepNavy hover:bg-iceBlue hover:border-oceanBlue">
                  Rozpocznij za darmo
                </Button>
              </Link>
            </div>

            {/* Standard Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-oceanBlue shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-oceanBlue to-marineBlue text-white text-xs font-medium px-4 py-1 rounded-full">
                Popularny
              </div>
              <h3 className="font-serif text-2xl font-bold text-deepNavy mb-1">Standard</h3>
              <p className="text-sm text-marineBlue mb-6">Dla rozwijających się stajni</p>
              <div className="mb-8 pb-6 border-b border-iceBlue">
                <span className="text-5xl font-bold text-deepNavy">
                  {annualBilling ? '31.99' : '39.99'}
                </span>
                <span className="text-marineBlue">/miesiąc</span>
                {annualBilling && (
                  <div className="text-sm text-oceanBlue mt-2">
                    <span className="line-through text-marineBlue mr-2">39.99 zł</span>
                    479.88 zł/rok
                  </div>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-oceanBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Do 20 koni</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-oceanBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Dostęp do wszystkich dostępnych funkcji</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-oceanBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>200 SMS/miesiąc</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-oceanBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Raporty i statystyki</span>
                </li>
              </ul>
              <Link href="/register">
                <Button size="lg" className="w-full bg-gradient-to-r from-deepNavy to-oceanBlue hover:from-midnightBlue hover:to-marineBlue text-white shadow-md">
                  Wybierz Standard
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-2xl p-8 border border-iceBlue shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <h3 className="font-serif text-2xl font-bold text-deepNavy mb-1">Premium</h3>
              <p className="text-sm text-marineBlue mb-6">Dla dużych ośrodków</p>
              <div className="mb-8 pb-6 border-b border-iceBlue">
                <span className="text-5xl font-bold text-deepNavy">
                  {annualBilling ? '63.99' : '79.99'}
                </span>
                <span className="text-marineBlue">/miesiąc</span>
                {annualBilling && (
                  <div className="text-sm text-oceanBlue mt-2">
                    <span className="line-through text-marineBlue mr-2">79.99 zł</span>
                    767.88 zł/rok
                  </div>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-marineBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Nieograniczona liczba koni</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-marineBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Dostęp do wszystkich dostępnych funkcji</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-marineBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>400 SMS/miesiąc</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-marineBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Raporty i statystyki</span>
                </li>
                <li className="flex items-start text-deepNavy">
                  <Check className="w-5 h-5 text-marineBlue mr-3 mt-0.5 flex-shrink-0" />
                  <span>Priorytetowe wsparcie</span>
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full border-iceBlue text-deepNavy hover:bg-iceBlue hover:border-marineBlue">
                  Wybierz Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-deepNavy via-oceanBlue to-marineBlue relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMHYyaDM2ek0zNiAzMHYyaC0zdjJoM3pNMzYgMjZ2MmgtM3YyaDN6TTM2IDIydjJoLTN2MjN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 text-center relative z-10">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white mb-6">
            Gotowy do rozpoczęcia?
          </h2>
          <p className="text-xl text-iceBlue mb-8 max-w-2xl mx-auto">
            Dołącz do setek stajni, które już korzystają z HORSEmanago
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-deepNavy hover:bg-iceBlue px-8 py-4 shadow-xl">
                Zarejestruj się za darmo
              </Button>
            </Link>
            <Link href="/stables">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 px-8 py-4">
                Wyszukaj stajnię
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description, accent }: { title: string; description: string; accent: string }) {
  const accentColors: Record<string, string> = {
    oceanBlue: 'bg-oceanBlue',
    marineBlue: 'bg-marineBlue',
    steelBlue: 'bg-steelBlue',
    slateBlue: 'bg-slateBlue',
    blueGray: 'bg-blueGray',
    mistBlue: 'bg-mistBlue',
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-iceBlue shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColors[accent]}`}></div>
      <div className={`absolute top-0 left-0 w-1 h-full ${accentColors[accent]}`}></div>
      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${accentColors[accent]}`}></div>
      <h3 className="font-serif text-xl font-semibold text-deepNavy mb-3">{title}</h3>
      <p className="text-marineBlue leading-relaxed">{description}</p>
    </div>
  );
}

function TransparentButton({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-oceanBlue/50 bg-gradient-to-r from-white/85 to-white/75 backdrop-blur-md text-deepNavy font-medium hover:from-white/90 hover:to-white/80 hover:border-oceanBlue/70 transition-all duration-300 text-sm sm:text-base shadow-sm">
      {title}
    </div>
  );
}
