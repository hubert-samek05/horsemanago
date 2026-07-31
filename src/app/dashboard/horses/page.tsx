'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';

import { useAuthStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, Search, X, Edit2, Trash2, Maximize2, FileText, Shield, Stethoscope, Wrench } from 'lucide-react';
import api from '@/lib/api';

interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: 'stallion' | 'mare' | 'gelding';
  color: string;
  height: number; // in hands
  weight: number; // in kg
  dateOfBirth: string;
  registrationNumber?: string;
  microchipNumber?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'available' | 'busy' | 'maintenance' | 'retired' | 'sick';
  discipline: 'dressage' | 'jumping' | 'eventing' | 'western' | 'pleasure' | 'other';
  boxNumber?: string;
  owner?: string;
  description: string;
  specialSkills: string[];
  healthNotes: string;
  isBoarding?: boolean; // czy koń jest w pensjonacie
  image?: string;
}

interface HorseHealth {
  horseId: string;
  horseName: string;
  lastVetVisit: string;
  nextVetVisit: string;
  lastFarrierVisit: string;
  nextFarrierVisit: string;
  vaccinationStatus: 'up_to_date' | 'due_soon' | 'overdue';
  vaccinations: {
    type: string;
    date: string;
    nextDue: string;
    status: 'up_to_date' | 'due_soon' | 'overdue';
  }[];
  medicalConditions: {
    name: string;
    diagnosedDate: string;
    status: 'active' | 'chronic' | 'resolved';
    notes: string;
  }[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed';
  }[];
  healthNotes: string;
}

interface HorseFeeding {
  horseId: string;
  horseName: string;
  feedingSchedule: {
    morning: string;
    noon: string;
    evening: string;
  };
  supplements: {
    name: string;
    dosage: string;
    frequency: string;
    cost: number;
  }[];
  dailyCost: number;
  monthlyCost: number;
  notes: string;
}

interface HorseWorkload {
  horseId: string;
  horseName: string;
  dailyLimit: number; // max total sessions per day
  currentDailyWorkload: number;
  weeklyLimit: number;
  currentWeeklyWorkload: number;
  monthlyLimit: number;
  currentMonthlyWorkload: number;
  activityLimits: {
    lessons: { limit: number; current: number };
    training: { limit: number; current: number };
    competitions: { limit: number; current: number };
    other: { limit: number; current: number };
  };
  restRules: {
    maxConsecutiveWorkDays: number; // max days working before mandatory rest
    minRestDaysAfterFullWork: number; // minimum rest days after reaching daily limit
    minRestDaysAfterCompetition: number; // minimum rest days after competition
    minBreakBetweenSessions: number; // minimum minutes between sessions
  };
  currentConsecutiveWorkDays: number;
  lastRestDate: string | null;
  nextRestRequired: boolean;
  nextRestDate: string | null;
  notes: string;
  weeklySchedule: {
    day: string;
    date: string;
    sessions: number;
    type: 'lekcja' | 'trening' | 'zawody' | 'wolne' | 'inne';
  }[];
}

interface HorseTraining {
  horseId: string;
  horseName: string;
  exercises: {
    id: string;
    name: string;
    category: 'dressage' | 'jumping' | 'cross_country' | 'groundwork' | 'other';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
    progress: number; // 0-100
    lastPracticed: string;
    notes: string;
  }[];
  goals: {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
  }[];
  trainingPlan: {
    id: string;
    date: string;
    focus: string;
    exercises: string[];
    duration: number;
    completed: boolean;
    notes: string;
  }[];
  reports: {
    id: string;
    date: string;
    focus: string;
    exercisesDone: string[];
    duration: number;
    rating: 1 | 2 | 3 | 4 | 5;
    notes: string;
  }[];
  notes: string;
}

interface HorseDocuments {
  horseId: string;
  horseName: string;
  passport: {
    number: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
  } | null;
  insurance: {
    company: string;
    policyNumber: string;
    startDate: string;
    endDate: string;
    coverage: string;
  } | null;
  certificates: {
    id: string;
    type: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    notes: string;
  }[];
  otherDocuments: {
    id: string;
    name: string;
    type: string;
    issueDate: string;
    expiryDate: string | null;
    notes: string;
  }[];
  notes: string;
}

function HorsesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'horses' | 'health' | 'feeding' | 'workload' | 'training' | 'documents'>('horses');
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [editingWorkload, setEditingWorkload] = useState<HorseWorkload | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [editingHealth, setEditingHealth] = useState<HorseHealth | null>(null);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [editingFeeding, setEditingFeeding] = useState<HorseFeeding | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<HorseTraining | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [editingDocuments, setEditingDocuments] = useState<HorseDocuments | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workloadSearchTerm, setWorkloadSearchTerm] = useState('');
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [selectedWorkload, setSelectedWorkload] = useState<HorseWorkload | null>(null);
  const [trainingSearchTerm, setTrainingSearchTerm] = useState('');
  const [selectedTraining, setSelectedTraining] = useState<HorseTraining | null>(null);
  const [trainingDetailTab, setTrainingDetailTab] = useState<'exercises' | 'goals' | 'plan' | 'reports'>('exercises');
  const [newReport, setNewReport] = useState({ date: '', focus: '', exercisesDone: '', duration: 60, rating: 5 as 1 | 2 | 3 | 4 | 5, notes: '' });
  const [documentsSearchTerm, setDocumentsSearchTerm] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<HorseDocuments | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['horses', 'health', 'feeding', 'workload', 'training', 'documents'].includes(tab)) {
      setActiveTab(tab as 'horses' | 'health' | 'feeding' | 'workload' | 'training' | 'documents');
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: 0,
    gender: 'gelding' as Horse['gender'],
    color: '',
    height: 0,
    weight: 0,
    dateOfBirth: '',
    registrationNumber: '',
    microchipNumber: '',
    level: 'intermediate' as Horse['level'],
    status: 'available' as Horse['status'],
    discipline: 'pleasure' as Horse['discipline'],
    boxNumber: '',
    owner: '',
    description: '',
    specialSkills: [] as string[],
    healthNotes: '',
    image: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadHorses = async () => {
      try {
        const { data } = await api.get(`/horses?stableId=${activeStableId}`);
        setHorses(data || []);
      } catch (error) {
        console.error('Load horses error:', error);
        setHorses([]);
      } finally {
        setLoading(false);
      }
    };
    loadHorses();
  }, [activeStableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie koni...</p>
        </div>
      </div>
    );
  }

  const levels = [
    { value: 'beginner', label: 'Początkujący', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: 'Średniozaawansowany', color: 'bg-blue-100 text-blue-800' },
    { value: 'advanced', label: 'Zaawansowany', color: 'bg-purple-100 text-purple-800' },
  ];

  const statuses = [
    { value: 'available', label: 'Dostępny', color: 'bg-green-100 text-green-800' },
    { value: 'busy', label: 'Zajęty', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'maintenance', label: 'W konserwacji', color: 'bg-red-100 text-red-800' },
    { value: 'retired', label: 'Emerytowany', color: 'bg-gray-100 text-gray-800' },
    { value: 'sick', label: 'Chory', color: 'bg-red-100 text-red-800' },
  ];

  const genders = [
    { value: 'stallion', label: 'Ogier' },
    { value: 'mare', label: 'Klacz' },
    { value: 'gelding', label: 'Wałach' },
  ];

  const disciplines = [
    { value: 'dressage', label: 'Ujeżdżenie' },
    { value: 'jumping', label: 'Skoki' },
    { value: 'eventing', label: 'WSZ' },
    { value: 'western', label: 'Western' },
    { value: 'pleasure', label: 'Rekreacja' },
    { value: 'other', label: 'Inne' },
  ];

  const filteredHorses = horses.filter(horse =>
    horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    horse.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    horse.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (horse.boxNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vaccinationStatuses = [
    { value: 'up_to_date', label: 'Aktualne', color: 'bg-green-100 text-green-800' },
    { value: 'due_soon', label: 'Wymagają odnowienia', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'overdue', label: 'Przeterminowane', color: 'bg-red-100 text-red-800' },
  ];

  const [horseHealth, setHorseHealth] = useState<HorseHealth[]>([]);

  const [horseFeeding, setHorseFeeding] = useState<HorseFeeding[]>([]);

  const [horseTraining, setHorseTraining] = useState<HorseTraining[]>([]);

  const [horseDocuments, setHorseDocuments] = useState<HorseDocuments[]>([]);

  const [horseWorkload, setHorseWorkload] = useState<HorseWorkload[]>([]);

  const filteredWorkload = horseWorkload.filter(w =>
    w.horseName.toLowerCase().includes(workloadSearchTerm.toLowerCase())
  );

  const filteredTraining = horseTraining.filter(t =>
    t.horseName.toLowerCase().includes(trainingSearchTerm.toLowerCase()) ||
    t.exercises.some(e => e.name.toLowerCase().includes(trainingSearchTerm.toLowerCase())) ||
    t.goals.some(g => g.title.toLowerCase().includes(trainingSearchTerm.toLowerCase()))
  );

  const filteredDocuments = horseDocuments.filter(d =>
    d.horseName.toLowerCase().includes(documentsSearchTerm.toLowerCase()) ||
    (d.passport?.number || '').toLowerCase().includes(documentsSearchTerm.toLowerCase()) ||
    d.certificates.some(c => c.type.toLowerCase().includes(documentsSearchTerm.toLowerCase())) ||
    d.otherDocuments.some(o => o.name.toLowerCase().includes(documentsSearchTerm.toLowerCase()))
  );

  const handleAddHorse = () => {
    setFormData({ 
      name: '',
      breed: '',
      age: 0,
      gender: 'gelding',
      color: '',
      height: 0,
      weight: 0,
      dateOfBirth: '',
      registrationNumber: '',
      microchipNumber: '',
      level: 'intermediate',
      status: 'available',
      discipline: 'pleasure',
      boxNumber: '',
      owner: '',
      description: '',
      specialSkills: [],
      healthNotes: '',
      image: '',
    });
    setEditingHorse(null);
    setShowAddModal(true);
  };

  const handleEditHorse = (horse: Horse) => {
    setFormData({
      name: horse.name,
      breed: horse.breed,
      age: horse.age,
      gender: horse.gender,
      color: horse.color,
      height: horse.height,
      weight: horse.weight,
      dateOfBirth: horse.dateOfBirth,
      registrationNumber: horse.registrationNumber || '',
      microchipNumber: horse.microchipNumber || '',
      level: horse.level,
      status: horse.status,
      discipline: horse.discipline,
      boxNumber: horse.boxNumber || '',
      owner: horse.owner || '',
      description: horse.description,
      specialSkills: horse.specialSkills,
      healthNotes: horse.healthNotes,
      image: horse.image || '',
    });
    setEditingHorse(horse);
    setShowAddModal(true);
  };

  const handleDeleteHorse = async (id: string) => {
    try {
      await api.delete(`/horses/${id}`);
      setHorses(horses.filter(h => h.id !== id));
    } catch (error) {
      console.error('Delete horse error:', error);
      alert('Nie udało się usunąć konia');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHorse) {
        const { data } = await api.put(`/horses/${editingHorse.id}`, formData);
        setHorses(horses.map(h => h.id === editingHorse.id ? data : h));
      } else {
        const { data } = await api.post('/horses', { ...formData, stableId: activeStableId });
        setHorses([...horses, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save horse error:', error);
      alert('Nie udało się zapisać konia');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Konie</h1>
              <p className="text-marineBlue">Zarządzaj stadem koni</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('horses')}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'horses'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Konie
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'health'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Zdrowie
            </button>
            <button
              onClick={() => setActiveTab('feeding')}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'feeding'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Karmienie
            </button>
            <button
              onClick={() => setActiveTab('workload')}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'workload'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Obciążenie
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'training'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Trening
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Dokumenty
            </button>
          </div>

          {/* Horses Tab */}
          {activeTab === 'horses' && (
            <>
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj konia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                  />
                </div>
                <button
                  onClick={handleAddHorse}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-5 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj konia</span>
                </button>
              </div>

          {/* Horses List */}
          {filteredHorses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-oceanBlue" />
              </div>
              <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak koni</h3>
              <p className="text-marineBlue mb-6">Dodaj pierwszego konia i zacznij zarządzać stajnią</p>
              <button
                onClick={handleAddHorse}
                className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Dodaj pierwszego konia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredHorses.map((horse) => (
              <div key={horse.id} onClick={() => setSelectedHorse(horse)} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {horse.image ? (
                      <img src={horse.image} alt={horse.name} className="w-12 h-12 rounded-full object-cover border-2 border-iceBlue" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-lg font-bold">
                        {horse.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif text-lg font-bold text-deepNavy">{horse.name}</h3>
                      <p className="text-xs text-marineBlue">{horse.breed} • {horse.color}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleEditHorse(horse); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteHorse(horse.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-marineBlue mb-4 line-clamp-2">{horse.description}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-arcticBlue/40 rounded-2xl p-3">
                    <p className="text-xs text-marineBlue">Wiek</p>
                    <p className="text-sm font-semibold text-deepNavy">{horse.age} lat</p>
                  </div>
                  <div className="bg-arcticBlue/40 rounded-2xl p-3">
                    <p className="text-xs text-marineBlue">Wzrost</p>
                    <p className="text-sm font-semibold text-deepNavy">{horse.height} cm</p>
                  </div>
                  <div className="bg-arcticBlue/40 rounded-2xl p-3">
                    <p className="text-xs text-marineBlue">Dyscyplina</p>
                    <p className="text-sm font-semibold text-deepNavy">{disciplines.find(d => d.value === horse.discipline)?.label}</p>
                  </div>
                  <div className="bg-arcticBlue/40 rounded-2xl p-3">
                    <p className="text-xs text-marineBlue">Boks</p>
                    <p className="text-sm font-semibold text-deepNavy">{horse.boxNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statuses.find(s => s.value === horse.status)?.color}`}>
                    {statuses.find(s => s.value === horse.status)?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${levels.find(l => l.value === horse.level)?.color || 'bg-iceBlue text-deepNavy'}`}>
                    {levels.find(l => l.value === horse.level)?.label}
                  </span>
                  {horse.isBoarding && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-oceanBlue/10 text-oceanBlue">Pensjonat</span>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
            </>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => {
                    setEditingHealth(null);
                    setShowHealthModal(true);
                  }}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj rekord zdrowia</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {horseHealth.map((health) => (
                  <div key={health.horseId} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-deepNavy">{health.horseName}</h3>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                          vaccinationStatuses.find(s => s.value === health.vaccinationStatus)?.color
                        }`}>
                          {vaccinationStatuses.find(s => s.value === health.vaccinationStatus)?.label}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingHealth(health);
                          setShowHealthModal(true);
                        }}
                        className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Vet Visits */}
                    <div className="mb-4 p-4 bg-iceBlue/20 rounded-xl">
                      <h4 className="font-semibold text-deepNavy mb-2">Wizyty weterynaryjne</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-marineBlue">Ostatnia:</p>
                          <p className="text-deepNavy font-medium">{health.lastVetVisit || '-'}</p>
                        </div>
                        <div>
                          <p className="text-marineBlue">Następna:</p>
                          <p className="text-deepNavy font-medium">{health.nextVetVisit || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Farrier Visits */}
                    <div className="mb-4 p-4 bg-iceBlue/20 rounded-xl">
                      <h4 className="font-semibold text-deepNavy mb-2">Wizyty kowala</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-marineBlue">Ostatnia:</p>
                          <p className="text-deepNavy font-medium">{health.lastFarrierVisit || '-'}</p>
                        </div>
                        <div>
                          <p className="text-marineBlue">Następna:</p>
                          <p className="text-deepNavy font-medium">{health.nextFarrierVisit || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vaccinations */}
                    {health.vaccinations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-deepNavy mb-2">Szczepienia</h4>
                        <div className="space-y-2">
                          {health.vaccinations.map((vacc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-iceBlue text-sm">
                              <span className="text-marineBlue">{vacc.type}</span>
                              <div className="text-right">
                                <p className="text-deepNavy text-xs">{vacc.date}</p>
                                <p className="text-marineBlue text-xs">Następna: {vacc.nextDue}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Conditions */}
                    {health.medicalConditions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-deepNavy mb-2">Choroby</h4>
                        <div className="space-y-2">
                          {health.medicalConditions.map((condition, idx) => (
                            <div key={idx} className="p-2 bg-white rounded-lg border border-iceBlue text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-deepNavy font-medium">{condition.name}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  condition.status === 'active' ? 'bg-red-100 text-red-700' :
                                  condition.status === 'chronic' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {condition.status === 'active' ? 'Aktywna' :
                                   condition.status === 'chronic' ? 'Przewlekła' : 'Wyleczona'}
                                </span>
                              </div>
                              {condition.notes && <p className="text-marineBlue text-xs mt-1">{condition.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    {health.medications.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-deepNavy mb-2">Leki</h4>
                        <div className="space-y-2">
                          {health.medications.map((med, idx) => (
                            <div key={idx} className="p-2 bg-white rounded-lg border border-iceBlue text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-deepNavy font-medium">{med.name}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  med.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {med.status === 'active' ? 'Aktywny' : 'Zakończony'}
                                </span>
                              </div>
                              <p className="text-marineBlue text-xs">{med.dosage} - {med.frequency}</p>
                              <p className="text-marineBlue text-xs">{med.startDate} - {med.endDate}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {health.healthNotes && (
                      <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <p className="text-xs text-yellow-800">{health.healthNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Feeding Tab */}
          {activeTab === 'feeding' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => {
                    setEditingFeeding(null);
                    setShowFeedingModal(true);
                  }}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Edytuj karmienie</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {horseFeeding.map((feeding) => {
                  const horse = horses.find(h => h.id === feeding.horseId);
                  const isBoardingHorse = horse?.isBoarding;
                  return (
                    <div key={feeding.horseId} className={`bg-white rounded-2xl shadow-lg border p-6 ${isBoardingHorse ? 'border-orange-300' : 'border-iceBlue'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-deepNavy">{feeding.horseName}</h3>
                          {isBoardingHorse && (
                            <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Koń pensjonatowy
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingFeeding(feeding);
                            setShowFeedingModal(true);
                          }}
                          className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Feeding Schedule */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-deepNavy mb-2">Harmonogram karmienia</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-iceBlue/20 rounded-xl">
                            <p className="text-xs text-marineBlue mb-1">Rano</p>
                            <p className="text-sm text-deepNavy">{feeding.feedingSchedule.morning || '-'}</p>
                          </div>
                          <div className="p-3 bg-iceBlue/20 rounded-xl">
                            <p className="text-xs text-marineBlue mb-1">W południe</p>
                            <p className="text-sm text-deepNavy">{feeding.feedingSchedule.noon || '-'}</p>
                          </div>
                          <div className="p-3 bg-iceBlue/20 rounded-xl">
                            <p className="text-xs text-marineBlue mb-1">Wieczorem</p>
                            <p className="text-sm text-deepNavy">{feeding.feedingSchedule.evening || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Supplements */}
                      {feeding.supplements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-deepNavy mb-2">Suplementy</h4>
                          <div className="space-y-2">
                            {feeding.supplements.map((supp, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-iceBlue text-sm">
                                <div>
                                  <p className="text-deepNavy font-medium">{supp.name}</p>
                                  <p className="text-marineBlue text-xs">{supp.dosage} - {supp.frequency}</p>
                                </div>
                                <span className="text-deepNavy font-medium">{supp.cost} zł/mies.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Costs */}
                      <div className="mb-4 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                          <p className="text-xs text-green-700 mb-1">Koszt dzienny</p>
                          <p className="text-lg font-bold text-green-800">{feeding.dailyCost} zł</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-xs text-blue-700 mb-1">Koszt miesięczny</p>
                          <p className="text-lg font-bold text-blue-800">{feeding.monthlyCost} zł</p>
                        </div>
                      </div>

                      {/* Notes */}
                      {feeding.notes && (
                        <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                          <p className="text-xs text-yellow-800">{feeding.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Workload Tab */}
          {activeTab === 'workload' && (
            <>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj obciążenia..."
                    value={workloadSearchTerm}
                    onChange={(e) => setWorkloadSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingWorkload(null);
                    setShowWorkloadModal(true);
                  }}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Ustaw limity</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredWorkload.map((workload) => {
                  const dailyPercentage = (workload.currentDailyWorkload / workload.dailyLimit) * 100;
                  const weeklyPercentage = (workload.currentWeeklyWorkload / workload.weeklyLimit) * 100;
                  const monthlyPercentage = (workload.currentMonthlyWorkload / workload.monthlyLimit) * 100;
                  const consecutiveDaysPercentage = (workload.currentConsecutiveWorkDays / workload.restRules.maxConsecutiveWorkDays) * 100;
                  
                  return (
                    <div key={workload.horseId} onClick={() => setSelectedWorkload(workload)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-lg font-bold">
                            {workload.horseName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-serif text-xl font-bold text-deepNavy">{workload.horseName}</h3>
                            {workload.nextRestRequired && (
                              <span className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                Wymaga przerwy {workload.nextRestDate ? `(${workload.nextRestDate})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setEditingWorkload(workload); setShowWorkloadModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setHorseWorkload(horseWorkload.filter(w => w.horseId !== workload.horseId)); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4 p-4 bg-arcticBlue/40 rounded-2xl">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-marineBlue font-medium">Dziennie</span>
                          <span className="text-deepNavy font-bold">{workload.currentDailyWorkload}/{workload.dailyLimit}</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${dailyPercentage >= 100 ? 'bg-red-500' : dailyPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(dailyPercentage, 100)}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-arcticBlue/40 rounded-2xl">
                          <p className="text-xs text-marineBlue mb-1">Tygodniowo</p>
                          <p className="text-sm font-bold text-deepNavy">{workload.currentWeeklyWorkload}/{workload.weeklyLimit}</p>
                          <div className="w-full bg-white rounded-full h-2 mt-2 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${weeklyPercentage >= 100 ? 'bg-red-500' : weeklyPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(weeklyPercentage, 100)}%` }} />
                          </div>
                        </div>
                        <div className="p-3 bg-arcticBlue/40 rounded-2xl">
                          <p className="text-xs text-marineBlue mb-1">Miesięcznie</p>
                          <p className="text-sm font-bold text-deepNavy">{workload.currentMonthlyWorkload}/{workload.monthlyLimit}</p>
                          <div className="w-full bg-white rounded-full h-2 mt-2 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${monthlyPercentage >= 100 ? 'bg-red-500' : monthlyPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(monthlyPercentage, 100)}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-arcticBlue/40 rounded-2xl">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-marineBlue font-medium">Dni pracy z rzędu</span>
                          <span className="text-deepNavy font-bold">{workload.currentConsecutiveWorkDays}/{workload.restRules.maxConsecutiveWorkDays}</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${consecutiveDaysPercentage >= 100 ? 'bg-red-500' : consecutiveDaysPercentage >= 75 ? 'bg-yellow-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(consecutiveDaysPercentage, 100)}%` }} />
                        </div>
                        {workload.lastRestDate && (
                          <p className="text-xs text-marineBlue mt-2">Ostatni dzień wolny: {workload.lastRestDate}</p>
                        )}
                      </div>

                      <div className="mt-4 flex justify-between">
                        {workload.weeklySchedule.map((day) => (
                          <div key={day.day} className="flex flex-col items-center gap-1">
                            <span className="text-xs text-marineBlue">{day.day}</span>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${day.sessions > 0 ? 'bg-oceanBlue text-white' : 'bg-arcticBlue/40 text-marineBlue'}`}>
                              {day.sessions}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Training Tab */}
          {activeTab === 'training' && (
            <>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj treningu..."
                    value={trainingSearchTerm}
                    onChange={(e) => setTrainingSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={() => { setEditingTraining(null); setShowTrainingModal(true); }}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj trening</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTraining.map((training) => {
                  const overall = Math.round(training.goals.reduce((acc, g) => acc + g.progress, 0) / (training.goals.length || 1));
                  const nextPlan = training.trainingPlan.find(p => !p.completed);
                  const latestReport = training.reports[0];
                  return (
                    <div key={training.horseId} onClick={() => { setSelectedTraining(training); setTrainingDetailTab('exercises'); }} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-lg font-bold">
                            {training.horseName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-serif text-xl font-bold text-deepNavy">{training.horseName}</h3>
                            <p className="text-xs text-marineBlue">{training.exercises.length} ćwiczeń • {training.goals.length} celów</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setEditingTraining(training); setShowTrainingModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setHorseTraining(horseTraining.filter(t => t.horseId !== training.horseId)); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-arcticBlue/40 rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Postęp celów</p>
                          <p className="text-sm font-bold text-deepNavy">{overall}%</p>
                        </div>
                        <div className="bg-arcticBlue/40 rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Najbliższy plan</p>
                          <p className="text-sm font-bold text-deepNavy line-clamp-1">{nextPlan?.date || '-'}</p>
                        </div>
                        <div className="bg-arcticBlue/40 rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Ostatni raport</p>
                          <p className="text-sm font-bold text-deepNavy line-clamp-1">{latestReport?.date || '-'}</p>
                        </div>
                        <div className="bg-arcticBlue/40 rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Planów do wykonania</p>
                          <p className="text-sm font-bold text-deepNavy">{training.trainingPlan.filter(p => !p.completed).length}</p>
                        </div>
                      </div>

                      {training.notes && (
                        <p className="text-xs text-marineBlue line-clamp-2">{training.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj dokumentów..."
                    value={documentsSearchTerm}
                    onChange={(e) => setDocumentsSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={() => { setEditingDocuments(null); setShowDocumentsModal(true); }}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj dokumenty</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocuments.map((docs) => (
                  <div key={docs.horseId} onClick={() => setSelectedDocuments(docs)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-lg font-bold">
                          {docs.horseName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-bold text-deepNavy">{docs.horseName}</h3>
                          <p className="text-xs text-marineBlue">{docs.certificates.length} certyfikatów • {docs.otherDocuments.length} innych</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setEditingDocuments(docs); setShowDocumentsModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setHorseDocuments(horseDocuments.filter(d => d.horseId !== docs.horseId)); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {docs.passport && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-marineBlue">Paszport</span>
                          <span className="font-medium text-deepNavy line-clamp-1">{docs.passport.number}</span>
                        </div>
                      )}
                      {docs.insurance && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-marineBlue">Ubezpieczenie</span>
                          <span className="font-medium text-deepNavy line-clamp-1">{docs.insurance.company}</span>
                        </div>
                      )}
                      {docs.notes && (
                        <p className="text-xs text-marineBlue line-clamp-2">{docs.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {selectedHorse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  {selectedHorse.image ? (
                    <img src={selectedHorse.image} alt={selectedHorse.name} className="w-16 h-16 rounded-full object-cover border-2 border-iceBlue" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-2xl font-bold">
                      {selectedHorse.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedHorse.name}</h2>
                    <p className="text-sm text-marineBlue">{selectedHorse.breed} • {selectedHorse.color} • {selectedHorse.age} lat</p>
                  </div>
                </div>
                <button onClick={() => setSelectedHorse(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              {selectedHorse.image && (
                <div className="mb-6">
                  <img src={selectedHorse.image} alt={selectedHorse.name} className="w-full h-56 object-cover rounded-3xl border border-iceBlue" />
                </div>
              )}

              <p className="text-deepNavy mb-6">{selectedHorse.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Płeć</p>
                  <p className="text-sm font-semibold text-deepNavy">{genders.find(g => g.value === selectedHorse.gender)?.label}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Wzrost</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedHorse.height} cm</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Waga</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedHorse.weight} kg</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Data urodzenia</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedHorse.dateOfBirth || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Boks</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedHorse.boxNumber || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Poziom</p>
                  <p className="text-sm font-semibold text-deepNavy">{levels.find(l => l.value === selectedHorse.level)?.label}</p>
                </div>
              </div>

              {selectedHorse.specialSkills.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-marineBlue mb-2">Umiejętności</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedHorse.specialSkills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white text-deepNavy border border-iceBlue">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statuses.find(s => s.value === selectedHorse.status)?.color}`}>
                  {statuses.find(s => s.value === selectedHorse.status)?.label}
                </span>
                {selectedHorse.isBoarding && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-oceanBlue/10 text-oceanBlue">Pensjonat</span>
                )}
              </div>

              {(() => {
                const workload = horseWorkload.find(w => w.horseId === selectedHorse.id);
                const health = horseHealth.find(h => h.horseId === selectedHorse.id);
                if (!workload && !health) return null;
                return (
                  <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                    <h3 className="font-serif text-lg font-bold text-deepNavy mb-4">Obciążenie i najbliższe terminy</h3>
                    {workload && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Przepracowane dni z rzędu</p>
                          <p className="text-sm font-semibold text-deepNavy">{workload.currentConsecutiveWorkDays}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Dzisiaj zajęć</p>
                          <p className="text-sm font-semibold text-deepNavy">{workload.currentDailyWorkload}/{workload.dailyLimit}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Ten tydzień</p>
                          <p className="text-sm font-semibold text-deepNavy">{workload.currentWeeklyWorkload}/{workload.weeklyLimit}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Ten miesiąc</p>
                          <p className="text-sm font-semibold text-deepNavy">{workload.currentMonthlyWorkload}/{workload.monthlyLimit}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {workload && (
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Następny wymagany odpoczynek</p>
                          <p className="text-sm font-semibold text-deepNavy">{workload.nextRestRequired ? (workload.nextRestDate || 'Tak') : 'Nie'}</p>
                        </div>
                      )}
                      {health && (
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Następna wizyta weterynaryjna</p>
                          <p className="text-sm font-semibold text-deepNavy">{health.nextVetVisit || '-'}</p>
                        </div>
                      )}
                      {health && (
                        <div className="bg-white rounded-2xl p-3">
                          <p className="text-xs text-marineBlue">Następna wizyta kowala</p>
                          <p className="text-sm font-semibold text-deepNavy">{health.nextFarrierVisit || '-'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <button onClick={() => { setSelectedHorse(null); handleEditHorse(selectedHorse); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj</button>
                <button onClick={() => { setSelectedHorse(null); handleDeleteHorse(selectedHorse.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingHorse ? 'Edytuj konia' : 'Dodaj konia'}
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Imię</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Rasa</label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Płeć</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Horse['gender'] })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {genders.map((gender) => (
                        <option key={gender.value} value={gender.value}>{gender.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Maść</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Wiek (lata)</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Wzrost (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Waga (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data urodzenia</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                    style={{ boxSizing: 'border-box' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Nr rejestracyjny</label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Nr mikrochipu</label>
                    <input
                      type="text"
                      value={formData.microchipNumber}
                      onChange={(e) => setFormData({ ...formData, microchipNumber: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Poziom</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value as Horse['level'] })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {levels.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Horse['status'] })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Dyscyplina</label>
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value as Horse['discipline'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {disciplines.map((discipline) => (
                      <option key={discipline.value} value={discipline.value}>{discipline.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Nr boksu</label>
                    <input
                      type="text"
                      value={formData.boxNumber}
                      onChange={(e) => setFormData({ ...formData, boxNumber: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Właściciel</label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Umiejętności specjalne (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={formData.specialSkills.join(', ')}
                    onChange={(e) => setFormData({ ...formData, specialSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                    placeholder="np. Ujeżdżenie, Skoki, Hipoterapia"
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Zdjęcie konia</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-oceanBlue/10 file:text-oceanBlue hover:file:bg-oceanBlue/20"
                  />
                  {formData.image && (
                    <div className="mt-3">
                      <img src={formData.image} alt="Podgląd konia" className="w-full h-40 object-cover rounded-2xl border border-iceBlue" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki zdrowotne</label>
                  <textarea
                    value={formData.healthNotes}
                    onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all font-semibold"
                  >
                    {editingHorse ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Workload Settings Modal */}
      {selectedWorkload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-2xl font-bold">
                    {selectedWorkload.horseName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedWorkload.horseName}</h2>
                    {selectedWorkload.nextRestRequired && (
                      <span className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Wymaga przerwy {selectedWorkload.nextRestDate ? `(${selectedWorkload.nextRestDate})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedWorkload(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Dzienny</p>
                  <p className="text-sm font-bold text-deepNavy">{selectedWorkload.currentDailyWorkload}/{selectedWorkload.dailyLimit}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Tygodniowy</p>
                  <p className="text-sm font-bold text-deepNavy">{selectedWorkload.currentWeeklyWorkload}/{selectedWorkload.weeklyLimit}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Miesięczny</p>
                  <p className="text-sm font-bold text-deepNavy">{selectedWorkload.currentMonthlyWorkload}/{selectedWorkload.monthlyLimit}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Dni z rzędu</p>
                  <p className="text-sm font-bold text-deepNavy">{selectedWorkload.currentConsecutiveWorkDays}/{selectedWorkload.restRules.maxConsecutiveWorkDays}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-deepNavy mb-3">Cały tydzień</p>
                <div className="grid grid-cols-7 gap-2">
                  {selectedWorkload.weeklySchedule.map((day) => {
                    const typeColors: Record<string, string> = {
                      lekcja: 'bg-oceanBlue text-white',
                      trening: 'bg-green-500 text-white',
                      zawody: 'bg-purple-500 text-white',
                      inne: 'bg-yellow-500 text-white',
                      wolne: 'bg-arcticBlue/40 text-marineBlue',
                    };
                    return (
                      <div key={day.day} className="bg-arcticBlue/30 rounded-2xl p-3 text-center">
                        <p className="text-xs text-marineBlue mb-1">{day.day}</p>
                        <p className="text-xs text-deepNavy mb-1">{day.date.slice(5)}</p>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${day.sessions > 0 ? typeColors[day.type] : typeColors['wolne']}`}>
                          {day.sessions}
                        </div>
                        {day.sessions > 0 && <p className="text-[10px] text-marineBlue mt-1 capitalize">{day.type}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm font-semibold text-deepNavy mb-2">Limity per typ zajęć</p>
                {Object.entries(selectedWorkload.activityLimits).map(([activity, limits]) => {
                  const activityLabels: Record<string, string> = { lessons: 'Lekcje', training: 'Trening', competitions: 'Zawody', other: 'Inne' };
                  return (
                    <div key={activity} className="flex items-center justify-between text-sm p-3 bg-arcticBlue/40 rounded-2xl">
                      <span className="text-marineBlue">{activityLabels[activity]}</span>
                      <span className="text-deepNavy font-medium">{limits.current}/{limits.limit}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                <p className="text-xs text-marineBlue font-medium mb-2">Zasady przerw i regeneracji:</p>
                <div className="space-y-1 text-sm text-deepNavy">
                  <p>• Min. przerwa między sesjami: {selectedWorkload.restRules.minBreakBetweenSessions} min</p>
                  <p>• Dni wolne po pełnym dniu: {selectedWorkload.restRules.minRestDaysAfterFullWork}</p>
                  <p>• Dni wolne po zawodach: {selectedWorkload.restRules.minRestDaysAfterCompetition}</p>
                </div>
              </div>

              {selectedWorkload.notes && (
                <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                  <p className="text-xs text-marineBlue mb-1">Notatki</p>
                  <p className="text-sm text-deepNavy">{selectedWorkload.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setSelectedWorkload(null); setEditingWorkload(selectedWorkload); setShowWorkloadModal(true); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj limity</button>
                <button onClick={() => { setSelectedWorkload(null); setHorseWorkload(horseWorkload.filter(w => w.horseId !== selectedWorkload.horseId)); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWorkloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingWorkload ? 'Edytuj limity' : 'Ustaw limity'}
                </h2>
                <button
                  onClick={() => setShowWorkloadModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Select Horse */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    defaultValue={editingWorkload?.horseId || ''}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                {/* Daily/Weekly/Monthly Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Limit dzienny</label>
                    <input
                      type="number"
                      defaultValue={editingWorkload?.dailyLimit || 4}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Limit tygodniowy</label>
                    <input
                      type="number"
                      defaultValue={editingWorkload?.weeklyLimit || 20}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Limit miesięczny</label>
                    <input
                      type="number"
                      defaultValue={editingWorkload?.monthlyLimit || 80}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                </div>

                {/* Activity Limits */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Limity per typ zajęć</h3>
                  
                  {['lessons', 'training', 'competitions', 'other'].map((activity) => {
                    const activityLabels: Record<string, string> = {
                      lessons: 'Lekcje',
                      training: 'Trening',
                      competitions: 'Zawody',
                      other: 'Inne'
                    };
                    const limits = editingWorkload?.activityLimits[activity as keyof typeof editingWorkload.activityLimits];
                    
                    return (
                      <div key={activity} className="mb-4 p-4 bg-iceBlue/20 rounded-xl">
                        <h4 className="font-medium text-deepNavy mb-3">{activityLabels[activity]}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-marineBlue mb-1">Limit dzienny</label>
                            <input
                              type="number"
                              defaultValue={limits?.limit || 0}
                              className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-marineBlue mb-1">Obecnie</label>
                            <input
                              type="number"
                              defaultValue={limits?.current || 0}
                              className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm bg-gray-50"
                              min="0"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rest Rules */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Zasady przerw i regeneracji</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Max dni pracy z rzędu</label>
                      <input
                        type="number"
                        defaultValue={editingWorkload?.restRules.maxConsecutiveWorkDays || 5}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Min. dni wolne po pełnym dniu</label>
                      <input
                        type="number"
                        defaultValue={editingWorkload?.restRules.minRestDaysAfterFullWork || 1}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Min. dni wolne po zawodach</label>
                      <input
                        type="number"
                        defaultValue={editingWorkload?.restRules.minRestDaysAfterCompetition || 2}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Min. przerwa między sesjami (min)</label>
                      <input
                        type="number"
                        defaultValue={editingWorkload?.restRules.minBreakBetweenSessions || 30}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Obecne dni pracy z rzędu</label>
                      <input
                        type="number"
                        defaultValue={editingWorkload?.currentConsecutiveWorkDays || 0}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm bg-gray-50"
                        min="0"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Ostatni dzień wolny</label>
                      <input
                        type="date"
                        defaultValue={editingWorkload?.lastRestDate || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    defaultValue={editingWorkload?.notes || ''}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                    placeholder="Dodatkowe informacje o limitych obciążenia..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowWorkloadModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={() => {
                      // Save logic would go here - for now just close modal
                      setShowWorkloadModal(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all font-semibold"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Edit Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingHealth ? 'Edytuj rekord zdrowia' : 'Dodaj rekord zdrowia'}
                </h2>
                <button
                  onClick={() => setShowHealthModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Select Horse */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    defaultValue={editingHealth?.horseId || ''}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                {/* Vet Visits */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Wizyty weterynaryjne
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Ostatnia wizyta</label>
                      <input
                        type="date"
                        defaultValue={editingHealth?.lastVetVisit || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Następna wizyta</label>
                      <input
                        type="date"
                        defaultValue={editingHealth?.nextVetVisit || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vaccination Status */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Szczepienia</h3>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status szczepień</label>
                    <select
                      defaultValue={editingHealth?.vaccinationStatus || 'up_to_date'}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {vaccinationStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditions Section */}
                <div className="border-t border-iceBlue pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-deepNavy">Choroby i schorzenia</h3>
                    <button
                      type="button"
                      className="text-sm text-oceanBlue hover:text-marineBlue font-medium"
                    >
                      + Dodaj chorobę
                    </button>
                  </div>
                  
                  {editingHealth?.medicalConditions && editingHealth.medicalConditions.length > 0 ? (
                    <div className="space-y-3">
                      {editingHealth.medicalConditions.map((condition, idx) => (
                        <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-200">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                              <label className="block text-xs text-red-800 mb-1">Nazwa choroby</label>
                              <input
                                type="text"
                                defaultValue={condition.name}
                                className="w-full px-3 py-2 rounded-lg border border-red-200 focus:outline-none focus:border-red-400 text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-red-800 mb-1">Data diagnozy</label>
                              <input
                                type="date"
                                defaultValue={condition.diagnosedDate}
                                className="w-full px-3 py-2 rounded-lg border border-red-200 focus:outline-none focus:border-red-400 text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-red-800 mb-1">Status</label>
                              <select
                                defaultValue={condition.status}
                                className="w-full px-3 py-2 rounded-lg border border-red-200 focus:outline-none focus:border-red-400 text-deepNavy text-sm"
                              >
                                <option value="active">Aktywna</option>
                                <option value="chronic">Przewlekła</option>
                                <option value="resolved">Wyleczona</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-red-800 mb-1">Notatki</label>
                            <textarea
                              defaultValue={condition.notes}
                              className="w-full px-3 py-2 rounded-lg border border-red-200 focus:outline-none focus:border-red-400 text-deepNavy text-sm resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-marineBlue text-center py-4">Brak chorób. Kliknij "Dodaj chorobę" aby rozpocząć.</p>
                  )}
                </div>

                {/* Medications Section */}
                <div className="border-t border-iceBlue pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-deepNavy">Leki i suplementy</h3>
                    <button
                      type="button"
                      className="text-sm text-oceanBlue hover:text-marineBlue font-medium"
                    >
                      + Dodaj lek
                    </button>
                  </div>
                  
                  {editingHealth?.medications && editingHealth.medications.length > 0 ? (
                    <div className="space-y-3">
                      {editingHealth.medications.map((med) => (
                        <div key={med.name} className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                              <label className="block text-xs text-green-800 mb-1">Nazwa leku</label>
                              <input
                                type="text"
                                defaultValue={med.name}
                                className="w-full px-3 py-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-400 text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-green-800 mb-1">Dawkowanie</label>
                              <input
                                type="text"
                                defaultValue={med.dosage}
                                className="w-full px-3 py-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-400 text-deepNavy text-sm"
                                placeholder="Np. 500mg 2x dziennie"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-green-800 mb-1">Częstotliwość</label>
                              <input
                                type="text"
                                defaultValue={med.frequency}
                                className="w-full px-3 py-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-400 text-deepNavy text-sm"
                                placeholder="Np. Codziennie"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-green-800 mb-1">Data rozpoczęcia</label>
                              <input
                                type="date"
                                defaultValue={med.startDate}
                                className="w-full px-3 py-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-400 text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-green-800 mb-1">Data zakończenia</label>
                              <input
                                type="date"
                                defaultValue={med.endDate}
                                className="w-full px-3 py-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-400 text-deepNavy text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-green-800 mb-1">Status</label>
                              <select
                                defaultValue={med.status}
                                className="w-full px-3 py-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-400 text-deepNavy text-sm"
                              >
                                <option value="active">Aktywny</option>
                                <option value="completed">Zakończony</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-marineBlue text-center py-4">Brak leków. Kliknij "Dodaj lek" aby rozpocząć.</p>
                  )}
                </div>

                {/* General Health Notes */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki zdrowotne</label>
                  <textarea
                    defaultValue={editingHealth?.healthNotes || ''}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={3}
                    placeholder="Dodatkowe informacje o stanie zdrowia..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowHealthModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={() => {
                      // Save logic would go here - for now just close modal
                      setShowHealthModal(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all font-semibold"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feeding Edit Modal */}
      {showFeedingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingFeeding ? 'Edytuj karmienie' : 'Dodaj karmienie'}
                </h2>
                <button
                  onClick={() => setShowFeedingModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Select Horse */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    defaultValue={editingFeeding?.horseId || ''}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                {/* Feeding Schedule */}
                <div>
                  <h3 className="font-semibold text-deepNavy mb-3">Harmonogram karmienia</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Rano</label>
                      <input
                        type="text"
                        defaultValue={editingFeeding?.feedingSchedule.morning || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="np. 2 kg owsa + siano"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">W południe</label>
                      <input
                        type="text"
                        defaultValue={editingFeeding?.feedingSchedule.noon || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="np. 1 kg koncentratu"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Wieczorem</label>
                      <input
                        type="text"
                        defaultValue={editingFeeding?.feedingSchedule.evening || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="np. 2 kg owsa + siano"
                      />
                    </div>
                  </div>
                </div>

                {/* Costs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Koszt dzienny (zł)</label>
                    <input
                      type="number"
                      defaultValue={editingFeeding?.dailyCost || 0}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Koszt miesięczny (zł)</label>
                    <input
                      type="number"
                      defaultValue={editingFeeding?.monthlyCost || 0}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    defaultValue={editingFeeding?.notes || ''}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                    placeholder="Dodatkowe informacje o diecie..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowFeedingModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all font-semibold"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTraining && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-xl font-bold">
                    {selectedTraining.horseName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedTraining.horseName}</h2>
                    <p className="text-sm text-marineBlue">Plan treningowy i raporty</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingTraining(selectedTraining); setSelectedTraining(null); setShowTrainingModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setHorseTraining(horseTraining.filter(t => t.horseId !== selectedTraining.horseId)); setSelectedTraining(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedTraining(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(['exercises','goals','plan','reports'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTrainingDetailTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${trainingDetailTab === tab ? 'bg-oceanBlue text-white' : 'bg-arcticBlue/40 text-marineBlue hover:bg-iceBlue'}`}
                  >
                    {tab === 'exercises' ? 'Ćwiczenia' : tab === 'goals' ? 'Cele' : tab === 'plan' ? 'Plan' : 'Raporty'}
                  </button>
                ))}
              </div>

              {trainingDetailTab === 'exercises' && (
                <div className="space-y-3">
                  {selectedTraining.exercises.map((exercise) => {
                    const categoryLabels: Record<string, string> = { dressage: 'Ujeżdżenie', jumping: 'Skoki', cross_country: 'W terenie', groundwork: 'Praca z ziemi', other: 'Inne' };
                    const difficultyLabels: Record<string, string> = { beginner: 'Początkujący', intermediate: 'Średniozaawansowany', advanced: 'Zaawansowany' };
                    const statusLabels: Record<string, string> = { not_started: 'Nie rozpoczęte', in_progress: 'W trakcie', completed: 'Ukończone', mastered: 'Opanowane' };
                    const statusColors: Record<string, string> = { not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', mastered: 'bg-purple-100 text-purple-700' };
                    return (
                      <div key={exercise.id} className="p-4 bg-iceBlue/20 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-deepNavy">{exercise.name}</p>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[exercise.status]}`}>{statusLabels[exercise.status]}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-marineBlue mb-3">
                          <span className="bg-arcticBlue/40 px-2 py-1 rounded-lg">{categoryLabels[exercise.category]}</span>
                          <span className="bg-arcticBlue/40 px-2 py-1 rounded-lg">{difficultyLabels[exercise.difficulty]}</span>
                          <span className="bg-arcticBlue/40 px-2 py-1 rounded-lg">Ostatnio: {exercise.lastPracticed || '-'}</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 mb-1">
                          <div className="bg-gradient-to-r from-oceanBlue to-marineBlue h-2 rounded-full" style={{ width: `${exercise.progress}%` }} />
                        </div>
                        <p className="text-xs text-marineBlue mt-2">{exercise.progress}%</p>
                        {exercise.notes && <p className="text-xs text-marineBlue mt-2">{exercise.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {trainingDetailTab === 'goals' && (
                <div className="space-y-3">
                  {selectedTraining.goals.map((goal) => {
                    const statusLabels: Record<string, string> = { not_started: 'Nie rozpoczęty', in_progress: 'W trakcie', completed: 'Ukończony' };
                    const statusColors: Record<string, string> = { not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' };
                    return (
                      <div key={goal.id} className="p-4 bg-iceBlue/20 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-deepNavy">{goal.title}</p>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[goal.status]}`}>{statusLabels[goal.status]}</span>
                        </div>
                        <p className="text-sm text-marineBlue mb-3">{goal.description}</p>
                        <div className="flex items-center justify-between text-xs text-marineBlue mb-1">
                          <span>Termin: {goal.targetDate}</span>
                          <span className="font-medium text-deepNavy">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div className="bg-gradient-to-r from-oceanBlue to-marineBlue h-2 rounded-full" style={{ width: `${goal.progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {trainingDetailTab === 'plan' && (
                <div className="space-y-3">
                  {selectedTraining.trainingPlan.length > 0 ? selectedTraining.trainingPlan.map((plan) => (
                    <div key={plan.id} className={`p-4 rounded-2xl border ${plan.completed ? 'bg-green-50 border-green-100' : 'bg-iceBlue/20 border-iceBlue'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-deepNavy">{plan.focus}</p>
                          <p className="text-xs text-marineBlue">{plan.date} • {plan.duration} min</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${plan.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{plan.completed ? 'Wykonany' : 'Zaplanowany'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {plan.exercises.map((ex, i) => <span key={i} className="text-xs bg-arcticBlue/40 text-marineBlue px-2 py-1 rounded-lg">{ex}</span>)}
                      </div>
                      {plan.notes && <p className="text-xs text-marineBlue">{plan.notes}</p>}
                    </div>
                  )) : <p className="text-sm text-marineBlue text-center py-8">Brak zaplanowanych treningów.</p>}
                </div>
              )}

              {trainingDetailTab === 'reports' && (
                <div className="space-y-4">
                  <div className="bg-arcticBlue/30 rounded-2xl p-4">
                    <h3 className="font-semibold text-deepNavy mb-3">Dodaj raport z dnia treningu</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input type="date" value={newReport.date} onChange={(e) => setNewReport({ ...newReport, date: e.target.value })} className="px-3 py-2 rounded-xl border border-iceBlue bg-white text-deepNavy text-sm" />
                      <input type="text" placeholder="Główny cel" value={newReport.focus} onChange={(e) => setNewReport({ ...newReport, focus: e.target.value })} className="px-3 py-2 rounded-xl border border-iceBlue bg-white text-deepNavy text-sm" />
                      <input type="text" placeholder="Wykonane ćwiczenia (oddziel przecinkiem)" value={newReport.exercisesDone} onChange={(e) => setNewReport({ ...newReport, exercisesDone: e.target.value })} className="px-3 py-2 rounded-xl border border-iceBlue bg-white text-deepNavy text-sm" />
                      <input type="number" placeholder="Czas trwania (min)" value={newReport.duration} onChange={(e) => setNewReport({ ...newReport, duration: parseInt(e.target.value) || 0 })} className="px-3 py-2 rounded-xl border border-iceBlue bg-white text-deepNavy text-sm" />
                      <select value={newReport.rating} onChange={(e) => setNewReport({ ...newReport, rating: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })} className="px-3 py-2 rounded-xl border border-iceBlue bg-white text-deepNavy text-sm">
                        <option value={1}>1 - słabo</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5 - świetnie</option>
                      </select>
                      <textarea placeholder="Notatki" value={newReport.notes} onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })} className="px-3 py-2 rounded-xl border border-iceBlue bg-white text-deepNavy text-sm resize-none" rows={2} />
                    </div>
                    <button
                      onClick={() => {
                        if (!newReport.date) return;
                        const report = { ...newReport, id: Date.now().toString(), exercisesDone: newReport.exercisesDone.split(',').map(x => x.trim()).filter(Boolean) };
                        setHorseTraining(prev => prev.map(t => t.horseId === selectedTraining.horseId ? { ...t, reports: [report, ...t.reports] } : t));
                        setSelectedTraining(prev => prev ? { ...prev, reports: [report, ...prev.reports] } : null);
                        setNewReport({ date: '', focus: '', exercisesDone: '', duration: 60, rating: 5, notes: '' });
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white text-sm font-medium"
                    >
                      Zapisz raport
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedTraining.reports.map((r) => (
                      <div key={r.id} className="p-4 bg-iceBlue/20 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-deepNavy">{r.date} — {r.focus}</p>
                          <span className="text-xs bg-oceanBlue text-white px-2 py-1 rounded-lg">Ocena {r.rating}/5</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.exercisesDone.map((ex, i) => <span key={i} className="text-xs bg-arcticBlue/40 text-marineBlue px-2 py-1 rounded-lg">{ex}</span>)}
                        </div>
                        <p className="text-xs text-marineBlue mb-1">{r.duration} min</p>
                        {r.notes && <p className="text-xs text-deepNavy">{r.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training Edit Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingTraining ? 'Edytuj trening' : 'Dodaj trening'}
                </h2>
                <button
                  onClick={() => setShowTrainingModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Select Horse */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    defaultValue={editingTraining?.horseId || ''}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                {/* Exercises Section */}
                <div className="border-t border-iceBlue pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-deepNavy">Ćwiczenia</h3>
                    <button
                      type="button"
                      className="text-sm text-oceanBlue hover:text-marineBlue font-medium"
                    >
                      + Dodaj ćwiczenie
                    </button>
                  </div>
                  
                  {editingTraining?.exercises && editingTraining.exercises.length > 0 ? (
                    <div className="space-y-3">
                      {editingTraining.exercises.map((exercise, idx) => (
                        <div key={exercise.id} className="p-4 bg-iceBlue/20 rounded-xl">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Nazwa ćwiczenia</label>
                              <input
                                type="text"
                                defaultValue={exercise.name}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Kategoria</label>
                              <select
                                defaultValue={exercise.category}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              >
                                <option value="dressage">Ujeżdżenie</option>
                                <option value="jumping">Skoki</option>
                                <option value="cross_country">W terenie</option>
                                <option value="groundwork">Praca z ziemi</option>
                                <option value="other">Inne</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Poziom</label>
                              <select
                                defaultValue={exercise.difficulty}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              >
                                <option value="beginner">Początkujący</option>
                                <option value="intermediate">Średniozaawansowany</option>
                                <option value="advanced">Zaawansowany</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Status</label>
                              <select
                                defaultValue={exercise.status}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              >
                                <option value="not_started">Nie rozpoczęte</option>
                                <option value="in_progress">W trakcie</option>
                                <option value="completed">Ukończone</option>
                                <option value="mastered">Opanowane</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Postęp (%)</label>
                              <input
                                type="number"
                                defaultValue={exercise.progress}
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Ostatnio ćwiczone</label>
                              <input
                                type="date"
                                defaultValue={exercise.lastPracticed}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-marineBlue mb-1">Notatki</label>
                            <textarea
                              defaultValue={exercise.notes}
                              className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-marineBlue text-center py-4">Brak ćwiczeń. Kliknij "Dodaj ćwiczenie" aby rozpocząć.</p>
                  )}
                </div>

                {/* Goals Section */}
                <div className="border-t border-iceBlue pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-deepNavy">Cele treningowe</h3>
                    <button
                      type="button"
                      className="text-sm text-oceanBlue hover:text-marineBlue font-medium"
                    >
                      + Dodaj cel
                    </button>
                  </div>
                  
                  {editingTraining?.goals && editingTraining.goals.length > 0 ? (
                    <div className="space-y-3">
                      {editingTraining.goals.map((goal) => (
                        <div key={goal.id} className="p-4 bg-iceBlue/20 rounded-xl">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                              <label className="block text-xs text-marineBlue mb-1">Tytuł celu</label>
                              <input
                                type="text"
                                defaultValue={goal.title}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-marineBlue mb-1">Opis</label>
                              <textarea
                                defaultValue={goal.description}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Data docelowa</label>
                              <input
                                type="date"
                                defaultValue={goal.targetDate}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Status</label>
                              <select
                                defaultValue={goal.status}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              >
                                <option value="not_started">Nie rozpoczęty</option>
                                <option value="in_progress">W trakcie</option>
                                <option value="completed">Ukończony</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-marineBlue mb-1">Postęp (%)</label>
                              <input
                                type="number"
                                defaultValue={goal.progress}
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-marineBlue text-center py-4">Brak celów. Kliknij "Dodaj cel" aby rozpocząć.</p>
                  )}
                </div>

                {/* General Notes */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki ogólne</label>
                  <textarea
                    defaultValue={editingTraining?.notes || ''}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={3}
                    placeholder="Dodatkowe informacje o treningu..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowTrainingModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={() => {
                      // Save logic would go here - for now just close modal
                      setShowTrainingModal(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all font-semibold"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDocuments && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white text-xl font-bold">
                    {selectedDocuments.horseName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedDocuments.horseName}</h2>
                    <p className="text-sm text-marineBlue">Dokumenty konia</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingDocuments(selectedDocuments); setSelectedDocuments(null); setShowDocumentsModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setHorseDocuments(horseDocuments.filter(d => d.horseId !== selectedDocuments.horseId)); setSelectedDocuments(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedDocuments(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              {selectedDocuments.passport && (
                <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="font-semibold text-deepNavy mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Paszport</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p className="text-marineBlue">Numer: <span className="text-deepNavy font-medium">{selectedDocuments.passport.number}</span></p>
                    <p className="text-marineBlue">Wydany: <span className="text-deepNavy">{selectedDocuments.passport.issueDate}</span></p>
                    <p className="text-marineBlue">Ważny do: <span className="text-deepNavy">{selectedDocuments.passport.expiryDate}</span></p>
                    <p className="text-marineBlue">Organ: <span className="text-deepNavy">{selectedDocuments.passport.issuingAuthority}</span></p>
                  </div>
                </div>
              )}

              {selectedDocuments.insurance && (
                <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <h3 className="font-semibold text-deepNavy mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Ubezpieczenie</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p className="text-marineBlue">Firma: <span className="text-deepNavy font-medium">{selectedDocuments.insurance.company}</span></p>
                    <p className="text-marineBlue">Polisa: <span className="text-deepNavy">{selectedDocuments.insurance.policyNumber}</span></p>
                    <p className="text-marineBlue">Okres: <span className="text-deepNavy">{selectedDocuments.insurance.startDate} - {selectedDocuments.insurance.endDate}</span></p>
                    <p className="text-marineBlue">Zakres: <span className="text-deepNavy">{selectedDocuments.insurance.coverage}</span></p>
                  </div>
                </div>
              )}

              {selectedDocuments.certificates.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-deepNavy mb-2">Certyfikaty</h3>
                  <div className="space-y-2">
                    {selectedDocuments.certificates.map(cert => (
                      <div key={cert.id} className="p-3 bg-iceBlue/20 rounded-2xl text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-deepNavy font-medium">{cert.type}</span>
                          <span className="text-marineBlue text-xs">{cert.issuingAuthority}</span>
                        </div>
                        <p className="text-marineBlue text-xs">Ważny: {cert.issueDate} - {cert.expiryDate}</p>
                        {cert.notes && <p className="text-marineBlue text-xs mt-1">{cert.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocuments.otherDocuments.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-deepNavy mb-2">Inne dokumenty</h3>
                  <div className="space-y-2">
                    {selectedDocuments.otherDocuments.map(doc => (
                      <div key={doc.id} className="p-3 bg-iceBlue/20 rounded-2xl text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-deepNavy font-medium">{doc.name}</span>
                          <span className="text-marineBlue text-xs">{doc.type}</span>
                        </div>
                        <p className="text-marineBlue text-xs">Wydany: {doc.issueDate}</p>
                        {doc.expiryDate && <p className="text-marineBlue text-xs">Ważny do: {doc.expiryDate}</p>}
                        {doc.notes && <p className="text-marineBlue text-xs mt-1">{doc.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocuments.notes && (
                <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedDocuments.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Edit Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingDocuments ? 'Edytuj dokumenty' : 'Dodaj dokumenty'}
                </h2>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Select Horse */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    defaultValue={editingDocuments?.horseId || ''}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                {/* Passport Section */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Paszport
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Numer paszportu</label>
                      <input
                        type="text"
                        defaultValue={editingDocuments?.passport?.number || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="Wprowadź numer paszportu"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data wydania</label>
                      <input
                        type="date"
                        defaultValue={editingDocuments?.passport?.issueDate || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data ważności</label>
                      <input
                        type="date"
                        defaultValue={editingDocuments?.passport?.expiryDate || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Organ wydający</label>
                      <input
                        type="text"
                        defaultValue={editingDocuments?.passport?.issuingAuthority || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="Np. PZHK"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Section */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Ubezpieczenie
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Firma ubezpieczeniowa</label>
                      <input
                        type="text"
                        defaultValue={editingDocuments?.insurance?.company || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="Np. PZU, Allianz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Numer polisy</label>
                      <input
                        type="text"
                        defaultValue={editingDocuments?.insurance?.policyNumber || ''}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        placeholder="Wprowadź numer polisy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data rozpoczęcia</label>
                      <input
                        type="date"
                        defaultValue={editingDocuments?.insurance?.startDate || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data zakończenia</label>
                      <input
                        type="date"
                        defaultValue={editingDocuments?.insurance?.endDate || ''}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-deepNavy mb-2">Zakres ubezpieczenia</label>
                      <textarea
                        defaultValue={editingDocuments?.insurance?.coverage || ''}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                        rows={2}
                        placeholder="Np. OC, AC, NNW"
                      />
                    </div>
                  </div>
                </div>

                {/* Certificates Section */}
                <div className="border-t border-iceBlue pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-deepNavy">Certyfikaty</h3>
                    <button
                      type="button"
                      className="text-sm text-oceanBlue hover:text-marineBlue font-medium"
                    >
                      + Dodaj certyfikat
                    </button>
                  </div>
                  
                  {editingDocuments?.certificates && editingDocuments.certificates.length > 0 ? (
                    <div className="space-y-3">
                      {editingDocuments.certificates.map((cert) => (
                        <div key={cert.id} className="p-4 bg-iceBlue/20 rounded-xl">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Typ certyfikatu</label>
                              <input
                                type="text"
                                defaultValue={cert.type}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Organ wydający</label>
                              <input
                                type="text"
                                defaultValue={cert.issuingAuthority}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Data wydania</label>
                              <input
                                type="date"
                                defaultValue={cert.issueDate}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Data ważności</label>
                              <input
                                type="date"
                                defaultValue={cert.expiryDate}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-marineBlue mb-1">Notatki</label>
                            <textarea
                              defaultValue={cert.notes}
                              className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-marineBlue text-center py-4">Brak certyfikatów. Kliknij "Dodaj certyfikat" aby rozpocząć.</p>
                  )}
                </div>

                {/* Other Documents Section */}
                <div className="border-t border-iceBlue pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-deepNavy">Inne dokumenty</h3>
                    <button
                      type="button"
                      className="text-sm text-oceanBlue hover:text-marineBlue font-medium"
                    >
                      + Dodaj dokument
                    </button>
                  </div>
                  
                  {editingDocuments?.otherDocuments && editingDocuments.otherDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {editingDocuments.otherDocuments.map((doc) => (
                        <div key={doc.id} className="p-4 bg-white rounded-lg border border-iceBlue">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                              <label className="block text-xs text-marineBlue mb-1">Nazwa dokumentu</label>
                              <input
                                type="text"
                                defaultValue={doc.name}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Typ</label>
                              <select
                                defaultValue={doc.type}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              >
                                <option value="medical">Medyczny</option>
                                <option value="ownership">Własności</option>
                                <option value="training">Treningowy</option>
                                <option value="competition">Zawodowy</option>
                                <option value="other">Inny</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-marineBlue mb-1">Data wydania</label>
                              <input
                                type="date"
                                defaultValue={doc.issueDate}
                                className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-marineBlue mb-1">Notatki</label>
                            <textarea
                              defaultValue={doc.notes}
                              className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-marineBlue text-center py-4">Brak innych dokumentów. Kliknij "Dodaj dokument" aby rozpocząć.</p>
                  )}
                </div>

                {/* General Notes */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki ogólne</label>
                  <textarea
                    defaultValue={editingDocuments?.notes || ''}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={3}
                    placeholder="Dodatkowe informacje o dokumentach..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowDocumentsModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={() => {
                      // Save logic would go here - for now just close modal
                      setShowDocumentsModal(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all font-semibold"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav user={user} />
    </div>
  );
}

export default function HorsesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center">
      <div className="text-deepNavy">Ładowanie...</div>
    </div>}>
      <HorsesContent />
    </Suspense>
  );
}
