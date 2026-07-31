'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, Clock, ChevronLeft, ChevronRight, User, Calendar, Phone, Mail, Hammer } from 'lucide-react';
import api from '@/lib/api';

interface Farrier {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  serviceArea: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  licenseNumber: string;
  available: boolean;
  notes: string;
}

interface Appointment {
  id: string;
  farrierId: string;
  farrierName: string;
  horseId: string;
  horseName: string;
  date: string;
  time: string;
  type: 'trimming' | 'shoeing' | 'emergency' | 'corrective' | 'other';
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
}

export default function FarriersPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'farriers' | 'appointments'>('appointments');
  const [showAddFarrierModal, setShowAddFarrierModal] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [editingFarrier, setEditingFarrier] = useState<Farrier | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [farrierSearchTerm, setFarrierSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [selectedFarrier, setSelectedFarrier] = useState<Farrier | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [now, setNow] = useState(new Date());
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [farriers, setFarriers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const { data } = await api.get(`/farriers?stableId=${activeStableId}`);
        setFarriers(data || []);
      } catch (error) {
        console.error('Load farriers error:', error);
        setFarriers([]);
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
          <p className="text-marineBlue">Ładowanie kowali...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [farrierFormData, setFarrierFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    serviceArea: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    licenseNumber: '',
    available: true,
    notes: '',
  });

  const [appointmentFormData, setAppointmentFormData] = useState({
    farrierId: '',
    farrierName: '',
    horseId: '',
    horseName: '',
    date: '',
    time: '',
    type: 'trimming' as Appointment['type'],
    reason: '',
    status: 'scheduled' as Appointment['status'],
    notes: '',
  });

  const appointmentTypes = [
    { value: 'trimming', label: 'Strzyżenie' },
    { value: 'shoeing', label: 'Podkówanie' },
    { value: 'emergency', label: 'Nagłe' },
    { value: 'corrective', label: 'Korekcyjne' },
    { value: 'other', label: 'Inne' },
  ];

  const appointmentStatuses = [
    { value: 'scheduled', label: 'Zaplanowane', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Zakończone', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Odwołane', color: 'bg-gray-100 text-gray-800' },
    { value: 'no_show', label: 'Nie stawił się', color: 'bg-red-100 text-red-800' },
  ];

  const saveCalendarEvent = (appointment: Appointment) => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('calendar-events');
      const parsed: any[] = saved ? JSON.parse(saved) : [];
      const [h, m] = (appointment.time || '00:00').split(':').map(Number);
      const startMin = h * 60 + (m || 0);
      const endMin = startMin + 60;
      const endH = Math.floor(endMin / 60).toString().padStart(2, '0');
      const endM = (endMin % 60).toString().padStart(2, '0');
      const [y, mo, d] = appointment.date.split('-').map(Number);
      const date = new Date(y, mo - 1, d);
      const farrierEvent = {
        id: `farrier-${appointment.id}`,
        title: 'Kowal',
        instructorId: Number(appointment.farrierId) || 9999,
        startTime: appointment.time,
        endTime: `${endH}:${endM}`,
        date: date.toISOString(),
        type: 'farrier',
        isGroup: false,
        location: 1,
        horseIds: [],
        assignHorseLater: false,
        clientName: appointment.horseName,
      };
      const filtered = parsed.filter((e: any) => e.id !== farrierEvent.id);
      localStorage.setItem('calendar-events', JSON.stringify([...filtered, farrierEvent]));
    } catch (e) {}
  };

  const removeCalendarEvent = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('calendar-events');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      localStorage.setItem('calendar-events', JSON.stringify(parsed.filter((e: any) => e.id !== `farrier-${id}`)));
    } catch (e) {}
  };

  const handleAddFarrier = () => {
    setFarrierFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      serviceArea: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      licenseNumber: '',
      available: true,
      notes: '',
    });
    setEditingFarrier(null);
    setShowAddFarrierModal(true);
  };

  const handleEditFarrier = (farrier: Farrier) => {
    setFarrierFormData({
      name: farrier.name,
      email: farrier.email,
      phone: farrier.phone,
      specialization: farrier.specialization,
      serviceArea: farrier.serviceArea,
      address: farrier.address,
      emergencyContact: farrier.emergencyContact,
      emergencyPhone: farrier.emergencyPhone,
      licenseNumber: farrier.licenseNumber,
      available: farrier.available,
      notes: farrier.notes,
    });
    setEditingFarrier(farrier);
    setShowAddFarrierModal(true);
  };

  const handleDeleteFarrier = async (id: string) => {
    try {
      await api.delete(`/farriers/${id}`);
      setFarriers(farriers.filter(f => f.id !== id));
    } catch (error) {
      console.error('Delete farrier error:', error);
      alert('Nie udało się usunąć kowala');
    }
  };

  const handleSubmitFarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFarrier) {
        const { data } = await api.put(`/farriers/${editingFarrier.id}`, farrierFormData);
        setFarriers(farriers.map(f => f.id === editingFarrier.id ? data : f));
      } else {
        const { data } = await api.post('/farriers', { ...farrierFormData, stableId: activeStableId });
        setFarriers([...farriers, data]);
      }
      setShowAddFarrierModal(false);
    } catch (error) {
      console.error('Save farrier error:', error);
      alert('Nie udało się zapisać kowala');
    }
  };

  const handleAddAppointment = () => {
    setAppointmentFormData({
      farrierId: '',
      farrierName: '',
      horseId: '',
      horseName: '',
      date: '',
      time: '',
      type: 'trimming',
      reason: '',
      status: 'scheduled',
      notes: '',
    });
    setEditingAppointment(null);
    setShowAddAppointmentModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentFormData({
      farrierId: appointment.farrierId,
      farrierName: appointment.farrierName,
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
      await api.delete(`/farriers/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
      removeCalendarEvent(id);
    } catch (error) {
      console.error('Delete appointment error:', error);
      alert('Nie udało się usunąć wizyty');
    }
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAppointment: Appointment = editingAppointment
        ? { ...editingAppointment, ...appointmentFormData }
        : { id: Date.now().toString(), ...appointmentFormData };
      
      if (editingAppointment) {
        const { data } = await api.put(`/farriers/appointments/${editingAppointment.id}`, appointmentFormData);
        setAppointments(appointments.map(a => a.id === editingAppointment.id ? data : a));
      } else {
        const { data } = await api.post('/farriers/appointments', { ...appointmentFormData, stableId: activeStableId });
        setAppointments([...appointments, data]);
      }
      saveCalendarEvent(newAppointment);
      setShowAddAppointmentModal(false);
    } catch (error) {
      console.error('Save appointment error:', error);
      alert('Nie udało się zapisać wizyty');
    }
  };

  const getFarrierStats = () => {
    const totalFarriers = farriers.length;
    const availableFarriers = farriers.filter(f => f.available).length;
    const upcomingAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

    return {
      totalFarriers,
      availableFarriers,
      upcomingAppointments,
      completedAppointments,
    };
  };

  const stats = getFarrierStats();

  const nextVisit = useMemo(() => {
    const upcoming = appointments
      .filter(a => a.status === 'scheduled')
      .map(a => new Date(`${a.date}T${a.time || '00:00'}`))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return upcoming || null;
  }, [appointments]);

  const countdown = useMemo(() => {
    if (!nextVisit) return null;
    const diff = nextVisit.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, overdue: false };
  }, [nextVisit, now]);

  const calendarDays = useMemo(() => {
    const year = miniCalendarMonth.getFullYear();
    const month = miniCalendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [miniCalendarMonth]);

  const filteredFarriers = farriers.filter(f =>
    f.name.toLowerCase().includes(farrierSearchTerm.toLowerCase()) ||
    f.specialization.toLowerCase().includes(farrierSearchTerm.toLowerCase()) ||
    f.serviceArea.toLowerCase().includes(farrierSearchTerm.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a =>
    a.horseName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
    a.farrierName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
    a.reason.toLowerCase().includes(appointmentSearchTerm.toLowerCase())
  );

  const hasAppointment = (date: Date) => appointments.some(a => {
    const [y, m, day] = a.date.split('-').map(Number);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === day;
  });

  const isToday = (date: Date) => date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

  const handleMiniCalendarDayClick = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setAppointmentFormData({
      farrierId: '',
      farrierName: '',
      horseId: '',
      horseName: '',
      date: `${yyyy}-${mm}-${dd}`,
      time: '',
      type: 'trimming',
      reason: '',
      status: 'scheduled',
      notes: '',
    });
    setEditingAppointment(null);
    setShowAddAppointmentModal(true);
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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Kowale</h1>
              <p className="text-marineBlue">Zarządzaj kowalami i wizytami</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Kowale</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalFarriers}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Dostępni</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.availableFarriers}</p>
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
                <Hammer className="w-5 h-5 text-green-600" />
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
              Wizyty kowalskie
            </button>
            <button
              onClick={() => setActiveTab('farriers')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'farriers'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Kowale
            </button>
          </div>

          {/* Farriers Tab */}
          {activeTab === 'farriers' && (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                  <input
                    type="text"
                    placeholder="Szukaj kowala..."
                    value={farrierSearchTerm}
                    onChange={(e) => setFarrierSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                  />
                </div>
                <button
                  onClick={handleAddFarrier}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj kowala</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFarriers.map((farrier) => (
                  <div key={farrier.id} onClick={() => setSelectedFarrier(farrier)} className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <Hammer className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{farrier.name}</h3>
                          <p className="text-xs text-marineBlue">{farrier.specialization}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEditFarrier(farrier); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFarrier(farrier.id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-marineBlue mb-3 line-clamp-1">{farrier.serviceArea}</p>
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-marineBlue" />
                        <span className="text-deepNavy">{farrier.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-marineBlue" />
                        <span className="text-deepNavy line-clamp-1">{farrier.email}</span>
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${farrier.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {farrier.available ? 'Dostępny' : 'Niedostępny'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              <div className="flex-1 min-w-0 space-y-4 w-full">
                <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-deepNavy">Następna wizyta kowalska</h3>
                      <p className="text-xs text-marineBlue">
                        {nextVisit ? nextVisit.toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : 'Brak zaplanowanych wizyt'}
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    {countdown ? (
                      <div className="text-2xl font-bold text-deepNavy font-mono">
                        {countdown.overdue ? 'Termin minął' : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`}
                      </div>
                    ) : (
                      <p className="text-sm text-marineBlue">Dodaj wizytę, aby zobaczyć odliczanie</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowMobileCalendar(!showMobileCalendar)}
                  className="lg:hidden w-full bg-white rounded-2xl shadow-md border border-iceBlue p-4 flex items-center justify-center gap-2 text-deepNavy font-medium"
                >
                  <Calendar className="w-5 h-5 text-oceanBlue" />
                  {showMobileCalendar ? 'Ukryj kalendarz' : 'Pokaż kalendarz'}
                </button>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
                    <input
                      type="text"
                      placeholder="Szukaj wizyty..."
                      value={appointmentSearchTerm}
                      onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddAppointment}
                    className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Dodaj wizytę</span>
                  </button>
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
                            <p className="text-xs text-marineBlue">{appointment.farrierName}</p>
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

              <div className={`w-full lg:w-80 ${showMobileCalendar ? 'block' : 'hidden'} lg:block`}>
                <div className="bg-white rounded-2xl shadow-md border border-iceBlue p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg font-bold text-deepNavy">Mini kalendarz</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMiniCalendarMonth(new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() - 1, 1))} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-deepNavy" />
                      </button>
                      <span className="text-sm font-medium text-deepNavy w-24 text-center">{miniCalendarMonth.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setMiniCalendarMonth(new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() + 1, 1))} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-deepNavy" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(d => <span key={d} className="text-xs font-medium text-marineBlue">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => (
                      <div key={i} className="aspect-square p-1">
                        {day && (
                          <button
                            onClick={() => handleMiniCalendarDayClick(day)}
                            className={`w-full h-full rounded-xl text-sm font-medium flex flex-col items-center justify-center transition-colors ${isToday(day) ? 'bg-oceanBlue text-white' : hasAppointment(day) ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'hover:bg-iceBlue text-deepNavy'}`}
                          >
                            <span>{day.getDate()}</span>
                            {hasAppointment(day) && <span className="w-1.5 h-1.5 rounded-full bg-current mt-1" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedFarrier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                    <Hammer className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-deepNavy">{selectedFarrier.name}</h2>
                    <p className="text-sm text-marineBlue">{selectedFarrier.specialization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingFarrier(selectedFarrier); setSelectedFarrier(null); setShowAddFarrierModal(true); }} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setFarriers(farriers.filter(f => f.id !== selectedFarrier.id)); setSelectedFarrier(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedFarrier(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                    <X className="w-5 h-5 text-deepNavy" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Obszar działania</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedFarrier.serviceArea}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Adres</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedFarrier.address || '-'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Telefon</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedFarrier.phone}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Email</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedFarrier.email}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Numer licencji</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedFarrier.licenseNumber || '-'}</p>
                </div>
                <div className="bg-arcticBlue/30 rounded-2xl p-4">
                  <p className="text-xs text-marineBlue mb-1">Kontakt awaryjny</p>
                  <p className="text-sm font-medium text-deepNavy">{selectedFarrier.emergencyContact || '-'} {selectedFarrier.emergencyPhone && `(${selectedFarrier.emergencyPhone})`}</p>
                </div>
              </div>

              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${selectedFarrier.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedFarrier.available ? 'Dostępny' : 'Niedostępny'}
                </span>
              </div>

              {selectedFarrier.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">{selectedFarrier.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Farrier Modal */}
      {showAddFarrierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingFarrier ? 'Edytuj kowala' : 'Dodaj kowala'}
                </h2>
                <button
                  onClick={() => setShowAddFarrierModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitFarrier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Imię i nazwisko</label>
                  <input
                    type="text"
                    value={farrierFormData.name}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, name: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                  <input
                    type="email"
                    value={farrierFormData.email}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, email: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={farrierFormData.phone}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, phone: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Specjalizacja</label>
                  <input
                    type="text"
                    value={farrierFormData.specialization}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, specialization: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Obszar działania</label>
                  <input
                    type="text"
                    value={farrierFormData.serviceArea}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, serviceArea: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Adres</label>
                  <input
                    type="text"
                    value={farrierFormData.address}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, address: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Kontakt awaryjny</label>
                    <input
                      type="text"
                      value={farrierFormData.emergencyContact}
                      onChange={(e) => setFarrierFormData({ ...farrierFormData, emergencyContact: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Telefon awaryjny</label>
                    <input
                      type="tel"
                      value={farrierFormData.emergencyPhone}
                      onChange={(e) => setFarrierFormData({ ...farrierFormData, emergencyPhone: e.target.value })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Numer licencji</label>
                  <input
                    type="text"
                    value={farrierFormData.licenseNumber}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, licenseNumber: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={farrierFormData.available}
                      onChange={(e) => setFarrierFormData({ ...farrierFormData, available: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Dostępny</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={farrierFormData.notes}
                    onChange={(e) => setFarrierFormData({ ...farrierFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddFarrierModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingFarrier ? 'Zapisz zmiany' : 'Dodaj'}
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
                  <p className="text-sm text-marineBlue">{selectedAppointment.farrierName}</p>
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa konia</label>
                  <input
                    type="text"
                    value={appointmentFormData.horseName}
                    onChange={(e) => setAppointmentFormData({ ...appointmentFormData, horseName: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Kowal</label>
                  <select
                    value={appointmentFormData.farrierId}
                    onChange={(e) => {
                      const selectedFarrier = farriers.find(f => f.id === e.target.value);
                      setAppointmentFormData({ 
                        ...appointmentFormData, 
                        farrierId: e.target.value,
                        farrierName: selectedFarrier?.name || '',
                      });
                    }}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz kowala</option>
                    {farriers.filter(f => f.available).map((farrier) => (
                      <option key={farrier.id} value={farrier.id}>{farrier.name}</option>
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
