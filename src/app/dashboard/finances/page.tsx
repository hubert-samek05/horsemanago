'use client';

export const dynamic = 'force-static';
import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, DollarSign, Calendar, TrendingUp, TrendingDown, CreditCard, Filter, Ticket, PieChart, BarChart3, Download, Printer } from 'lucide-react';
import api from '@/lib/api';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  clientId?: string;
  clientName?: string;
  horseId?: string;
  horseName?: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  invoiceNumber?: string;
  notes: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  horseId?: string;
  horseName?: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  notes: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function FinancesPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices' | 'passes' | 'ride-payments'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  const [transactionFormData, setTransactionFormData] = useState({
    type: 'income' as Transaction['type'],
    category: '',
    amount: 0,
    date: '',
    description: '',
    clientId: '',
    clientName: '',
    horseId: '',
    horseName: '',
    status: 'completed' as Transaction['status'],
    paymentMethod: 'card' as Transaction['paymentMethod'],
    invoiceNumber: '',
    notes: '',
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    invoiceNumber: '',
    clientId: '',
    clientName: '',
    horseId: '',
    horseName: '',
    issueDate: '',
    dueDate: '',
    amount: 0,
    status: 'draft' as Invoice['status'],
    items: [] as InvoiceItem[],
    notes: '',
  });

  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: 0 });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [transactions, setTransactions] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [summaryRes, paymentsRes, invoicesRes, clientsRes, horsesRes] = await Promise.all([
          api.get(`/finances/summary?stableId=${activeStableId}`),
          api.get(`/finances/payments?stableId=${activeStableId}`),
          api.get(`/finances/invoices?stableId=${activeStableId}`),
          api.get(`/clients?stableId=${activeStableId}`),
          api.get(`/horses?stableId=${activeStableId}`)
        ]);
        setFinancialSummary(summaryRes.data);
        setTransactions(paymentsRes.data || []);
        setInvoices(invoicesRes.data || []);
        setClients(clientsRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setTransactions([]);
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
          <p className="text-marineBlue">Ładowanie finansów...</p>
        </div>
      </div>
    );
  }

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const transactionCategories = [
    { value: 'Lekcje jazdy', label: 'Lekcje jazdy' },
    { value: 'Pensjonat', label: 'Pensjonat' },
    { value: 'Wynajem boksu', label: 'Wynajem boksu' },
    { value: 'Zawody', label: 'Zawody' },
    { value: 'Karma', label: 'Karma' },
    { value: 'Weterynarz', label: 'Weterynarz' },
    { value: 'Kowal', label: 'Kowal' },
    { value: 'Sprzęt', label: 'Sprzęt' },
    { value: 'Wynagrodzenia', label: 'Wynagrodzenia' },
    { value: 'Inne', label: 'Inne' },
  ];

  const transactionStatuses = [
    { value: 'pending', label: 'Oczekujące', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Zakończone', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Anulowane', color: 'bg-red-100 text-red-800' },
  ];

  const invoiceStatuses = [
    { value: 'draft', label: 'Projekt', color: 'bg-gray-100 text-gray-800' },
    { value: 'sent', label: 'Wysłana', color: 'bg-blue-100 text-blue-800' },
    { value: 'paid', label: 'Opłacona', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Zaległa', color: 'bg-red-100 text-red-800' },
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Gotówka' },
    { value: 'card', label: 'Karta' },
    { value: 'transfer', label: 'Przelew' },
    { value: 'other', label: 'Inne' },
  ];

  const handleAddTransaction = () => {
    setTransactionFormData({
      type: 'income',
      category: '',
      amount: 0,
      date: '',
      description: '',
      clientId: '',
      clientName: '',
      horseId: '',
      horseName: '',
      status: 'completed',
      paymentMethod: 'card',
      invoiceNumber: '',
      notes: '',
    });
    setEditingTransaction(null);
    setShowAddTransactionModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      clientId: transaction.clientId || '',
      clientName: transaction.clientName || '',
      horseId: transaction.horseId || '',
      horseName: transaction.horseName || '',
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      invoiceNumber: transaction.invoiceNumber || '',
      notes: transaction.notes,
    });
    setEditingTransaction(transaction);
    setShowAddTransactionModal(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.delete(`/finances/payments/${id}`);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete transaction error:', error);
      alert('Nie udało się usunąć transakcji');
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        const { data } = await api.put(`/finances/payments/${editingTransaction.id}`, transactionFormData);
        setTransactions(transactions.map(t => t.id === editingTransaction.id ? data : t));
      } else {
        const { data } = await api.post('/finances/payments', { ...transactionFormData, stableId: activeStableId });
        setTransactions([...transactions, data]);
      }
      setShowAddTransactionModal(false);
    } catch (error) {
      console.error('Save transaction error:', error);
      alert('Nie udało się zapisać transakcji');
    }
  };

  const handleAddInvoice = () => {
    setInvoiceFormData({
      invoiceNumber: '',
      clientId: '',
      clientName: '',
      horseId: '',
      horseName: '',
      issueDate: '',
      dueDate: '',
      amount: 0,
      status: 'draft',
      items: [],
      notes: '',
    });
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setEditingInvoice(null);
    setShowAddInvoiceModal(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceFormData({
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      horseId: invoice.horseId || '',
      horseName: invoice.horseName || '',
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: invoice.amount,
      status: invoice.status,
      items: invoice.items,
      notes: invoice.notes,
    });
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setEditingInvoice(invoice);
    setShowAddInvoiceModal(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.delete(`/finances/invoices/${id}`);
      setInvoices(invoices.filter(i => i.id !== id));
    } catch (error) {
      console.error('Delete invoice error:', error);
      alert('Nie udało się usunąć faktury');
    }
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        const { data } = await api.put(`/finances/invoices/${editingInvoice.id}`, invoiceFormData);
        setInvoices(invoices.map(i => i.id === editingInvoice.id ? data : i));
      } else {
        const { data } = await api.post('/finances/invoices', { ...invoiceFormData, stableId: activeStableId });
        setInvoices([...invoices, data]);
      }
      setShowAddInvoiceModal(false);
    } catch (error) {
      console.error('Save invoice error:', error);
      alert('Nie udało się zapisać faktury');
    }
  };

  const handleAddInvoiceItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.unitPrice >= 0) {
      const item: InvoiceItem = {
        id: Date.now().toString(),
        description: newItem.description,
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        total: newItem.quantity * newItem.unitPrice,
      };
      setInvoiceFormData({
        ...invoiceFormData,
        items: [...invoiceFormData.items, item],
        amount: invoiceFormData.amount + item.total,
      });
      setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    }
  };

  const handleDeleteInvoiceItem = (itemId: string) => {
    const item = invoiceFormData.items.find(i => i.id === itemId);
    setInvoiceFormData({
      ...invoiceFormData,
      items: invoiceFormData.items.filter(i => i.id !== itemId),
      amount: invoiceFormData.amount - (item?.total || 0),
    });
  };

  const getFinanceStats = () => {
    const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const pendingPayments = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const totalInvoices = invoices.length;
    const totalRidePayments = transactions.filter(t => t.category === 'Lekcje jazdy' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalPassSales = transactions.filter(t => t.category === 'Karnety' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalBoarding = transactions.filter(t => t.category === 'Pensjonat' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      pendingPayments,
      overdueInvoices,
      paidInvoices,
      totalInvoices,
      totalRidePayments,
      totalPassSales,
      totalBoarding,
    };
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  };

  const stats = getFinanceStats();
  const filteredTransactions = getFilteredTransactions();

  const formatCurrency = (n: number) => `${n.toLocaleString('pl-PL')} zł`;

  const monthlyData = useMemo(() => [
    { label: 'Sty', income: 8200, expense: 5100 },
    { label: 'Lut', income: 9400, expense: 4800 },
    { label: 'Mar', income: 11200, expense: 6200 },
    { label: 'Kwi', income: 10500, expense: 5500 },
    { label: 'Maj', income: 12100, expense: 6100 },
    { label: 'Cze', income: 13500, expense: 5900 },
  ], []);

  const incomeCategories = useMemo(() => [
    { label: 'Lekcje', value: stats.totalRidePayments || 0, color: '#0ea5e9' },
    { label: 'Pensjonat', value: stats.totalBoarding || 0, color: '#22c55e' },
    { label: 'Karnety', value: stats.totalPassSales || 0, color: '#8b5cf6' },
    { label: 'Inne', value: Math.max(0, stats.totalIncome - (stats.totalRidePayments + stats.totalBoarding + stats.totalPassSales)), color: '#f59e0b' },
  ], [stats]);

  const expenseCategories = [
    { label: 'Karma', value: 1200, color: '#ef4444' },
    { label: 'Weterynarz', value: 800, color: '#f97316' },
    { label: 'Kowal', value: 600, color: '#eab308' },
    { label: 'Sprzęt', value: 400, color: '#94a3b8' },
  ];

  const polar = (cx: number, cy: number, r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const PieChartSVG = ({ data, inner = 0, size = 160 }: { data: { label: string; value: number; color: string }[]; inner?: number; size?: number }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className='text-sm text-marineBlue'>Brak danych</div>;
    let acc = -Math.PI / 2;
    const r = size / 2 - 4;
    const c = size / 2;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const slice = (d.value / total) * Math.PI * 2;
          const start = polar(c, c, r, acc);
          const end = polar(c, c, r, acc + slice);
          const innerStart = polar(c, c, r * inner, acc);
          const innerEnd = polar(c, c, r * inner, acc + slice);
          const large = slice > Math.PI ? 1 : 0;
          const path = `
            M ${start.x} ${start.y}
            A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}
            L ${inner ? innerEnd.x : c} ${inner ? innerEnd.y : c}
            ${inner ? `A ${r * inner} ${r * inner} 0 ${large} 0 ${innerStart.x} ${innerStart.y}` : ''}
            Z
          `;
          acc += slice;
          return <path key={i} d={path} fill={d.color} stroke='white' strokeWidth={1} />;
        })}
      </svg>
    );
  };

  const BarChartSVG = ({ data, max }: { data: { label: string; value: number; color: string }[]; max: number }) => {
    const gap = 12;
    const h = 160;
    const totalGap = (data.length + 1) * gap;
    const barW = (320 - totalGap) / data.length;
    return (
      <svg width='100%' height={h} viewBox={`0 0 320 ${h}`} preserveAspectRatio='none'>
        {data.map((d, i) => {
          const barH = (d.value / max) * (h - 20);
          const x = gap + i * (barW + gap);
          const y = h - barH - 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={d.color} />
              <text x={x + barW / 2} y={h - 2} textAnchor='middle' fontSize='10' fill='#64748b'>{d.label}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor='middle' fontSize='10' fill={d.color}>{d.value}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const LineChartSVG = ({ data, max }: { data: { label: string; income: number; expense: number }[]; max: number }) => {
    const w = 640;
    const h = 200;
    const pad = 24;
    const step = (w - pad * 2) / (data.length - 1);
    const incomePoints = data.map((d, i) => `${pad + i * step},${h - pad - (d.income / max) * (h - pad * 2)}`).join(' ');
    const expensePoints = data.map((d, i) => `${pad + i * step},${h - pad - (d.expense / max) * (h - pad * 2)}`).join(' ');
    return (
      <svg width='100%' height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline fill='none' stroke='#22c55e' strokeWidth={3} points={incomePoints} />
        <polyline fill='none' stroke='#ef4444' strokeWidth={3} points={expensePoints} />
        {data.map((d, i) => {
          const x = pad + i * step;
          const yi = h - pad - (d.income / max) * (h - pad * 2);
          const ye = h - pad - (d.expense / max) * (h - pad * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={yi} r={3} fill='#22c55e' />
              <circle cx={x} cy={ye} r={3} fill='#ef4444' />
              <text x={x} y={h - 4} textAnchor='middle' fontSize='10' fill='#64748b'>{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const Legend = ({ data }: { data: { label: string; value: number; color: string }[] }) => (
    <div className='space-y-2'>
      {data.map((d) => (
        <div key={d.label} className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2'>
            <span className='w-3 h-3 rounded-full' style={{ backgroundColor: d.color }} />
            <span className='text-deepNavy'>{d.label}</span>
          </div>
          <span className='font-medium text-deepNavy'>{formatCurrency(d.value)}</span>
        </div>
      ))}
    </div>
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
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Finanse</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Finanse</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj finansami i płatnościami.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4 flex items-start justify-between'>
              <div>
                <p className='text-sm text-marineBlue mb-1'>Przychody</p>
                <p className='text-2xl font-bold text-green-600'>{formatCurrency(stats.totalIncome)}</p>
                <p className='text-xs text-marineBlue mt-1'>+12% vs miesiąc temu</p>
              </div>
              <div className='p-3 rounded-xl bg-green-500'>
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
            </div>
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4 flex items-start justify-between'>
              <div>
                <p className='text-sm text-marineBlue mb-1'>Wydatki</p>
                <p className='text-2xl font-bold text-red-600'>{formatCurrency(stats.totalExpenses)}</p>
                <p className='text-xs text-marineBlue mt-1'>-5% vs miesiąc temu</p>
              </div>
              <div className='p-3 rounded-xl bg-red-500'>
                <TrendingDown className='w-6 h-6 text-white' />
              </div>
            </div>
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4 flex items-start justify-between'>
              <div>
                <p className='text-sm text-marineBlue mb-1'>Netto</p>
                <p className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netIncome)}
                </p>
                <p className='text-xs text-marineBlue mt-1'>Marża</p>
              </div>
              <div className='p-3 rounded-xl bg-oceanBlue'>
                <DollarSign className='w-6 h-6 text-white' />
              </div>
            </div>
            <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4 flex items-start justify-between'>
              <div>
                <p className='text-sm text-marineBlue mb-1'>Oczekujące / Zaległe</p>
                <p className='text-2xl font-bold text-yellow-600'>{formatCurrency(stats.pendingPayments)}</p>
                <p className='text-xs text-marineBlue mt-1'>{stats.overdueInvoices} zaległych faktur</p>
              </div>
              <div className='p-3 rounded-xl bg-yellow-500'>
                <Calendar className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Przegląd
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Transakcje
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'invoices'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Faktury
            </button>
            <button
              onClick={() => setActiveTab('passes')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'passes'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Karnety
            </button>
            <button
              onClick={() => setActiveTab('ride-payments')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'ride-payments'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Płatności za jazdy
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2 bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Przepływ gotówki (przychody vs wydatki)</h3>
                  <LineChartSVG data={monthlyData} max={15000} />
                </div>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Przychody według kategorii</h3>
                  <div className='flex justify-center mb-4'>
                    <PieChartSVG data={incomeCategories} inner={0.55} size={180} />
                  </div>
                  <Legend data={incomeCategories} />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Wydatki według kategorii</h3>
                  <BarChartSVG data={expenseCategories} max={1400} />
                </div>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Szybkie akcje</h3>
                  <div className='space-y-3'>
                    <button onClick={() => setActiveTab('transactions')} className='w-full p-3 rounded-xl border border-iceBlue hover:bg-iceBlue transition-colors flex items-center gap-3 text-left'>
                      <DollarSign className='w-5 h-5 text-oceanBlue' />
                      <div>
                        <p className='text-sm font-medium text-deepNavy'>Dodaj transakcję</p>
                        <p className='text-xs text-marineBlue'>Przychód lub wydatek</p>
                      </div>
                    </button>
                    <button onClick={() => setActiveTab('invoices')} className='w-full p-3 rounded-xl border border-iceBlue hover:bg-iceBlue transition-colors flex items-center gap-3 text-left'>
                      <CreditCard className='w-5 h-5 text-oceanBlue' />
                      <div>
                        <p className='text-sm font-medium text-deepNavy'>Wystaw fakturę</p>
                        <p className='text-xs text-marineBlue'>Dla klienta</p>
                      </div>
                    </button>
                    <button onClick={() => setActiveTab('ride-payments')} className='w-full p-3 rounded-xl border border-iceBlue hover:bg-iceBlue transition-colors flex items-center gap-3 text-left'>
                      <Calendar className='w-5 h-5 text-oceanBlue' />
                      <div>
                        <p className='text-sm font-medium text-deepNavy'>Płatności za jazdy</p>
                        <p className='text-xs text-marineBlue'>Oznacz jako opłacone</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy'>Ostatnie transakcje</h3>
                  <button onClick={() => setActiveTab('transactions')} className='text-sm text-oceanBlue hover:text-marineBlue font-medium'>
                    Zobacz wszystkie
                  </button>
                </div>
                <div className='space-y-3'>
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className='flex items-center justify-between p-3 rounded-lg hover:bg-iceBlue/20 transition-colors'>
                      <div className='flex items-center gap-3'>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className='w-5 h-5 text-green-600' />
                          ) : (
                            <TrendingDown className='w-5 h-5 text-red-600' />
                          )}
                        </div>
                        <div>
                          <p className='text-sm font-medium text-deepNavy'>{transaction.description}</p>
                          <p className='text-xs text-marineBlue'>{transaction.date} • {transaction.category}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className={`text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} PLN
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${transactionStatuses.find(s => s.value === transaction.status)?.color}`}>
                          {transactionStatuses.find(s => s.value === transaction.status)?.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-marineBlue" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      <option value="all">Wszystkie typy</option>
                      <option value="income">Przychody</option>
                      <option value="expense">Wydatki</option>
                    </select>
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="all">Wszystkie kategorie</option>
                    {transactionCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddTransaction}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj transakcję</span>
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-iceBlue/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Data</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Typ</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden sm:table-cell">Kategoria</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Opis</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell">Klient</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell">Koń</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Kwota</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden xl:table-cell">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-iceBlue">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-iceBlue/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-deepNavy">{transaction.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {transaction.type === 'income' ? 'Przychód' : 'Wydatek'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden sm:table-cell">{transaction.category}</td>
                          <td className="px-6 py-4 text-sm text-deepNavy">{transaction.description}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden md:table-cell">{transaction.clientName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden lg:table-cell">{transaction.horseName || '-'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-deepNavy">
                            {transaction.amount.toFixed(2)} PLN
                          </td>
                          <td className="px-6 py-4 hidden xl:table-cell">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${transactionStatuses.find(s => s.value === transaction.status)?.color}`}>
                              {transactionStatuses.find(s => s.value === transaction.status)?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
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

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddInvoice}
                  className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Dodaj fakturę</span>
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-iceBlue/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Numer</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden sm:table-cell">Klient</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Data wystawienia</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell">Termin płatności</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell">Kwota</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-iceBlue">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-iceBlue/20 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-deepNavy">{invoice.invoiceNumber}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden sm:table-cell">{invoice.clientName}</td>
                          <td className="px-6 py-4 text-sm text-deepNavy">{invoice.issueDate}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden md:table-cell">{invoice.dueDate}</td>
                          <td className="px-6 py-4 text-sm font-bold text-deepNavy hidden lg:table-cell">
                            {invoice.amount.toFixed(2)} PLN
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoiceStatuses.find(s => s.value === invoice.status)?.color}`}>
                              {invoiceStatuses.find(s => s.value === invoice.status)?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditInvoice(invoice)}
                                className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id)}
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

          {/* Passes Tab */}
          {activeTab === 'passes' && (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-8 text-center">
              <Ticket className="w-16 h-16 text-oceanBlue mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Zarządzaj karnetami</h3>
              <p className="text-marineBlue mb-6">Przejdź do dedykowanej strony karnetów, aby zarządzać sprzedażą i śledzeniem przejazdów.</p>
              <button
                onClick={() => router.push('/dashboard/passes')}
                className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                Przejdź do karnetów
              </button>
            </div>
          )}

          {/* Ride Payments Tab */}
          {activeTab === 'ride-payments' && (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-8 text-center">
              <Calendar className="w-16 h-16 text-oceanBlue mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Płatności za jazdy</h3>
              <p className="text-marineBlue mb-6">Przejdź do dedykowanej strony płatności za jazdy, aby oznaczać zajęcia jako opłacone i zarządzać karnetami.</p>
              <button
                onClick={() => router.push('/dashboard/ride-payments')}
                className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Przejdź do płatności
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingTransaction ? 'Edytuj transakcję' : 'Dodaj transakcję'}
                </h2>
                <button
                  onClick={() => setShowAddTransactionModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                  <select
                    value={transactionFormData.type}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, type: e.target.value as Transaction['type'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="income">Przychód</option>
                    <option value="expense">Wydatek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Kategoria</label>
                  <select
                    value={transactionFormData.category}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    {transactionCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Kwota</label>
                  <input
                    type="number"
                    value={transactionFormData.amount}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data</label>
                  <input
                    type="date"
                    value={transactionFormData.date}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={transactionFormData.description}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Klient</label>
                  <select
                    value={transactionFormData.clientId}
                    onChange={(e) => {
                      const client = clients.find((c: any) => c.id === e.target.value);
                      setTransactionFormData({ ...transactionFormData, clientId: e.target.value, clientName: client ? `${client.user.firstName} ${client.user.lastName}` : '' });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Brak</option>
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>{client.user.firstName} {client.user.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    value={transactionFormData.horseId}
                    onChange={(e) => {
                      const horse = horses.find((h: any) => h.id === e.target.value);
                      setTransactionFormData({ ...transactionFormData, horseId: e.target.value, horseName: horse ? horse.name : '' });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Brak</option>
                    {horses.map((horse: any) => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={transactionFormData.status}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, status: e.target.value as Transaction['status'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {transactionStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Metoda płatności</label>
                    <select
                      value={transactionFormData.paymentMethod}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, paymentMethod: e.target.value as Transaction['paymentMethod'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Numer faktury</label>
                  <input
                    type="text"
                    value={transactionFormData.invoiceNumber}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={transactionFormData.notes}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddTransactionModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingTransaction ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingInvoice ? 'Edytuj fakturę' : 'Dodaj fakturę'}
                </h2>
                <button
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmitInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Numer faktury</label>
                  <input
                    type="text"
                    value={invoiceFormData.invoiceNumber}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Klient</label>
                  <select
                    value={invoiceFormData.clientId}
                    onChange={(e) => {
                      const client = clients.find((c: any) => c.id === e.target.value);
                      setInvoiceFormData({ ...invoiceFormData, clientId: e.target.value, clientName: client ? `${client.user.firstName} ${client.user.lastName}` : '' });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  >
                    <option value="">Wybierz klienta</option>
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>{client.user.firstName} {client.user.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Koń</label>
                  <select
                    value={invoiceFormData.horseId}
                    onChange={(e) => {
                      const horse = horses.find((h: any) => h.id === e.target.value);
                      setInvoiceFormData({ ...invoiceFormData, horseId: e.target.value, horseName: horse ? horse.name : '' });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="">Brak</option>
                    {horses.map((horse: any) => (
                      <option key={horse.id} value={horse.id}>{horse.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data wystawienia</label>
                    <input
                      type="date"
                      value={invoiceFormData.issueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, issueDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Termin płatności</label>
                    <input
                      type="date"
                      value={invoiceFormData.dueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={invoiceFormData.status}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, status: e.target.value as Invoice['status'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {invoiceStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Pozycje</label>
                  <div className="space-y-2 mb-2">
                    {invoiceFormData.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-iceBlue/20 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-deepNavy">{item.description}</p>
                          <p className="text-xs text-marineBlue">{item.quantity} x {item.unitPrice.toFixed(2)} PLN = {item.total.toFixed(2)} PLN</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoiceItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Opis"
                      className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      placeholder="Ilość"
                      className="w-20 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <input
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Cena"
                      className="w-24 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddInvoiceItem}
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-deepNavy">Suma:</span>
                  <span className="text-lg font-bold text-deepNavy">{invoiceFormData.amount.toFixed(2)} PLN</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={invoiceFormData.notes}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddInvoiceModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white hover:shadow-lg transition-all text-sm"
                  >
                    {editingInvoice ? 'Zapisz zmiany' : 'Dodaj'}
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
