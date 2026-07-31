'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Mail, Phone, Calendar, Menu, X, Clock, CreditCard, Ticket, Check, AlertCircle, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface Client {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    createdAt: string;
  };
  stableId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt?: string;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadClients = async () => {
      try {
        const { data } = await api.get(`/clients?stableId=${activeStableId}`);
        setClients(data || []);
      } catch (error) {
        console.error('Load clients error:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, [activeStableId]);

  const filteredClients = clients.filter(client =>
    client.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.user.phone && client.user.phone.includes(searchTerm))
  );

  const handleUpdateStatus = async (clientId: string, status: string) => {
    try {
      await api.put(`/clients/${clientId}`, { status });
      setClients(clients.map(c => c.id === clientId ? { ...c, status } : c));
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) return;
    try {
      await api.delete(`/clients/${clientId}`);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Delete client error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie klientów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      
      <div className="lg:ml-72 min-h-screen pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-deepNavy to-oceanBlue text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <Image
            src="/zdj/horsemanagologo3"
            alt="HORSEmanago"
            width={100}
            height={100}
            className="rounded-lg"
          />
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 lg:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-1">Klienci</h1>
              <p className="text-marineBlue text-sm">Zarządzaj klientami stajni i przeglądaj historię wizyt</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-5 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Dodaj klienta</span>
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj klienta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
            />
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-lg border border-iceBlue overflow-hidden">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-oceanBlue" />
                </div>
                <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak klientów</h3>
                <p className="text-marineBlue mb-6">Zarządzaj klientami stajni i przeglądaj historię wizyt</p>
                <p className="text-sm text-marineBlue/70 mb-6">Klienci mogą dołączyć do Twojej stajni przez publiczną wizytówkę</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-arcticBlue/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Klient</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Kontakt</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Dołączył</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iceBlue">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-iceBlue/20 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white font-bold shadow-md">
                            {client.user.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-deepNavy">{client.user.firstName} {client.user.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm text-marineBlue">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {client.user.email}</span>
                          {client.user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {client.user.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                          client.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {client.status === 'accepted' ? 'Aktywny' : client.status === 'pending' ? 'Oczekujący' : client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-marineBlue">{client.joinedAt ? new Date(client.joinedAt).toLocaleDateString('pl-PL') : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(client.id, client.status === 'accepted' ? 'inactive' : 'accepted'); }}
                            className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {filteredClients.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-oceanBlue" />
                </div>
                <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak klientów</h3>
                <p className="text-marineBlue mb-6">Zarządzaj klientami stajni i przeglądaj historię wizyt</p>
                <p className="text-sm text-marineBlue/70 mb-6">Klienci mogą dołączyć do Twojej stajni przez publiczną wizytówkę</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="bg-white rounded-2xl p-4 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white text-lg font-bold shadow-md">
                        {client.user.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-deepNavy">{client.user.firstName} {client.user.lastName}</div>
                        <div className="text-xs text-marineBlue">{client.user.email}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-marineBlue" />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      client.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                      client.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {client.status === 'accepted' ? 'Aktywny' : client.status === 'pending' ? 'Oczekujący' : client.status}
                    </span>
                  </div>
                  <div className="text-sm text-marineBlue space-y-1">
                    {client.user.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {client.user.phone}</div>}
                    {client.joinedAt && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(client.joinedAt).toLocaleDateString('pl-PL')}</div>}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
