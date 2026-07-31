'use client';

import { useEffect } from 'react';
import { useAuthStore, usePassStore } from '@/lib/store';

export default function StoreHydration() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    usePassStore.persist.rehydrate();
  }, []);

  return null;
}
