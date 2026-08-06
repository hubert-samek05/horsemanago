'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore, usePassStore, Pass } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, Filter, BarChart3, PieChart, TrendingUp, Ticket, User, Calendar, CreditCard, CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react';
import api from '@/lib/api';

interface PassTypeConfig {
  id: string;
  value: string;
  label: string;
  rides: number;
  defaultPrice: number;
  validityDays?: number;
  active: boolean;
}

export default function PassesPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId, activeRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'passes' | 'types' | 'reports'>('passes');

  const effectiveRole = activeRole || user?.role;
  const isStableOwner = effectiveRole === 'STABLE_OWNER' || effectiveRole === 'ADMIN';
  const isEmployee = effectiveRole === 'INSTRUCTOR' || effectiveRole === 'STABLE_WORKER';
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPass, setEditingPass] = useState<Pass | null>(null);
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  const [passSearchTerm, setPassSearchTerm] = useState('');
  const [passStatusFilter, setPassStatusFilter] = useState<string>('all');
  const [passTypeFilter, setPassTypeFilter] = useState<string>('all');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingPassType, setEditingPassType] = useState<PassTypeConfig | null>(null);
  const [typeForm, setTypeForm] = useState({
    value: '',
    label: '',
    rides: 0,
    defaultPrice: 0,
    validityDays: undefined as number | undefined,
    active: true,
  });
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    type: 'pack_10' as Pass['type'],
    typeName: 'Pakiet 10 przejazdów',
    totalRides: 10,
    remainingRides: 10,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    price: 0,
    status: 'active' as Pass['status'],
    paymentMethod: 'card' as Pass['paymentMethod'],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const passes = usePassStore((state) => state.passes);
  const setPasses = usePassStore((state) => state.setPasses);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [passesRes, passTypesRes, clientsRes] = await Promise.all([
          api.get(`/passes?stableId=${activeStableId}`),
          api.get(`/passes/types?stableId=${activeStableId}`),
          api.get(`/clients?stableId=${activeStableId}`)
        ]);
        setPasses(passesRes.data || []);
        setPassTypes(passTypesRes.data || []);
        setClients(clientsRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setPasses([]);
        setPassTypes([]);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeStableId, setPasses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie karnetów...</p>
        </div>
      </div>
    );
  }

  const [passTypes, setPassTypes] = useState<PassTypeConfig[]>([]);

  const paymentMethods = [
    { value: 'cash', label: 'Gotówka' },
    { value: 'card', label: 'Karta' },
    { value: 'transfer', label: 'Przelew' },
    { value: 'online', label: 'Płatność online' },
  ];

  const handleAddPass = () => {
    setFormData({
      clientId: '',
      clientName: '',
      clientPhone: '',
      type: 'pack_10',
      typeName: 'Pakiet 10 przejazdów',
      totalRides: 10,
      remainingRides: 10,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      price: 0,
      status: 'active',
      paymentMethod: 'card',
      notes: '',
    });
    setEditingPass(null);
    setShowAddModal(true);
  };

  const handleEditPass = (pass: Pass) => {
    setFormData({
      clientId: pass.clientId,
      clientName: pass.clientName,
      clientPhone: pass.clientPhone,
      type: pass.type,
      typeName: pass.typeName,
      totalRides: pass.totalRides,
      remainingRides: pass.remainingRides,
      purchaseDate: pass.purchaseDate,
      expiryDate: pass.expiryDate,
      price: pass.price,
      status: pass.status,
      paymentMethod: pass.paymentMethod,
      notes: pass.notes || '',
    });
    setEditingPass(pass);
    setShowAddModal(true);
  };

  const handleDeletePass = async (id: string) => {
    try {
      await api.delete(`/passes/${id}`);
      setPasses(passes.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete pass error:', error);
      alert('Nie udało się usunąć karnetu');
    }
  };

  const handleUseRide = async (pass: Pass) => {
    if (pass.remainingRides > 0) {
      try {
        const { data } = await api.put(`/passes/${pass.id}/use-ride`);
        setPasses(passes.map(p => p.id === pass.id ? data : p));
      } catch (error) {
        console.error('Use ride error:', error);
        alert('Nie udało się odliczyć przejazdu');
      }
    }
  };

  const handleAddPassType = () => {
    setTypeForm({ value: '', label: '', rides: 0, defaultPrice: 0, validityDays: undefined, active: true });
    setEditingPassType(null);
    setShowTypeModal(true);
  };

  const handleEditPassType = (type: PassTypeConfig) => {
    setTypeForm({
      value: type.value,
      label: type.label,
      rides: type.rides,
      defaultPrice: type.defaultPrice,
      validityDays: type.validityDays,
      active: type.active,
    });
    setEditingPassType(type);
    setShowTypeModal(true);
  };

  const handleDeletePassType = async (id: string) => {
    try {
      await api.delete(`/passes/types/${id}`);
      setPassTypes(passTypes.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete pass type error:', error);
      alert('Nie udało się usunąć typu karnetu');
    }
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPassType) {
        const { data } = await api.put(`/passes/types/${editingPassType.id}`, { ...typeForm, stableId: activeStableId });
        setPassTypes(passTypes.map(t => t.id === editingPassType.id ? data : t));
      } else {
        const { data } = await api.post('/passes/types', { ...typeForm, stableId: activeStableId });
        setPassTypes([...passTypes, data]);
      }
      setShowTypeModal(false);
    } catch (error) {
      console.error('Save pass type error:', error);
      alert('Nie udało się zapisać typu karnetu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPass) {
        const { data } = await api.put(`/passes/${editingPass.id}`, formData);
        setPasses(passes.map(p => p.id === editingPass.id ? data : p));
      } else {
        const { data } = await api.post('/passes', { ...formData, stableId: activeStableId });
        setPasses([...passes, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save pass error:', error);
      alert('Nie udało się zapisać karnetu');
    }
  };

  const handleTypeChange = (type: Pass['type']) => {
    const selectedType = passTypes.find(t => t.value === type);
    if (selectedType) {
      setFormData({
        ...formData,
        type,
        typeName: selectedType.label,
        totalRides: selectedType.rides,
        remainingRides: selectedType.rides,
        price: selectedType.defaultPrice,
      });
    }
  };

  const getPassStats = () => {
    const totalPasses = passes.length;
    const activePasses = passes.filter(p => p.status === 'active').length;
    const expiredPasses = passes.filter(p => p.status === 'expired').length;
    const usedPasses = passes.filter(p => p.status === 'used').length;
    const totalRevenue = passes.reduce((sum, p) => sum + p.price, 0);
    const totalRemainingRides = passes.reduce((sum, p) => sum + p.remainingRides, 0);

    return {
      totalPasses,
      activePasses,
      expiredPasses,
      usedPasses,
      totalRevenue,
      totalRemainingRides,
    };
  };

  const stats = getPassStats();

  const filteredPasses = passes.filter(p => {
    const searchMatch = passSearchTerm === '' ||
      p.clientName.toLowerCase().includes(passSearchTerm.toLowerCase()) ||
      p.clientPhone.toLowerCase().includes(passSearchTerm.toLowerCase()) ||
      p.typeName.toLowerCase().includes(passSearchTerm.toLowerCase());
    const statusMatch = passStatusFilter === 'all' || p.status === passStatusFilter;
    const typeMatch = passTypeFilter === 'all' || p.type === passTypeFilter;
    return searchMatch && statusMatch && typeMatch;
  });

  const reportPasses = passes.filter(p => {
    if (!reportStartDate || !reportEndDate) return true;
    return p.purchaseDate >= reportStartDate && p.purchaseDate <= reportEndDate;
  });

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
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Sprzedaż</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Karnety</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj karnetami i pakietami przejazdów.
                </p>
              </div>
              <button
                onClick={handleAddPass}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-deepNavy rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Wszystkie</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalPasses}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Aktywne</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.activePasses}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Wykorzystane</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.usedPasses}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-marineBlue">Wygasłe</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.expiredPasses}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Pozostałe przejazdy</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalRemainingRides}</p>
            </div>
            {isStableOwner && (
              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-marineBlue">Przychód</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue} zł</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('passes')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'passes'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Karnety sprzedane
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'types'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Typy karnetów
            </button>
            {isStableOwner && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'reports'
                    ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                    : 'bg-white text-deepNavy hover:bg-iceBlue'
                }`}
              >
                Raporty
              </button>
            )}
          </div>

          {activeTab === 'passes' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj karnetu lub klienta..."
                    value={passSearchTerm}
                    onChange={(e) => setPassSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-marineBlue" />
                  <select
                    value={passStatusFilter}
                    onChange={(e) => setPassStatusFilter(e.target.value)}
                    className="px-3 py-3.5 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm bg-transparent"
                  >
                    <option value="all">Wszystkie statusy</option>
                    <option value="active">Aktywne</option>
                    <option value="expired">Wygasłe</option>
                    <option value="used">Wykorzystane</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={passTypeFilter}
                    onChange={(e) => setPassTypeFilter(e.target.value)}
                    className="px-3 py-3.5 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm bg-transparent"
                  >
                    <option value="all">Wszystkie typy</option>
                    {passTypes.map(t => (
                      <option key={t.id} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                <thead>
                  <tr className="border-b border-iceBlue bg-iceBlue/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Klient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Typ karnetu</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Przejazdy</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Data zakupu</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Ważny do</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Cena</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Płatność</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPasses.map((pass) => (
                    <tr key={pass.id} onClick={() => setSelectedPass(pass)} className="border-b border-iceBlue/50 hover:bg-iceBlue/20 transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white text-sm font-medium">
                            {pass.clientName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-deepNavy">{pass.clientName}</p>
                            <p className="text-xs text-marineBlue">{pass.clientPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-deepNavy">{pass.typeName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-deepNavy">{pass.remainingRides}/{pass.totalRides}</span>
                          {pass.remainingRides > 0 && pass.status === 'active' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUseRide(pass); }}
                              className="p-1 hover:bg-green-100 rounded transition-colors text-green-600"
                              title="Użyj przejazd"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-deepNavy">{pass.purchaseDate}</td>
                      <td className="py-3 px-4 text-sm text-deepNavy">{pass.expiryDate || '-'}</td>
                      <td className="py-3 px-4 text-sm text-deepNavy font-medium">{pass.price} zł</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pass.status === 'active' ? 'bg-green-100 text-green-800' :
                          pass.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pass.status === 'active' ? 'Aktywny' :
                           pass.status === 'expired' ? 'Wygasły' : 'Wykorzystany'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-deepNavy">
                        {paymentMethods.find(m => m.value === pass.paymentMethod)?.label}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPass(pass); }}
                            className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePass(pass.id); }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'types' && isStableOwner && (
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-serif text-xl font-bold text-deepNavy'>Typy karnetów</h2>
            <button onClick={handleAddPassType} className='bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              Dodaj typ
            </button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {passTypes.map(type => (
              <div key={type.id} className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h3 className='font-serif text-lg font-bold text-deepNavy'>{type.label}</h3>
                    <p className='text-sm text-marineBlue'>{type.value}</p>
                  </div>
                  <div className='flex gap-1'>
                    <button onClick={() => handleEditPassType(type)} className='p-2 hover:bg-iceBlue rounded-lg text-marineBlue hover:text-deepNavy'><Edit2 className='w-4 h-4'/></button>
                    <button onClick={() => handleDeletePassType(type.id)} className='p-2 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-700'><Trash2 className='w-4 h-4'/></button>
                  </div>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'><span className='text-marineBlue'>Przejazdy:</span><span className='text-deepNavy'>{type.rides}</span></div>
                  <div className='flex justify-between'><span className='text-marineBlue'>Cena domyślna:</span><span className='text-deepNavy'>{type.defaultPrice} zł</span></div>
                  <div className='flex justify-between'><span className='text-marineBlue'>Ważność:</span><span className='text-deepNavy'>{type.validityDays ? `${type.validityDays} dni` : 'Bez limitu'}</span></div>
                  <div className='flex justify-between'><span className='text-marineBlue'>Aktywny:</span><span className='text-deepNavy'>{type.active ? 'Tak' : 'Nie'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'types' && isEmployee && (
        <div>
          <h2 className='font-serif text-xl font-bold text-deepNavy mb-4'>Typy karnetów</h2>
          <p className='text-sm text-marineBlue mb-4'>Dostępne typy karnetów i ich ceny</p>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {passTypes.map(type => (
              <div key={type.id} className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                <div className='mb-4'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy'>{type.label}</h3>
                  <p className='text-sm text-marineBlue'>{type.value}</p>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'><span className='text-marineBlue'>Przejazdy:</span><span className='text-deepNavy'>{type.rides}</span></div>
                  <div className='flex justify-between'><span className='text-marineBlue'>Cena:</span><span className='text-deepNavy'>{type.defaultPrice} zł</span></div>
                  <div className='flex justify-between'><span className='text-marineBlue'>Ważność:</span><span className='text-deepNavy'>{type.validityDays ? `${type.validityDays} dni` : 'Bez limitu'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && isStableOwner && (
        <div>
          <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6 mb-6'>
            <h2 className='font-serif text-xl font-bold text-deepNavy mb-4'>Raport sprzedaży</h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-deepNavy mb-2'>Od</label>
                <input type='date' value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' />
              </div>
              <div>
                <label className='block text-sm font-medium text-deepNavy mb-2'>Do</label>
                <input type='date' value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' />
              </div>
              <div className='flex items-end'>
                <button onClick={() => { setReportStartDate(''); setReportEndDate(''); }} className='w-full px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm'>Wyczyść</button>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4'>
              <div className='flex items-center gap-2 mb-2'><BarChart3 className='w-5 h-5 text-oceanBlue' /><span className='text-sm text-marineBlue'>Sprzedane karnety</span></div>
              <p className='text-2xl font-bold text-deepNavy'>{reportPasses.length}</p>
            </div>
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4'>
              <div className='flex items-center gap-2 mb-2'><TrendingUp className='w-5 h-5 text-green-600' /><span className='text-sm text-marineBlue'>Przychód w okresie</span></div>
              <p className='text-2xl font-bold text-green-600'>{reportPasses.reduce((sum, p) => sum + p.price, 0)} zł</p>
            </div>
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4'>
              <div className='flex items-center gap-2 mb-2'><PieChart className='w-5 h-5 text-purple-600' /><span className='text-sm text-marineBlue'>Pozostałe przejazdy</span></div>
              <p className='text-2xl font-bold text-purple-600'>{reportPasses.reduce((sum, p) => sum + p.remainingRides, 0)}</p>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6 mb-6'>
            <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Sprzedaż według typu</h3>
            <div className='space-y-2'>
              {passTypes.map(t => {
                const count = reportPasses.filter(p => p.type === t.value).length;
                const revenue = reportPasses.filter(p => p.type === t.value).reduce((sum, p) => sum + p.price, 0);
                return (
                  <div key={t.id} className='flex justify-between p-3 bg-iceBlue/30 rounded-2xl'>
                    <span className='text-sm text-deepNavy'>{t.label}</span>
                    <span className='text-sm font-medium text-deepNavy'>{count} szt. • {revenue} zł</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
            <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Przychód według metody płatności</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {paymentMethods.map(m => {
                const revenue = reportPasses.filter(p => p.paymentMethod === m.value).reduce((sum, p) => sum + p.price, 0);
                const count = reportPasses.filter(p => p.paymentMethod === m.value).length;
                return (
                  <div key={m.value} className='flex justify-between p-3 bg-iceBlue/30 rounded-2xl'>
                    <span className='text-sm text-deepNavy'>{m.label}</span>
                    <span className='text-sm font-medium text-deepNavy'>{count} • {revenue} zł</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {selectedPass && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedPass.clientName}</h2>
                  <p className='text-sm text-marineBlue'>{selectedPass.clientPhone}</p>
                </div>
                <div className='flex items-center gap-1'>
                  <button onClick={() => { setEditingPass(selectedPass); setSelectedPass(null); setShowAddModal(true); }} className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors'>
                    <Edit2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => { setPasses(passes.filter(p => p.id !== selectedPass.id)); setSelectedPass(null); }} className='p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors'>
                    <Trash2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => setSelectedPass(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                    <X className='w-5 h-5 text-deepNavy' />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Typ</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPass.typeName}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Przejazdy</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPass.remainingRides}/{selectedPass.totalRides}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Status</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPass.status === 'active' ? 'Aktywny' : selectedPass.status === 'expired' ? 'Wygasły' : 'Wykorzystany'}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Data zakupu</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPass.purchaseDate}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Ważny do</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPass.expiryDate || '-'}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Cena</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPass.price} zł</p>
                </div>
              </div>

              {selectedPass.notes && (
                <div className='bg-iceBlue/30 rounded-2xl p-4 mb-4'>
                  <p className='text-xs text-marineBlue mb-1'>Notatki</p>
                  <p className='text-sm text-deepNavy'>{selectedPass.notes}</p>
                </div>
              )}

              {selectedPass.remainingRides > 0 && selectedPass.status === 'active' && (
                <button onClick={() => { handleUseRide(selectedPass); setSelectedPass(null); }} className='w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2'>
                  <CheckCircle className='w-4 h-4' /> Użyj przejazd
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingPass ? 'Edytuj karnet' : 'Dodaj karnet'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Klient</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        clientId: e.target.value,
                        clientName: client ? `${client.user.firstName} ${client.user.lastName}` : '',
                        clientPhone: client ? client.user.phone || '' : '',
                      });
                    }}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz klienta</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.user.firstName} {client.user.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ karnetu</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as Pass['type'])}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {passTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Liczba przejazdów</label>
                    <input
                      type="number"
                      value={formData.totalRides}
                      onChange={(e) => setFormData({ ...formData, totalRides: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Pozostałe</label>
                    <input
                      type="number"
                      value={formData.remainingRides}
                      onChange={(e) => setFormData({ ...formData, remainingRides: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                      max={formData.totalRides}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data zakupu</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Ważny do</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Cena (zł)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Pass['status'] })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      <option value="active">Aktywny</option>
                      <option value="expired">Wygasły</option>
                      <option value="used">Wykorzystany</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Metoda płatności</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as Pass['paymentMethod'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                    placeholder="Opcjonalne notatki..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingPass ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showTypeModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='font-serif text-xl font-bold text-deepNavy'>{editingPassType ? 'Edytuj typ' : 'Dodaj typ'}</h2>
                <button onClick={() => setShowTypeModal(false)} className='p-2 hover:bg-iceBlue rounded-lg transition-colors'><X className='w-5 h-5 text-deepNavy' /></button>
              </div>
              <form onSubmit={handleTypeSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Identyfikator</label>
                  <input type='text' value={typeForm.value} onChange={(e) => setTypeForm({ ...typeForm, value: e.target.value })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' required />
                </div>
                <div>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Nazwa</label>
                  <input type='text' value={typeForm.label} onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' required />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Przejazdy</label>
                    <input type='number' value={typeForm.rides} onChange={(e) => setTypeForm({ ...typeForm, rides: parseInt(e.target.value) || 0 })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' min='0' required />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Cena domyślna</label>
                    <input type='number' value={typeForm.defaultPrice} onChange={(e) => setTypeForm({ ...typeForm, defaultPrice: parseInt(e.target.value) || 0 })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' min='0' required />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Ważność (dni)</label>
                  <input type='number' value={typeForm.validityDays || ''} onChange={(e) => setTypeForm({ ...typeForm, validityDays: e.target.value ? parseInt(e.target.value) : undefined })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' placeholder='Opcjonalnie' />
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' checked={typeForm.active} onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })} className='w-4 h-4' />
                  <label className='text-sm text-deepNavy'>Aktywny</label>
                </div>
                <div className='flex gap-2 pt-4'>
                  <button type='button' onClick={() => setShowTypeModal(false)} className='flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm'>Anuluj</button>
                  <button type='submit' className='flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm'>{editingPassType ? 'Zapisz' : 'Dodaj'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <MobileNav user={user} />
    </div>
  );
}
