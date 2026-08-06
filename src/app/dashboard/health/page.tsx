'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Heart, Activity, Syringe, Pill, Calendar, AlertTriangle, Search } from 'lucide-react';
import api from '@/lib/api';

interface HealthRecord {
  id: string;
  horseId: string;
  horseName: string;
  date: string;
  type: 'checkup' | 'illness' | 'injury' | 'vaccination' | 'deworming' | 'dental' | 'other';
  description: string;
  veterinarian: string;
  diagnosis: string;
  treatment: string;
  medications: string[];
  followUpDate?: string;
  status: 'resolved' | 'ongoing' | 'chronic';
  notes: string;
}

interface Vaccination {
  id: string;
  horseId: string;
  horseName: string;
  vaccineName: string;
  administrationDate: string;
  nextDueDate: string;
  veterinarian: string;
  batchNumber: string;
  status: 'up_to_date' | 'due_soon' | 'overdue';
  notes: string;
}

export default function HealthPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'vaccinations'>('records');
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showAddVaccinationModal, setShowAddVaccinationModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(false);

  const [recordFormData, setRecordFormData] = useState({
    horseId: '',
    horseName: '',
    date: '',
    type: 'checkup' as HealthRecord['type'],
    description: '',
    veterinarian: '',
    diagnosis: '',
    treatment: '',
    medications: [] as string[],
    followUpDate: '',
    status: 'resolved' as HealthRecord['status'],
    notes: '',
  });

  const [vaccinationFormData, setVaccinationFormData] = useState({
    horseId: '',
    horseName: '',
    vaccineName: '',
    administrationDate: '',
    nextDueDate: '',
    veterinarian: '',
    batchNumber: '',
    status: 'up_to_date' as Vaccination['status'],
    notes: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [recordsRes, vaccinationsRes, horsesRes] = await Promise.all([
          api.get(`/health/records?stableId=${activeStableId}`),
          api.get(`/health/vaccinations?stableId=${activeStableId}`),
          api.get(`/horses?stableId=${activeStableId}`)
        ]);
        setHealthRecords(recordsRes.data || []);
        setVaccinations(vaccinationsRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setHealthRecords([]);
        setVaccinations([]);
        setHorses([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeStableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie zdrowia...</p>
        </div>
      </div>
    );
  }

  const recordTypes = [
    { value: 'checkup', label: 'Badanie kontrolne', icon: Activity },
    { value: 'illness', label: 'Choroba', icon: Heart },
    { value: 'injury', label: 'Kontuzja', icon: AlertTriangle },
    { value: 'vaccination', label: 'Szczepienie', icon: Syringe },
    { value: 'deworming', label: 'Odrobaczanie', icon: Pill },
    { value: 'dental', label: 'Badanie zębów', icon: Activity },
    { value: 'other', label: 'Inne', icon: Activity },
  ];

  const recordStatuses = [
    { value: 'resolved', label: 'Rozwiązany', color: 'bg-green-100 text-green-800' },
    { value: 'ongoing', label: 'W trakcie', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'chronic', label: 'Przewlekły', color: 'bg-red-100 text-red-800' },
  ];

  const vaccinationStatuses = [
    { value: 'up_to_date', label: 'Aktualne', color: 'bg-green-100 text-green-800' },
    { value: 'due_soon', label: 'Wymagają odnowienia', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'overdue', label: 'Przeterminowane', color: 'bg-red-100 text-red-800' },
  ];

  const handleAddRecord = () => {
    setRecordFormData({
      horseId: '',
      horseName: '',
      date: '',
      type: 'checkup',
      description: '',
      veterinarian: '',
      diagnosis: '',
      treatment: '',
      medications: [],
      followUpDate: '',
      status: 'resolved',
      notes: '',
    });
    setEditingRecord(null);
    setShowAddRecordModal(true);
  };

  const handleEditRecord = (record: HealthRecord) => {
    setRecordFormData({
      horseId: record.horseId,
      horseName: record.horseName,
      date: record.date,
      type: record.type,
      description: record.description,
      veterinarian: record.veterinarian,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      medications: record.medications,
      followUpDate: record.followUpDate || '',
      status: record.status,
      notes: record.notes,
    });
    setEditingRecord(record);
    setShowAddRecordModal(true);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await api.delete(`/health/records/${id}`);
      setHealthRecords(healthRecords.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete record error:', error);
      alert('Nie udało się usunąć rekordu zdrowia');
    }
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        const { data } = await api.put(`/health/records/${editingRecord.id}`, recordFormData);
        setHealthRecords(healthRecords.map(r => r.id === editingRecord.id ? data : r));
      } else {
        const { data } = await api.post('/health/records', { ...recordFormData, stableId: activeStableId });
        setHealthRecords([...healthRecords, data]);
      }
      setShowAddRecordModal(false);
    } catch (error) {
      console.error('Save record error:', error);
      alert('Nie udało się zapisać rekordu zdrowia');
    }
  };

  const handleAddVaccination = () => {
    setVaccinationFormData({
      horseId: '',
      horseName: '',
      vaccineName: '',
      administrationDate: '',
      nextDueDate: '',
      veterinarian: '',
      batchNumber: '',
      status: 'up_to_date',
      notes: '',
    });
    setEditingVaccination(null);
    setShowAddVaccinationModal(true);
  };

  const handleEditVaccination = (vaccination: Vaccination) => {
    setVaccinationFormData({
      horseId: vaccination.horseId,
      horseName: vaccination.horseName,
      vaccineName: vaccination.vaccineName,
      administrationDate: vaccination.administrationDate,
      nextDueDate: vaccination.nextDueDate,
      veterinarian: vaccination.veterinarian,
      batchNumber: vaccination.batchNumber,
      status: vaccination.status,
      notes: vaccination.notes,
    });
    setEditingVaccination(vaccination);
    setShowAddVaccinationModal(true);
  };

  const handleDeleteVaccination = async (id: string) => {
    try {
      await api.delete(`/health/vaccinations/${id}`);
      setVaccinations(vaccinations.filter(v => v.id !== id));
    } catch (error) {
      console.error('Delete vaccination error:', error);
      alert('Nie udało się usunąć szczepienia');
    }
  };

  const handleSubmitVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVaccination) {
        const { data } = await api.put(`/health/vaccinations/${editingVaccination.id}`, vaccinationFormData);
        setVaccinations(vaccinations.map(v => v.id === editingVaccination.id ? data : v));
      } else {
        const { data } = await api.post('/health/vaccinations', { ...vaccinationFormData, stableId: activeStableId });
        setVaccinations([...vaccinations, data]);
      }
      setShowAddVaccinationModal(false);
    } catch (error) {
      console.error('Save vaccination error:', error);
      alert('Nie udało się zapisać szczepienia');
    }
  };

  const getHealthStats = () => {
    const totalRecords = healthRecords.length;
    const ongoingIssues = healthRecords.filter(r => r.status === 'ongoing').length;
    const chronicIssues = healthRecords.filter(r => r.status === 'chronic').length;
    const overdueVaccinations = vaccinations.filter(v => v.status === 'overdue').length;
    const dueSoonVaccinations = vaccinations.filter(v => v.status === 'due_soon').length;

    return {
      totalRecords,
      ongoingIssues,
      chronicIssues,
      overdueVaccinations,
      dueSoonVaccinations,
    };
  };

  const stats = getHealthStats();

  const filteredRecords = healthRecords.filter(r =>
    r.horseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.veterinarian.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recordTypes.find(t => t.value === r.type)?.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVaccinations = vaccinations.filter(v =>
    v.horseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.veterinarian.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vaccinationStatuses.find(s => s.value === v.status)?.label || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-1">Zdrowie koni</h1>
              <p className="text-marineBlue">Zarządzaj zdrowiem i szczepieniami</p>
            </div>
            <button
              onClick={activeTab === 'records' ? handleAddRecord : handleAddVaccination}
              className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{activeTab === 'records' ? 'Dodaj rekord' : 'Dodaj szczepienie'}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Rekordy</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalRecords}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-marineBlue">W trakcie</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.ongoingIssues}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Przewlekłe</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.chronicIssues}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Syringe className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Przeterminowane</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.overdueVaccinations}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-marineBlue">Wymagają odnowienia</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.dueSoonVaccinations}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setActiveTab('records'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'records'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Rekordy zdrowia
            </button>
            <button
              onClick={() => { setActiveTab('vaccinations'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'vaccinations'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Szczepienia
            </button>
          </div>

          {/* Health Records Tab */}
          {activeTab === 'records' && (
            <div>
              <div className="mb-4 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                <input
                  type="text"
                  placeholder="Szukaj rekordu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRecords.map((record) => {
                  const TypeIcon = recordTypes.find(t => t.value === record.type)?.icon || Activity;
                  return (
                    <div key={record.id} onClick={() => setSelectedRecord(record)} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{record.horseName}</h3>
                            <p className="text-xs text-marineBlue">{record.date} • {recordTypes.find(t => t.value === record.type)?.label}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleEditRecord(record); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-marineBlue mb-4 line-clamp-2">{record.description}</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-arcticBlue/40 rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Weterynarz</p>
                          <p className="text-sm font-semibold text-deepNavy line-clamp-1">{record.veterinarian || '-'}</p>
                        </div>
                        <div className="bg-arcticBlue/40 rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Diagnoza</p>
                          <p className="text-sm font-semibold text-deepNavy line-clamp-1">{record.diagnosis || '-'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${recordStatuses.find(s => s.value === record.status)?.color}`}>
                          {recordStatuses.find(s => s.value === record.status)?.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vaccinations Tab */}
          {activeTab === 'vaccinations' && (
            <div>
              <div className="mb-4 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                <input
                  type="text"
                  placeholder="Szukaj szczepienia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVaccinations.map((vaccination) => (
                  <div key={vaccination.id} onClick={() => setSelectedVaccination(vaccination)} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <Syringe className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{vaccination.horseName}</h3>
                          <p className="text-xs text-marineBlue">{vaccination.vaccineName}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditVaccination(vaccination); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteVaccination(vaccination.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Podano</p>
                        <p className="text-sm font-semibold text-deepNavy">{vaccination.administrationDate}</p>
                      </div>
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Następna dawka</p>
                        <p className="text-sm font-semibold text-deepNavy">{vaccination.nextDueDate}</p>
                      </div>
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Weterynarz</p>
                        <p className="text-sm font-semibold text-deepNavy line-clamp-1">{vaccination.veterinarian || '-'}</p>
                      </div>
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Partia</p>
                        <p className="text-sm font-semibold text-deepNavy">{vaccination.batchNumber || '-'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${vaccinationStatuses.find(s => s.value === vaccination.status)?.color}`}>
                        {vaccinationStatuses.find(s => s.value === vaccination.status)?.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedRecord.horseName}</h2>
                    <p className="text-sm text-marineBlue">{selectedRecord.date} • {recordTypes.find(t => t.value === selectedRecord.type)?.label}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <p className="text-deepNavy mb-6">{selectedRecord.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Weterynarz</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedRecord.veterinarian || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Diagnoza</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedRecord.diagnosis || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Data kontroli</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedRecord.followUpDate || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Leczenie</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedRecord.treatment || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Status</p>
                  <p className="text-sm font-semibold text-deepNavy">{recordStatuses.find(s => s.value === selectedRecord.status)?.label}</p>
                </div>
              </div>

              {selectedRecord.medications.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-marineBlue mb-2">Leki</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.medications.map((med, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white text-deepNavy border border-iceBlue">{med}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                  <p className="text-xs text-marineBlue mb-1">Notatki</p>
                  <p className="text-sm text-deepNavy">{selectedRecord.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setSelectedRecord(null); handleEditRecord(selectedRecord); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj</button>
                <button onClick={() => { setSelectedRecord(null); handleDeleteRecord(selectedRecord.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVaccination && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Syringe className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedVaccination.horseName}</h2>
                    <p className="text-sm text-marineBlue">{selectedVaccination.vaccineName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedVaccination(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Podano</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedVaccination.administrationDate}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Następna dawka</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedVaccination.nextDueDate}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Weterynarz</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedVaccination.veterinarian || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Numer partii</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedVaccination.batchNumber || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Status</p>
                  <p className="text-sm font-semibold text-deepNavy">{vaccinationStatuses.find(s => s.value === selectedVaccination.status)?.label}</p>
                </div>
              </div>

              {selectedVaccination.notes && (
                <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                  <p className="text-xs text-marineBlue mb-1">Notatki</p>
                  <p className="text-sm text-deepNavy">{selectedVaccination.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setSelectedVaccination(null); handleEditVaccination(selectedVaccination); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj</button>
                <button onClick={() => { setSelectedVaccination(null); handleDeleteVaccination(selectedVaccination.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Health Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingRecord ? 'Edytuj rekord' : 'Dodaj rekord'}
                </h2>
                <button
                  onClick={() => setShowAddRecordModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    value={recordFormData.horseId}
                    onChange={(e) => {
                      const selectedHorse = horses.find(h => h.id === e.target.value);
                      setRecordFormData({
                        ...recordFormData,
                        horseId: e.target.value,
                        horseName: selectedHorse?.name || '',
                      });
                    }}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map((horse) => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data</label>
                  <input
                    type="date"
                    value={recordFormData.date}
                    onChange={(e) => setRecordFormData({ ...recordFormData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={recordFormData.type}
                    onChange={(e) => setRecordFormData({ ...recordFormData, type: e.target.value as HealthRecord['type'] })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  >
                    {recordTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={recordFormData.description}
                    onChange={(e) => setRecordFormData({ ...recordFormData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Weterynarz</label>
                  <input
                    type="text"
                    value={recordFormData.veterinarian}
                    onChange={(e) => setRecordFormData({ ...recordFormData, veterinarian: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Diagnoza</label>
                  <input
                    type="text"
                    value={recordFormData.diagnosis}
                    onChange={(e) => setRecordFormData({ ...recordFormData, diagnosis: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Leczenie</label>
                  <textarea
                    value={recordFormData.treatment}
                    onChange={(e) => setRecordFormData({ ...recordFormData, treatment: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Leki (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={recordFormData.medications.join(', ')}
                    onChange={(e) => setRecordFormData({ ...recordFormData, medications: e.target.value.split(',').map(m => m.trim()).filter(m => m) })}
                    placeholder="np. Przeciwzapalne, Witaminy"
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data kontroli</label>
                  <input
                    type="date"
                    value={recordFormData.followUpDate}
                    onChange={(e) => setRecordFormData({ ...recordFormData, followUpDate: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={recordFormData.status}
                    onChange={(e) => setRecordFormData({ ...recordFormData, status: e.target.value as HealthRecord['status'] })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  >
                    {recordStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={recordFormData.notes}
                    onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddRecordModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingRecord ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Vaccination Modal */}
      {showAddVaccinationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingVaccination ? 'Edytuj szczepienie' : 'Dodaj szczepienie'}
                </h2>
                <button
                  onClick={() => setShowAddVaccinationModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitVaccination} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    value={vaccinationFormData.horseId}
                    onChange={(e) => {
                      const selectedHorse = horses.find(h => h.id === e.target.value);
                      setVaccinationFormData({
                        ...vaccinationFormData,
                        horseId: e.target.value,
                        horseName: selectedHorse?.name || '',
                      });
                    }}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map((horse) => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa szczepionki</label>
                  <input
                    type="text"
                    value={vaccinationFormData.vaccineName}
                    onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, vaccineName: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data podania</label>
                    <input
                      type="date"
                      value={vaccinationFormData.administrationDate}
                      onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, administrationDate: e.target.value })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Następna dawka</label>
                    <input
                      type="date"
                      value={vaccinationFormData.nextDueDate}
                      onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, nextDueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Weterynarz</label>
                  <input
                    type="text"
                    value={vaccinationFormData.veterinarian}
                    onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, veterinarian: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Numer partii</label>
                  <input
                    type="text"
                    value={vaccinationFormData.batchNumber}
                    onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, batchNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={vaccinationFormData.status}
                    onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, status: e.target.value as Vaccination['status'] })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  >
                    {vaccinationStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={vaccinationFormData.notes}
                    onChange={(e) => setVaccinationFormData({ ...vaccinationFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddVaccinationModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingVaccination ? 'Zapisz zmiany' : 'Dodaj'}
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
