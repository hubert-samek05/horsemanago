'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, FileText, Check, AlertCircle, User, Calendar } from 'lucide-react';

interface Consent {
  id: string;
  name: string;
  description: string;
  type: 'data_processing' | 'photo' | 'medical' | 'liability' | 'other';
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'draft';
  content: string;
  required: boolean;
}

interface ClientConsent {
  id: string;
  consentId: string;
  consentName: string;
  clientId: string;
  clientName: string;
  signedDate: string;
  expiryDate?: string;
  status: 'signed' | 'expired' | 'revoked';
  version: string;
}

export default function ConsentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'consents' | 'tracking'>('consents');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConsent, setEditingConsent] = useState<Consent | null>(null);
  const [consentSearchTerm, setConsentSearchTerm] = useState('');
  const [trackingSearchTerm, setTrackingSearchTerm] = useState('');
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
  const [selectedClientConsent, setSelectedClientConsent] = useState<ClientConsent | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'data_processing' as Consent['type'],
    version: '1.0',
    effectiveDate: '',
    expiryDate: '',
    status: 'draft' as Consent['status'],
    content: '',
    required: false,
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [consents, setConsents] = useState<Consent[]>([
    {
      id: '1',
      name: 'Zgoda na przetwarzanie danych osobowych',
      description: 'Zgoda na przetwarzanie danych osobowych zgodnie z RODO',
      type: 'data_processing',
      version: '1.0',
      effectiveDate: '2024-01-01',
      status: 'active',
      content: 'Wyrażam zgodę na przetwarzanie moich danych osobowych...',
      required: true,
    },
    {
      id: '2',
      name: 'Zgoda na wykorzystanie wizerunku',
      description: 'Zgoda na wykorzystanie zdjęć i nagrań w celach promocyjnych',
      type: 'photo',
      version: '1.0',
      effectiveDate: '2024-01-01',
      status: 'active',
      content: 'Wyrażam zgodę na wykorzystanie mojego wizerunku...',
      required: false,
    },
    {
      id: '3',
      name: 'Zgoda na leczenie weterynaryjne',
      description: 'Zgoda na przeprowadzenie zabiegów weterynaryjnych',
      type: 'medical',
      version: '1.0',
      effectiveDate: '2024-01-01',
      status: 'active',
      content: 'Wyrażam zgodę na przeprowadzenie zabiegów weterynaryjnych...',
      required: true,
    },
  ]);

  const [clientConsents, setClientConsents] = useState<ClientConsent[]>([
    {
      id: '1',
      consentId: '1',
      consentName: 'Zgoda na przetwarzanie danych osobowych',
      clientId: '1',
      clientName: 'Anna Kowalska',
      signedDate: '2024-03-01',
      status: 'signed',
      version: '1.0',
    },
    {
      id: '2',
      consentId: '2',
      consentName: 'Zgoda na wykorzystanie wizerunku',
      clientId: '1',
      clientName: 'Anna Kowalska',
      signedDate: '2024-03-01',
      status: 'signed',
      version: '1.0',
    },
    {
      id: '3',
      consentId: '1',
      consentName: 'Zgoda na przetwarzanie danych osobowych',
      clientId: '2',
      clientName: 'Piotr Nowak',
      signedDate: '2024-02-15',
      status: 'signed',
      version: '1.0',
    },
    {
      id: '4',
      consentId: '3',
      consentName: 'Zgoda na leczenie weterynaryjne',
      clientId: '2',
      clientName: 'Piotr Nowak',
      signedDate: '2024-02-15',
      status: 'signed',
      version: '1.0',
    },
  ]);

  const consentTypes = [
    { value: 'data_processing', label: 'Przetwarzanie danych' },
    { value: 'photo', label: 'Wizerunek' },
    { value: 'medical', label: 'Leczenie weterynaryjne' },
    { value: 'liability', label: 'Odpowiedzialność' },
    { value: 'other', label: 'Inne' },
  ];

  const consentStatuses = [
    { value: 'draft', label: 'Projekt', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Aktywna', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Wygasła', color: 'bg-red-100 text-red-800' },
  ];

  const clientConsentStatuses = [
    { value: 'signed', label: 'Podpisana', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Wygasła', color: 'bg-red-100 text-red-800' },
    { value: 'revoked', label: 'Odwołana', color: 'bg-orange-100 text-orange-800' },
  ];

  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      type: 'data_processing',
      version: '1.0',
      effectiveDate: '',
      expiryDate: '',
      status: 'draft',
      content: '',
      required: false,
    });
    setEditingConsent(null);
    setShowAddModal(true);
  };

  const handleEdit = (consent: Consent) => {
    setFormData({
      name: consent.name,
      description: consent.description,
      type: consent.type,
      version: consent.version,
      effectiveDate: consent.effectiveDate,
      expiryDate: consent.expiryDate || '',
      status: consent.status,
      content: consent.content,
      required: consent.required,
    });
    setEditingConsent(consent);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    setConsents(consents.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConsent) {
      setConsents(consents.map(c => c.id === editingConsent.id ? { ...c, ...formData } : c));
    } else {
      setConsents([...consents, { id: Date.now().toString(), ...formData }]);
    }
    setShowAddModal(false);
  };

  const getConsentStats = () => {
    const totalConsents = consents.length;
    const activeConsents = consents.filter(c => c.status === 'active').length;
    const requiredConsents = consents.filter(c => c.required).length;
    const totalSignatures = clientConsents.filter(c => c.status === 'signed').length;
    const expiredSignatures = clientConsents.filter(c => c.status === 'expired').length;

    return {
      totalConsents,
      activeConsents,
      requiredConsents,
      totalSignatures,
      expiredSignatures,
    };
  };

  const stats = getConsentStats();

  const filteredConsents = consents.filter(c =>
    c.name.toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
    consentTypes.find(t => t.value === c.type)?.label.toLowerCase().includes(consentSearchTerm.toLowerCase())
  );

  const filteredClientConsents = clientConsents.filter(cc =>
    cc.clientName.toLowerCase().includes(trackingSearchTerm.toLowerCase()) ||
    cc.consentName.toLowerCase().includes(trackingSearchTerm.toLowerCase())
  );

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
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Zgody i regulaminy</h1>
              <p className="text-marineBlue">Zarządzaj zgodami i śledź zgodność</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Zgody</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalConsents}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Aktywne</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.activeConsents}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Wymagane</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.requiredConsents}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Podpisy</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalSignatures}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-marineBlue">Wygasłe</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiredSignatures}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('consents')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'consents'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Zgody
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'tracking'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Śledzenie
            </button>
          </div>

          {/* Consents Tab */}
          {activeTab === 'consents' && (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj zgody..."
                    value={consentSearchTerm}
                    onChange={(e) => setConsentSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  className="w-full sm:w-auto bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj zgodę</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConsents.map((consent) => (
                  <div key={consent.id} onClick={() => setSelectedConsent(consent)} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{consent.name}</h3>
                            <p className="text-xs text-marineBlue">{consentTypes.find(t => t.value === consent.type)?.label}</p>
                          </div>
                        </div>
                        <p className="text-sm text-marineBlue mb-3">{consent.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(consent); }}
                          className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(consent.id); }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Wersja:</span>
                        <span className="text-deepNavy">{consent.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Data wejścia:</span>
                        <span className="text-deepNavy">{consent.effectiveDate}</span>
                      </div>
                      {consent.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-marineBlue">Wygaśnięcie:</span>
                          <span className="text-deepNavy">{consent.expiryDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${consentStatuses.find(s => s.value === consent.status)?.color}`}>
                        {consentStatuses.find(s => s.value === consent.status)?.label}
                      </span>
                      {consent.required && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Wymagana
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div>
              <div className="mb-4 relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                <input
                  type="text"
                  placeholder="Szukaj klienta lub zgody..."
                  value={trackingSearchTerm}
                  onChange={(e) => setTrackingSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                />
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-iceBlue/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Klient</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell">Zgoda</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell">Wersja</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden xl:table-cell">Data podpisu</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-iceBlue">
                      {filteredClientConsents.map((clientConsent) => (
                        <tr key={clientConsent.id} onClick={() => setSelectedClientConsent(clientConsent)} className="hover:bg-iceBlue/20 transition-colors cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-deepNavy">{clientConsent.clientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-deepNavy hidden md:table-cell">{clientConsent.consentName}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden lg:table-cell">{clientConsent.version}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden xl:table-cell">{clientConsent.signedDate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${clientConsentStatuses.find(s => s.value === clientConsent.status)?.color}`}>
                              {clientConsentStatuses.find(s => s.value === clientConsent.status)?.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedConsent && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedConsent.name}</h2>
                  <p className='text-sm text-marineBlue'>{consentTypes.find(t => t.value === selectedConsent.type)?.label}</p>
                </div>
                <div className='flex items-center gap-1'>
                  <button onClick={() => { setEditingConsent(selectedConsent); setSelectedConsent(null); setShowAddModal(true); }} className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors'>
                    <Edit2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => { setConsents(consents.filter(c => c.id !== selectedConsent.id)); setSelectedConsent(null); }} className='p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors'>
                    <Trash2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => setSelectedConsent(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                    <X className='w-5 h-5 text-deepNavy' />
                  </button>
                </div>
              </div>

              <p className='text-sm text-deepNavy mb-4'>{selectedConsent.description}</p>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Wersja</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedConsent.version}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Status</p>
                  <p className='text-sm font-medium text-deepNavy'>{consentStatuses.find(s => s.value === selectedConsent.status)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Data wejścia</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedConsent.effectiveDate}</p>
                </div>
                {selectedConsent.expiryDate && (
                  <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                    <p className='text-xs text-marineBlue mb-1'>Data wygaśnięcia</p>
                    <p className='text-sm font-medium text-deepNavy'>{selectedConsent.expiryDate}</p>
                  </div>
                )}
              </div>

              {selectedConsent.required && (
                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-4'>Wymagana</span>
              )}

              <div className='bg-iceBlue/30 rounded-2xl p-4'>
                <p className='text-xs text-marineBlue mb-2'>Treść</p>
                <p className='text-sm text-deepNavy whitespace-pre-wrap'>{selectedConsent.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedClientConsent && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div className='flex items-center gap-4'>
                  <div className='w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white'>
                    <User className='w-7 h-7' />
                  </div>
                  <div>
                    <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedClientConsent.clientName}</h2>
                    <p className='text-sm text-marineBlue'>{selectedClientConsent.consentName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClientConsent(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                  <X className='w-5 h-5 text-deepNavy' />
                </button>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Wersja</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedClientConsent.version}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Status</p>
                  <p className='text-sm font-medium text-deepNavy'>{clientConsentStatuses.find(s => s.value === selectedClientConsent.status)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Data podpisu</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedClientConsent.signedDate}</p>
                </div>
                {selectedClientConsent.expiryDate && (
                  <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                    <p className='text-xs text-marineBlue mb-1'>Data wygaśnięcia</p>
                    <p className='text-sm font-medium text-deepNavy'>{selectedClientConsent.expiryDate}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingConsent ? 'Edytuj zgodę' : 'Dodaj zgodę'}
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Consent['type'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {consentTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Wersja</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data wejścia</label>
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data wygaśnięcia</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Consent['status'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {consentStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Treść</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Zgoda wymagana</span>
                  </label>
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
                    {editingConsent ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
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
