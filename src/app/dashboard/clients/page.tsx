'use client';

export const dynamic = 'force-static';
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
  const { user, isAuthenticated, activeStableId, activeRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const effectiveRole = activeRole || user?.role;
  const isStableOwner = effectiveRole === 'STABLE_OWNER' || effectiveRole === 'ADMIN';
  const isManager = effectiveRole === 'MANAGER';
  const canAddClients = isStableOwner || isManager;

  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [addClientError, setAddClientError] = useState('');
  const [addClientLoading, setAddClientLoading] = useState(false);
  const [editClientLoading, setEditClientLoading] = useState(false);
  const [editClientError, setEditClientError] = useState('');

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

  const resetAddClientForm = () => {
    setNewClientFirstName('');
    setNewClientLastName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setAddClientError('');
  };

  const handleAddClient = async () => {
    setAddClientError('');
    if (!newClientFirstName.trim() || !newClientEmail.trim()) {
      setAddClientError('Imię i email są wymagane');
      return;
    }
    setAddClientLoading(true);
    try {
      const { data } = await api.post('/clients', {
        stableId: activeStableId,
        firstName: newClientFirstName.trim(),
        lastName: newClientLastName.trim(),
        email: newClientEmail.trim(),
        phone: newClientPhone.trim() || undefined,
      });
      setClients([data, ...clients]);
      setShowModal(false);
      resetAddClientForm();
    } catch (error: any) {
      console.error('Add client error:', error);
      setAddClientError(error?.response?.data?.error || 'Nie udało się dodać klienta');
    } finally {
      setAddClientLoading(false);
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    setEditClientError('');
    setEditClientLoading(true);
    try {
      const { data } = await api.put(`/clients/${selectedClient.id}`, {
        firstName: selectedClient.user.firstName,
        lastName: selectedClient.user.lastName,
        email: selectedClient.user.email,
        phone: selectedClient.user.phone,
      });
      setClients(clients.map(c => c.id === selectedClient.id ? data : c));
      setSelectedClient(data);
    } catch (error: any) {
      console.error('Edit client error:', error);
      setEditClientError(error?.response?.data?.error || 'Nie udało się zaktualizować klienta');
    } finally {
      setEditClientLoading(false);
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

        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Masthead */}
          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-6 lg:p-10 flex flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Baza klientów</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Klienci</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj klientami stajni i przeglądaj historię wizyt.
                </p>
              </div>
              {canAddClients && (
                <button
                  onClick={() => setShowModal(true)}
                  className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-deepNavy rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
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
                            onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
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

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-deepNavy">Edytuj klienta</h2>
              <button
                onClick={() => { setSelectedClient(null); setEditClientError(''); }}
                className="p-2 hover:bg-arcticBlue rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-marineBlue" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-1.5">Imię *</label>
                  <input
                    type="text"
                    value={selectedClient.user.firstName}
                    onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, firstName: e.target.value}})}
                    className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-1.5">Nazwisko</label>
                  <input
                    type="text"
                    value={selectedClient.user.lastName}
                    onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, lastName: e.target.value}})}
                    className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-1.5">Email *</label>
                <input
                  type="email"
                  value={selectedClient.user.email}
                  onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, email: e.target.value}})}
                  className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={selectedClient.user.phone || ''}
                  onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, phone: e.target.value}})}
                  className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-1.5">Status</label>
                <select
                  value={selectedClient.status}
                  onChange={(e) => setSelectedClient({...selectedClient, status: e.target.value})}
                  className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                >
                  <option value="accepted">Aktywny</option>
                  <option value="pending">Oczekujący</option>
                  <option value="inactive">Nieaktywny</option>
                </select>
              </div>

              {editClientError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editClientError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleEditClient}
                  disabled={editClientLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {editClientLoading ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button
                  onClick={() => handleDeleteClient(selectedClient.id)}
                  className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-deepNavy">Dodaj klienta</h2>
              <button
                onClick={() => { setShowModal(false); resetAddClientForm(); }}
                className="p-2 hover:bg-arcticBlue rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-marineBlue" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-1.5">Imię *</label>
                  <input
                    type="text"
                    value={newClientFirstName}
                    onChange={(e) => setNewClientFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    placeholder="Jan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-1.5">Nazwisko</label>
                  <input
                    type="text"
                    value={newClientLastName}
                    onChange={(e) => setNewClientLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    placeholder="Kowalski"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-1.5">Email *</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                  placeholder="jan.kowalski@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deepNavy mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-arcticBlue/30 border border-iceBlue rounded-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                  placeholder="+48 600 000 000"
                />
              </div>

              <p className="text-xs text-marineBlue/80 bg-iceBlue/50 rounded-xl p-3">
                Jeśli klient nie ma jeszcze konta w HORSEmanago, otrzyma email z zaproszeniem do jego utworzenia.
                Terminy i wizyty będą przypisane do niego już teraz i zobaczy je po zalogowaniu.
              </p>

              {addClientError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addClientError}</span>
                </div>
              )}

              <button
                onClick={handleAddClient}
                disabled={addClientLoading}
                className="w-full py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {addClientLoading ? 'Dodawanie...' : 'Dodaj klienta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
