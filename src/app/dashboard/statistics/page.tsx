'use client';

export const dynamic = 'force-dynamic';
import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, BarChart3, TrendingUp, Activity, DollarSign, Users, PawPrint, Calendar, PieChart, Layers, ArrowUpRight, ArrowDownRight, Filter, Download, CreditCard, Ticket } from 'lucide-react';
import api from '@/lib/api';

interface ChartPoint {
  label: string;
  value: number;
  color: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'clients' | 'services' | 'horses'>('overview');
  const [loading, setLoading] = useState(false);

  const [monthlyRevenue, setMonthlyRevenue] = useState<ChartPoint[]>([]);
  const [serviceStats, setServiceStats] = useState<ChartPoint[]>([]);
  const [clientStats, setClientStats] = useState<ChartPoint[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<ChartPoint[]>([]);
  const [horseWorkloads, setHorseWorkloads] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; rides: number; revenue: number }[]>([]);
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
  const [unpaidInvoicesAmount, setUnpaidInvoicesAmount] = useState(0);
  const [activePassesCount, setActivePassesCount] = useState(0);
  const [activePassesRevenue, setActivePassesRevenue] = useState(0);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadStatistics = async () => {
      try {
        const { data } = await api.get(`/statistics?stableId=${activeStableId}&months=6`);
        setMonthlyRevenue(data.monthlyRevenue || []);
        setServiceStats(data.serviceStats || []);
        setClientStats(data.clientStats || []);
        setPaymentMethodStats(data.paymentMethodStats || []);
        setHorseWorkloads(data.horseWorkloads || []);
        setTopClients(data.topClients || []);
        setUnpaidInvoicesCount(data.unpaidInvoicesCount || 0);
        setUnpaidInvoicesAmount(data.unpaidInvoicesAmount || 0);
        setActivePassesCount(data.activePassesCount || 0);
        setActivePassesRevenue(data.activePassesRevenue || 0);
      } catch (error) {
        console.error('Load statistics error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStatistics();
  }, [activeStableId]);

  const revenueTotal = useMemo(() => monthlyRevenue.reduce((s, d) => s + d.value, 0), [monthlyRevenue]);
  const ridesTotal = useMemo(() => serviceStats.reduce((s, d) => s + d.value, 0), [serviceStats]);
  const clientsTotal = useMemo(() => clientStats.reduce((s, d) => s + d.value, 0), [clientStats]);

  const formatCurrency = (n: number) => `${n.toLocaleString('pl-PL')} zł`;

  const polar = (cx: number, cy: number, r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const PieChart = ({ data, inner = 0, size = 160 }: { data: ChartPoint[]; inner?: number; size?: number }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;
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

  const BarChart = ({ data, max }: { data: ChartPoint[]; max: number }) => {
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

  const LineChart = ({ data, max }: { data: ChartPoint[]; max: number }) => {
    const w = 640;
    const h = 200;
    const pad = 24;
    const step = (w - pad * 2) / (data.length - 1);
    const points = data.map((d, i) => {
      const x = pad + i * step;
      const y = h - pad - (d.value / max) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width='100%' height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline fill='none' stroke='#0ea5e9' strokeWidth={3} points={points} />
        {data.map((d, i) => {
          const x = pad + i * step;
          const y = h - pad - (d.value / max) * (h - pad * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill='#0ea5e9' />
              <text x={x} y={h - 4} textAnchor='middle' fontSize='10' fill='#64748b'>{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const tabs = [
    { key: 'overview', label: 'Podsumowanie', icon: BarChart3 },
    { key: 'finance', label: 'Finanse', icon: DollarSign },
    { key: 'clients', label: 'Klienci', icon: Users },
    { key: 'services', label: 'Usługi', icon: Layers },
    { key: 'horses', label: 'Konie', icon: PawPrint },
  ] as const;

  const StatCard = ({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: any; color: string }) => (
    <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4 flex items-start justify-between'>
      <div>
        <p className='text-sm text-marineBlue mb-1'>{title}</p>
        <p className='text-2xl font-bold text-deepNavy'>{value}</p>
        {sub && <p className='text-xs text-marineBlue mt-1'>{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className='w-6 h-6 text-white' />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <p className="text-marineBlue">Ładowanie statystyk...</p>
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
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-1">Statystyki</h1>
              <p className="text-marineBlue">Kompletny przegląd biznesu, finansów i obciążenia koni</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-iceBlue px-3 py-2 shadow-sm">
                <Calendar className="w-4 h-4 text-marineBlue" />
                <select className="bg-transparent text-sm text-deepNavy focus:outline-none">
                  <option>Ostatnie 6 miesięcy</option>
                  <option>Bieżący rok</option>
                  <option>Ostatni miesiąc</option>
                </select>
              </div>
              <button className="px-4 py-2 rounded-xl bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue/20 transition-colors text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Eksport</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-1 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-lg'
                      : 'bg-white text-deepNavy border border-iceBlue hover:bg-iceBlue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title='Przychód' value={formatCurrency(revenueTotal)} sub={`${monthlyRevenue.length} miesięcy`} icon={DollarSign} color='bg-green-500' />
                <StatCard title='Jazdy' value={ridesTotal.toString()} sub={`${serviceStats.length} typów usług`} icon={Activity} color='bg-oceanBlue' />
                <StatCard title='Klienci' value={clientsTotal.toString()} sub={`+${clientStats.find(c => c.label === 'Nowi')?.value ?? 0} nowych`} icon={Users} color='bg-purple-500' />
                <StatCard title='Średnie wykorzystanie koni' value={`${horseWorkloads.length > 0 ? Math.round(horseWorkloads.reduce((s, h) => s + h.utilizationRate, 0) / horseWorkloads.length) : 0}%`} sub={`${horseWorkloads.length} koni`} icon={PawPrint} color='bg-orange-500' />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className='lg:col-span-2 bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Przychód w czasie</h3>
                  <LineChart data={monthlyRevenue} max={20000} />
                </div>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Struktura usług</h3>
                  <div className='flex justify-center mb-4'>
                    <PieChart data={serviceStats} inner={0.55} size={180} />
                  </div>
                  <div className='space-y-2'>
                    {serviceStats.map((s) => (
                      <div key={s.label} className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <span className='w-3 h-3 rounded-full' style={{ backgroundColor: s.color }} />
                          <span className='text-deepNavy'>{s.label}</span>
                        </div>
                        <span className='font-medium text-deepNavy'>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Metody płatności</h3>
                  <div className='flex items-center gap-6'>
                    <PieChart data={paymentMethodStats} size={140} />
                    <div className='flex-1 space-y-2'>
                      {paymentMethodStats.map((s) => (
                        <div key={s.label} className='flex items-center justify-between text-sm'>
                          <div className='flex items-center gap-2'>
                            <span className='w-3 h-3 rounded-full' style={{ backgroundColor: s.color }} />
                            <span className='text-deepNavy'>{s.label}</span>
                          </div>
                          <span className='font-medium text-deepNavy'>{s.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Najpopularniejsze usługi</h3>
                  <BarChart data={serviceStats} max={500} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title='Przychód całkowity' value={formatCurrency(revenueTotal)} icon={DollarSign} color='bg-green-500' />
                <StatCard title='Średni przychód/mies' value={formatCurrency(Math.round(revenueTotal / (monthlyRevenue.length || 1)))} icon={TrendingUp} color='bg-oceanBlue' />
                <StatCard title='Nieopłacone faktury' value={unpaidInvoicesCount.toString()} sub={formatCurrency(unpaidInvoicesAmount)} icon={CreditCard} color='bg-red-500' />
                <StatCard title='Aktywne karnety' value={activePassesCount.toString()} sub={formatCurrency(activePassesRevenue)} icon={Ticket} color='bg-purple-500' />
              </div>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Miesięczny przychód</h3>
                  <BarChart data={monthlyRevenue} max={20000} />
                </div>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Rozkład metod płatności</h3>
                  <div className='flex justify-center'>
                    <PieChart data={paymentMethodStats} inner={0.55} size={200} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title='Wszyscy klienci' value={clientsTotal.toString()} icon={Users} color='bg-oceanBlue' />
                <StatCard title='Nowi w tym miesiącu' value={(clientStats.find(c => c.label === 'Nowi')?.value ?? 0).toString()} icon={ArrowUpRight} color='bg-green-500' />
                <StatCard title='Nieaktywni' value={(clientStats.find(c => c.label === 'Nieaktywni')?.value ?? 0).toString()} icon={ArrowDownRight} color='bg-red-500' />
              </div>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Status klientów</h3>
                  <div className='flex justify-center mb-4'>
                    <PieChart data={clientStats} inner={0.5} size={180} />
                  </div>
                  <div className='space-y-2'>
                    {clientStats.map((s) => (
                      <div key={s.label} className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <span className='w-3 h-3 rounded-full' style={{ backgroundColor: s.color }} />
                          <span className='text-deepNavy'>{s.label}</span>
                        </div>
                        <span className='font-medium text-deepNavy'>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='lg:col-span-2 bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Top klienci</h3>
                  <div className='space-y-3'>
                    {topClients.map((c, i) => (
                      <div key={i} className='flex items-center justify-between p-3 rounded-xl bg-iceBlue/30'>
                        <div className='flex items-center gap-3'>
                          <span className='w-6 h-6 rounded-full bg-oceanBlue text-white text-xs flex items-center justify-center'>{i + 1}</span>
                          <span className='text-sm font-medium text-deepNavy'>{c.name}</span>
                        </div>
                        <div className='flex items-center gap-4 text-sm'>
                          <span className='text-marineBlue'>{c.rides} jazd</span>
                          <span className='font-medium text-deepNavy'>{c.revenue} zł</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Liczba jazd wg usługi</h3>
                  <BarChart data={serviceStats} max={500} />
                </div>
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy mb-4'>Udział procentowy usług</h3>
                  <div className='flex justify-center'>
                    <PieChart data={serviceStats} inner={0} size={200} />
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden'>
                <div className='p-6 border-b border-iceBlue'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy'>Szczegóły usług</h3>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-iceBlue/30'>
                      <tr>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-deepNavy'>Usługa</th>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-deepNavy'>Liczba jazd</th>
                        <th className='px-6 py-3 text-left text-sm font-semibold text-deepNavy'>Udział</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-iceBlue'>
                      {serviceStats.map((s) => {
                        const pct = ((s.value / ridesTotal) * 100).toFixed(1);
                        return (
                          <tr key={s.label} className='hover:bg-iceBlue/20 transition-colors'>
                            <td className='px-6 py-3 text-sm text-deepNavy'>{s.label}</td>
                            <td className='px-6 py-3 text-sm text-deepNavy'>{s.value}</td>
                            <td className='px-6 py-3 text-sm text-deepNavy'>
                              <div className='flex items-center gap-3'>
                                <div className='flex-1 bg-iceBlue rounded-full h-2 max-w-[160px]'>
                                  <div className='h-2 rounded-full' style={{ width: `${pct}%`, backgroundColor: s.color }} />
                                </div>
                                <span>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'horses' && (
            <div className="space-y-6">
              <div className='bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden'>
                <div className='p-6 border-b border-iceBlue'>
                  <h3 className='font-serif text-lg font-bold text-deepNavy'>Obciążenie koni</h3>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-iceBlue/30'>
                      <tr>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Koń</th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell'>Jazdy/tydz</th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell'>Godz/tydz</th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell'>Ostatnia jazda</th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Wykorzystanie</th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Status</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-iceBlue'>
                      {horseWorkloads.map((h) => {
                        const utilizationColor = h.utilizationRate > 90 ? 'bg-red-100 text-red-800' : h.utilizationRate < 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                        const status = h.utilizationRate > 90 ? 'Przepracowany' : h.utilizationRate < 60 ? 'Niewykorzystany' : 'Optymalny';
                        return (
                          <tr key={h.horseId} className='hover:bg-iceBlue/20 transition-colors'>
                            <td className='px-6 py-4 font-medium text-deepNavy'>{h.horseName}</td>
                            <td className='px-6 py-4 text-sm text-deepNavy hidden md:table-cell'>{h.weeklyRides}</td>
                            <td className='px-6 py-4 text-sm text-deepNavy hidden md:table-cell'>{h.weeklyHours.toFixed(1)}</td>
                            <td className='px-6 py-4 text-sm text-marineBlue hidden lg:table-cell'>{h.lastRideDate}</td>
                            <td className='px-6 py-4'>
                              <div className='flex items-center gap-2'>
                                <div className='flex-1 bg-iceBlue rounded-full h-2 max-w-[140px]'>
                                  <div className={`h-2 rounded-full ${h.utilizationRate > 90 ? 'bg-red-500' : h.utilizationRate < 60 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${h.utilizationRate}%` }} />
                                </div>
                                <span className='text-sm font-medium text-deepNavy'>{h.utilizationRate}%</span>
                              </div>
                            </td>
                            <td className='px-6 py-4'>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${utilizationColor}`}>{status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}
