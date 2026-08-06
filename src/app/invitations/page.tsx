'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, User, Wrench, Check, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Invitation {
  id: string;
  type: 'INSTRUCTOR' | 'STABLE_WORKER';
  stableId: string;
  stableName: string;
  createdAt: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchInvitations();
  }, [hasHydrated, isAuthenticated, router]);

  const fetchInvitations = async () => {
    try {
      const { data } = await api.get('/employees/invitations/pending');
      setInvitations(data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setAccepting(invitationId);
    try {
      await api.post(`/employees/${invitationId}/accept`);
      await fetchInvitations();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    setRejecting(invitationId);
    try {
      await api.post(`/employees/${invitationId}/reject`);
      await fetchInvitations();
    } catch (error) {
      console.error('Failed to reject invitation:', error);
    } finally {
      setRejecting(null);
    }
  };

  const getRoleIcon = (type: string) => {
    switch (type) {
      case 'INSTRUCTOR': return <User className="w-6 h-6" />;
      case 'STABLE_WORKER': return <Wrench className="w-6 h-6" />;
      default: return <Building2 className="w-6 h-6" />;
    }
  };

  const getRoleLabel = (type: string) => {
    switch (type) {
      case 'INSTRUCTOR': return 'Instruktor';
      case 'STABLE_WORKER': return 'Pracownik';
      default: return type;
    }
  };

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'INSTRUCTOR': return 'from-emerald-600 to-teal-600';
      case 'STABLE_WORKER': return 'from-amber-600 to-orange-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-deepNavy mx-auto" />
          <p className="mt-4 text-marineBlue">Ładowanie zaproszeń...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/zdj/horsemanagologo3"
              alt="HORSEmanago"
              width={120}
              height={120}
              className="rounded-lg mx-auto"
            />
          </Link>
          <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Zaproszenia do stajni</h1>
          <p className="text-marineBlue text-sm">Masz {invitations.length} zaproszenie{invitations.length !== 1 ? 'a' : ''} do zaakceptowania.</p>
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-marineBlue mb-4">Nie masz żadnych oczekujących zaproszeń.</p>
            <button
              onClick={() => router.push('/select-stable')}
              className="px-6 py-3 bg-gradient-to-r from-deepNavy to-oceanBlue text-white rounded-xl font-medium hover:from-oceanBlue hover:to-marineBlue transition-all"
            >
              Przejdź do wyboru stajni
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(invitation.type)} text-white flex items-center justify-center`}>
                    {getRoleIcon(invitation.type)}
                  </div>
                  <span className="text-xs text-marineBlue">
                    {new Date(invitation.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-deepNavy mb-1">{invitation.stableName}</h3>
                <p className="text-sm text-marineBlue mb-4">{getRoleLabel(invitation.type)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(invitation.id)}
                    disabled={accepting === invitation.id || rejecting === invitation.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accepting === invitation.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Akceptuj
                  </button>
                  <button
                    onClick={() => handleReject(invitation.id)}
                    disabled={accepting === invitation.id || rejecting === invitation.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejecting === invitation.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Odrzuć
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/select-stable')}
            className="text-sm text-marineBlue hover:text-deepNavy transition-colors"
          >
            Przejdź do wyboru stajni
          </button>
        </div>
      </div>
    </div>
  );
}
