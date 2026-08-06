'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, Calendar, MapPin, Users, Trophy, Clock, DollarSign, Award, User, Filter, Download, Share2, Copy, CheckCircle, XCircle } from 'lucide-react';

interface Competition {
  id: string;
  name: string;
  type: 'dressage' | 'jumping' | 'eventing' | 'western' | 'other';
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  entryFee: number;
  prizePool: number;
  classes: CompetitionClass[];
  requirements: string[];
  organizer: string;
  contactEmail: string;
  contactPhone: string;
  schedule: CompetitionSchedule[];
  participants: Participant[];
  results: Result[];
  createdAt: string;
}

interface CompetitionClass {
  id: string;
  name: string;
  level: string;
  maxParticipants: number;
  entryFee: number;
  startTime: string;
}

interface CompetitionSchedule {
  id: string;
  date: string;
  time: string;
  activity: string;
  location: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Participant {
  id: string;
  name: string;
  horseName: string;
  classId: string;
  className: string;
  status: 'registered' | 'confirmed' | 'withdrawn';
  paid: boolean;
  paymentDate?: string;
}

interface Result {
  id: string;
  classId: string;
  className: string;
  participantId: string;
  participantName: string;
  horseName: string;
  position: number;
  score: number;
  time?: string;
  faults?: number;
}

export default function CompetitionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [activeTab, setActiveTab] = useState<'competitions' | 'participants' | 'results' | 'schedule'>('competitions');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [competitionSearchTerm, setCompetitionSearchTerm] = useState('');
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantForm, setParticipantForm] = useState({
    source: 'existing' as 'existing' | 'new',
    clientId: '',
    name: '',
    email: '',
    phone: '',
    horseName: '',
    classId: '',
    paid: false,
  });
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'dressage' as Competition['type'],
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    maxParticipants: 50,
    currentParticipants: 0,
    status: 'upcoming' as Competition['status'],
    entryFee: 0,
    prizePool: 0,
    classes: [] as CompetitionClass[],
    requirements: [] as string[],
    organizer: '',
    contactEmail: '',
    contactPhone: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [competitions, setCompetitions] = useState<Competition[]>([]);

  const [clients, setClients] = useState<Client[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [compRes, clientRes, horseRes] = await Promise.all([
          api.get(`/competitions?stableId=${activeStableId}`),
          api.get(`/clients?stableId=${activeStableId}`),
          api.get(`/horses?stableId=${activeStableId}`)
        ]);
        setCompetitions(compRes.data || []);
        setClients(clientRes.data?.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}`, email: c.user.email, phone: c.user.phone || '' })) || []);
        setHorses(horseRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setCompetitions([]);
        setClients([]);
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
          <p className="text-marineBlue">Ładowanie zawodów...</p>
        </div>
      </div>
    );
  }

  const types = [
    { value: 'dressage', label: 'Ujeżdżenie' },
    { value: 'jumping', label: 'Skoki' },
    { value: 'eventing', label: 'WSZ' },
    { value: 'western', label: 'Western' },
    { value: 'other', label: 'Inne' },
  ];

  const statuses = [
    { value: 'upcoming', label: 'Nadchodzące', color: 'bg-blue-100 text-blue-800' },
    { value: 'ongoing', label: 'W trakcie', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Zakończone', color: 'bg-gray-100 text-gray-800' },
    { value: 'cancelled', label: 'Odwołane', color: 'bg-red-100 text-red-800' },
  ];

  const handleAddCompetition = () => {
    setFormData({
      name: '',
      type: 'dressage',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
      maxParticipants: 50,
      currentParticipants: 0,
      status: 'upcoming',
      entryFee: 0,
      prizePool: 0,
      classes: [],
      requirements: [],
      organizer: '',
      contactEmail: '',
      contactPhone: '',
    });
    setEditingCompetition(null);
    setShowAddModal(true);
  };

  const handleEditCompetition = (competition: Competition) => {
    setFormData({
      name: competition.name,
      type: competition.type,
      startDate: competition.startDate,
      endDate: competition.endDate,
      location: competition.location,
      description: competition.description,
      maxParticipants: competition.maxParticipants,
      currentParticipants: competition.currentParticipants,
      status: competition.status,
      entryFee: competition.entryFee,
      prizePool: competition.prizePool,
      classes: competition.classes,
      requirements: competition.requirements,
      organizer: competition.organizer,
      contactEmail: competition.contactEmail,
      contactPhone: competition.contactPhone,
    });
    setEditingCompetition(competition);
    setShowAddModal(true);
  };

  const handleDeleteCompetition = async (id: string) => {
    try {
      await api.delete(`/competitions/${id}`);
      setCompetitions(competitions.filter(c => c.id !== id));
    } catch (error) {
      console.error('Delete competition error:', error);
      alert('Nie udało się usunąć zawodów');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompetition) {
        const { data } = await api.put(`/competitions/${editingCompetition.id}`, formData);
        setCompetitions(competitions.map(c => c.id === editingCompetition.id ? data : c));
      } else {
        const { data } = await api.post('/competitions', { 
          ...formData, 
          stableId: activeStableId,
          schedule: [], 
          participants: [], 
          results: [], 
          createdAt: new Date().toISOString().split('T')[0] 
        });
        setCompetitions([...competitions, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save competition error:', error);
      alert('Nie udało się zapisać zawodów');
    }
  };

  const handleViewParticipants = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowParticipantsModal(true);
  };

  const handleViewResults = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowResultsModal(true);
  };

  const handleViewSchedule = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowScheduleModal(true);
  };

  const handleOpenParticipantModal = (competition: Competition) => {
    setSelectedCompetition(competition);
    setParticipantForm({
      source: 'existing',
      clientId: '',
      name: '',
      email: '',
      phone: '',
      horseName: '',
      classId: competition.classes[0]?.id || '',
      paid: false,
    });
    setClientSearchTerm('');
    setShowParticipantModal(true);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetition) return;

    try {
      let clientName = participantForm.name;
      let clientEmail = participantForm.email;
      let clientPhone = participantForm.phone;
      let clientId: string | undefined;

      if (participantForm.source === 'existing') {
        const client = clients.find(c => c.id === participantForm.clientId);
        if (!client) return;
        clientName = client.name;
        clientEmail = client.email;
        clientPhone = client.phone;
        clientId = client.id;
      } else {
        const { data: newClient } = await api.post('/clients', {
          stableId: activeStableId,
          firstName: participantForm.name.split(' ')[0],
          lastName: participantForm.name.split(' ').slice(1).join(' '),
          email: participantForm.email,
          phone: participantForm.phone,
        });
        setClients([...clients, { id: newClient.id, name: participantForm.name, email: participantForm.email, phone: participantForm.phone }]);
        clientId = newClient.id;
      }

      const className = selectedCompetition.classes.find(c => c.id === participantForm.classId)?.name || '';
      const newParticipant: Participant = {
        id: Date.now().toString(),
        name: clientName,
        horseName: participantForm.horseName,
        classId: participantForm.classId,
        className,
        status: 'registered',
        paid: participantForm.paid,
        paymentDate: participantForm.paid ? new Date().toISOString().split('T')[0] : undefined,
      };

      const { data } = await api.post(`/competitions/${selectedCompetition.id}/participants`, { ...newParticipant, stableId: activeStableId, clientId });
      setCompetitions(competitions.map(c =>
        c.id === selectedCompetition.id
          ? { ...c, participants: [...c.participants, data], currentParticipants: c.currentParticipants + 1 }
          : c
      ));
      setShowParticipantModal(false);
    } catch (error) {
      console.error('Add participant error:', error);
      alert('Nie udało się dodać uczestnika');
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!selectedCompetition) return;
    try {
      await api.delete(`/competitions/${selectedCompetition.id}/participants/${participantId}`);
      setCompetitions(competitions.map(c =>
        c.id === selectedCompetition.id
          ? { ...c, participants: c.participants.filter(p => p.id !== participantId), currentParticipants: c.currentParticipants - 1 }
          : c
      ));
    } catch (error) {
      console.error('Delete participant error:', error);
      alert('Nie udało się usunąć uczestnika');
    }
  };

  const getCompetitionStats = () => {
    const totalCompetitions = competitions.length;
    const upcomingCompetitions = competitions.filter(c => c.status === 'upcoming').length;
    const ongoingCompetitions = competitions.filter(c => c.status === 'ongoing').length;
    const completedCompetitions = competitions.filter(c => c.status === 'completed').length;
    const totalParticipants = competitions.reduce((sum, c) => sum + c.currentParticipants, 0);
    const totalPrizePool = competitions.reduce((sum, c) => sum + c.prizePool, 0);

    return {
      totalCompetitions,
      upcomingCompetitions,
      ongoingCompetitions,
      completedCompetitions,
      totalParticipants,
      totalPrizePool,
    };
  };

  const getFilteredCompetitions = () => {
    return competitions.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      const searchMatch = competitionSearchTerm === '' ||
        c.name.toLowerCase().includes(competitionSearchTerm.toLowerCase()) ||
        c.location.toLowerCase().includes(competitionSearchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(competitionSearchTerm.toLowerCase()) ||
        c.organizer.toLowerCase().includes(competitionSearchTerm.toLowerCase());
      return searchMatch;
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleShare = async (competition: Competition) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: competition.name,
          text: competition.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link skopiowany do schowka!');
    }
  };

  const stats = getCompetitionStats();
  const filteredCompetitions = getFilteredCompetitions();

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
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Zawody</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj zawodami, uczestnikami i wynikami.
                </p>
              </div>
              <button
                onClick={handleAddCompetition}
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
                <Trophy className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Wszystkie</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalCompetitions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Nadchodzące</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.upcomingCompetitions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">W trakcie</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.ongoingCompetitions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-marineBlue">Zakończone</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{stats.completedCompetitions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Uczestnicy</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-marineBlue">Pula nagród</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.totalPrizePool} zł</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'competitions'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Zawody
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
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'results'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Wyniki
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Harmonogram
            </button>
          </div>

          {/* Filters */}
          {activeTab === 'competitions' && (
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                <input
                  type="text"
                  placeholder="Szukaj zawodów..."
                  value={competitionSearchTerm}
                  onChange={(e) => setCompetitionSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-marineBlue" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-3.5 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                >
                  <option value="all">Wszystkie statusy</option>
                  <option value="upcoming">Nadchodzące</option>
                  <option value="ongoing">W trakcie</option>
                  <option value="completed">Zakończone</option>
                  <option value="cancelled">Odwołane</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-3.5 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                >
                  <option value="all">Wszystkie typy</option>
                  {types.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Competitions Tab */}
          {activeTab === 'competitions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompetitions.map((competition) => (
                <div key={competition.id} onClick={() => setSelectedCompetition(competition)} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{competition.name}</h3>
                          <p className="text-xs text-marineBlue">{types.find(t => t.value === competition.type)?.label}</p>
                        </div>
                      </div>
                      <p className="text-sm text-marineBlue mb-3">{competition.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditCompetition(competition); }}
                        className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCompetition(competition.id); }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-marineBlue" />
                      <span className="text-deepNavy">{competition.startDate} - {competition.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-marineBlue" />
                      <span className="text-deepNavy">{competition.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-marineBlue" />
                      <span className="text-deepNavy">{competition.currentParticipants}/{competition.maxParticipants} uczestników</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statuses.find(s => s.value === competition.status)?.color}`}>
                      {statuses.find(s => s.value === competition.status)?.label}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-oceanBlue/10 text-oceanBlue">
                      {competition.entryFee} zł
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-marineBlue/10 text-marineBlue">
                      Pula: {competition.prizePool} zł
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewParticipants(competition); }}
                      className="px-3 py-2 rounded-lg border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-xs flex items-center justify-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      Uczestnicy
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewResults(competition); }}
                      className="px-3 py-2 rounded-lg border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-xs flex items-center justify-center gap-1"
                    >
                      <Award className="w-3 h-3" />
                      Wyniki
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewSchedule(competition); }}
                      className="px-3 py-2 rounded-lg border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-xs flex items-center justify-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Harmonogram
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Wszyscy uczestnicy</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj uczestnika..."
                    value={participantSearchTerm}
                    onChange={(e) => setParticipantSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-iceBlue">
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Zawody</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Uczestnik</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Koń</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Klasa</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Opłacone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitions.flatMap(comp =>
                      comp.participants.filter(p =>
                        participantSearchTerm === '' ||
                        p.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                        p.horseName.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                        p.className.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                        comp.name.toLowerCase().includes(participantSearchTerm.toLowerCase())
                      ).map(participant => (
                        <tr key={`${comp.id}-${participant.id}`} className="border-b border-iceBlue/50">
                          <td className="py-3 px-4 text-sm text-deepNavy">{comp.name}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{participant.name}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{participant.horseName}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{participant.className}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              participant.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              participant.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {participant.status === 'confirmed' ? 'Potwierdzony' :
                               participant.status === 'registered' ? 'Zarejestrowany' : 'Wycofany'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {participant.paid ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Wyniki zawodów</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj wyniku..."
                    value={resultSearchTerm}
                    onChange={(e) => setResultSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-iceBlue">
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Zawody</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Klasa</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Miejsce</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Uczestnik</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Koń</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Wynik</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Czas</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Błędy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitions.flatMap(comp =>
                      comp.results.filter(r =>
                        resultSearchTerm === '' ||
                        r.className.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                        r.participantName.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                        r.horseName.toLowerCase().includes(resultSearchTerm.toLowerCase()) ||
                        comp.name.toLowerCase().includes(resultSearchTerm.toLowerCase())
                      ).map(result => (
                        <tr key={`${comp.id}-${result.id}`} className="border-b border-iceBlue/50">
                          <td className="py-3 px-4 text-sm text-deepNavy">{comp.name}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.className}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              result.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                              result.position === 2 ? 'bg-gray-100 text-gray-800' :
                              result.position === 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-iceBlue text-deepNavy'
                            }`}>
                              #{result.position}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.participantName}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.horseName}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.score}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.time || '-'}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.faults !== undefined ? result.faults : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Harmonogram zawodów</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj w harmonogramie..."
                    value={scheduleSearchTerm}
                    onChange={(e) => setScheduleSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                  />
                </div>
              </div>
              <div className="space-y-4">
                {competitions.filter(c =>
                  scheduleSearchTerm === '' ||
                  c.name.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
                  c.schedule.some(i =>
                    i.activity.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
                    i.location.toLowerCase().includes(scheduleSearchTerm.toLowerCase())
                  )
                ).map(competition => (
                  <div key={competition.id} className="border border-iceBlue rounded-xl p-4">
                    <h3 className="font-semibold text-deepNavy mb-3">{competition.name}</h3>
                    <div className="space-y-2">
                      {competition.schedule.filter(item =>
                        scheduleSearchTerm === '' ||
                        item.activity.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
                        item.location.toLowerCase().includes(scheduleSearchTerm.toLowerCase())
                      ).map(item => (
                        <div key={item.id} className="flex items-center gap-4 text-sm">
                          <div className="w-24 text-marineBlue">{item.date}</div>
                          <div className="w-20 text-deepNavy font-medium">{item.time}</div>
                          <div className="flex-1 text-deepNavy">{item.activity}</div>
                          <div className="text-marineBlue">{item.location}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCompetition && !showParticipantsModal && !showResultsModal && !showScheduleModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedCompetition.name}</h2>
                  <p className='text-sm text-marineBlue'>{types.find(t => t.value === selectedCompetition.type)?.label}</p>
                </div>
                <div className='flex items-center gap-1'>
                  <button onClick={() => { setEditingCompetition(selectedCompetition); setSelectedCompetition(null); setShowAddModal(true); }} className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors'>
                    <Edit2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => { handleDeleteCompetition(selectedCompetition.id); setSelectedCompetition(null); }} className='p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors'>
                    <Trash2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => setSelectedCompetition(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                    <X className='w-5 h-5 text-deepNavy' />
                  </button>
                </div>
              </div>

              <p className='text-sm text-deepNavy mb-4'>{selectedCompetition.description}</p>

              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Termin</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.startDate} - {selectedCompetition.endDate}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Lokalizacja</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.location}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Status</p>
                  <p className='text-sm font-medium text-deepNavy'>{statuses.find(s => s.value === selectedCompetition.status)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Uczestnicy</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.currentParticipants}/{selectedCompetition.maxParticipants}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Opłata</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.entryFee} zł</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Pula nagród</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.prizePool} zł</p>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Organizator</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.organizer}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Kontakt</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedCompetition.contactEmail}<br />{selectedCompetition.contactPhone}</p>
                </div>
              </div>

              <div className='mb-4'>
                <p className='text-xs text-marineBlue mb-2'>Wymagania</p>
                <div className='flex flex-wrap gap-2'>
                  {selectedCompetition.requirements.map((req, idx) => (
                    <span key={idx} className='px-3 py-1 rounded-full text-xs font-medium bg-oceanBlue/10 text-oceanBlue'>{req}</span>
                  ))}
                </div>
              </div>

              <div className='mb-4'>
                <p className='text-xs text-marineBlue mb-2'>Klasy</p>
                <div className='space-y-2'>
                  {selectedCompetition.classes.map(cls => (
                    <div key={cls.id} className='bg-iceBlue/30 rounded-2xl p-3 flex justify-between items-center'>
                      <div>
                        <p className='text-sm font-medium text-deepNavy'>{cls.name}</p>
                        <p className='text-xs text-marineBlue'>{cls.level}</p>
                      </div>
                      <div className='text-right text-sm text-deepNavy'>
                        {cls.maxParticipants} miejsc • {cls.entryFee} zł
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-3 gap-2'>
                <button onClick={() => setShowParticipantsModal(true)} className='px-3 py-2 rounded-xl bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue/20 transition-colors text-sm flex items-center justify-center gap-1'>
                  <Users className='w-4 h-4' /> Uczestnicy
                </button>
                <button onClick={() => setShowResultsModal(true)} className='px-3 py-2 rounded-xl bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue/20 transition-colors text-sm flex items-center justify-center gap-1'>
                  <Award className='w-4 h-4' /> Wyniki
                </button>
                <button onClick={() => setShowScheduleModal(true)} className='px-3 py-2 rounded-xl bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue/20 transition-colors text-sm flex items-center justify-center gap-1'>
                  <Clock className='w-4 h-4' /> Harmonogram
                </button>
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
                  {editingCompetition ? 'Edytuj zawody' : 'Dodaj zawody'}
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa zawodów</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ zawodów</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Competition['type'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data rozpoczęcia</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data zakończenia</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Lokalizacja</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Maks. uczestników</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Aktualni uczestnicy</label>
                    <input
                      type="number"
                      value={formData.currentParticipants}
                      onChange={(e) => setFormData({ ...formData, currentParticipants: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Competition['status'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Opłata wpisowa (zł)</label>
                    <input
                      type="number"
                      value={formData.entryFee}
                      onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Pula nagród (zł)</label>
                    <input
                      type="number"
                      value={formData.prizePool}
                      onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Klasy</label>
                  <div className="space-y-2">
                    {formData.classes.map((cls, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={cls.name}
                          onChange={(e) => {
                            const newClasses = [...formData.classes];
                            newClasses[index] = { ...cls, name: e.target.value };
                            setFormData({ ...formData, classes: newClasses });
                          }}
                          placeholder="Nazwa klasy"
                          className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                        <input
                          type="text"
                          value={cls.level}
                          onChange={(e) => {
                            const newClasses = [...formData.classes];
                            newClasses[index] = { ...cls, level: e.target.value };
                            setFormData({ ...formData, classes: newClasses });
                          }}
                          placeholder="Poziom"
                          className="w-24 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newClasses = formData.classes.filter((_, i) => i !== index);
                            setFormData({ ...formData, classes: newClasses });
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, classes: [...formData.classes, { id: Date.now().toString(), name: '', level: '', maxParticipants: 20, entryFee: 100, startTime: '09:00' }] })}
                      className="w-full px-3 py-2 rounded-lg border border-dashed border-iceBlue text-marineBlue hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Dodaj klasę
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Wymagania (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={formData.requirements.join(', ')}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
                    placeholder="np. Ubezpieczenie, Certyfikat PZJ"
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Organizator</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Email kontaktowy</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Telefon kontaktowy</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
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
                    {editingCompetition ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && selectedCompetition && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Uczestnicy - {selectedCompetition.name}</h2>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => handleOpenParticipantModal(selectedCompetition)}
                    className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-lg transition-colors'
                    title='Dodaj uczestnika'
                  >
                    <Plus className='w-5 h-5' />
                  </button>
                  <button
                    onClick={() => setShowParticipantsModal(false)}
                    className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-iceBlue">
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Uczestnik</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Koń</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Klasa</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Opłacone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Data płatności</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCompetition.participants.map(participant => (
                      <tr key={participant.id} className="border-b border-iceBlue/50">
                        <td className="py-3 px-4 text-sm text-deepNavy">{participant.name}</td>
                        <td className="py-3 px-4 text-sm text-deepNavy">{participant.horseName}</td>
                        <td className="py-3 px-4 text-sm text-deepNavy">{participant.className}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            participant.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            participant.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {participant.status === 'confirmed' ? 'Potwierdzony' :
                             participant.status === 'registered' ? 'Zarejestrowany' : 'Wycofany'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {participant.paid ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-deepNavy">{participant.paymentDate || '-'}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteParticipant(participant.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && selectedCompetition && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Wyniki - {selectedCompetition.name}</h2>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
              {selectedCompetition.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-iceBlue">
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Klasa</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Miejsce</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Uczestnik</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Koń</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Wynik</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Czas</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Błędy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompetition.results.map(result => (
                        <tr key={result.id} className="border-b border-iceBlue/50">
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.className}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              result.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                              result.position === 2 ? 'bg-gray-100 text-gray-800' :
                              result.position === 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-iceBlue text-deepNavy'
                            }`}>
                              #{result.position}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.participantName}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.horseName}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.score}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.time || '-'}</td>
                          <td className="py-3 px-4 text-sm text-deepNavy">{result.faults !== undefined ? result.faults : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-marineBlue">
                  <Award className="w-12 h-12 mx-auto mb-2 text-iceBlue" />
                  <p>Brak wyników dla tych zawodów</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedCompetition && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Harmonogram - {selectedCompetition.name}</h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
              <div className="space-y-3">
                {selectedCompetition.schedule.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-iceBlue/30 rounded-lg">
                    <div className="w-20 text-sm font-medium text-deepNavy">{item.date}</div>
                    <div className="w-16 text-sm text-oceanBlue font-semibold">{item.time}</div>
                    <div className="flex-1 text-sm text-deepNavy">{item.activity}</div>
                    <div className="text-sm text-marineBlue">{item.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showParticipantModal && selectedCompetition && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='font-serif text-xl font-bold text-deepNavy'>Dodaj uczestnika</h2>
                <button onClick={() => setShowParticipantModal(false)} className='p-2 hover:bg-iceBlue rounded-lg transition-colors'>
                  <X className='w-5 h-5 text-deepNavy' />
                </button>
              </div>
              <form onSubmit={handleAddParticipant} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Źródło</label>
                  <select
                    value={participantForm.source}
                    onChange={(e) => setParticipantForm({ ...participantForm, source: e.target.value as 'existing' | 'new', clientId: '' })}
                    className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm'
                  >
                    <option value='existing'>Istniejący klient</option>
                    <option value='new'>Nowy klient</option>
                  </select>
                </div>

                {participantForm.source === 'existing' && (
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Wybierz klienta</label>
                    <div className='relative mb-2'>
                      <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue' />
                      <input
                        type='text'
                        placeholder='Szukaj klienta...'
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className='w-full pl-12 pr-4 py-2 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm'
                      />
                    </div>
                    <div className='max-h-48 overflow-y-auto border border-iceBlue rounded-xl'>
                      {clients.filter(c =>
                        c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                        c.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                        c.phone.includes(clientSearchTerm)
                      ).map(client => (
                        <button
                          key={client.id}
                          type='button'
                          onClick={() => setParticipantForm({ ...participantForm, clientId: client.id })}
                          className={`w-full text-left px-4 py-3 border-b border-iceBlue last:border-0 transition-colors ${participantForm.clientId === client.id ? 'bg-oceanBlue/10 text-oceanBlue' : 'hover:bg-iceBlue'}`}
                        >
                          <p className='text-sm font-medium text-deepNavy'>{client.name}</p>
                          <p className='text-xs text-marineBlue'>{client.email} · {client.phone}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {participantForm.source === 'new' && (
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-deepNavy mb-2'>Imię i nazwisko</label>
                      <input type='text' value={participantForm.name} onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' required />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-deepNavy mb-2'>Email</label>
                      <input type='email' value={participantForm.email} onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' required />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-deepNavy mb-2'>Telefon</label>
                      <input type='tel' value={participantForm.phone} onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })} className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm' required />
                    </div>
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Koń</label>
                  <select
                    value={participantForm.horseName}
                    onChange={(e) => setParticipantForm({ ...participantForm, horseName: e.target.value })}
                    className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm'
                    required
                  >
                    <option value=''>Wybierz konia</option>
                    {horses.map((horse: any) => (
                      <option key={horse.id} value={horse.name}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Klasa</label>
                  <select
                    value={participantForm.classId}
                    onChange={(e) => setParticipantForm({ ...participantForm, classId: e.target.value })}
                    className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm'
                  >
                    {selectedCompetition.classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className='flex items-center gap-2'>
                  <input type='checkbox' checked={participantForm.paid} onChange={(e) => setParticipantForm({ ...participantForm, paid: e.target.checked })} className='w-4 h-4' />
                  <label className='text-sm text-deepNavy'>Opłacone</label>
                </div>

                <div className='flex gap-2 pt-4'>
                  <button type='button' onClick={() => setShowParticipantModal(false)} className='flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm'>Anuluj</button>
                  <button type='submit' className='flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm'>Dodaj</button>
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
