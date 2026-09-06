'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Plus, Search, Mail, Phone, Calendar, Menu, X, AlertCircle, ChevronRight, Users, UserCheck, Clock, UserPlus, Trash2 } from 'lucide-react';
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

const STATUS_TABS = [
  { value: 'all', label: 'Wszyscy' },
  { value: 'accepted', label: 'Aktywni' },
  { value: 'pending', label: 'Oczekujący' },
  { value: 'inactive', label: 'Nieaktywni' },
];

const statusBadge = (status: string) => {
  switch (status) {
    case 'accepted':
      return { label: 'Aktywny', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
    case 'pending':
      return { label: 'Oczekujący', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
    default:
      return { label: 'Nieaktywny', cls: 'bg-slate-100 text-slate-500 ring-slate-500/20' };
  }
};

export default function ClientsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId, activeRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [addClientError, setAddClientError] = useState('');
  const [addClientLoading, setAddClientLoading] = useState(false);
  const [editClientLoading, setEditClientLoading] = useState(false);
  const [editClientError, setEditClientError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const effectiveRole = activeRole || user?.role;
  const isStableOwner = effectiveRole === 'STABLE_OWNER' || effectiveRole === 'ADMIN';
  const isManager = effectiveRole === 'MANAGER';
  const [canManageClients, setCanManageClients] = useState(false);
  const canAddClients = isStableOwner || isManager || canManageClients;

  useEffect(() => {
    if (isStableOwner || isManager || !activeStableId || !user?.id) return;
    const loadPermissions = async () => {
      try {
        const { data } = await api.get(`/employees?stableId=${activeStableId}`);
        const me = (data || []).find((e: any) => e.userId === user.id || e.user?.id === user.id);
        setCanManageClients(me?.permissions?.manageClients === true);
      } catch {
        setCanManageClients(false);
      }
    };
    loadPermissions();
  }, [activeStableId, user?.id, isStableOwner, isManager]);

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

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.user.phone && client.user.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'accepted').length,
    pending: clients.filter(c => c.status === 'pending').length,
    newThisMonth: clients.filter(c => {
      const d = new Date(c.joinedAt || c.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) return;
    try {
      await api.delete(`/clients/${clientId}`);
      setClients(clients.filter(c => c.id !== clientId));
      setSelectedClient(null);
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
        status: selectedClient.status,
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

  const inputCls = 'w-full px-4 py-2.5 bg-white border border-iceBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanBlue/30 focus:border-oceanBlue text-deepNavy text-sm transition-all placeholder:text-marineBlue/50';
  const labelCls = 'block text-xs font-semibold text-marineBlue uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen bg-arcticBlue">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="lg:ml-72 min-h-screen pb-24 lg:pb-12">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-iceBlue px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Image
            src="/zdj/horsemanagologo3"
            alt="HORSEmanago"
            width={90}
            height={90}
            className="rounded-lg"
          />
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-arcticBlue rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-deepNavy" />
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-oceanBlue mb-2">Baza klientów</p>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold text-deepNavy">Klienci</h1>
              <p className="text-marineBlue text-sm mt-2 max-w-md">
                Zarządzaj klientami stajni, ich statusami i danymi kontaktowymi.
              </p>
            </div>
            {canAddClients && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-oceanBlue text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-marineBlue transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Dodaj klienta
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
            {[
              { label: 'Wszyscy klienci', value: stats.total, icon: Users },
              { label: 'Aktywni', value: stats.active, icon: UserCheck },
              { label: 'Oczekujący', value: stats.pending, icon: Clock },
              { label: 'Nowi w tym miesiącu', value: stats.newThisMonth, icon: UserPlus },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-iceBlue p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-marineBlue">{s.label}</p>
                  <s.icon className="w-4 h-4 text-blueGray" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-deepNavy">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blueGray w-4 h-4" />
              <input
                type="text"
                placeholder="Szukaj po imieniu, nazwisku, emailu lub telefonie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-iceBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanBlue/30 focus:border-oceanBlue text-deepNavy placeholder:text-marineBlue/50 text-sm transition-all"
              />
            </div>
            <div className="flex gap-1 bg-white border border-iceBlue rounded-lg p-1 overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    statusFilter === tab.value
                      ? 'bg-oceanBlue text-white'
                      : 'text-marineBlue hover:text-deepNavy hover:bg-arcticBlue'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clients List */}
          {loading ? (
            <div className="bg-white rounded-xl border border-iceBlue p-16 text-center">
              <div className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-iceBlue border-t-oceanBlue" />
              <p className="mt-4 text-sm text-marineBlue">Ładowanie klientów...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white rounded-xl border border-iceBlue p-12 lg:p-16 text-center">
              <div className="w-14 h-14 rounded-xl bg-arcticBlue flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-oceanBlue" />
              </div>
              <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Brak wyników' : 'Brak klientów'}
              </h3>
              <p className="text-sm text-marineBlue mb-6 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Spróbuj zmienić kryteria wyszukiwania lub filtr.'
                  : 'Dodaj pierwszego klienta ręcznie lub poczekaj, aż dołączą przez publiczną wizytówkę stajni.'}
              </p>
              {canAddClients && !searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 bg-oceanBlue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-marineBlue transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj klienta
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-iceBlue overflow-hidden divide-y divide-iceBlue/70">
              {filteredClients.map((client) => {
                const badge = statusBadge(client.status);
                const fullName = `${client.user.firstName} ${client.user.lastName}`.trim();
                return (
                  <button
                    key={client.id}
                    onClick={() => { setSelectedClient(client); setEditClientError(''); }}
                    className="w-full flex items-center gap-4 px-4 lg:px-6 py-4 text-left hover:bg-arcticBlue/60 transition-colors group"
                  >
                    {client.user.avatar ? (
                      <img src={client.user.avatar} alt={fullName} className="w-11 h-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-oceanBlue/10 text-oceanBlue flex items-center justify-center font-semibold text-sm shrink-0">
                        {client.user.firstName.charAt(0)}{client.user.lastName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-semibold text-deepNavy text-sm">{fullName}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-marineBlue">
                        <span className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{client.user.email}</span>
                        </span>
                        {client.user.phone && (
                          <span className="hidden sm:flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {client.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:block text-xs text-marineBlue shrink-0">
                      Od {client.joinedAt ? new Date(client.joinedAt).toLocaleDateString('pl-PL') : new Date(client.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                    <ChevronRight className="w-4 h-4 text-blueGray group-hover:text-oceanBlue transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MobileNav user={user} />

      {/* Client Detail / Edit Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-deepNavy/50 p-0 sm:p-4" onClick={() => { setSelectedClient(null); setEditClientError(''); }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3.5">
                {selectedClient.user.avatar ? (
                  <img src={selectedClient.user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-oceanBlue/10 text-oceanBlue flex items-center justify-center font-semibold">
                    {selectedClient.user.firstName.charAt(0)}{selectedClient.user.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-lg font-bold text-deepNavy">Edytuj klienta</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset mt-0.5 ${statusBadge(selectedClient.status).cls}`}>
                    {statusBadge(selectedClient.status).label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedClient(null); setEditClientError(''); }}
                className="p-2 hover:bg-arcticBlue rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-marineBlue" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Imię *</label>
                  <input
                    type="text"
                    value={selectedClient.user.firstName}
                    onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, firstName: e.target.value}})}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nazwisko</label>
                  <input
                    type="text"
                    value={selectedClient.user.lastName}
                    onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, lastName: e.target.value}})}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  value={selectedClient.user.email}
                  onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, email: e.target.value}})}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Telefon</label>
                <input
                  type="tel"
                  value={selectedClient.user.phone || ''}
                  onChange={(e) => setSelectedClient({...selectedClient, user: {...selectedClient.user, phone: e.target.value}})}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'accepted', l: 'Aktywny' },
                    { v: 'pending', l: 'Oczekujący' },
                    { v: 'inactive', l: 'Nieaktywny' },
                  ].map((s) => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => setSelectedClient({...selectedClient, status: s.v})}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedClient.status === s.v
                          ? 'bg-oceanBlue text-white border-oceanBlue'
                          : 'bg-white text-marineBlue border-iceBlue hover:border-oceanBlue/40'
                      }`}
                    >
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {editClientError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editClientError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditClient}
                  disabled={editClientLoading}
                  className="flex-1 py-2.5 bg-oceanBlue text-white rounded-lg text-sm font-semibold hover:bg-marineBlue transition-colors disabled:opacity-60"
                >
                  {editClientLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
                <button
                  onClick={() => handleDeleteClient(selectedClient.id)}
                  className="px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-deepNavy/50 p-0 sm:p-4" onClick={() => { setShowModal(false); resetAddClientForm(); }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="font-serif text-lg font-bold text-deepNavy">Dodaj klienta</h2>
              <button
                onClick={() => { setShowModal(false); resetAddClientForm(); }}
                className="p-2 hover:bg-arcticBlue rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-marineBlue" />
              </button>
            </div>
            <p className="text-sm text-marineBlue mb-6">Wypełnij dane — klient bez konta dostanie email z zaproszeniem.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Imię *</label>
                  <input
                    type="text"
                    value={newClientFirstName}
                    onChange={(e) => setNewClientFirstName(e.target.value)}
                    className={inputCls}
                    placeholder="Jan"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nazwisko</label>
                  <input
                    type="text"
                    value={newClientLastName}
                    onChange={(e) => setNewClientLastName(e.target.value)}
                    className={inputCls}
                    placeholder="Kowalski"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className={inputCls}
                  placeholder="jan.kowalski@example.com"
                />
              </div>

              <div>
                <label className={labelCls}>Telefon</label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className={inputCls}
                  placeholder="+48 600 000 000"
                />
              </div>

              <div className="flex items-start gap-3 bg-arcticBlue border border-iceBlue rounded-lg p-3.5">
                <Mail className="w-4 h-4 text-oceanBlue shrink-0 mt-0.5" />
                <p className="text-xs text-marineBlue leading-relaxed">
                  Jeśli klient nie ma jeszcze konta w HORSEmanago, otrzyma email z zaproszeniem do jego utworzenia. Terminy i wizyty będą przypisane do niego już teraz.
                </p>
              </div>

              {addClientError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addClientError}</span>
                </div>
              )}

              <button
                onClick={handleAddClient}
                disabled={addClientLoading}
                className="w-full py-3 bg-oceanBlue text-white rounded-lg text-sm font-semibold hover:bg-marineBlue transition-colors disabled:opacity-60"
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
