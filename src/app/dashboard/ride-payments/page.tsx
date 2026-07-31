'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAuthStore, usePassStore, Pass } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, Calendar, User, CreditCard, CheckCircle, XCircle, Clock, DollarSign, Filter, Ticket } from 'lucide-react';
import api from '@/lib/api';

interface RidePayment {
  id: string;
  rideId: string;
  clientName: string;
  clientPhone: string;
  horseName: string;
  instructorName: string;
  serviceType: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  paid: boolean;
  depositPaid: boolean;
  depositAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'online' | 'pass';
  passId?: string;
  passName?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export default function RidePaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RidePayment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<RidePayment | null>(null);
  const [markPaymentModal, setMarkPaymentModal] = useState(false);
  const [markingPayment, setMarkingPayment] = useState<RidePayment | null>(null);
  const [markMethod, setMarkMethod] = useState<RidePayment['paymentMethod']>('cash');
  const [markPassId, setMarkPassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rideId: '',
    clientName: '',
    clientPhone: '',
    horseName: '',
    instructorName: '',
    serviceType: '',
    date: '',
    time: '',
    duration: 60,
    price: 0,
    paid: false,
    depositPaid: false,
    depositAmount: 0,
    paymentMethod: 'cash' as RidePayment['paymentMethod'],
    passId: '',
    passName: '',
    status: 'completed' as RidePayment['status'],
    notes: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [payments, setPayments] = useState<RidePayment[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        // TODO: Fetch real data from API
        // For now, show empty state
        setPayments([]);
      } catch (error) {
        console.error('Load payments error:', error);
        setPayments([]);
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
          <p className="text-marineBlue">Ładowanie płatności...</p>
        </div>
      </div>
    );
  }

  const passes = usePassStore((state) => state.passes);
  const setPasses = usePassStore((state) => state.setPasses);

  const paymentMethods = [
    { value: 'cash', label: 'Gotówka' },
    { value: 'card', label: 'Karta' },
    { value: 'transfer', label: 'Przelew' },
    { value: 'online', label: 'Płatność online' },
    { value: 'pass', label: 'Karnet' },
  ];

  const statuses = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'scheduled', label: 'Zaplanowane' },
    { value: 'in_progress', label: 'W trakcie' },
    { value: 'completed', label: 'Zakończone' },
    { value: 'cancelled', label: 'Odwołane' },
  ];

  const handleAddPayment = () => {
    setFormData({
      rideId: '',
      clientName: '',
      clientPhone: '',
      horseName: '',
      instructorName: '',
      serviceType: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      duration: 60,
      price: 0,
      paid: false,
      depositPaid: false,
      depositAmount: 0,
      paymentMethod: 'cash',
      passId: '',
      passName: '',
      status: 'completed',
      notes: '',
    });
    setEditingPayment(null);
    setShowAddModal(true);
  };

  const handleEditPayment = (payment: RidePayment) => {
    setFormData({
      rideId: payment.rideId,
      clientName: payment.clientName,
      clientPhone: payment.clientPhone,
      horseName: payment.horseName,
      instructorName: payment.instructorName,
      serviceType: payment.serviceType,
      date: payment.date,
      time: payment.time,
      duration: payment.duration,
      price: payment.price,
      paid: payment.paid,
      depositPaid: payment.depositPaid,
      depositAmount: payment.depositAmount,
      paymentMethod: payment.paymentMethod,
      passId: payment.passId || '',
      passName: payment.passName || '',
      status: payment.status,
      notes: payment.notes || '',
    });
    setEditingPayment(payment);
    setShowAddModal(true);
  };

  const handleDeletePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleMarkPaid = (payment: RidePayment) => {
    setMarkingPayment(payment);
    setMarkMethod('cash');
    setMarkPassId('');
    setMarkPaymentModal(true);
  };

  const usePassRide = (passId: string) => {
    setPasses(passes.map(p =>
      p.id === passId && p.remainingRides > 0
        ? { ...p, remainingRides: p.remainingRides - 1, status: p.remainingRides - 1 === 0 ? 'used' as const : p.status }
        : p
    ));
  };

  const restorePassRide = (passId: string) => {
    setPasses(passes.map(p =>
      p.id === passId
        ? { ...p, remainingRides: p.remainingRides + 1, status: 'active' as const }
        : p
    ));
  };

  const handleConfirmMarkPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markingPayment) return;

    if (markMethod === 'pass') {
      const pass = passes.find(p => p.id === markPassId);
      if (!pass || pass.remainingRides <= 0) return;
      usePassRide(pass.id);
      setPayments(payments.map(p =>
        p.id === markingPayment.id ? { ...p, paid: true, paymentMethod: 'pass' as const, passId: pass.id, passName: pass.typeName } : p
      ));
    } else {
      setPayments(payments.map(p =>
        p.id === markingPayment.id ? { ...p, paid: true, paymentMethod: markMethod, passId: '', passName: '' } : p
      ));
    }
    setMarkPaymentModal(false);
    setMarkingPayment(null);
  };

  const handleMarkUnpaid = (payment: RidePayment) => {
    if (payment.paymentMethod === 'pass' && payment.passId) {
      restorePassRide(payment.passId);
    }
    setPayments(payments.map(p =>
      p.id === payment.id ? { ...p, paid: false, paymentMethod: 'cash' as const, passId: '', passName: '' } : p
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      setPayments(payments.map(p => p.id === editingPayment.id ? { ...p, ...formData } : p));
    } else {
      setPayments([...payments, { id: Date.now().toString(), ...formData }]);
      if (formData.paid && formData.paymentMethod === 'pass' && formData.passId) {
        usePassRide(formData.passId);
      }
    }
    setShowAddModal(false);
  };

  const handleUsePass = (pass: Pass) => {
    if (pass.remainingRides <= 0) return;
    setFormData({
      ...formData,
      paymentMethod: 'pass',
      passId: pass.id,
      passName: pass.typeName,
    });
  };

  const getPaymentStats = () => {
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.paid).length;
    const unpaidPayments = payments.filter(p => !p.paid).length;
    const depositPaid = payments.filter(p => p.depositPaid).length;
    const totalRevenue = payments.filter(p => p.paid).reduce((sum, p) => sum + p.price, 0);
    const totalDeposits = payments.reduce((sum, p) => sum + p.depositAmount, 0);
    const passPayments = payments.filter(p => p.paymentMethod === 'pass').length;

    return {
      totalPayments,
      paidPayments,
      unpaidPayments,
      depositPaid,
      totalRevenue,
      totalDeposits,
      passPayments,
    };
  };

  const getFilteredPayments = () => {
    return payments.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterPayment === 'paid' && !p.paid) return false;
      if (filterPayment === 'unpaid' && p.paid) return false;
      if (filterPayment === 'pass' && p.paymentMethod !== 'pass') return false;
      const searchMatch = paymentSearchTerm === '' ||
        p.clientName.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        p.clientPhone.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        p.horseName.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        p.instructorName.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        p.serviceType.toLowerCase().includes(paymentSearchTerm.toLowerCase());
      return searchMatch;
    });
  };

  const stats = getPaymentStats();
  const filteredPayments = getFilteredPayments();

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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Płatności za jazdy</h1>
              <p className="text-marineBlue">Zarządzaj płatnościami za odbyte zajęcia</p>
            </div>
            <button
              onClick={handleAddPayment}
              className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Dodaj płatność</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Wszystkie</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalPayments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Opłacone</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.paidPayments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Nieopłacone</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.unpaidPayments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Karnetem</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.passPayments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Przychód</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue} zł</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-marineBlue">Zaliczki</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.totalDeposits} zł</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marineBlue" />
              <input
                type="text"
                placeholder="Szukaj płatności..."
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-marineBlue" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
              >
                <option value="all">Wszystkie płatności</option>
                <option value="paid">Opłacone</option>
                <option value="unpaid">Nieopłacone</option>
                <option value="pass">Karnetem</option>
              </select>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-iceBlue bg-iceBlue/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Data/Czas</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Klient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Koń</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Instruktor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Usługa</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Cena</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Zaliczka</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Płatność</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-marineBlue">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} onClick={() => setSelectedPayment(payment)} className="border-b border-iceBlue/50 hover:bg-iceBlue/20 transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="text-sm text-deepNavy">{payment.date}</div>
                        <div className="text-xs text-marineBlue">{payment.time} ({payment.duration} min)</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white text-sm font-medium">
                            {payment.clientName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-deepNavy">{payment.clientName}</p>
                            <p className="text-xs text-marineBlue">{payment.clientPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-deepNavy">{payment.horseName}</td>
                      <td className="py-3 px-4 text-sm text-deepNavy">{payment.instructorName}</td>
                      <td className="py-3 px-4 text-sm text-deepNavy">{payment.serviceType}</td>
                      <td className="py-3 px-4 text-sm text-deepNavy font-medium">{payment.price} zł</td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-deepNavy">{payment.depositAmount} zł</div>
                        {payment.depositPaid && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-deepNavy">
                            {payment.paymentMethod === 'pass' ? (
                              <span className="flex items-center gap-1">
                                <Ticket className="w-3 h-3" />
                                {payment.passName}
                              </span>
                            ) : (
                              paymentMethods.find(m => m.value === payment.paymentMethod)?.label
                            )}
                          </span>
                          {payment.paid ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          payment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'completed' ? 'Zakończone' :
                           payment.status === 'in_progress' ? 'W trakcie' :
                           payment.status === 'scheduled' ? 'Zaplanowane' : 'Odwołane'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {!payment.paid && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkPaid(payment); }}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                              title="Oznacz jako opłacone"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {payment.paid && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkUnpaid(payment); }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Oznacz jako nieopłacone"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPayment(payment); }}
                            className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.id); }}
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
      </div>

      {selectedPayment && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedPayment.clientName}</h2>
                  <p className='text-sm text-marineBlue'>{selectedPayment.clientPhone}</p>
                </div>
                <div className='flex items-center gap-1'>
                  <button onClick={() => { setEditingPayment(selectedPayment); setSelectedPayment(null); setShowAddModal(true); }} className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors'>
                    <Edit2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => { setPayments(payments.filter(p => p.id !== selectedPayment.id)); setSelectedPayment(null); }} className='p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors'>
                    <Trash2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => setSelectedPayment(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                    <X className='w-5 h-5 text-deepNavy' />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Data</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.date}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Godzina</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.time}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Czas trwania</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.duration} min</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Koń</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.horseName}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Instruktor</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.instructorName}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Usługa</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.serviceType}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Cena</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.price} zł</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Zaliczka</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.depositAmount} zł {selectedPayment.depositPaid ? '(wpłacona)' : '(nie)'}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Metoda</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedPayment.paymentMethod === 'pass' ? selectedPayment.passName : paymentMethods.find(m => m.value === selectedPayment.paymentMethod)?.label}</p>
                </div>
              </div>

              <div className='flex items-center gap-4 mb-4'>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedPayment.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedPayment.paid ? 'Opłacone' : 'Nieopłacone'}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedPayment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedPayment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  selectedPayment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedPayment.status === 'completed' ? 'Zakończone' : selectedPayment.status === 'in_progress' ? 'W trakcie' : selectedPayment.status === 'scheduled' ? 'Zaplanowane' : 'Odwołane'}
                </span>
              </div>

              {selectedPayment.notes && (
                <div className='bg-iceBlue/30 rounded-2xl p-4 mb-4'>
                  <p className='text-xs text-marineBlue mb-1'>Notatki</p>
                  <p className='text-sm text-deepNavy'>{selectedPayment.notes}</p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-2'>
                {!selectedPayment.paid ? (
                  <button onClick={() => { handleMarkPaid(selectedPayment); setSelectedPayment(null); }} className='px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2'>
                    <CheckCircle className='w-4 h-4' /> Oznacz opłacone
                  </button>
                ) : (
                  <button onClick={() => { handleMarkUnpaid(selectedPayment); setSelectedPayment(null); }} className='px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2'>
                    <XCircle className='w-4 h-4' /> Oznacz nieopłacone
                  </button>
                )}
                <button onClick={() => { setEditingPayment(selectedPayment); setSelectedPayment(null); setShowAddModal(true); }} className='px-4 py-3 rounded-xl bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue/20 transition-all text-sm flex items-center justify-center gap-2'>
                  <Edit2 className='w-4 h-4' /> Edytuj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {markPaymentModal && markingPayment && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='font-serif text-xl font-bold text-deepNavy'>Oznacz jako opłacone</h2>
                <button onClick={() => { setMarkPaymentModal(false); setMarkingPayment(null); }} className='p-2 hover:bg-iceBlue rounded-lg transition-colors'>
                  <X className='w-5 h-5 text-deepNavy' />
                </button>
              </div>

              <form onSubmit={handleConfirmMarkPaid} className='space-y-4'>
                <div>
                  <p className='text-sm text-marineBlue mb-3'>
                    Płatność za <span className='font-medium text-deepNavy'>{markingPayment.serviceType}</span> — <span className='font-medium text-deepNavy'>{markingPayment.price} zł</span>
                  </p>
                  <label className='block text-sm font-medium text-deepNavy mb-2'>Forma płatności</label>
                  <div className='grid grid-cols-2 gap-2'>
                    {paymentMethods.map((method) => (
                      <button
                        key={method.value}
                        type='button'
                        onClick={() => { setMarkMethod(method.value as RidePayment['paymentMethod']); setMarkPassId(''); }}
                        className={`px-3 py-3 rounded-xl border text-sm text-center transition-colors ${
                          markMethod === method.value
                            ? 'border-oceanBlue bg-oceanBlue/10 text-oceanBlue font-medium'
                            : 'border-iceBlue text-deepNavy hover:bg-iceBlue'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {markMethod === 'pass' && (
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Wybierz karnet klienta</label>
                    {(() => {
                      const clientPasses = passes.filter(p => p.clientName === markingPayment.clientName && p.remainingRides > 0);
                      if (clientPasses.length === 0) {
                        return (
                          <div className='p-4 rounded-xl bg-red-50 text-red-700 text-sm'>
                            Ten klient nie ma karnetów z dostępnymi zajęciami. Wybierz inną formę płatności.
                          </div>
                        );
                      }
                      return (
                        <div className='space-y-2'>
                          {clientPasses.map((pass) => (
                            <button
                              key={pass.id}
                              type='button'
                              onClick={() => setMarkPassId(pass.id)}
                              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                                markPassId === pass.id
                                  ? 'border-oceanBlue bg-oceanBlue/10'
                                  : 'border-iceBlue hover:bg-iceBlue'
                              }`}
                            >
                              <div className='flex items-center justify-between'>
                                <div>
                                  <p className='text-sm font-medium text-deepNavy'>{pass.typeName}</p>
                                  <p className='text-xs text-marineBlue'>Pozostałe: {pass.remainingRides}</p>
                                </div>
                                {markPassId === pass.id && (
                                  <CheckCircle className='w-5 h-5 text-green-600' />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className='flex gap-2 pt-4'>
                  <button
                    type='button'
                    onClick={() => { setMarkPaymentModal(false); setMarkingPayment(null); }}
                    className='flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm'
                  >
                    Anuluj
                  </button>
                  <button
                    type='submit'
                    disabled={markMethod === 'pass' && !markPassId}
                    className='flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Potwierdź płatność
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingPayment ? 'Edytuj płatność' : 'Dodaj płatność'}
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa klienta</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Telefon klienta</label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <input
                    type="text"
                    value={formData.horseName}
                    onChange={(e) => setFormData({ ...formData, horseName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Instruktor</label>
                  <input
                    type="text"
                    value={formData.instructorName}
                    onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ usługi</label>
                  <input
                    type="text"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Godzina</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Czas trwania (min)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="15"
                      step="15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Cena (zł)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Zaliczka (zł)</label>
                    <input
                      type="number"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData({ ...formData, depositAmount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="depositPaid"
                      checked={formData.depositPaid}
                      onChange={(e) => setFormData({ ...formData, depositPaid: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <label htmlFor="depositPaid" className="text-sm text-deepNavy">Zaliczka wpłacona</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Metoda płatności</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as RidePayment['paymentMethod'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                {formData.paymentMethod === 'pass' && (
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Wybierz karnet</label>
                    {(() => {
                      const clientPasses = passes.filter(p => p.clientName === formData.clientName && p.remainingRides > 0);
                      const exhaustedPasses = passes.filter(p => p.clientName === formData.clientName && p.remainingRides <= 0);
                      if (clientPasses.length === 0 && exhaustedPasses.length === 0 && formData.clientName !== '') {
                        return (
                          <div className='p-4 rounded-xl bg-red-50 text-red-700 text-sm'>
                            Ten klient nie ma karnetów z dostępnymi zajęciami.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {clientPasses.map((pass) => (
                            <button
                              key={pass.id}
                              type="button"
                              onClick={() => handleUsePass(pass)}
                              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                                formData.passId === pass.id
                                  ? 'border-oceanBlue bg-oceanBlue/10'
                                  : 'border-iceBlue hover:bg-iceBlue'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-deepNavy">{pass.typeName}</p>
                                  <p className="text-xs text-marineBlue">Pozostałe: {pass.remainingRides}</p>
                                </div>
                                {formData.passId === pass.id && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                            </button>
                          ))}
                          {exhaustedPasses.length > 0 && (
                            <div className='pt-2 border-t border-iceBlue'>
                              <p className='text-xs text-marineBlue mb-2'>Wyczerpane karnety</p>
                              {exhaustedPasses.map((pass) => (
                                <div key={pass.id} className='w-full p-3 rounded-lg border border-iceBlue bg-iceBlue/20 opacity-60 cursor-not-allowed'>
                                  <div className='flex items-center justify-between'>
                                    <div>
                                      <p className='text-sm font-medium text-deepNavy'>{pass.typeName}</p>
                                      <p className='text-xs text-red-600'>Brak dostępnych zajęć</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="paid"
                    checked={formData.paid}
                    onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                    className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                  />
                  <label htmlFor="paid" className="text-sm text-deepNavy">Opłacone w całości</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RidePayment['status'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="scheduled">Zaplanowane</option>
                    <option value="in_progress">W trakcie</option>
                    <option value="completed">Zakończone</option>
                    <option value="cancelled">Odwołane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                    placeholder="Opcjonalne notatki..."
                  />
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
                    {editingPayment ? 'Zapisz zmiany' : 'Dodaj'}
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
