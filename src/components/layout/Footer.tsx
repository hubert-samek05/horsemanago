import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/zdj/logohorsemanago"
                alt="Horsemanago"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold">Horsemanago</span>
            </div>
            <p className="text-navy-200 text-sm max-w-md">
              Kompleksowy system do zarządzania stajniami, klubami jeździeckimi 
              i ośrodkami jazdy konnej. Zautomatyzuj swoje procesy i skup się na tym, 
              co najważniejsze - koniach i klientach.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produkt</h3>
            <ul className="space-y-2 text-sm text-navy-200">
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Funkcje
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Cennik
                </Link>
              </li>
              <li>
                <Link href="/stables" className="hover:text-white transition-colors">
                  Wyszukaj stajnię
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Firma</h3>
            <ul className="space-y-2 text-sm text-navy-200">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  O nas
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Regulamin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-8 text-center text-sm text-navy-300">
          <p>&copy; {new Date().getFullYear()} Horsemanago. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
