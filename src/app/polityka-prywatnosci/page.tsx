'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PolitykaPrywatnosci() {
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
              <Link href="/" className="text-deepNavy hover:text-oceanBlue transition-colors font-medium">
                Strona główna
              </Link>
              <Link href="/login" className="text-deepNavy hover:text-oceanBlue transition-colors font-medium">
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-deepNavy mb-8">Polityka Prywatności</h1>
          
          <div className="prose prose-lg max-w-none text-deepNavy">
            <p className="text-lg mb-6">
              Niniejsza Polityka Prywatności określa zasady przetwarzania danych osobowych 
              przez HORSEmanago.net (dalej: "Administrator") oraz prawa użytkowników związane 
              z przetwarzaniem ich danych osobowych.
            </p>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">1. Administrator Danych Osobowych</h2>
            <p className="mb-4">
              Administratorem Twoich danych osobowych jest HORSEmanago.net. 
              W razie pytań dotyczących przetwarzania danych osobowych możesz skontaktować się z nami 
              pod adresem e-mail: kontakt@horsemango.net
            </p>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">2. Rodzaje przetwarzanych danych</h2>
            <p className="mb-4">Przetwarzamy następujące rodzaje danych osobowych:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Dane rejestracyjne: imię, nazwisko, adres e-mail, numer telefonu</li>
              <li>Dane konta: nazwa użytkownika, hasło (w formie zahaszowanej)</li>
              <li>Dane profilowe: zdjęcie profilowe, opis profilu</li>
              <li>Dane koni: imię konia, rasa, wiek, historia zdrowia</li>
              <li>Dane rezerwacji: terminy, usługi, preferencje</li>
              <li>Dane płatności: informacje niezbędne do realizacji płatności</li>
            </ul>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">3. Cele przetwarzania danych</h2>
            <p className="mb-4">Twoje dane osobowe przetwarzamy w następujących celach:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Realizacji umowy o świadczenie usług drogą elektroniczną</li>
              <li>Zapewnienia bezpieczeństwa konta i danych użytkownika</li>
              <li>Komunikacji z użytkownikiem</li>
              <li>Personalizacji usług i treści</li>
              <li>Analityki i statystyk</li>
              <li>Realizacji płatności</li>
            </ul>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">4. Podstawa prawna przetwarzania</h2>
            <p className="mb-4">
              Podstawą prawną przetwarzania Twoich danych osobowych jest:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Art. 6 ust. 1 lit. a) RODO - zgoda użytkownika</li>
              <li>Art. 6 ust. 1 lit. b) RODO - realizacja umowy</li>
              <li>Art. 6 ust. 1 lit. c) RODO - obowiązek prawny</li>
              <li>Art. 6 ust. 1 lit. f) RODO - prawnie uzasadniony interes Administratora</li>
            </ul>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">5. Odbiorcy danych</h2>
            <p className="mb-4">
              Twoje dane osobowe mogą być udostępnione następującym odbiorcom:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Podmiotom świadczącym usługi hostingowe</li>
              <li>Podmiotom obsługującym płatności</li>
              <li>Podmiotom providing wsparcie techniczne</li>
              <li>Organom państwowym w przypadkach przewidzianych przez prawo</li>
            </ul>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">6. Okres przechowywania danych</h2>
            <p className="mb-4">
              Twoje dane osobowe będą przechowywane przez okres niezbędny do realizacji celów, 
              dla których zostały zebrane, chyba że przepisy prawa wymagają dłuższego okresu przechowywania.
            </p>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">7. Prawa użytkownika</h2>
            <p className="mb-4">Przysługują Ci następujące prawa:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Prawo dostępu do swoich danych</li>
              <li>Prawo do sprostowania danych</li>
              <li>Prawo do usunięcia danych</li>
              <li>Prawo do ograniczenia przetwarzania</li>
              <li>Prawo do przenoszenia danych</li>
              <li>Prawo do sprzeciwu</li>
              <li>Prawo do wycofania zgody</li>
            </ul>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">8. Cookies</h2>
            <p className="mb-4">
              Nasza strona wykorzystuje pliki cookies w celu poprawy jakości usług 
              i personalizacji treści. Możesz zarządzać ustawieniami cookies w przeglądarce.
            </p>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">9. Zmiany w polityce prywatności</h2>
            <p className="mb-4">
              Administrator zastrzega sobie prawo do zmiany niniejszej Polityki Prywatności. 
              O zmianach użytkownicy będą informowani drogą elektroniczną.
            </p>

            <h2 className="text-2xl font-bold text-deepNavy mt-8 mb-4">10. Kontakt</h2>
            <p className="mb-4">
              W razie pytań dotyczących niniejszej Polityki Prywatności prosimy o kontakt:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>E-mail: kontakt@horsemango.net</li>
              <li>Adres: HORSEmanago.net</li>
            </ul>

            <p className="text-sm text-gray-600 mt-8">
              Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-deepNavy text-white py-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© 2024 HORSEmanago.net. Wszelkie prawa zastrzeżone.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/polityka-prywatnosci" className="text-sm hover:text-oceanBlue transition-colors">
                Polityka Prywatności
              </Link>
              <Link href="/regulamin" className="text-sm hover:text-oceanBlue transition-colors">
                Regulamin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
