'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePassStore } from '@/lib/store';
import api from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user, activeStableId, setActiveStable } = useAuthStore();
  const passHasHydrated = usePassStore((state) => state.hasHydrated);
  const [mounted, setMounted] = useState(false);
  const [stableResolved, setStableResolved] = useState(false);

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    usePassStore.persist.rehydrate();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && hasHydrated && !isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!mounted || !hasHydrated || !isAuthenticated()) return;

    const isStableOwner = user?.role === 'STABLE_OWNER' || user?.role === 'ADMIN';
    const isEmployee = user?.role === 'INSTRUCTOR' || user?.role === 'STABLE_WORKER';

    if (!isStableOwner && !isEmployee) {
      setStableResolved(true);
      return;
    }

    if (activeStableId) {
      setStableResolved(true);
      return;
    }

    const resolveStable = async () => {
      try {
        if (isStableOwner) {
          const { data } = await api.get('/stables/my/owned');
          if (Array.isArray(data) && data.length > 0) {
            setActiveStable(data[0].id);
          }
        } else if (isEmployee) {
          // For employees, get the stable they belong to
          const { data } = await api.get('/employees');
          if (Array.isArray(data) && data.length > 0) {
            setActiveStable(data[0].stableId);
          }
        }
      } catch (error) {
        console.error('Resolve stable error:', error);
      } finally {
        setStableResolved(true);
      }
    };
    resolveStable();
  }, [mounted, hasHydrated, isAuthenticated, user, activeStableId, setActiveStable]);

  if (!mounted || !hasHydrated || !passHasHydrated || !stableResolved) {
    return null;
  }

  return <>{children}</>;
}
