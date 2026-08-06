'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, Search, X, Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';

interface Service {
  id: string;
  stableId: string;
  name: string;
  description: string | null;
  type: string;
  duration: number;
  price: number;
  instructorIds: string[];
  maxParticipants: number | null;
  skillLevel: string | null;
  requirements: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'lesson',
    duration: '60',
    price: '',
    instructorIds: [] as string[],
    maxParticipants: '',
    skillLevel: '',
    requirements: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  // Get stable ID from active stable
  const stableId = activeStableId;

  useEffect(() => {
    if (!stableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [servicesRes, instructorsRes] = await Promise.all([
          api.get(`/services?stableId=${stableId}`),
          api.get(`/employees?stableId=${stableId}`),
        ]);
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
        setInstructors(Array.isArray(instructorsRes.data) ? instructorsRes.data : []);
      } catch (error) {
        console.error('Load data error:', error);
        setServices([]);
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [stableId]);

  const handleAddService = async () => {
    if (!formData.name.trim() || !formData.type || !formData.duration || !formData.price || !stableId) return;
    setSaving(true);
    try {
      const serviceData = {
        stableId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        instructorIds: formData.instructorIds,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        skillLevel: formData.skillLevel,
        requirements: formData.requirements,
      };

      if (editingService) {
        const { data } = await api.put(`/services/${editingService.id}`, serviceData);
        setServices(services.map(s => s.id === editingService.id ? data : s));
      } else {
        const { data } = await api.post('/services', serviceData);
        setServices([...services, data]);
      }

      setFormData({
        name: '',
        description: '',
        type: 'lesson',
        duration: '60',
        price: '',
        instructorIds: [],
        maxParticipants: '',
        skillLevel: '',
        requirements: [],
      });
      setShowAddModal(false);
      setEditingService(null);
    } catch (error) {
      console.error('Save service error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!stableId) return;
    setSaving(true);
    try {
      await api.delete(`/services/${serviceId}`);
      setServices(services.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Delete service error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditService = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      type: service.type,
      duration: service.duration.toString(),
      price: service.price.toString(),
      instructorIds: service.instructorIds || [],
      maxParticipants: service.maxParticipants?.toString() || '',
      skillLevel: service.skillLevel || '',
      requirements: service.requirements || [],
    });
    setEditingService(service);
    setShowAddModal(true);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie usług...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Oferta</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Usługi</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj usługami stajni.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
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
              placeholder="Szukaj usługi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
            />
          </div>

          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-oceanBlue" />
              </div>
              <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak usług</h3>
              <p className="text-marineBlue mb-6">Dodaj pierwszą usługę i zarządzaj ofertą stajni</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Dodaj pierwszą usługę
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-bold text-deepNavy mb-1">{service.name}</h3>
                      <p className="text-sm text-marineBlue capitalize">{service.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditService(service)}
                        disabled={saving}
                        className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        disabled={saving}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-sm text-marineBlue mb-3">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-deepNavy font-medium">{service.duration} min</span>
                    <span className="text-oceanBlue font-bold">{service.price} zł</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-iceBlue shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-deepNavy">
                    {editingService ? 'Edytuj usługę' : 'Nowa usługa'}
                  </h2>
                  <p className="text-sm text-marineBlue mt-1">
                    {editingService ? 'Zmień szczegóły usługi' : 'Utwórz nową usługę dla stajni'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingService(null);
                    setFormData({
                      name: '',
                      description: '',
                      type: 'lesson',
                      duration: '60',
                      price: '',
                      instructorIds: [],
                      maxParticipants: '',
                      skillLevel: '',
                      requirements: [],
                    });
                  }}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa usługi *</label>
                  <input
                    type="text"
                    placeholder="np. Lekcja indywidualna"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis (opcjonalny)</label>
                  <textarea
                    placeholder="Opis usługi..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ usługi *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                  >
                    <option value="lesson">Lekcja</option>
                    <option value="training">Trening</option>
                    <option value="rental">Wypożyczenie</option>
                    <option value="boarding">Pensjonat</option>
                    <option value="other">Inne</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Czas trwania (min) *</label>
                    <input
                      type="number"
                      placeholder="60"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Cena (zł) *</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Przypisani instruktorzy</label>
                  <div className="space-y-2">
                    {instructors.map((instructor) => (
                      <label key={instructor.id} className="flex items-center gap-3 p-3 bg-arcticBlue/40 rounded-xl cursor-pointer hover:bg-arcticBlue/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.instructorIds.includes(instructor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, instructorIds: [...formData.instructorIds, instructor.id] });
                            } else {
                              setFormData({ ...formData, instructorIds: formData.instructorIds.filter(id => id !== instructor.id) });
                            }
                          }}
                          className="w-5 h-5 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                        />
                        <span className="font-medium text-deepNavy">{instructor.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Maks. liczba uczestników</label>
                    <input
                      type="number"
                      placeholder="np. 10"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Poziom zaawansowania</label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    >
                      <option value="">Wszystkie poziomy</option>
                      <option value="beginner">Początkujący</option>
                      <option value="intermediate">Średniozaawansowany</option>
                      <option value="advanced">Zaawansowany</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Wymagania (opcjonalne)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="np. Kask, obuwie sportowe"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !formData.requirements.includes(value)) {
                            setFormData({ ...formData, requirements: [...formData.requirements, value] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="np. Kask, obuwie sportowe"]') as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value && !formData.requirements.includes(value)) {
                          setFormData({ ...formData, requirements: [...formData.requirements, value] });
                          if (input) input.value = '';
                        }
                      }}
                      className="px-4 py-3 bg-oceanBlue text-white rounded-2xl font-medium hover:bg-marineBlue transition-colors"
                    >
                      Dodaj
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requirements.map((req, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm font-medium bg-oceanBlue/10 text-oceanBlue border border-oceanBlue/20 flex items-center gap-2">
                        {req}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) })}
                          className="hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6 border-t border-iceBlue shrink-0">
              <button
                onClick={handleAddService}
                disabled={saving || !formData.name.trim() || !formData.type || !formData.duration || !formData.price}
                className="w-full bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-5 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                {saving ? 'Zapisywanie...' : (editingService ? 'Zapisz zmiany' : 'Dodaj usługę')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
