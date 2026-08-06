import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  roles?: {
    STABLE_OWNER?: Array<{ stableId: string; stableName: string }>;
    INSTRUCTOR?: Array<{ stableId: string; stableName: string }>;
    STABLE_WORKER?: Array<{ stableId: string; stableName: string }>;
    CLIENT?: Array<{ stableId: string; stableName: string }>;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  activeStableId: string | null;
  activeRole: string | null;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setActiveStable: (stableId: string, role?: string) => void;
  setActiveRole: (role: string) => void;
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
      activeRole: null,
      hasHydrated: false,
      setAuth: (user, token) => set({ user, token }),
      setActiveStable: (stableId, role) => set(role ? { activeStableId: stableId, activeRole: role } : { activeStableId: stableId }),
      setActiveRole: (role) => set({ activeRole: role }),
      logout: () => {
        set({ user: null, token: null, activeStableId: null, activeRole: null });
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

export const usePassStore = create<PassState>()((set) => ({
  hasHydrated: false,
  setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
  passes: [],
  setPasses: (passes) => set({ passes }),
}));
