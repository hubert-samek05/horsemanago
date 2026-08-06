'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, Search, X, Edit2, Trash2, MapPin } from 'lucide-react';
import api from '@/lib/api';

interface Location {
  id: string;
  name: string;
  type: 'arena' | 'round_pen' | 'lunging' | 'pasture';
  capacity: number;
  description: string;
}

export default function LocationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'arena' as 'arena' | 'round_pen' | 'lunging' | 'pasture',
    capacity: 1,
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const { data } = await api.get(`/locations?stableId=${activeStableId}`);
        setLocations(data || []);
      } catch (error) {
        console.error('Load locations error:', error);
        setLocations([]);
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
          <p className="text-marineBlue">Ładowanie lokalizacji...</p>
        </div>
      </div>
    );
  }

  const locationTypes = [
    { value: 'arena', label: 'Ujeżdżalnia' },
    { value: 'round_pen', label: 'Lonżownik' },
    { value: 'lunging', label: 'Karuzela' },
    { value: 'pasture', label: 'Pastwisko' },
  ];

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locationTypes.find(t => t.value === location.type)?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLocation = () => {
    setFormData({ name: '', type: 'arena', capacity: 1, description: '' });
    setEditingLocation(null);
    setShowAddModal(true);
  };

  const handleEditLocation = (location: Location) => {
    setFormData({
      name: location.name,
      type: location.type,
      capacity: location.capacity,
      description: location.description,
    });
    setEditingLocation(location);
    setShowAddModal(true);
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await api.delete(`/locations/${id}`);
      setLocations(locations.filter(l => l.id !== id));
    } catch (error) {
      console.error('Delete location error:', error);
      alert('Nie udało się usunąć lokalizacji');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        const { data } = await api.put(`/locations/${editingLocation.id}`, formData);
        setLocations(locations.map(l => l.id === editingLocation.id ? data : l));
      } else {
        const { data } = await api.post('/locations', { ...formData, stableId: activeStableId });
        setLocations([...locations, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save location error:', error);
      alert('Nie udało się zapisać lokalizacji');
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

        <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Masthead */}
          <div className="rounded-3xl bg-gradient-to-r from-deepNavy via-oceanBlue to-marineBlue text-white overflow-hidden shadow-xl">
            <div className="p-6 sm:p-6 lg:p-10 flex flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div>
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Infrastruktura</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Miejsca</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj lokalizacjami i infrastrukturą stajni.
                </p>
              </div>
              <button
                onClick={handleAddLocation}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-deepNavy rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj miejsca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
            />
          </div>

          {filteredLocations.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-oceanBlue" />
              </div>
              <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak miejsc</h3>
              <p className="text-marineBlue mb-6">Dodaj pierwsze miejsce i zarządzaj infrastrukturą stajni</p>
              <button
                onClick={handleAddLocation}
                className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Dodaj pierwsze miejsce
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLocations.map((location) => (
                <div key={location.id} onClick={() => setSelectedLocation(location)} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-deepNavy mb-1">{location.name}</h3>
                      <p className="text-sm text-marineBlue line-clamp-2">{location.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleEditLocation(location); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteLocation(location.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-arcticBlue/40 rounded-2xl p-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-oceanBlue" />
                      <div>
                        <p className="text-xs text-marineBlue">Typ</p>
                        <p className="text-sm font-semibold text-deepNavy">{locationTypes.find(t => t.value === location.type)?.label}</p>
                      </div>
                    </div>
                    <div className="bg-arcticBlue/40 rounded-2xl p-3 flex items-center gap-2">
                      <div>
                        <p className="text-xs text-marineBlue">Pojemność</p>
                        <p className="text-sm font-semibold text-deepNavy">{location.capacity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedLocation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedLocation.name}</h2>
                  <p className="text-sm text-marineBlue">{locationTypes.find(t => t.value === selectedLocation.type)?.label}</p>
                </div>
                <button onClick={() => setSelectedLocation(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <p className="text-deepNavy mb-6">{selectedLocation.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-arcticBlue/40 rounded-2xl p-4 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-oceanBlue" />
                  <div>
                    <p className="text-xs text-marineBlue">Typ</p>
                    <p className="font-semibold text-deepNavy">{locationTypes.find(t => t.value === selectedLocation.type)?.label}</p>
                  </div>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-4 flex items-center gap-3">
                  <div>
                    <p className="text-xs text-marineBlue">Pojemność</p>
                    <p className="font-semibold text-deepNavy">{selectedLocation.capacity}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setSelectedLocation(null); handleEditLocation(selectedLocation); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj</button>
                <button onClick={() => { setSelectedLocation(null); handleDeleteLocation(selectedLocation.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingLocation ? 'Edytuj miejsce' : 'Dodaj miejsce'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
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
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  >
                    {locationTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Pojemność</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-arcticBlue/30 border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-iceBlue rounded-2xl text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl hover:shadow-lg transition-all font-semibold"
                  >
                    {editingLocation ? 'Zapisz zmiany' : 'Dodaj'}
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
