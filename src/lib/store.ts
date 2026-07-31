import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  activeStableId: string | null;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setActiveStable: (stableId: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      activeStableId: null,
      hasHydrated: false,
      setAuth: (user, token) => set({ user, token }),
      setActiveStable: (stableId) => set({ activeStableId: stableId }),
      logout: () => {
        set({ user: null, token: null, activeStableId: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },
      isAuthenticated: () => !!get().token,
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export interface Pass {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  type: string;
  typeName: string;
  totalRides: number;
  remainingRides: number;
  purchaseDate: string;
  expiryDate: string;
  price: number;
  status: 'active' | 'expired' | 'used';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'online';
  notes?: string;
}

interface PassState {
  passes: Pass[];
  hasHydrated: boolean;
  setPasses: (passes: Pass[]) => void;
  setHasHydrated: (state: boolean) => void;
}

export const usePassStore = create<PassState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
      passes: [
        {
          id: '1',
          clientId: 'c1',
          clientName: 'Anna Kowalska',
          clientPhone: '+48 123 456 789',
          type: 'pack_10',
          typeName: 'Pakiet 10 przejazdów',
          totalRides: 10,
          remainingRides: 7,
          purchaseDate: '2024-06-01',
          expiryDate: '2024-12-01',
          price: 500,
          status: 'active',
          paymentMethod: 'card',
          notes: 'Karnet prezentowy',
        },
        {
          id: '2',
          clientId: 'c2',
          clientName: 'Marek Nowak',
          clientPhone: '+48 987 654 321',
          type: 'monthly',
          typeName: 'Karnet miesięczny',
          totalRides: 20,
          remainingRides: 15,
          purchaseDate: '2024-06-15',
          expiryDate: '2024-07-15',
          price: 600,
          status: 'active',
          paymentMethod: 'transfer',
        },
        {
          id: '3',
          clientId: 'c3',
          clientName: 'Ewa Wiśniewska',
          clientPhone: '+48 555 123 456',
          type: 'pack_5',
          typeName: 'Pakiet 5 przejazdów',
          totalRides: 5,
          remainingRides: 0,
          purchaseDate: '2024-05-01',
          expiryDate: '2024-07-01',
          price: 300,
          status: 'used',
          paymentMethod: 'cash',
        },
      ],
      setPasses: (passes) => set({ passes }),
    }),
    {
      name: 'pass-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
