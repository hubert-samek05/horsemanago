'use client';

export const dynamic = 'force-dynamic';
import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const direct = urlParams.get('direct');
      if (!direct) {
        router.push('/welcome');
      }
    }
  }, [router]);

  return null;
}
