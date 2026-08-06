'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, Calendar, Users, MapPin, DollarSign, CheckSquare, Square, FileText, User, Phone, Mail, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface CampSession {
  id: string;
  campId: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  currentRegistrations: number;
  price: number;
  status: 'draft' | 'open' | 'full' | 'completed' | 'cancelled';
  ageRange: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
}

interface Camp {
  id: string;
  name: string;
  description: string;
  location: string;
  instructors: string[];
  activities: string[];
  requirements: string[];
  includes: string[];
  notes: string;
  status: 'active' | 'archived';
  sessions: CampSession[];
}

interface Participant {
  id: string;
  sessionId: string;
  sessionName: string;
  campId: string;
  campName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  pesel: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelation: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
  swimmingAbility: 'none' | 'beginner' | 'intermediate' | 'advanced';
  ridingExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  registrationDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  consentPhotos: boolean;
  consentMedical: boolean;
  consentRules: boolean;
}

export default function CampsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'camps' | 'sessions' | 'participants'>('camps');
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null);
  const [editingSession, setEditingSession] = useState<CampSession | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null);
  const [campSearchTerm, setCampSearchTerm] = useState('');
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [selectedSession, setSelectedSession] = useState<(CampSession & { campName: string }) | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);

  const [campFormData, setCampFormData] = useState({
    name: '',
    description: '',
    location: '',
    instructors: [] as string[],
    activities: [] as string[],
    requirements: [] as string[],
    includes: [] as string[],
    notes: '',
    status: 'active' as Camp['status'],
  });

  const [sessionFormData, setSessionFormData] = useState({
    campId: '',
    name: '',
    startDate: '',
    endDate: '',
    capacity: 20,
    price: 0,
    status: 'draft' as CampSession['status'],
    ageRange: '',
    skillLevel: 'all' as CampSession['skillLevel'],
  });

  const [participantFormData, setParticipantFormData] = useState({
    sessionId: '',
    sessionName: '',
    campId: '',
    campName: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    pesel: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    medicalConditions: '',
    medications: '',
    allergies: '',
    dietaryRestrictions: '',
    swimmingAbility: 'none' as Participant['swimmingAbility'],
    ridingExperience: 'none' as Participant['ridingExperience'],
    paymentStatus: 'pending' as Participant['paymentStatus'],
    paymentAmount: 0,
    status: 'pending' as Participant['status'],
    notes: '',
    consentPhotos: false,
    consentMedical: false,
    consentRules: false,
  });

  const [newInstructor, setNewInstructor] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newInclude, setNewInclude] = useState('');

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [camps, setCamps] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [campsRes, participantsRes] = await Promise.all([
          api.get(`/camps?stableId=${activeStableId}`),
          api.get(`/camps/participants/all?stableId=${activeStableId}`),
        ]);
        setCamps(campsRes.data || []);
        setParticipants(participantsRes.data || []);
      } catch (error) {
        console.error('Load camps error:', error);
        setCamps([]);
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
          <p className="text-marineBlue">Ładowanie obozów...</p>
        </div>
      </div>
    );
  }

  const skillLevels = [
    { value: 'beginner', label: 'Początkujący' },
    { value: 'intermediate', label: 'Średniozaawansowany' },
    { value: 'advanced', label: 'Zaawansowany' },
    { value: 'all', label: 'Wszystkie poziomy' },
  ];

  const sessionStatuses = [
    { value: 'draft', label: 'Projekt', color: 'bg-gray-100 text-gray-800' },
    { value: 'open', label: 'Otwarty', color: 'bg-green-100 text-green-800' },
    { value: 'full', label: 'Zapełniony', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Zakończony', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Anulowany', color: 'bg-red-100 text-red-800' },
  ];

  const participantStatuses = [
    { value: 'pending', label: 'Oczekująca', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Potwierdzona', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Anulowana', color: 'bg-red-100 text-red-800' },
  ];

  const paymentStatuses = [
    { value: 'pending', label: 'Oczekująca', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'partial', label: 'Częściowa', color: 'bg-orange-100 text-orange-800' },
    { value: 'paid', label: 'Opłacona', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Zaległa', color: 'bg-red-100 text-red-800' },
  ];

  const swimmingLevels = [
    { value: 'none', label: 'Nie umie' },
    { value: 'beginner', label: 'Początkujący' },
    { value: 'intermediate', label: 'Średniozaawansowany' },
    { value: 'advanced', label: 'Zaawansowany' },
  ];

  const handleAddCamp = () => {
    setCampFormData({
      name: '',
      description: '',
      location: '',
      instructors: [],
      activities: [],
      requirements: [],
      includes: [],
      notes: '',
      status: 'active',
    });
    setNewInstructor('');
    setNewActivity('');
    setNewRequirement('');
    setNewInclude('');
    setEditingCamp(null);
    setShowAddCampModal(true);
  };

  const handleAddSession = (campId: string) => {
    setSessionFormData({
      campId,
      name: '',
      startDate: '',
      endDate: '',
      capacity: 20,
      price: 0,
      status: 'draft',
      ageRange: '',
      skillLevel: 'all',
    });
    setEditingSession(null);
    setShowAddSessionModal(true);
  };

  const handleAddParticipant = () => {
    setParticipantFormData({
      sessionId: '',
      sessionName: '',
      campId: '',
      campName: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      pesel: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      emergencyContact: '',
      emergencyPhone: '',
      emergencyRelation: '',
      medicalConditions: '',
      medications: '',
      allergies: '',
      dietaryRestrictions: '',
      swimmingAbility: 'none',
      ridingExperience: 'none',
      paymentStatus: 'pending',
      paymentAmount: 0,
      status: 'pending',
      notes: '',
      consentPhotos: false,
      consentMedical: false,
      consentRules: false,
    });
    setEditingParticipant(null);
    setShowAddParticipantModal(true);
  };

  const handleEditCamp = (camp: Camp) => {
    setCampFormData({
      name: camp.name,
      description: camp.description,
      location: camp.location,
      instructors: camp.instructors,
      activities: camp.activities,
      requirements: camp.requirements,
      includes: camp.includes,
      notes: camp.notes,
      status: camp.status,
    });
    setNewInstructor('');
    setNewActivity('');
    setNewRequirement('');
    setNewInclude('');
    setEditingCamp(camp);
    setShowAddCampModal(true);
  };

  const handleEditSession = (session: CampSession) => {
    setSessionFormData({
      campId: session.campId,
      name: session.name,
      startDate: session.startDate,
      endDate: session.endDate,
      capacity: session.capacity,
      price: session.price,
      status: session.status,
      ageRange: session.ageRange,
      skillLevel: session.skillLevel,
    });
    setEditingSession(session);
    setShowAddSessionModal(true);
  };

  const handleEditParticipant = (participant: Participant) => {
    setParticipantFormData({
      sessionId: participant.sessionId,
      sessionName: participant.sessionName,
      campId: participant.campId,
      campName: participant.campName,
      firstName: participant.firstName,
      lastName: participant.lastName,
      dateOfBirth: participant.dateOfBirth,
      pesel: participant.pesel,
      address: participant.address,
      city: participant.city,
      postalCode: participant.postalCode,
      phone: participant.phone,
      email: participant.email,
      parentName: participant.parentName,
      parentPhone: participant.parentPhone,
      parentEmail: participant.parentEmail,
      emergencyContact: participant.emergencyContact,
      emergencyPhone: participant.emergencyPhone,
      emergencyRelation: participant.emergencyRelation,
      medicalConditions: participant.medicalConditions,
      medications: participant.medications,
      allergies: participant.allergies,
      dietaryRestrictions: participant.dietaryRestrictions,
      swimmingAbility: participant.swimmingAbility,
      ridingExperience: participant.ridingExperience,
      paymentStatus: participant.paymentStatus,
      paymentAmount: participant.paymentAmount,
      status: participant.status,
      notes: participant.notes,
      consentPhotos: participant.consentPhotos,
      consentMedical: participant.consentMedical,
      consentRules: participant.consentRules,
    });
    setEditingParticipant(participant);
    setShowAddParticipantModal(true);
  };

  const handleDeleteCamp = async (id: string) => {
    try {
      await api.delete(`/camps/${id}`);
      setCamps(camps.filter(c => c.id !== id));
    } catch (error) {
      console.error('Delete camp error:', error);
      alert('Nie udało się usunąć obozu');
    }
  };

  const handleDeleteSession = async (campId: string, sessionId: string) => {
    try {
      await api.delete(`/camps/sessions/${sessionId}`);
      setCamps(camps.map(c => {
        if (c.id === campId) {
          return {
            ...c,
            sessions: c.sessions.filter((s: any) => s.id !== sessionId),
          };
        }
        return c;
      }));
    } catch (error) {
      console.error('Delete session error:', error);
      alert('Nie udało się usunąć turnusu');
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    try {
      await api.delete(`/camps/participants/${id}`);
      setParticipants(participants.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete participant error:', error);
      alert('Nie udało się usunąć uczestnika');
    }
  };

  const handleSubmitCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCamp) {
        const { data } = await api.put(`/camps/${editingCamp.id}`, campFormData);
        setCamps(camps.map(c => c.id === editingCamp.id ? data : c));
      } else {
        const { data } = await api.post('/camps', { ...campFormData, stableId: activeStableId });
        setCamps([...camps, { ...data, sessions: [] }]);
      }
      setShowAddCampModal(false);
    } catch (error) {
      console.error('Save camp error:', error);
      alert('Nie udało się zapisać obozu');
    }
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const camp = camps.find(c => c.id === sessionFormData.campId);
      if (!camp) return;

      if (editingSession) {
        const { data } = await api.put(`/camps/sessions/${editingSession.id}`, sessionFormData);
        setCamps(camps.map(c => {
          if (c.id === camp.id) {
            return {
              ...c,
              sessions: c.sessions.map((s: any) => s.id === editingSession.id ? data : s),
            };
          }
          return c;
        }));
      } else {
        const { data } = await api.post('/camps/sessions', { ...sessionFormData, stableId: activeStableId });
        setCamps(camps.map(c => {
          if (c.id === camp.id) {
            return {
              ...c,
              sessions: [...c.sessions, { ...data, currentRegistrations: 0 }],
            };
          }
          return c;
        }));
      }
      setShowAddSessionModal(false);
    } catch (error) {
      console.error('Save session error:', error);
      alert('Nie udało się zapisać turnusu');
    }
  };

  const handleSubmitParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        const { data } = await api.put(`/camps/participants/${editingParticipant.id}`, participantFormData);
        setParticipants(participants.map(p => p.id === editingParticipant.id ? data : p));
      } else {
        const { data } = await api.post('/camps/participants', { ...participantFormData, stableId: activeStableId });
        setParticipants([...participants, { ...data, registrationDate: new Date().toISOString().split('T')[0] }]);
      }
      setShowAddParticipantModal(false);
    } catch (error) {
      console.error('Save participant error:', error);
      alert('Nie udało się zapisać uczestnika');
    }
  };

  const handleAddInstructor = () => {
    if (newInstructor.trim()) {
      setCampFormData({ ...campFormData, instructors: [...campFormData.instructors, newInstructor] });
      setNewInstructor('');
    }
  };

  const handleDeleteInstructor = (index: number) => {
    setCampFormData({
      ...campFormData,
      instructors: campFormData.instructors.filter((_, i) => i !== index),
    });
  };

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      setCampFormData({ ...campFormData, activities: [...campFormData.activities, newActivity] });
      setNewActivity('');
    }
  };

  const handleDeleteActivity = (index: number) => {
    setCampFormData({
      ...campFormData,
      activities: campFormData.activities.filter((_, i) => i !== index),
    });
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setCampFormData({ ...campFormData, requirements: [...campFormData.requirements, newRequirement] });
      setNewRequirement('');
    }
  };

  const handleDeleteRequirement = (index: number) => {
    setCampFormData({
      ...campFormData,
      requirements: campFormData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleAddInclude = () => {
    if (newInclude.trim()) {
      setCampFormData({ ...campFormData, includes: [...campFormData.includes, newInclude] });
      setNewInclude('');
    }
  };

  const handleDeleteInclude = (index: number) => {
    setCampFormData({
      ...campFormData,
      includes: campFormData.includes.filter((_, i) => i !== index),
    });
  };


  const getCampStats = () => {
    const totalCamps = camps.length;
    const totalSessions = camps.reduce((sum, c) => sum + c.sessions.length, 0);
    const openSessions = camps.reduce((sum, c) => sum + c.sessions.filter((s: any) => s.status === 'open').length, 0);
    const totalParticipants = participants.length;
    const confirmedParticipants = participants.filter(p => p.status === 'confirmed').length;
    const pendingParticipants = participants.filter(p => p.status === 'pending').length;
    const totalRevenue = participants.reduce((sum, p) => sum + p.paymentAmount, 0);

    return {
      totalCamps,
      totalSessions,
      openSessions,
      totalParticipants,
      confirmedParticipants,
      pendingParticipants,
      totalRevenue,
    };
  };

  const stats = getCampStats();

  const filteredCamps = camps.filter(c =>
    c.name.toLowerCase().includes(campSearchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(campSearchTerm.toLowerCase()) ||
    c.status.toLowerCase().includes(campSearchTerm.toLowerCase())
  );

  const filteredSessions = camps
    .flatMap(c => c.sessions.map((s: any) => ({ ...s, campName: c.name })))
    .filter(s => !selectedCampId || s.campId === selectedCampId)
    .filter(s =>
      s.name.toLowerCase().includes(sessionSearchTerm.toLowerCase()) ||
      s.campName.toLowerCase().includes(sessionSearchTerm.toLowerCase())
    );

  const filteredParticipants = participants.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
    p.sessionName.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
    p.campName.toLowerCase().includes(participantSearchTerm.toLowerCase())
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

        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Masthead */}
          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-6 lg:p-10 flex flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Wydarzenia</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Obozy jeździeckie</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj obozami, turnusami i uczestnikami.
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'camps') handleAddCamp();
                  else if (activeTab === 'sessions' && selectedCampId) handleAddSession(selectedCampId);
                  else if (activeTab === 'participants') handleAddParticipant();
                }}
                disabled={activeTab === 'sessions' && !selectedCampId}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-deepNavy rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Obozy</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalCamps}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Turnusy</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalSessions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Otwarte</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.openSessions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Uczestnicy</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalParticipants}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Potwierdzone</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.confirmedParticipants}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Square className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-marineBlue">Oczekujące</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingParticipants}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Przychód</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.totalRevenue} zł</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('camps')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'camps'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Obozy
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'sessions'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Turnusy
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'participants'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Uczestnicy
            </button>
          </div>

          {/* Camps Tab */}
          {activeTab === 'camps' && (
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                <input
                  type="text"
                  placeholder="Szukaj obozu..."
                  value={campSearchTerm}
                  onChange={(e) => setCampSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCamps.map((camp) => (
                  <div key={camp.id} onClick={() => setSelectedCamp(camp)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-deepNavy mb-1">{camp.name}</h3>
                        <p className="text-sm text-marineBlue mb-2 line-clamp-1">{camp.description}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${camp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {camp.status === 'active' ? 'Aktywny' : 'Archiwalny'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditCamp(camp); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCamp(camp.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2 text-marineBlue">
                        <MapPin className="w-4 h-4" />
                        <span>{camp.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-marineBlue">
                        <Users className="w-4 h-4" />
                        <span>{camp.sessions.length} turnusów</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-iceBlue">
                      <p className="text-xs text-marineBlue line-clamp-1">{camp.activities.slice(0, 3).join(', ')}{camp.activities.length > 3 ? '...' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                  value={selectedCampId || ''}
                  onChange={(e) => setSelectedCampId(e.target.value || null)}
                  className="px-4 py-3.5 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm bg-white"
                >
                  <option value="">Wszystkie obozy</option>
                  {camps.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj turnusu..."
                    value={sessionSearchTerm}
                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} onClick={() => setSelectedSession(session)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-deepNavy mb-1">{session.name}</h3>
                        <p className="text-sm text-marineBlue mb-2">{session.campName}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${sessionStatuses.find(s => s.value === session.status)?.color}`}>
                          {sessionStatuses.find(s => s.value === session.status)?.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditSession(session); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.campId, session.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2 text-marineBlue">
                        <Calendar className="w-4 h-4" />
                        <span>{session.startDate} - {session.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-marineBlue">
                        <Users className="w-4 h-4" />
                        <span>{session.currentRegistrations}/{session.capacity} miejsc</span>
                      </div>
                      <div className="flex items-center gap-2 text-marineBlue">
                        <DollarSign className="w-4 h-4" />
                        <span>{session.price} PLN</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-iceBlue">
                      <p className="text-xs text-marineBlue">Wiek: {session.ageRange} · Poziom: {skillLevels.find(l => l.value === session.skillLevel)?.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                <input
                  type="text"
                  placeholder="Szukaj uczestnika..."
                  value={participantSearchTerm}
                  onChange={(e) => setParticipantSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredParticipants.map((participant) => {
                  const payment = paymentStatuses.find(s => s.value === participant.paymentStatus);
                  const status = participantStatuses.find(s => s.value === participant.status);
                  return (
                    <div key={participant.id} onClick={() => setSelectedParticipant(participant)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{participant.firstName} {participant.lastName}</h3>
                            <p className="text-xs text-marineBlue">{participant.dateOfBirth}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEditParticipant(participant); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteParticipant(participant.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm mb-3">
                        <p className="text-deepNavy"><span className="text-marineBlue">Turnus:</span> {participant.sessionName}</p>
                        <p className="text-deepNavy"><span className="text-marineBlue">Telefon:</span> {participant.phone}</p>
                        <p className="text-deepNavy line-clamp-1"><span className="text-marineBlue">Email:</span> {participant.email}</p>
                        <p className="text-deepNavy"><span className="text-marineBlue">Zapis:</span> {participant.registrationDate}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment?.color || 'bg-gray-100 text-gray-700'}`}>{payment?.label}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}>{status?.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCamp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedCamp.name}</h2>
                  <p className="text-sm text-marineBlue">{selectedCamp.location}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingCamp(selectedCamp); setSelectedCamp(null); setShowAddCampModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { handleDeleteCamp(selectedCamp.id); setSelectedCamp(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedCamp(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-deepNavy mb-4">{selectedCamp.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Status</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedCamp.status === 'active' ? 'Aktywny' : 'Archiwalny'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Turnusy</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedCamp.sessions.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedCamp.instructors.length > 0 && (
                  <div>
                    <p className="text-xs text-marineBlue mb-1">Instruktorzy</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCamp.instructors.map((i, idx) => <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-arcticBlue/60 text-deepNavy">{i}</span>)}
                    </div>
                  </div>
                )}
                {selectedCamp.activities.length > 0 && (
                  <div>
                    <p className="text-xs text-marineBlue mb-1">Aktywności</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCamp.activities.map((a, idx) => <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{a}</span>)}
                    </div>
                  </div>
                )}
                {selectedCamp.requirements.length > 0 && (
                  <div>
                    <p className="text-xs text-marineBlue mb-1">Wymagania</p>
                    <ul className="list-disc list-inside text-sm text-deepNavy">
                      {selectedCamp.requirements.map((r, idx) => <li key={idx}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {selectedCamp.includes.length > 0 && (
                  <div>
                    <p className="text-xs text-marineBlue mb-1">Cena zawiera</p>
                    <ul className="list-disc list-inside text-sm text-deepNavy">
                      {selectedCamp.includes.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {selectedCamp.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedCamp.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Camp Modal */}
      {showAddCampModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingCamp ? 'Edytuj obóz' : 'Dodaj obóz'}
                </h2>
                <button
                  onClick={() => setShowAddCampModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitCamp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={campFormData.name}
                    onChange={(e) => setCampFormData({ ...campFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={campFormData.description}
                    onChange={(e) => setCampFormData({ ...campFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Lokalizacja</label>
                  <input
                    type="text"
                    value={campFormData.location}
                    onChange={(e) => setCampFormData({ ...campFormData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Instruktorzy</label>
                  <div className="space-y-2 mb-2">
                    {campFormData.instructors.map((instructor, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-iceBlue/20 rounded-lg">
                        <span className="text-sm text-deepNavy">{instructor}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteInstructor(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInstructor}
                      onChange={(e) => setNewInstructor(e.target.value)}
                      placeholder="Nowy instruktor"
                      className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddInstructor}
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Aktywności</label>
                  <div className="space-y-2 mb-2">
                    {campFormData.activities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-iceBlue/20 rounded-lg">
                        <span className="text-sm text-deepNavy">{activity}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newActivity}
                      onChange={(e) => setNewActivity(e.target.value)}
                      placeholder="Nowa aktywność"
                      className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Wymagania</label>
                  <div className="space-y-2 mb-2">
                    {campFormData.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-iceBlue/20 rounded-lg">
                        <span className="text-sm text-deepNavy">{requirement}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequirement(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Nowe wymaganie"
                      className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Cena zawiera</label>
                  <div className="space-y-2 mb-2">
                    {campFormData.includes.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-iceBlue/20 rounded-lg">
                        <span className="text-sm text-deepNavy">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteInclude(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInclude}
                      onChange={(e) => setNewInclude(e.target.value)}
                      placeholder="Co zawiera cena"
                      className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddInclude}
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={campFormData.notes}
                    onChange={(e) => setCampFormData({ ...campFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCampModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all"
                  >
                    {editingCamp ? 'Zapisz zmiany' : 'Dodaj obóz'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedSession.name}</h2>
                  <p className="text-sm text-marineBlue">{selectedSession.campName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingSession(selectedSession); setSelectedSession(null); setShowAddSessionModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { handleDeleteSession(selectedSession.campId, selectedSession.id); setSelectedSession(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Data</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedSession.startDate} - {selectedSession.endDate}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Miejsca</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedSession.currentRegistrations}/{selectedSession.capacity}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Cena</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedSession.price} PLN</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Status</p>
                  <p className="text-sm font-medium text-deepNavy">{sessionStatuses.find(s => s.value === selectedSession.status)?.label}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Wiek</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedSession.ageRange}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Poziom</p>
                  <p className="text-sm font-medium text-deepNavy">{skillLevels.find(l => l.value === selectedSession.skillLevel)?.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingSession ? 'Edytuj turnus' : 'Dodaj turnus'}
                </h2>
                <button
                  onClick={() => setShowAddSessionModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa turnusu</label>
                  <input
                    type="text"
                    value={sessionFormData.name}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data rozpoczęcia</label>
                    <input
                      type="date"
                      value={sessionFormData.startDate}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data zakończenia</label>
                    <input
                      type="date"
                      value={sessionFormData.endDate}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, endDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Pojemność</label>
                    <input
                      type="number"
                      value={sessionFormData.capacity}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Cena (PLN)</label>
                    <input
                      type="number"
                      value={sessionFormData.price}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={sessionFormData.status}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, status: e.target.value as CampSession['status'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {sessionStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Wiek</label>
                    <input
                      type="text"
                      value={sessionFormData.ageRange}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, ageRange: e.target.value })}
                      placeholder="np. 8-16 lat"
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Poziom zaawansowania</label>
                  <select
                    value={sessionFormData.skillLevel}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, skillLevel: e.target.value as CampSession['skillLevel'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {skillLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSessionModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all"
                  >
                    {editingSession ? 'Zapisz zmiany' : 'Dodaj turnus'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedParticipant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedParticipant.firstName} {selectedParticipant.lastName}</h2>
                    <p className="text-sm text-marineBlue">{selectedParticipant.campName} · {selectedParticipant.sessionName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingParticipant(selectedParticipant); setSelectedParticipant(null); setShowAddParticipantModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { handleDeleteParticipant(selectedParticipant.id); setSelectedParticipant(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedParticipant(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Data urodzenia / PESEL</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.dateOfBirth} · {selectedParticipant.pesel}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Adres</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.address}, {selectedParticipant.postalCode} {selectedParticipant.city}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Kontakt</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.phone} · {selectedParticipant.email}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Rodzic/opiekun</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.parentName} ({selectedParticipant.parentPhone})</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Kontakt awaryjny</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.emergencyContact} · {selectedParticipant.emergencyPhone} ({selectedParticipant.emergencyRelation})</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Zapis i płatność</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.registrationDate} · {selectedParticipant.paymentAmount} PLN</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Pływanie</p>
                  <p className="text-sm font-medium text-deepNavy">{swimmingLevels.find(l => l.value === selectedParticipant.swimmingAbility)?.label}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Jazda konna</p>
                  <p className="text-sm font-medium text-deepNavy">{skillLevels.find(l => l.value === selectedParticipant.ridingExperience)?.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Choroby</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.medicalConditions || '-'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Leki</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.medications || '-'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Alergie</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedParticipant.allergies || '-'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatuses.find(s => s.value === selectedParticipant.paymentStatus)?.color || 'bg-gray-100 text-gray-700'}`}>{paymentStatuses.find(s => s.value === selectedParticipant.paymentStatus)?.label}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${participantStatuses.find(s => s.value === selectedParticipant.status)?.color || 'bg-gray-100 text-gray-700'}`}>{participantStatuses.find(s => s.value === selectedParticipant.status)?.label}</span>
              </div>

              {selectedParticipant.dietaryRestrictions && (
                <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-200 mb-3">
                  <p className="text-sm text-yellow-800">Dieta: {selectedParticipant.dietaryRestrictions}</p>
                </div>
              )}

              {selectedParticipant.notes && (
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 mb-3">
                  <p className="text-sm text-blue-800">{selectedParticipant.notes}</p>
                </div>
              )}

              <div className="text-xs text-marineBlue">
                Zgody: {selectedParticipant.consentPhotos ? 'Wizerunek ' : ''}{selectedParticipant.consentMedical ? 'Medyczna ' : ''}{selectedParticipant.consentRules ? 'Regulamin' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Participant Modal */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingParticipant ? 'Edytuj uczestnika' : 'Dodaj uczestnika'}
                </h2>
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitParticipant} className="space-y-4">
                {/* Wybór turnusu */}
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Turnus</label>
                  <select
                    value={participantFormData.sessionId}
                    onChange={(e) => {
                      const session = camps.flatMap(c => c.sessions).find(s => s.id === e.target.value);
                      const camp = camps.find(c => c.id === session?.campId);
                      setParticipantFormData({
                        ...participantFormData,
                        sessionId: e.target.value,
                        sessionName: session?.name || '',
                        campId: camp?.id || '',
                        campName: camp?.name || '',
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz turnus</option>
                    {camps.flatMap(camp => 
                      camp.sessions.map((session: any) => ({ ...session, campName: camp.name }))
                    ).map(session => (
                      <option key={session.id} value={session.id}>{session.campName} - {session.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dane osobowe */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dane osobowe
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Imię</label>
                      <input
                        type="text"
                        value={participantFormData.firstName}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Nazwisko</label>
                      <input
                        type="text"
                        value={participantFormData.lastName}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data urodzenia</label>
                      <input
                        type="date"
                        value={participantFormData.dateOfBirth}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">PESEL</label>
                      <input
                        type="text"
                        value={participantFormData.pesel}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, pesel: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Adres */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3">Adres</h3>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Ulica i numer</label>
                    <input
                      type="text"
                      value={participantFormData.address}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Kod pocztowy</label>
                      <input
                        type="text"
                        value={participantFormData.postalCode}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-deepNavy mb-2">Miasto</label>
                      <input
                        type="text"
                        value={participantFormData.city}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Kontakt */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Kontakt
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                      <input
                        type="text"
                        value={participantFormData.phone}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                      <input
                        type="email"
                        value={participantFormData.email}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dane rodzica/opiekuna */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3">Dane rodzica/opiekuna</h3>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Imię i nazwisko</label>
                    <input
                      type="text"
                      value={participantFormData.parentName}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, parentName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                      <input
                        type="text"
                        value={participantFormData.parentPhone}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, parentPhone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                      <input
                        type="email"
                        value={participantFormData.parentEmail}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, parentEmail: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Kontakt awaryjny */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Kontakt awaryjny
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Imię i nazwisko</label>
                    <input
                      type="text"
                      value={participantFormData.emergencyContact}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, emergencyContact: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                      <input
                        type="text"
                        value={participantFormData.emergencyPhone}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, emergencyPhone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Stopień pokrewieństwa</label>
                      <input
                        type="text"
                        value={participantFormData.emergencyRelation}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, emergencyRelation: e.target.value })}
                        placeholder="np. ojciec, matka"
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Informacje medyczne */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3">Informacje medyczne</h3>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Choroby przewlekłe</label>
                    <textarea
                      value={participantFormData.medicalConditions}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, medicalConditions: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Przyjmowane leki</label>
                      <textarea
                        value={participantFormData.medications}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, medications: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Alergie</label>
                      <textarea
                        value={participantFormData.allergies}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, allergies: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-deepNavy mb-2">Ograniczenia dietetyczne</label>
                    <textarea
                      value={participantFormData.dietaryRestrictions}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, dietaryRestrictions: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Umiejętności */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3">Umiejętności</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Pływanie</label>
                      <select
                        value={participantFormData.swimmingAbility}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, swimmingAbility: e.target.value as Participant['swimmingAbility'] })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      >
                        {swimmingLevels.map((level) => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Jazda konna</label>
                      <select
                        value={participantFormData.ridingExperience}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, ridingExperience: e.target.value as Participant['ridingExperience'] })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      >
                        {skillLevels.map((level) => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Płatność i status */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3">Płatność i status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Status płatności</label>
                      <select
                        value={participantFormData.paymentStatus}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, paymentStatus: e.target.value as Participant['paymentStatus'] })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Kwota wpłacona (PLN)</label>
                      <input
                        type="number"
                        value={participantFormData.paymentAmount}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, paymentAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status zapisu</label>
                    <select
                      value={participantFormData.status}
                      onChange={(e) => setParticipantFormData({ ...participantFormData, status: e.target.value as Participant['status'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {participantStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Zgody */}
                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-semibold text-deepNavy mb-3">Zgody</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantFormData.consentPhotos}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, consentPhotos: e.target.checked })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zgoda na przetwarzanie wizerunku (zdjęcia/filmy)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantFormData.consentMedical}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, consentMedical: e.target.checked })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zgoda na udzielenie pomocy medycznej w razie wypadku</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantFormData.consentRules}
                        onChange={(e) => setParticipantFormData({ ...participantFormData, consentRules: e.target.checked })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zgoda na przestrzeganie regulaminu obozu</span>
                    </label>
                  </div>
                </div>

                {/* Notatki */}
                <div className="border-t border-iceBlue pt-4">
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={participantFormData.notes}
                    onChange={(e) => setParticipantFormData({ ...participantFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipantModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all"
                  >
                    {editingParticipant ? 'Zapisz zmiany' : 'Dodaj uczestnika'}
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
