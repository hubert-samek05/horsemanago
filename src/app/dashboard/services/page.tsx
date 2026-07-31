'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, Search, X, Trash2 } from 'lucide-react';
import api from '@/lib/api';

export default function ServicesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
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
    const loadServices = async () => {
      try {
        const { data } = await api.get(`/stables/${stableId}/services`);
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Load services error:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, [stableId]);

  const handleAddService = async () => {
    if (!newService.trim() || !stableId) return;
    setSaving(true);
    try {
      const updatedServices = [...services, newService.trim()];
      await api.put(`/stables/${stableId}`, { services: updatedServices });
      setServices(updatedServices);
      setNewService('');
    } catch (error) {
      console.error('Add service error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (service: string) => {
    if (!stableId) return;
    setSaving(true);
    try {
      const updatedServices = services.filter(s => s !== service);
      await api.put(`/stables/${stableId}`, { services: updatedServices });
      setServices(updatedServices);
    } catch (error) {
      console.error('Delete service error:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [searchTerm, setSearchTerm] = useState('');

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

        <div className="p-4 lg:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-1">Usługi</h1>
              <p className="text-marineBlue text-sm">Zarządzaj usługami stajni</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nazwa nowej usługi..."
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy"
                onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
              />
              <button
                onClick={handleAddService}
                disabled={saving || !newService.trim()}
                className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-5 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Dodaj</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div key={service} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-bold text-deepNavy mb-1">{service}</h3>
                  </div>
                  <button 
                    onClick={() => handleDeleteService(service)}
                    disabled={saving}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-marineBlue">Brak usług do wyświetlenia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
