'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, MapPin, Clock, User, Calendar, Activity } from 'lucide-react';

interface Kantra {
  id: string;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor' | 'grass' | 'sand';
  size: number;
  surface: string;
  lighting: boolean;
  obstacles: boolean;
  maxCapacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'closed';
  notes: string;
}

interface KantraSession {
  id: string;
  kantraId: string;
  kantraName: string;
  horseId: string;
  horseName: string;
  riderId?: string;
  riderName?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  activity: 'training' | 'lesson' | 'competition' | 'free_riding' | 'other';
  notes: string;
}

export default function KantryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'kantry' | 'sessions'>('kantry');
  const [showAddKantraModal, setShowAddKantraModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [editingKantra, setEditingKantra] = useState<Kantra | null>(null);
  const [editingSession, setEditingSession] = useState<KantraSession | null>(null);

  const [kantraFormData, setKantraFormData] = useState({
    name: '',
    location: '',
    type: 'outdoor' as Kantra['type'],
    size: 0,
    surface: '',
    lighting: false,
    obstacles: false,
    maxCapacity: 4,
    status: 'available' as Kantra['status'],
    notes: '',
  });

  const [sessionFormData, setSessionFormData] = useState({
    kantraId: '',
    kantraName: '',
    horseId: '',
    horseName: '',
    riderId: '',
    riderName: '',
    startTime: '',
    endTime: '',
    duration: 60,
    activity: 'training' as KantraSession['activity'],
    notes: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [kantry, setKantry] = useState<Kantra[]>([
    {
      id: '1',
      name: 'Kantra A - Główna',
      location: 'Stajnia Horsemanago',
      type: 'outdoor',
      size: 60,
      surface: 'Piasek',
      lighting: true,
      obstacles: true,
      maxCapacity: 4,
      status: 'available',
      notes: '',
    },
    {
      id: '2',
      name: 'Kantra B - Treningowa',
      location: 'Stajnia Horsemanago',
      type: 'indoor',
      size: 40,
      surface: 'Piasek',
      lighting: true,
      obstacles: false,
      maxCapacity: 2,
      status: 'available',
      notes: '',
    },
    {
      id: '3',
      name: 'Kantra C - Trawna',
      location: 'Stajnia Horsemanago',
      type: 'grass',
      size: 80,
      surface: 'Trawa',
      lighting: false,
      obstacles: true,
      maxCapacity: 6,
      status: 'maintenance',
      notes: 'Remont nawierzchni',
    },
  ]);

  const [sessions, setSessions] = useState<KantraSession[]>([
    {
      id: '1',
      kantraId: '1',
      kantraName: 'Kantra A - Główna',
      horseId: '1',
      horseName: 'Błyskawica',
      riderId: '1',
      riderName: 'Anna Kowalska',
      startTime: '2024-03-15T10:00',
      endTime: '2024-03-15T11:00',
      duration: 60,
      activity: 'training',
      notes: '',
    },
    {
      id: '2',
      kantraId: '2',
      kantraName: 'Kantra B - Treningowa',
      horseId: '2',
      horseName: 'Gwiazda',
      riderId: '2',
      riderName: 'Piotr Nowak',
      startTime: '2024-03-15T11:30',
      endTime: '2024-03-15T12:30',
      duration: 60,
      activity: 'lesson',
      notes: '',
    },
  ]);

  const kantraTypes = [
    { value: 'indoor', label: 'Kryta' },
    { value: 'outdoor', label: 'Otwarta' },
    { value: 'grass', label: 'Trawna' },
    { value: 'sand', label: 'Piaskowa' },
  ];

  const kantraStatuses = [
    { value: 'available', label: 'Dostępna', color: 'bg-green-100 text-green-800' },
    { value: 'occupied', label: 'Zajęta', color: 'bg-red-100 text-red-800' },
    { value: 'maintenance', label: 'Konserwacja', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'closed', label: 'Zamknięta', color: 'bg-gray-100 text-gray-800' },
  ];

  const activityTypes = [
    { value: 'training', label: 'Trening' },
    { value: 'lesson', label: 'Lekcja' },
    { value: 'competition', label: 'Zawody' },
    { value: 'free_riding', label: 'Jazda wolna' },
    { value: 'other', label: 'Inne' },
  ];

  const handleAddKantra = () => {
    setKantraFormData({
      name: '',
      location: '',
      type: 'outdoor',
      size: 0,
      surface: '',
      lighting: false,
      obstacles: false,
      maxCapacity: 4,
      status: 'available',
      notes: '',
    });
    setEditingKantra(null);
    setShowAddKantraModal(true);
  };

  const handleEditKantra = (kantra: Kantra) => {
    setKantraFormData({
      name: kantra.name,
      location: kantra.location,
      type: kantra.type,
      size: kantra.size,
      surface: kantra.surface,
      lighting: kantra.lighting,
      obstacles: kantra.obstacles,
      maxCapacity: kantra.maxCapacity,
      status: kantra.status,
      notes: kantra.notes,
    });
    setEditingKantra(kantra);
    setShowAddKantraModal(true);
  };

  const handleDeleteKantra = (id: string) => {
    setKantry(kantry.filter(k => k.id !== id));
  };

  const handleSubmitKantra = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKantra) {
      setKantry(kantry.map(k => k.id === editingKantra.id ? { ...k, ...kantraFormData } : k));
    } else {
      setKantry([...kantry, { id: Date.now().toString(), ...kantraFormData }]);
    }
    setShowAddKantraModal(false);
  };

  const handleAddSession = () => {
    setSessionFormData({
      kantraId: '',
      kantraName: '',
      horseId: '',
      horseName: '',
      riderId: '',
      riderName: '',
      startTime: '',
      endTime: '',
      duration: 60,
      activity: 'training',
      notes: '',
    });
    setEditingSession(null);
    setShowAddSessionModal(true);
  };

  const handleEditSession = (session: KantraSession) => {
    setSessionFormData({
      kantraId: session.kantraId,
      kantraName: session.kantraName,
      horseId: session.horseId,
      horseName: session.horseName,
      riderId: session.riderId || '',
      riderName: session.riderName || '',
      startTime: session.startTime,
      endTime: session.endTime || '',
      duration: session.duration,
      activity: session.activity,
      notes: session.notes,
    });
    setEditingSession(session);
    setShowAddSessionModal(true);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleSubmitSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...s, ...sessionFormData } : s));
    } else {
      setSessions([...sessions, { id: Date.now().toString(), ...sessionFormData }]);
    }
    setShowAddSessionModal(false);
  };

  const getKantraStats = () => {
    const totalKantry = kantry.length;
    const availableKantry = kantry.filter(k => k.status === 'available').length;
    const occupiedKantry = kantry.filter(k => k.status === 'occupied').length;
    const totalSessions = sessions.length;
    const todaySessions = sessions.filter(s => s.startTime.startsWith(new Date().toISOString().split('T')[0])).length;

    return {
      totalKantry,
      availableKantry,
      occupiedKantry,
      totalSessions,
      todaySessions,
    };
  };

  const stats = getKantraStats();

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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Kantry</h1>
              <p className="text-marineBlue">System śledzenia areny i kantre</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Kantry</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalKantry}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Dostępne</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.availableKantry}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Zajęte</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.occupiedKantry}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Sesje</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalSessions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Dzisiaj</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.todaySessions}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('kantry')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'kantry'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Kantry
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'sessions'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Sesje
            </button>
          </div>

          {/* Kantry Tab */}
          {activeTab === 'kantry' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddKantra}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj kantrę</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kantry.map((kantra) => (
                  <div key={kantra.id} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{kantra.name}</h3>
                            <p className="text-xs text-marineBlue">{kantraTypes.find(t => t.value === kantra.type)?.label}</p>
                          </div>
                        </div>
                        <p className="text-sm text-marineBlue mb-3">{kantra.location}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditKantra(kantra)}
                          className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKantra(kantra.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Rozmiar:</span>
                        <span className="text-deepNavy">{kantra.size}m x {kantra.size}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Nawierzchnia:</span>
                        <span className="text-deepNavy">{kantra.surface}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Pojemność:</span>
                        <span className="text-deepNavy">{kantra.maxCapacity} koni</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${kantraStatuses.find(s => s.value === kantra.status)?.color}`}>
                        {kantraStatuses.find(s => s.value === kantra.status)?.label}
                      </span>
                      {kantra.lighting && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Oświetlenie
                        </span>
                      )}
                      {kantra.obstacles && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Przeszkody
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddSession}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nowa sesja</span>
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-iceBlue/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Kantra</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell">Koń</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell">Jeździec</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden xl:table-cell">Start</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Aktywność</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-iceBlue">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-iceBlue/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-deepNavy">{session.kantraName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-deepNavy hidden md:table-cell">{session.horseName}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden lg:table-cell">{session.riderName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden xl:table-cell">{new Date(session.startTime).toLocaleString('pl-PL')}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-oceanBlue/20 text-deepNavy">
                              {activityTypes.find(a => a.value === session.activity)?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditSession(session)}
                                className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(session.id)}
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
        </div>
      </div>

      {/* Add/Edit Kantra Modal */}
      {showAddKantraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingKantra ? 'Edytuj kantrę' : 'Dodaj kantrę'}
                </h2>
                <button
                  onClick={() => setShowAddKantraModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitKantra} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={kantraFormData.name}
                    onChange={(e) => setKantraFormData({ ...kantraFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Lokalizacja</label>
                  <input
                    type="text"
                    value={kantraFormData.location}
                    onChange={(e) => setKantraFormData({ ...kantraFormData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                    <select
                      value={kantraFormData.type}
                      onChange={(e) => setKantraFormData({ ...kantraFormData, type: e.target.value as Kantra['type'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {kantraTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Rozmiar (m)</label>
                    <input
                      type="number"
                      value={kantraFormData.size}
                      onChange={(e) => setKantraFormData({ ...kantraFormData, size: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nawierzchnia</label>
                  <input
                    type="text"
                    value={kantraFormData.surface}
                    onChange={(e) => setKantraFormData({ ...kantraFormData, surface: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Pojemność</label>
                    <input
                      type="number"
                      value={kantraFormData.maxCapacity}
                      onChange={(e) => setKantraFormData({ ...kantraFormData, maxCapacity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={kantraFormData.status}
                      onChange={(e) => setKantraFormData({ ...kantraFormData, status: e.target.value as Kantra['status'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {kantraStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={kantraFormData.lighting}
                      onChange={(e) => setKantraFormData({ ...kantraFormData, lighting: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Oświetlenie</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={kantraFormData.obstacles}
                      onChange={(e) => setKantraFormData({ ...kantraFormData, obstacles: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Przeszkody</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={kantraFormData.notes}
                    onChange={(e) => setKantraFormData({ ...kantraFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddKantraModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingKantra ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingSession ? 'Edytuj sesję' : 'Nowa sesja'}
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Kantra</label>
                  <select
                    value={sessionFormData.kantraId}
                    onChange={(e) => {
                      const kantra = kantry.find(k => k.id === e.target.value);
                      setSessionFormData({
                        ...sessionFormData,
                        kantraId: e.target.value,
                        kantraName: kantra?.name || '',
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz kantrę</option>
                    {kantry.map((kantra) => (
                      <option key={kantra.id} value={kantra.id}>{kantra.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <input
                    type="text"
                    value={sessionFormData.horseName}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, horseName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Jeździec (opcjonalnie)</label>
                  <input
                    type="text"
                    value={sessionFormData.riderName}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, riderName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Start</label>
                    <input
                      type="datetime-local"
                      value={sessionFormData.startTime}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, startTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Koniec</label>
                    <input
                      type="datetime-local"
                      value={sessionFormData.endTime}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, endTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Aktywność</label>
                  <select
                    value={sessionFormData.activity}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, activity: e.target.value as KantraSession['activity'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {activityTypes.map((activity) => (
                      <option key={activity.value} value={activity.value}>{activity.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={sessionFormData.notes}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSessionModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingSession ? 'Zapisz zmiany' : 'Dodaj'}
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
