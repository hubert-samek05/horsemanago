'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, Home, Users, Calendar, DollarSign } from 'lucide-react';
import api from '@/lib/api';

interface Box {
  id: string;
  number: string;
  type: 'box' | 'paddock' | 'pasture';
  size: number; // in m²
  capacity: number; // max horses
  currentOccupancy: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  amenities: string[];
  monthlyPrice: number;
  description: string;
  hasWater: boolean;
  hasElectricity: boolean;
  hasAutomaticWaterer: boolean;
  hasFeedStorage: boolean;
  notes: string;
}

interface BoardingHorse {
  id: string;
  horseId: string;
  horseName: string;
  boxId: string;
  boxNumber: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  services: string[];
  status: 'active' | 'pending' | 'expired' | 'terminated';
  specialRequirements: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  feedingSchedule: {
    morning: string;
    noon: string;
    evening: string;
  };
  feedingNotes: string;
  dietaryRestrictions: string;
  supplements: string;
}

export default function BoardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'boxes' | 'horses' | 'reports'>('boxes');
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [showAddHorseModal, setShowAddHorseModal] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [editingHorse, setEditingHorse] = useState<BoardingHorse | null>(null);
  const [boxSearchTerm, setBoxSearchTerm] = useState('');
  const [horseSearchTerm, setHorseSearchTerm] = useState('');
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<BoardingHorse | null>(null);
  const [loading, setLoading] = useState(false);

  const [boxFormData, setBoxFormData] = useState({
    number: '',
    type: 'box' as Box['type'],
    size: 0,
    capacity: 1,
    currentOccupancy: 0,
    status: 'available' as Box['status'],
    amenities: [] as string[],
    monthlyPrice: 0,
    description: '',
    hasWater: false,
    hasElectricity: false,
    hasAutomaticWaterer: false,
    hasFeedStorage: false,
    notes: '',
  });

  const [horseFormData, setHorseFormData] = useState({
    horseId: '',
    horseName: '',
    boxId: '',
    boxNumber: '',
    clientId: '',
    clientName: '',
    startDate: '',
    endDate: '',
    monthlyPrice: 0,
    services: [] as string[],
    status: 'active' as BoardingHorse['status'],
    specialRequirements: '',
    paymentStatus: 'paid' as BoardingHorse['paymentStatus'],
    feedingSchedule: {
      morning: '',
      noon: '',
      evening: '',
    },
    feedingNotes: '',
    dietaryRestrictions: '',
    supplements: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [boxes, setBoxes] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [boxesRes, horsesRes] = await Promise.all([
          api.get(`/boarding/boxes?stableId=${activeStableId}`),
          api.get(`/boarding/horses?stableId=${activeStableId}`),
        ]);
        setBoxes(boxesRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (error) {
        console.error('Load boarding data error:', error);
        setBoxes([]);
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
          <p className="text-marineBlue">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  const boxTypes = [
    { value: 'box', label: 'Boks' },
    { value: 'paddock', label: 'Padok' },
    { value: 'pasture', label: 'Pastwisko' },
  ];

  const boxStatuses = [
    { value: 'available', label: 'Dostępny', color: 'bg-green-100 text-green-800' },
    { value: 'occupied', label: 'Zajęty', color: 'bg-red-100 text-red-800' },
    { value: 'maintenance', label: 'W remoncie', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reserved', label: 'Zarezerwowany', color: 'bg-blue-100 text-blue-800' },
  ];

  const contractStatuses = [
    { value: 'active', label: 'Aktywny', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Oczekujący', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'expired', label: 'Wygasły', color: 'bg-gray-100 text-gray-800' },
    { value: 'terminated', label: 'Zakończony', color: 'bg-red-100 text-red-800' },
  ];

  const paymentStatuses = [
    { value: 'paid', label: 'Opłacone', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Oczekujące', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'overdue', label: 'Zaległe', color: 'bg-red-100 text-red-800' },
  ];

  const handleAddBox = () => {
    setBoxFormData({
      number: '',
      type: 'box',
      size: 0,
      capacity: 1,
      currentOccupancy: 0,
      status: 'available',
      amenities: [],
      monthlyPrice: 0,
      description: '',
      hasWater: false,
      hasElectricity: false,
      hasAutomaticWaterer: false,
      hasFeedStorage: false,
      notes: '',
    });
    setEditingBox(null);
    setShowAddBoxModal(true);
  };

  const handleEditBox = (box: Box) => {
    setBoxFormData({
      number: box.number,
      type: box.type,
      size: box.size,
      capacity: box.capacity,
      currentOccupancy: box.currentOccupancy,
      status: box.status,
      amenities: box.amenities,
      monthlyPrice: box.monthlyPrice,
      description: box.description,
      hasWater: box.hasWater,
      hasElectricity: box.hasElectricity,
      hasAutomaticWaterer: box.hasAutomaticWaterer,
      hasFeedStorage: box.hasFeedStorage,
      notes: box.notes,
    });
    setEditingBox(box);
    setShowAddBoxModal(true);
  };

  const handleDeleteBox = async (id: string) => {
    try {
      await api.delete(`/boarding/boxes/${id}`);
      setBoxes(boxes.filter(b => b.id !== id));
    } catch (error) {
      console.error('Delete box error:', error);
      alert('Nie udało się usunąć boksu');
    }
  };

  const handleSubmitBox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBox) {
        const { data } = await api.put(`/boarding/boxes/${editingBox.id}`, boxFormData);
        setBoxes(boxes.map(b => b.id === editingBox.id ? data : b));
      } else {
        const { data } = await api.post('/boarding/boxes', { ...boxFormData, stableId: activeStableId });
        setBoxes([...boxes, data]);
      }
      setShowAddBoxModal(false);
    } catch (error) {
      console.error('Save box error:', error);
      alert('Nie udało się zapisać boksu');
    }
  };

  const handleAddHorse = () => {
    setHorseFormData({
      horseId: '',
      horseName: '',
      boxId: '',
      boxNumber: '',
      clientId: '',
      clientName: '',
      startDate: '',
      endDate: '',
      monthlyPrice: 0,
      services: [],
      status: 'active',
      specialRequirements: '',
      paymentStatus: 'paid',
      feedingSchedule: {
        morning: '',
        noon: '',
        evening: '',
      },
      feedingNotes: '',
      dietaryRestrictions: '',
      supplements: '',
    });
    setEditingHorse(null);
    setShowAddHorseModal(true);
  };

  const handleEditHorse = (horse: BoardingHorse) => {
    setHorseFormData({
      horseId: horse.horseId,
      horseName: horse.horseName,
      boxId: horse.boxId,
      boxNumber: horse.boxNumber,
      clientId: horse.clientId,
      clientName: horse.clientName,
      startDate: horse.startDate,
      endDate: horse.endDate,
      monthlyPrice: horse.monthlyPrice,
      services: horse.services,
      status: horse.status,
      specialRequirements: horse.specialRequirements,
      paymentStatus: horse.paymentStatus,
      feedingSchedule: horse.feedingSchedule,
      feedingNotes: horse.feedingNotes,
      dietaryRestrictions: horse.dietaryRestrictions,
      supplements: horse.supplements,
    });
    setEditingHorse(horse);
    setShowAddHorseModal(true);
  };

  const handleDeleteHorse = async (id: string) => {
    try {
      await api.delete(`/boarding/horses/${id}`);
      setHorses(horses.filter(h => h.id !== id));
    } catch (error) {
      console.error('Delete boarding horse error:', error);
      alert('Nie udało się usunąć konia z pensjonatu');
    }
  };

  const handleSubmitHorse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHorse) {
        const { data } = await api.put(`/boarding/horses/${editingHorse.id}`, horseFormData);
        setHorses(horses.map(h => h.id === editingHorse.id ? data : h));
      } else {
        const { data } = await api.post('/boarding/horses', { ...horseFormData, stableId: activeStableId });
        setHorses([...horses, data]);
      }
      setShowAddHorseModal(false);
    } catch (error) {
      console.error('Save boarding horse error:', error);
      alert('Nie udało się zapisać konia w pensjonacie');
    }
  };

  const calculateAvailability = () => {
    const totalBoxes = boxes.length;
    const availableBoxes = boxes.filter(b => b.status === 'available').length;
    const occupiedBoxes = boxes.filter(b => b.status === 'occupied').length;
    const totalCapacity = boxes.reduce((sum, b) => sum + b.capacity, 0);
    const currentOccupancy = boxes.reduce((sum, b) => sum + b.currentOccupancy, 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;
    const monthlyRevenue = horses
      .filter(h => h.status === 'active')
      .reduce((sum, h) => sum + h.monthlyPrice, 0);

    return {
      totalBoxes,
      availableBoxes,
      occupiedBoxes,
      totalCapacity,
      currentOccupancy,
      utilizationRate,
      monthlyRevenue,
    };
  };

  const stats = calculateAvailability();

  const filteredBoxes = boxes.filter(b =>
    b.number.toLowerCase().includes(boxSearchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(boxSearchTerm.toLowerCase()) ||
    boxTypes.find(t => t.value === b.type)?.label.toLowerCase().includes(boxSearchTerm.toLowerCase())
  );

  const filteredHorses = horses.filter(h =>
    h.horseName.toLowerCase().includes(horseSearchTerm.toLowerCase()) ||
    h.clientName.toLowerCase().includes(horseSearchTerm.toLowerCase()) ||
    h.boxNumber.toLowerCase().includes(horseSearchTerm.toLowerCase())
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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Pensjonat</h1>
              <p className="text-marineBlue">Zarządzaj boksem i miejscami dla koni</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('boxes')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'boxes'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Boksy
            </button>
            <button
              onClick={() => setActiveTab('horses')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'horses'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Konie w pensjonacie
            </button>
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
          </div>

          {/* Boxes Tab */}
          {activeTab === 'boxes' && (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj boksu..."
                    value={boxSearchTerm}
                    onChange={(e) => setBoxSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={handleAddBox}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj boks</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBoxes.map((box) => (
                  <div key={box.id} onClick={() => setSelectedBox(box)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <Home className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{box.number}</h3>
                          <p className="text-xs text-marineBlue">{boxTypes.find(t => t.value === box.type)?.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditBox(box); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBox(box.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-marineBlue mb-3 line-clamp-1">{box.description}</p>
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Rozmiar</span>
                        <span className="text-deepNavy">{box.size} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Pojemność</span>
                        <span className="text-deepNavy">{box.currentOccupancy}/{box.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-marineBlue">Cena</span>
                        <span className="text-deepNavy">{box.monthlyPrice} zł/mies.</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${boxStatuses.find(s => s.value === box.status)?.color}`}>
                        {boxStatuses.find(s => s.value === box.status)?.label}
                      </span>
                      {box.hasWater && <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Woda</span>}
                      {box.hasElectricity && <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Prąd</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Horses Tab */}
          {activeTab === 'horses' && (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj konia..."
                    value={horseSearchTerm}
                    onChange={(e) => setHorseSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={handleAddHorse}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj konia</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHorses.map((horse) => {
                  const status = contractStatuses.find(s => s.value === horse.status);
                  const payment = paymentStatuses.find(s => s.value === horse.paymentStatus);
                  return (
                    <div key={horse.id} onClick={() => setSelectedHorse(horse)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-deepNavy">{horse.horseName}</h3>
                            <p className="text-xs text-marineBlue">{horse.clientName}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEditHorse(horse); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteHorse(horse.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-marineBlue">Boks</span>
                          <span className="text-deepNavy">{horse.boxNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-marineBlue">Okres</span>
                          <span className="text-deepNavy">{horse.startDate} - {horse.endDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-marineBlue">Cena</span>
                          <span className="text-deepNavy">{horse.monthlyPrice} zł/mies.</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}>{status?.label}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment?.color || 'bg-gray-100 text-gray-700'}`}>{payment?.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-5 h-5 text-oceanBlue" />
                    <span className="text-sm text-marineBlue">Wszystkie boksy</span>
                  </div>
                  <p className="text-2xl font-bold text-deepNavy">{stats.totalBoxes}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-marineBlue">Dostępne</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.availableBoxes}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-marineBlue">Zajęte</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{stats.occupiedBoxes}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-oceanBlue" />
                    <span className="text-sm text-marineBlue">Obłożenie</span>
                  </div>
                  <p className="text-2xl font-bold text-deepNavy">{stats.utilizationRate}%</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-oceanBlue" />
                    <span className="text-sm text-marineBlue">Przychód/mies.</span>
                  </div>
                  <p className="text-2xl font-bold text-deepNavy">{stats.monthlyRevenue} zł</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-marineBlue" />
                    <span className="text-sm text-marineBlue">Konie</span>
                  </div>
                  <p className="text-2xl font-bold text-deepNavy">{stats.currentOccupancy}/{stats.totalCapacity}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedBox && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Home className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedBox.number}</h2>
                    <p className="text-sm text-marineBlue">{boxTypes.find(t => t.value === selectedBox.type)?.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingBox(selectedBox); setSelectedBox(null); setShowAddBoxModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setBoxes(boxes.filter(b => b.id !== selectedBox.id)); setSelectedBox(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedBox(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Rozmiar</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedBox.size} m²</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Pojemność</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedBox.currentOccupancy}/{selectedBox.capacity}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Cena miesięczna</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedBox.monthlyPrice} zł</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Status</p>
                  <p className="text-sm font-medium text-deepNavy">{boxStatuses.find(s => s.value === selectedBox.status)?.label}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedBox.amenities.map((a, i) => <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-arcticBlue/60 text-deepNavy">{a}</span>)}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><span className={selectedBox.hasWater ? 'text-green-600' : 'text-gray-400'}>Woda</span></div>
                <div className="flex items-center gap-2"><span className={selectedBox.hasElectricity ? 'text-green-600' : 'text-gray-400'}>Prąd</span></div>
                <div className="flex items-center gap-2"><span className={selectedBox.hasAutomaticWaterer ? 'text-green-600' : 'text-gray-400'}>Automatyczne poidło</span></div>
                <div className="flex items-center gap-2"><span className={selectedBox.hasFeedStorage ? 'text-green-600' : 'text-gray-400'}>Przechowalnia paszy</span></div>
              </div>

              {selectedBox.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedBox.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Box Modal */}
      {showAddBoxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingBox ? 'Edytuj boks' : 'Dodaj boks'}
                </h2>
                <button
                  onClick={() => setShowAddBoxModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitBox} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Numer boksu</label>
                  <input
                    type="text"
                    value={boxFormData.number}
                    onChange={(e) => setBoxFormData({ ...boxFormData, number: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={boxFormData.type}
                    onChange={(e) => setBoxFormData({ ...boxFormData, type: e.target.value as Box['type'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {boxTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Rozmiar (m²)</label>
                    <input
                      type="number"
                      value={boxFormData.size}
                      onChange={(e) => setBoxFormData({ ...boxFormData, size: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Pojemność (konie)</label>
                    <input
                      type="number"
                      value={boxFormData.capacity}
                      onChange={(e) => setBoxFormData({ ...boxFormData, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={boxFormData.status}
                    onChange={(e) => setBoxFormData({ ...boxFormData, status: e.target.value as Box['status'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {boxStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Cena miesięczna (zł)</label>
                  <input
                    type="number"
                    value={boxFormData.monthlyPrice}
                    onChange={(e) => setBoxFormData({ ...boxFormData, monthlyPrice: parseInt(e.target.value) || 0 })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={boxFormData.description}
                    onChange={(e) => setBoxFormData({ ...boxFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Udogodnienia (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={boxFormData.amenities.join(', ')}
                    onChange={(e) => setBoxFormData({ ...boxFormData, amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a) })}
                    placeholder="np. Woda, Prąd, Klimatyzacja"
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={boxFormData.hasWater}
                      onChange={(e) => setBoxFormData({ ...boxFormData, hasWater: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Woda</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={boxFormData.hasElectricity}
                      onChange={(e) => setBoxFormData({ ...boxFormData, hasElectricity: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Prąd</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={boxFormData.hasAutomaticWaterer}
                      onChange={(e) => setBoxFormData({ ...boxFormData, hasAutomaticWaterer: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Automatyczne poidło</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={boxFormData.hasFeedStorage}
                      onChange={(e) => setBoxFormData({ ...boxFormData, hasFeedStorage: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Przechowalnia paszy</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={boxFormData.notes}
                    onChange={(e) => setBoxFormData({ ...boxFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddBoxModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingBox ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedHorse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedHorse.horseName}</h2>
                    <p className="text-sm text-marineBlue">{selectedHorse.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingHorse(selectedHorse); setSelectedHorse(null); setShowAddHorseModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setHorses(horses.filter(h => h.id !== selectedHorse.id)); setSelectedHorse(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedHorse(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Boks</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedHorse.boxNumber}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Cena miesięczna</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedHorse.monthlyPrice} zł</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Okres</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedHorse.startDate} - {selectedHorse.endDate}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Status</p>
                  <p className="text-sm font-medium text-deepNavy">{contractStatuses.find(s => s.value === selectedHorse.status)?.label}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Status płatności</p>
                  <p className="text-sm font-medium text-deepNavy">{paymentStatuses.find(s => s.value === selectedHorse.paymentStatus)?.label}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <h3 className="font-semibold text-deepNavy">Harmonogram karmienia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-arcticBlue/30 rounded-2xl p-4">
                    <p className="text-xs text-marineBlue mb-1">Rano</p>
                    <p className="text-sm font-medium text-deepNavy">{selectedHorse.feedingSchedule.morning || '-'}</p>
                  </div>
                  <div className="bg-arcticBlue/30 rounded-2xl p-4">
                    <p className="text-xs text-marineBlue mb-1">Południe</p>
                    <p className="text-sm font-medium text-deepNavy">{selectedHorse.feedingSchedule.noon || '-'}</p>
                  </div>
                  <div className="bg-arcticBlue/30 rounded-2xl p-4">
                    <p className="text-xs text-marineBlue mb-1">Wieczór</p>
                    <p className="text-sm font-medium text-deepNavy">{selectedHorse.feedingSchedule.evening || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <h3 className="font-semibold text-deepNavy">Dieta i suplementy</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-arcticBlue/30 rounded-2xl p-4">
                    <p className="text-xs text-marineBlue mb-1">Ograniczenia dietetyczne</p>
                    <p className="text-sm font-medium text-deepNavy">{selectedHorse.dietaryRestrictions || '-'}</p>
                  </div>
                  <div className="bg-arcticBlue/30 rounded-2xl p-4">
                    <p className="text-xs text-marineBlue mb-1">Suplementy</p>
                    <p className="text-sm font-medium text-deepNavy">{selectedHorse.supplements || '-'}</p>
                  </div>
                </div>
              </div>

              {selectedHorse.services.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedHorse.services.map((s, i) => <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-arcticBlue/60 text-deepNavy">{s}</span>)}
                </div>
              )}

              {selectedHorse.specialRequirements && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedHorse.specialRequirements}</p>
                </div>
              )}

              {selectedHorse.feedingNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-sm text-blue-800">{selectedHorse.feedingNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Horse Modal */}
      {showAddHorseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingHorse ? 'Edytuj konia w pensjonacie' : 'Dodaj konia do pensjonatu'}
                </h2>
                <button
                  onClick={() => setShowAddHorseModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitHorse} className="space-y-6">
                {/* Basic Information */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Podstawowe informacje</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa konia</label>
                      <input
                        type="text"
                        value={horseFormData.horseName}
                        onChange={(e) => setHorseFormData({ ...horseFormData, horseName: e.target.value })}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa klienta</label>
                      <input
                        type="text"
                        value={horseFormData.clientName}
                        onChange={(e) => setHorseFormData({ ...horseFormData, clientName: e.target.value })}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Box Assignment */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Przypisanie boksu</h3>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Numer boksu</label>
                    <select
                      value={horseFormData.boxId}
                      onChange={(e) => {
                        const selectedBox = boxes.find(b => b.id === e.target.value);
                        setHorseFormData({ 
                          ...horseFormData, 
                          boxId: e.target.value,
                          boxNumber: selectedBox?.number || '',
                          monthlyPrice: selectedBox?.monthlyPrice || 0,
                        });
                      }}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    >
                      <option value="">Wybierz boks</option>
                      {boxes.filter(b => b.status === 'available' || b.id === horseFormData.boxId).map((box) => (
                        <option key={box.id} value={box.id}>{box.number} - {box.monthlyPrice} zł</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Period */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Okres pobytu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data rozpoczęcia</label>
                      <input
                        type="date"
                        value={horseFormData.startDate}
                        onChange={(e) => setHorseFormData({ ...horseFormData, startDate: e.target.value })}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data zakończenia</label>
                      <input
                        type="date"
                        value={horseFormData.endDate}
                        onChange={(e) => setHorseFormData({ ...horseFormData, endDate: e.target.value })}
                        className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                        style={{ boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Feeding Schedule */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Harmonogram karmienia</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Rano</label>
                      <input
                        type="text"
                        value={horseFormData.feedingSchedule.morning}
                        onChange={(e) => setHorseFormData({ 
                          ...horseFormData, 
                          feedingSchedule: { ...horseFormData.feedingSchedule, morning: e.target.value }
                        })}
                        placeholder="np. Siano 2kg, owies 1kg"
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">W południe</label>
                      <input
                        type="text"
                        value={horseFormData.feedingSchedule.noon}
                        onChange={(e) => setHorseFormData({ 
                          ...horseFormData, 
                          feedingSchedule: { ...horseFormData.feedingSchedule, noon: e.target.value }
                        })}
                        placeholder="np. Siano 1kg"
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Wieczorem</label>
                      <input
                        type="text"
                        value={horseFormData.feedingSchedule.evening}
                        onChange={(e) => setHorseFormData({ 
                          ...horseFormData, 
                          feedingSchedule: { ...horseFormData.feedingSchedule, evening: e.target.value }
                        })}
                        placeholder="np. Siano 2kg, owies 1kg"
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Dietary Information */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Informacje dietetyczne</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Ograniczenia dietetyczne</label>
                      <textarea
                        value={horseFormData.dietaryRestrictions}
                        onChange={(e) => setHorseFormData({ ...horseFormData, dietaryRestrictions: e.target.value })}
                        placeholder="np. Alergia na lucernę, brak cukru"
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Suplementy</label>
                      <input
                        type="text"
                        value={horseFormData.supplements}
                        onChange={(e) => setHorseFormData({ ...horseFormData, supplements: e.target.value })}
                        placeholder="np. Witaminy, minerały"
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Notatki karmienia</label>
                      <textarea
                        value={horseFormData.feedingNotes}
                        onChange={(e) => setHorseFormData({ ...horseFormData, feedingNotes: e.target.value })}
                        placeholder="np. Koń wymaga wolnego karmienia"
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Services and Requirements */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Usługi i wymagania</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Usługi (oddzielone przecinkami)</label>
                      <input
                        type="text"
                        value={horseFormData.services.join(', ')}
                        onChange={(e) => setHorseFormData({ ...horseFormData, services: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                        placeholder="np. Karmienie, Sprzątanie, Wypas"
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Wymagania specjalne</label>
                      <textarea
                        value={horseFormData.specialRequirements}
                        onChange={(e) => setHorseFormData({ ...horseFormData, specialRequirements: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t border-iceBlue pt-6">
                  <h3 className="font-semibold text-deepNavy mb-4">Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                      <select
                        value={horseFormData.status}
                        onChange={(e) => setHorseFormData({ ...horseFormData, status: e.target.value as BoardingHorse['status'] })}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      >
                        {contractStatuses.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Status płatności</label>
                      <select
                        value={horseFormData.paymentStatus}
                        onChange={(e) => setHorseFormData({ ...horseFormData, paymentStatus: e.target.value as BoardingHorse['paymentStatus'] })}
                        className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddHorseModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingHorse ? 'Zapisz zmiany' : 'Dodaj konia'}
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
