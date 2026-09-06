'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

// Tracks which user id the stable resolution was already attempted for.
// Resetting per-user (instead of a global once-flag) ensures that after
// logout -> login the active stable is resolved again, and that a failed
// attempt can be retried on the next mount.
let resolveAttemptedFor: string | null = null;

function StableResolver() {
  const { isAuthenticated, hasHydrated, user, activeStableId, activeRole, setActiveStable } = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated || !isAuthenticated()) return;
    const currentUserId = user?.id ?? null;
    if (resolveAttemptedFor === currentUserId) return;

    resolveAttemptedFor = currentUserId;

    const params = new URLSearchParams(window.location.search);
    const stableIdFromUrl = params.get('stableId');
    if (stableIdFromUrl && stableIdFromUrl !== activeStableId) {
      const roles = (user as any)?.roles;
      let role: string | undefined;
      if (roles?.STABLE_OWNER?.some((s: any) => s.stableId === stableIdFromUrl)) role = 'STABLE_OWNER';
      else if (roles?.INSTRUCTOR?.some((s: any) => s.stableId === stableIdFromUrl)) role = 'INSTRUCTOR';
      else if (roles?.STABLE_WORKER?.some((s: any) => s.stableId === stableIdFromUrl)) role = 'STABLE_WORKER';
      else if (user?.role === 'STABLE_OWNER' || user?.role === 'ADMIN') role = 'STABLE_OWNER';
      setActiveStable(stableIdFromUrl, role);
      return;
    }

    if (activeStableId && activeRole) return;

    const roles = (user as any)?.roles;
    const isStableOwnerGlobal = user?.role === 'STABLE_OWNER' || user?.role === 'ADMIN';
    const isEmployeeGlobal = user?.role === 'INSTRUCTOR' || user?.role === 'STABLE_WORKER';

    if (activeStableId && !activeRole) {
      if (roles?.STABLE_OWNER?.some((s: any) => s.stableId === activeStableId)) {
        setActiveStable(activeStableId, 'STABLE_OWNER');
      } else if (roles?.INSTRUCTOR?.some((s: any) => s.stableId === activeStableId)) {
        setActiveStable(activeStableId, 'INSTRUCTOR');
      } else if (roles?.STABLE_WORKER?.some((s: any) => s.stableId === activeStableId)) {
        setActiveStable(activeStableId, 'STABLE_WORKER');
      } else {
        setActiveStable(activeStableId, isStableOwnerGlobal ? 'STABLE_OWNER' : isEmployeeGlobal ? user!.role : 'CLIENT');
      }
      return;
    }

    const resolveStable = async () => {
      try {
        if (isStableOwnerGlobal || roles?.STABLE_OWNER?.length > 0) {
          const { data } = await api.get('/stables/my/owned');
          if (Array.isArray(data) && data.length > 0) {
            setActiveStable(data[0].id, 'STABLE_OWNER');
            return;
          }
        }
        if (isEmployeeGlobal || roles?.INSTRUCTOR?.length > 0 || roles?.STABLE_WORKER?.length > 0) {
          const { data } = await api.get('/employees');
          if (Array.isArray(data) && data.length > 0) {
            setActiveStable(data[0].stableId, data[0].type || (isEmployeeGlobal ? user!.role : 'INSTRUCTOR'));
          }
        }
      } catch (error) {
        console.error('Resolve stable error:', error);
        // Allow retry on next mount if resolution failed
        resolveAttemptedFor = null;
      }
    };
    resolveStable();
  }, [hasHydrated, isAuthenticated, user, activeStableId, activeRole, setActiveStable]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StableResolver />
      {children}
    </>
  );
}
