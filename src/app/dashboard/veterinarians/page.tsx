'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, User, Calendar, Phone, Mail, Stethoscope } from 'lucide-react';
import api from '@/lib/api';

interface Veterinarian {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  clinic: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  licenseNumber: string;
  available: boolean;
  notes: string;
}

interface Appointment {
  id: string;
  veterinarianId: string;
  veterinarianName: string;
  horseId: string;
  horseName: string;
  date: string;
  time: string;
  type: 'checkup' | 'vaccination' | 'emergency' | 'dental' | 'deworming' | 'other';
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
}

export default function VeterinariansPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'veterinarians' | 'appointments'>('appointments');
  const [showAddVetModal, setShowAddVetModal] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [editingVet, setEditingVet] = useState<Veterinarian | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [vetSearchTerm, setVetSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);

  const [vetFormData, setVetFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    clinic: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    licenseNumber: '',
    available: true,
    notes: '',
  });

  const [appointmentFormData, setAppointmentFormData] = useState({
    veterinarianId: '',
    veterinarianName: '',
    horseId: '',
    horseName: '',
    date: '',
    time: '',
    type: 'checkup' as Appointment['type'],
    reason: '',
    status: 'scheduled' as Appointment['status'],
    notes: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [vetsRes, appointmentsRes, horsesRes] = await Promise.all([
          api.get(`/veterinarians?stableId=${activeStableId}`),
          api.get(`/veterinarians/appointments/all?stableId=${activeStableId}`),
          api.get(`/horses?stableId=${activeStableId}`)
        ]);
        setVeterinarians(vetsRes.data || []);
        setAppointments(appointmentsRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setVeterinarians([]);
        setAppointments([]);
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
          <p className="text-marineBlue">Ładowanie weterynarzy...</p>
        </div>
      </div>
    );
  }

  const appointmentTypes = [
    { value: 'checkup', label: 'Badanie kontrolne' },
    { value: 'vaccination', label: 'Szczepienie' },
    { value: 'emergency', label: 'Nagłe' },
    { value: 'dental', label: 'Stomatologiczne' },
    { value: 'deworming', label: 'Odrobaczanie' },
    { value: 'other', label: 'Inne' },
  ];

  const appointmentStatuses = [
    { value: 'scheduled', label: 'Zaplanowane', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Zakończone', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Odwołane', color: 'bg-gray-100 text-gray-800' },
    { value: 'no_show', label: 'Nie stawił się', color: 'bg-red-100 text-red-800' },
  ];

  const handleAddVet = () => {
    setVetFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      clinic: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      licenseNumber: '',
      available: true,
      notes: '',
    });
    setEditingVet(null);
    setShowAddVetModal(true);
  };

  const handleEditVet = (vet: Veterinarian) => {
    setVetFormData({
      name: vet.name,
      email: vet.email,
      phone: vet.phone,
      specialization: vet.specialization,
      clinic: vet.clinic,
      address: vet.address,
      emergencyContact: vet.emergencyContact,
      emergencyPhone: vet.emergencyPhone,
      licenseNumber: vet.licenseNumber,
      available: vet.available,
      notes: vet.notes,
    });
    setEditingVet(vet);
    setShowAddVetModal(true);
  };

  const handleDeleteVet = async (id: string) => {
    try {
      await api.delete(`/veterinarians/${id}`);
      setVeterinarians(veterinarians.filter(v => v.id !== id));
    } catch (error) {
      console.error('Delete veterinarian error:', error);
      alert('Nie udało się usunąć weterynarza');
    }
  };

  const handleSubmitVet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVet) {
        const { data } = await api.put(`/veterinarians/${editingVet.id}`, vetFormData);
        setVeterinarians(veterinarians.map(v => v.id === editingVet.id ? data : v));
      } else {
        const { data } = await api.post('/veterinarians', { ...vetFormData, stableId: activeStableId });
        setVeterinarians([...veterinarians, data]);
      }
      setShowAddVetModal(false);
    } catch (error) {
      console.error('Save veterinarian error:', error);
      alert('Nie udało się zapisać weterynarza');
    }
  };

  const handleAddAppointment = () => {
    setAppointmentFormData({
      veterinarianId: '',
      veterinarianName: '',
      horseId: '',
      horseName: '',
      date: '',
      time: '',
      type: 'checkup',
      reason: '',
      status: 'scheduled',
      notes: '',
    });
    setEditingAppointment(null);
    setShowAddAppointmentModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentFormData({
      veterinarianId: appointment.veterinarianId,
      veterinarianName: appointment.veterinarianName,
      horseId: appointment.horseId,
      horseName: appointment.horseName,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes,
    });
    setEditingAppointment(appointment);
    setShowAddAppointmentModal(true);
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await api.delete(`/veterinarians/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (error) {
      console.error('Delete appointment error:', error);
      alert('Nie udało się usunąć wizyty');
    }
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        const { data } = await api.put(`/veterinarians/appointments/${editingAppointment.id}`, appointmentFormData);
        setAppointments(appointments.map(a => a.id === editingAppointment.id ? data : a));
      } else {
        const { data } = await api.post('/veterinarians/appointments', { ...appointmentFormData, stableId: activeStableId });
        setAppointments([...appointments, data]);
      }
      setShowAddAppointmentModal(false);
    } catch (error) {
      console.error('Save appointment error:', error);
      alert('Nie udało się zapisać wizyty');
    }
  };

  const getVetStats = () => {
    const totalVets = veterinarians.length;
    const availableVets = veterinarians.filter(v => v.available).length;
    const upcomingAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

    return {
      totalVets,
      availableVets,
      upcomingAppointments,
      completedAppointments,
    };
  };

  const stats = getVetStats();

  const filteredVeterinarians = veterinarians.filter(v =>
    v.name.toLowerCase().includes(vetSearchTerm.toLowerCase()) ||
    v.specialization.toLowerCase().includes(vetSearchTerm.toLowerCase()) ||
    v.clinic.toLowerCase().includes(vetSearchTerm.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a =>
    a.horseName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
    a.veterinarianName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
    a.reason.toLowerCase().includes(appointmentSearchTerm.toLowerCase())
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
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Zdrowie</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Weterynarze</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj weterynarzami i wizytami weterynaryjnymi.
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'veterinarians') handleAddVet();
                  else if (activeTab === 'appointments') handleAddAppointment();
                }}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-deepNavy rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Weterynarze</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalVets}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Dostępni</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.availableVets}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Zaplanowane</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Zakończone</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completedAppointments}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'appointments'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Wizyty
            </button>
            <button
              onClick={() => setActiveTab('veterinarians')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'veterinarians'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Weterynarze
            </button>
          </div>

          {/* Veterinarians Tab */}
          {activeTab === 'veterinarians' && (
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                <input
                  type="text"
                  placeholder="Szukaj weterynarza..."
                  value={vetSearchTerm}
                  onChange={(e) => setVetSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVeterinarians.map((vet) => (
                  <div key={vet.id} onClick={() => setSelectedVet(vet)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{vet.name}</h3>
                          <p className="text-xs text-marineBlue">{vet.specialization}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditVet(vet); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteVet(vet.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-marineBlue mb-3 line-clamp-1">{vet.clinic}</p>
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-marineBlue" />
                        <span className="text-deepNavy">{vet.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-marineBlue" />
                        <span className="text-deepNavy line-clamp-1">{vet.email}</span>
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${vet.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {vet.available ? 'Dostępny' : 'Niedostępny'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
                <input
                  type="text"
                  placeholder="Szukaj wizyty..."
                  value={appointmentSearchTerm}
                  onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAppointments.map((appointment) => {
                  const typeLabel = appointmentTypes.find(t => t.value === appointment.type)?.label || appointment.type;
                  const status = appointmentStatuses.find(s => s.value === appointment.status);
                  return (
                    <div key={appointment.id} onClick={() => setSelectedAppointment(appointment)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-deepNavy">{appointment.horseName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-700'}`}>{status?.label}</span>
                          </div>
                          <p className="text-xs text-marineBlue">{appointment.veterinarianName}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEditAppointment(appointment); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(appointment.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-marineBlue mb-2">
                        <span className="bg-arcticBlue/40 px-2 py-1 rounded-lg">{appointment.date} {appointment.time}</span>
                        <span className="bg-arcticBlue/40 px-2 py-1 rounded-lg">{typeLabel}</span>
                      </div>
                      <p className="text-sm text-deepNavy line-clamp-2">{appointment.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedVet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedVet.name}</h2>
                    <p className="text-sm text-marineBlue">{selectedVet.specialization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingVet(selectedVet); setSelectedVet(null); setShowAddVetModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setVeterinarians(veterinarians.filter(v => v.id !== selectedVet.id)); setSelectedVet(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedVet(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Klinika</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedVet.clinic}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Adres</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedVet.address || '-'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Telefon</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedVet.phone}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Email</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedVet.email}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Numer licencji</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedVet.licenseNumber || '-'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Kontakt awaryjny</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedVet.emergencyContact || '-'} {selectedVet.emergencyPhone && `(${selectedVet.emergencyPhone})`}</p>
                </div>
              </div>

              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${selectedVet.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedVet.available ? 'Dostępny' : 'Niedostępny'}
                </span>
              </div>

              {selectedVet.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedVet.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Veterinarian Modal */}
      {showAddVetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingVet ? 'Edytuj weterynarza' : 'Dodaj weterynarza'}
                </h2>
                <button
                  onClick={() => setShowAddVetModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitVet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Imię i nazwisko</label>
                  <input
                    type="text"
                    value={vetFormData.name}
                    onChange={(e) => setVetFormData({ ...vetFormData, name: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                  <input
                    type="email"
                    value={vetFormData.email}
                    onChange={(e) => setVetFormData({ ...vetFormData, email: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={vetFormData.phone}
                    onChange={(e) => setVetFormData({ ...vetFormData, phone: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Specjalizacja</label>
                  <input
                    type="text"
                    value={vetFormData.specialization}
                    onChange={(e) => setVetFormData({ ...vetFormData, specialization: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Klinika</label>
                  <input
                    type="text"
                    value={vetFormData.clinic}
                    onChange={(e) => setVetFormData({ ...vetFormData, clinic: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Adres</label>
                  <input
                    type="text"
                    value={vetFormData.address}
                    onChange={(e) => setVetFormData({ ...vetFormData, address: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Kontakt awaryjny</label>
                    <input
                      type="text"
                      value={vetFormData.emergencyContact}
                      onChange={(e) => setVetFormData({ ...vetFormData, emergencyContact: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Telefon awaryjny</label>
                    <input
                      type="tel"
                      value={vetFormData.emergencyPhone}
                      onChange={(e) => setVetFormData({ ...vetFormData, emergencyPhone: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Numer licencji</label>
                  <input
                    type="text"
                    value={vetFormData.licenseNumber}
                    onChange={(e) => setVetFormData({ ...vetFormData, licenseNumber: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vetFormData.available}
                      onChange={(e) => setVetFormData({ ...vetFormData, available: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Dostępny</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={vetFormData.notes}
                    onChange={(e) => setVetFormData({ ...vetFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddVetModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingVet ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedAppointment.horseName}</h2>
                  <p className="text-sm text-marineBlue">{selectedAppointment.veterinarianName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingAppointment(selectedAppointment); setSelectedAppointment(null); setShowAddAppointmentModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setAppointments(appointments.filter(a => a.id !== selectedAppointment.id)); setSelectedAppointment(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Data i godzina</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedAppointment.date} {selectedAppointment.time}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Typ</p>
                  <p className="text-sm font-medium text-deepNavy">{appointmentTypes.find(t => t.value === selectedAppointment.type)?.label}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${appointmentStatuses.find(s => s.value === selectedAppointment.status)?.color}`}>{appointmentStatuses.find(s => s.value === selectedAppointment.status)?.label}</span>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Powód</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedAppointment.reason || '-'}</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Appointment Modal */}
      {showAddAppointmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingAppointment ? 'Edytuj wizytę' : 'Dodaj wizytę'}
                </h2>
                <button
                  onClick={() => setShowAddAppointmentModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    value={appointmentFormData.horseId}
                    onChange={(e) => {
                      const horse = horses.find(h => h.id === e.target.value);
                      setAppointmentFormData({
                        ...appointmentFormData,
                        horseId: e.target.value,
                        horseName: horse ? horse.name : '',
                      });
                    }}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz konia</option>
                    {horses.map((horse) => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Weterynarz</label>
                  <select
                    value={appointmentFormData.veterinarianId}
                    onChange={(e) => {
                      const selectedVet = veterinarians.find(v => v.id === e.target.value);
                      setAppointmentFormData({ 
                        ...appointmentFormData, 
                        veterinarianId: e.target.value,
                        veterinarianName: selectedVet?.name || '',
                      });
                    }}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz weterynarza</option>
                    {veterinarians.filter(v => v.available).map((vet) => (
                      <option key={vet.id} value={vet.id}>{vet.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data</label>
                    <input
                      type="date"
                      value={appointmentFormData.date}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, date: e.target.value })}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Godzina</label>
                    <input
                      type="time"
                      value={appointmentFormData.time}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, time: e.target.value })}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={appointmentFormData.type}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, type: e.target.value as Appointment['type'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {appointmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Powód</label>
                  <textarea
                    value={appointmentFormData.reason}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={appointmentFormData.status}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, status: e.target.value as Appointment['status'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {appointmentStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={appointmentFormData.notes}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAppointmentModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingAppointment ? 'Zapisz zmiany' : 'Dodaj'}
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
