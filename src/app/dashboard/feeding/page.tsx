'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Apple, Coffee, Clock, Calendar, Search } from 'lucide-react';
import api from '@/lib/api';

interface FeedingSchedule {
  id: string;
  horseId: string;
  horseName: string;
  feedType: string;
  feedAmount: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'scoops';
  timesPerDay: number;
  feedingTimes: string[];
  startDate: string;
  endDate?: string;
  supplements: string[];
  notes: string;
  specialInstructions: string;
}

interface FeedInventory {
  id: string;
  name: string;
  type: 'hay' | 'grain' | 'supplement' | 'treat' | 'other';
  currentStock: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pieces';
  minimumStock: number;
  supplier: string;
  lastRestockDate: string;
  notes: string;
}

export default function FeedingPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedules' | 'inventory'>('schedules');
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);
  const [editingInventory, setEditingInventory] = useState<FeedInventory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<FeedingSchedule | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<FeedInventory | null>(null);
  const [loading, setLoading] = useState(false);

  const [scheduleFormData, setScheduleFormData] = useState({
    horseId: '',
    horseName: '',
    feedType: '',
    feedAmount: 0,
    unit: 'kg' as FeedingSchedule['unit'],
    timesPerDay: 1,
    feedingTimes: ['08:00'],
    startDate: '',
    endDate: '',
    supplements: [] as string[],
    notes: '',
    specialInstructions: '',
  });

  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    type: 'grain' as FeedInventory['type'],
    currentStock: 0,
    unit: 'kg' as FeedInventory['unit'],
    minimumStock: 0,
    supplier: '',
    lastRestockDate: '',
    notes: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [feedingSchedules, setFeedingSchedules] = useState<any[]>([]);
  const [feedInventory, setFeedInventory] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [schedulesRes, inventoryRes, horsesRes] = await Promise.all([
          api.get(`/feeding/schedules?stableId=${activeStableId}`),
          api.get(`/feeding/inventory?stableId=${activeStableId}`),
          api.get(`/horses?stableId=${activeStableId}`)
        ]);
        setFeedingSchedules(schedulesRes.data || []);
        setFeedInventory(inventoryRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setFeedingSchedules([]);
        setFeedInventory([]);
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
          <p className="text-marineBlue">Ładowanie karmienia...</p>
        </div>
      </div>
    );
  }

  const feedTypes = [
    { value: 'hay', label: 'Siano' },
    { value: 'grain', label: 'Ziarna' },
    { value: 'mixed', label: 'Mieszanka' },
    { value: 'supplement', label: 'Suplement' },
    { value: 'other', label: 'Inne' },
  ];

  const units = [
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'l', label: 'l' },
    { value: 'ml', label: 'ml' },
    { value: 'scoops', label: 'łyżki' },
  ];

  const inventoryTypes = [
    { value: 'hay', label: 'Siano' },
    { value: 'grain', label: 'Ziarna' },
    { value: 'supplement', label: 'Suplement' },
    { value: 'treat', label: 'Przysmaki' },
    { value: 'other', label: 'Inne' },
  ];

  const handleAddSchedule = () => {
    setScheduleFormData({
      horseId: '',
      horseName: '',
      feedType: '',
      feedAmount: 0,
      unit: 'kg',
      timesPerDay: 1,
      feedingTimes: ['08:00'],
      startDate: '',
      endDate: '',
      supplements: [],
      notes: '',
      specialInstructions: '',
    });
    setEditingSchedule(null);
    setShowAddScheduleModal(true);
  };

  const handleEditSchedule = (schedule: FeedingSchedule) => {
    setScheduleFormData({
      horseId: schedule.horseId,
      horseName: schedule.horseName,
      feedType: schedule.feedType,
      feedAmount: schedule.feedAmount,
      unit: schedule.unit,
      timesPerDay: schedule.timesPerDay,
      feedingTimes: schedule.feedingTimes,
      startDate: schedule.startDate,
      endDate: schedule.endDate || '',
      supplements: schedule.supplements,
      notes: schedule.notes,
      specialInstructions: schedule.specialInstructions,
    });
    setEditingSchedule(schedule);
    setShowAddScheduleModal(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await api.delete(`/feeding/schedules/${id}`);
      setFeedingSchedules(feedingSchedules.filter(s => s.id !== id));
    } catch (error) {
      console.error('Delete schedule error:', error);
      alert('Nie udało się usunąć harmonogramu karmienia');
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        const { data } = await api.put(`/feeding/schedules/${editingSchedule.id}`, scheduleFormData);
        setFeedingSchedules(feedingSchedules.map(s => s.id === editingSchedule.id ? data : s));
      } else {
        const { data } = await api.post('/feeding/schedules', { ...scheduleFormData, stableId: activeStableId });
        setFeedingSchedules([...feedingSchedules, data]);
      }
      setShowAddScheduleModal(false);
    } catch (error) {
      console.error('Save schedule error:', error);
      alert('Nie udało się zapisać harmonogramu karmienia');
    }
  };

  const handleAddInventory = () => {
    setInventoryFormData({
      name: '',
      type: 'grain',
      currentStock: 0,
      unit: 'kg',
      minimumStock: 0,
      supplier: '',
      lastRestockDate: '',
      notes: '',
    });
    setEditingInventory(null);
    setShowAddInventoryModal(true);
  };

  const handleEditInventory = (inventory: FeedInventory) => {
    setInventoryFormData({
      name: inventory.name,
      type: inventory.type,
      currentStock: inventory.currentStock,
      unit: inventory.unit,
      minimumStock: inventory.minimumStock,
      supplier: inventory.supplier,
      lastRestockDate: inventory.lastRestockDate,
      notes: inventory.notes,
    });
    setEditingInventory(inventory);
    setShowAddInventoryModal(true);
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      await api.delete(`/feeding/inventory/${id}`);
      setFeedInventory(feedInventory.filter(i => i.id !== id));
    } catch (error) {
      console.error('Delete inventory error:', error);
      alert('Nie udało się usunąć zapasu');
    }
  };

  const handleSubmitInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInventory) {
        const { data } = await api.put(`/feeding/inventory/${editingInventory.id}`, inventoryFormData);
        setFeedInventory(feedInventory.map(i => i.id === editingInventory.id ? data : i));
      } else {
        const { data } = await api.post('/feeding/inventory', { ...inventoryFormData, stableId: activeStableId });
        setFeedInventory([...feedInventory, data]);
      }
      setShowAddInventoryModal(false);
    } catch (error) {
      console.error('Save inventory error:', error);
      alert('Nie udało się zapisać zapasu');
    }
  };

  const getFeedingStats = () => {
    const totalSchedules = feedingSchedules.length;
    const lowStockItems = feedInventory.filter(i => i.currentStock <= i.minimumStock).length;
    const totalHorses = new Set(feedingSchedules.map(s => s.horseId)).size;
    const totalDailyFeedings = feedingSchedules.reduce((sum, s) => sum + s.timesPerDay, 0);

    return {
      totalSchedules,
      lowStockItems,
      totalHorses,
      totalDailyFeedings,
    };
  };

  const stats = getFeedingStats();

  const filteredSchedules = feedingSchedules.filter(s =>
    s.horseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.feedType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplements.some((sup: string) => sup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredInventory = feedInventory.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inventoryTypes.find(t => t.value === i.type)?.label || '').toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-1">Karmienie</h1>
              <p className="text-marineBlue">Zarządzaj karmieniem i suplementacją</p>
            </div>
            <button
              onClick={activeTab === 'schedules' ? handleAddSchedule : handleAddInventory}
              className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{activeTab === 'schedules' ? 'Dodaj harmonogram' : 'Dodaj do magazynu'}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Harmonogramy</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalSchedules}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Konie</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalHorses}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Karmienia/dzień</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalDailyFeedings}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Niski stan</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setActiveTab('schedules'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'schedules'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Harmonogramy
            </button>
            <button
              onClick={() => { setActiveTab('inventory'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Magazyn
            </button>
          </div>

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <div>
              <div className="mb-4 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                <input
                  type="text"
                  placeholder="Szukaj harmonogramu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSchedules.map((schedule) => (
                  <div key={schedule.id} onClick={() => setSelectedSchedule(schedule)} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <Apple className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{schedule.horseName}</h3>
                          <p className="text-xs text-marineBlue">{schedule.feedType} • {schedule.feedAmount} {schedule.unit}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditSchedule(schedule); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Częstotliwość</p>
                        <p className="text-sm font-semibold text-deepNavy">{schedule.timesPerDay}x dziennie</p>
                      </div>
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Godziny</p>
                        <p className="text-sm font-semibold text-deepNavy line-clamp-1">{schedule.feedingTimes.join(', ')}</p>
                      </div>
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Od</p>
                        <p className="text-sm font-semibold text-deepNavy">{schedule.startDate || '-'}</p>
                      </div>
                      <div className="bg-arcticBlue/40 rounded-2xl p-3">
                        <p className="text-xs text-marineBlue">Do</p>
                        <p className="text-sm font-semibold text-deepNavy">{schedule.endDate || '-'}</p>
                      </div>
                    </div>
                    {schedule.supplements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {schedule.supplements.map((sup: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white text-deepNavy border border-iceBlue">{sup}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div className="mb-4 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                <input
                  type="text"
                  placeholder="Szukaj w magazynie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.map((item) => (
                  <div key={item.id} onClick={() => setSelectedInventory(item)} className={`bg-white rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all cursor-pointer ${item.currentStock <= item.minimumStock ? 'border-red-300' : 'border-iceBlue'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${item.currentStock <= item.minimumStock ? 'bg-red-500' : 'bg-gradient-to-br from-oceanBlue to-marineBlue'}`}>
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{item.name}</h3>
                          <p className="text-xs text-marineBlue">{inventoryTypes.find(t => t.value === item.type)?.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditInventory(item); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteInventory(item.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-marineBlue mb-3">{item.supplier || '-'}</p>
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between bg-arcticBlue/40 rounded-2xl p-3">
                        <span className="text-marineBlue">Stan</span>
                        <span className={`font-medium ${item.currentStock <= item.minimumStock ? 'text-red-600' : 'text-deepNavy'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between bg-arcticBlue/40 rounded-2xl p-3">
                        <span className="text-marineBlue">Minimum</span>
                        <span className="text-deepNavy">{item.minimumStock} {item.unit}</span>
                      </div>
                    </div>
                    {item.currentStock <= item.minimumStock && (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 inline-block">
                        Niski stan
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Apple className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedSchedule.horseName}</h2>
                    <p className="text-sm text-marineBlue">{selectedSchedule.feedType} • {selectedSchedule.feedAmount} {selectedSchedule.unit}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSchedule(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Częstotliwość</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedSchedule.timesPerDay}x dziennie</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Godziny</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedSchedule.feedingTimes.join(', ')}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Od</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedSchedule.startDate || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Do</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedSchedule.endDate || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Notatki</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedSchedule.notes || '-'}</p>
                </div>
              </div>

              {selectedSchedule.supplements.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-marineBlue mb-2">Suplementy</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSchedule.supplements.map((sup, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white text-deepNavy border border-iceBlue">{sup}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSchedule.specialInstructions && (
                <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                  <p className="text-xs text-marineBlue mb-1">Instrukcje specjalne</p>
                  <p className="text-sm text-deepNavy">{selectedSchedule.specialInstructions}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setSelectedSchedule(null); handleEditSchedule(selectedSchedule); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj</button>
                <button onClick={() => { setSelectedSchedule(null); handleDeleteSchedule(selectedSchedule.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInventory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${selectedInventory.currentStock <= selectedInventory.minimumStock ? 'bg-red-500' : 'bg-gradient-to-br from-oceanBlue to-marineBlue'}`}>
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedInventory.name}</h2>
                    <p className="text-sm text-marineBlue">{inventoryTypes.find(t => t.value === selectedInventory.type)?.label}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedInventory(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Aktualny stan</p>
                  <p className={`text-sm font-semibold ${selectedInventory.currentStock <= selectedInventory.minimumStock ? 'text-red-600' : 'text-deepNavy'}`}>{selectedInventory.currentStock} {selectedInventory.unit}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Minimalny stan</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedInventory.minimumStock} {selectedInventory.unit}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Dostawca</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedInventory.supplier || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Ostatnie uzupełnienie</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedInventory.lastRestockDate || '-'}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue">Status</p>
                  <p className="text-sm font-semibold text-deepNavy">{selectedInventory.currentStock <= selectedInventory.minimumStock ? 'Niski stan' : 'OK'}</p>
                </div>
              </div>

              {selectedInventory.notes && (
                <div className="mb-6 p-4 bg-arcticBlue/20 rounded-2xl border border-iceBlue">
                  <p className="text-xs text-marineBlue mb-1">Notatki</p>
                  <p className="text-sm text-deepNavy">{selectedInventory.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setSelectedInventory(null); handleEditInventory(selectedInventory); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj</button>
                <button onClick={() => { setSelectedInventory(null); handleDeleteInventory(selectedInventory.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingSchedule ? 'Edytuj harmonogram' : 'Dodaj harmonogram'}
                </h2>
                <button
                  onClick={() => setShowAddScheduleModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    value={scheduleFormData.horseId}
                    onChange={(e) => {
                      const selectedHorse = horses.find(h => h.id === e.target.value);
                      setScheduleFormData({
                        ...scheduleFormData,
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ karmy</label>
                  <select
                    value={scheduleFormData.feedType}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, feedType: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz typ</option>
                    {feedTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Ilość</label>
                    <input
                      type="number"
                      value={scheduleFormData.feedAmount}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, feedAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Jednostka</label>
                    <select
                      value={scheduleFormData.unit}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, unit: e.target.value as FeedingSchedule['unit'] })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    >
                      {units.map((unit) => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Ile razy dziennie</label>
                  <input
                    type="number"
                    value={scheduleFormData.timesPerDay}
                    onChange={(e) => {
                      const times = parseInt(e.target.value) || 1;
                      setScheduleFormData({ 
                        ...scheduleFormData, 
                        timesPerDay: times,
                        feedingTimes: Array(times).fill('08:00')
                      });
                    }}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    min="1"
                    max="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Godziny karmienia</label>
                  <div className="space-y-2">
                    {scheduleFormData.feedingTimes.map((time, index) => (
                      <input
                        key={index}
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...scheduleFormData.feedingTimes];
                          newTimes[index] = e.target.value;
                          setScheduleFormData({ ...scheduleFormData, feedingTimes: newTimes });
                        }}
                        className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data rozpoczęcia</label>
                    <input
                      type="date"
                      value={scheduleFormData.startDate}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data zakończenia</label>
                    <input
                      type="date"
                      value={scheduleFormData.endDate}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Suplementy (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={scheduleFormData.supplements.join(', ')}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, supplements: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                    placeholder="np. Witaminy, Minerały"
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Instrukcje specjalne</label>
                  <textarea
                    value={scheduleFormData.specialInstructions}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, specialInstructions: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={scheduleFormData.notes}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddScheduleModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingSchedule ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Inventory Modal */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingInventory ? 'Edytuj magazyn' : 'Dodaj do magazynu'}
                </h2>
                <button
                  onClick={() => setShowAddInventoryModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitInventory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={inventoryFormData.name}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={inventoryFormData.type}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, type: e.target.value as FeedInventory['type'] })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  >
                    {inventoryTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Aktualny stan</label>
                    <input
                      type="number"
                      value={inventoryFormData.currentStock}
                      onChange={(e) => setInventoryFormData({ ...inventoryFormData, currentStock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Jednostka</label>
                    <select
                      value={inventoryFormData.unit}
                      onChange={(e) => setInventoryFormData({ ...inventoryFormData, unit: e.target.value as FeedInventory['unit'] })}
                      className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    >
                      {units.map((unit) => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Minimalny stan</label>
                  <input
                    type="number"
                    value={inventoryFormData.minimumStock}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, minimumStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Dostawca</label>
                  <input
                    type="text"
                    value={inventoryFormData.supplier}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, supplier: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Ostatnie uzupełnienie</label>
                  <input
                    type="date"
                    value={inventoryFormData.lastRestockDate}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, lastRestockDate: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={inventoryFormData.notes}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingInventory ? 'Zapisz zmiany' : 'Dodaj'}
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
