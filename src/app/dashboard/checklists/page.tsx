'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, Search, CheckSquare, Square, Calendar, Clock, User, Activity, Repeat, Filter, Copy, Star } from 'lucide-react';

interface Checklist {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'event' | 'horse_care' | 'other';
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  items: ChecklistItem[];
  notes: string;
  isTemplate: boolean;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  linkedHorseId?: string;
  linkedHorseName?: string;
  createdAt: string;
  completedAt?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  dueTime?: string;
  assignedTo?: string;
  linkedHorseId?: string;
  linkedHorseName?: string;
  subtasks: ChecklistSubtask[];
}

interface ChecklistSubtask {
  id: string;
  text: string;
  completed: boolean;
}

interface DutyAssignment {
  date: string;
  instructor: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  category: Checklist['category'];
  items: Omit<ChecklistItem, 'id'>[];
  isFavorite: boolean;
  usageCount: number;
}

export default function ChecklistsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'daily' as Checklist['category'],
    assignedTo: '',
    dueDate: '',
    status: 'pending' as Checklist['status'],
    priority: 'medium' as Checklist['priority'],
    items: [] as ChecklistItem[],
    notes: '',
    isTemplate: false,
    recurring: 'none' as Checklist['recurring'],
    linkedHorseId: '' as string,
  });

  const [newItemText, setNewItemText] = useState('');
  const [activeTab, setActiveTab] = useState<'checklists' | 'templates' | 'reports' | 'stats'>('checklists');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [checklistSearchTerm, setChecklistSearchTerm] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportInstructor, setReportInstructor] = useState<string>('all');

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [checklists, setChecklists] = useState<Checklist[]>([]);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

  const [dutySchedule, setDutySchedule] = useState<DutyAssignment[]>([]);

  const [instructors, setInstructors] = useState<string[]>([]);
  const [stableHorses, setStableHorses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setInstructors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const { data } = await api.get(`/checklists?stableId=${activeStableId}`);
        if (data) {
          if (data.checklists) setChecklists(data.checklists);
          if (data.templates) setTemplates(data.templates);
        }

        // Load instructors from API
        const employeesRes = await api.get(`/employees?stableId=${activeStableId}`);
        const employees = employeesRes.data || [];
        setInstructors(employees.map((emp: any) => emp.name));

        // Load real horses of this stable (no fake/placeholder horses)
        const horsesRes = await api.get(`/horses?stableId=${activeStableId}&status=ACTIVE`);
        setStableHorses((horsesRes.data || []).map((h: any) => ({ id: h.id, name: h.name })));
      } catch (error) {
        console.error('Load checklists error:', error);
        setChecklists([]);
        setTemplates([]);
        setInstructors([]);
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
          <p className="text-marineBlue">Ładowanie list zadań...</p>
        </div>
      </div>
    );
  }

  const getInstructorOnDuty = (date: string) => {
    return dutySchedule.find(d => d.date === date)?.instructor || '';
  };

  const categories = [
    { value: 'daily', label: 'Codzienne', color: 'bg-blue-100 text-blue-800' },
    { value: 'weekly', label: 'Tygodniowe', color: 'bg-purple-100 text-purple-800' },
    { value: 'monthly', label: 'Miesięczne', color: 'bg-green-100 text-green-800' },
    { value: 'event', label: 'Wydarzenia', color: 'bg-orange-100 text-orange-800' },
    { value: 'horse_care', label: 'Opieka o konie', color: 'bg-teal-100 text-teal-800' },
    { value: 'other', label: 'Inne', color: 'bg-gray-100 text-gray-800' },
  ];

  const recurringOptions = [
    { value: 'none', label: 'Brak' },
    { value: 'daily', label: 'Codziennie' },
    { value: 'weekly', label: 'Tygodniowo' },
    { value: 'monthly', label: 'Miesięcznie' },
  ];

  const statuses = [
    { value: 'pending', label: 'Oczekujące', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'W trakcie', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Zakończone', color: 'bg-green-100 text-green-800' },
  ];

  const priorities = [
    { value: 'low', label: 'Niski', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Średni', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Wysoki', color: 'bg-red-100 text-red-800' },
  ];

  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      category: 'daily',
      assignedTo: '',
      dueDate: '',
      status: 'pending',
      priority: 'medium',
      items: [],
      notes: '',
      isTemplate: false,
      recurring: 'none',
      linkedHorseId: '',
    });
    setNewItemText('');
    setEditingChecklist(null);
    setShowAddModal(true);
  };

  const handleCreateFromTemplate = async (template: ChecklistTemplate) => {
    try {
      await api.put(`/checklists/templates/${template.id}/use`);
      setTemplates(templates.map(t => t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t));
    } catch (error) {
      console.error('Use template error:', error);
    }
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      assignedTo: '',
      dueDate: '',
      status: 'pending',
      priority: 'medium',
      items: template.items.map((item, index) => ({
        id: Date.now().toString() + index,
        ...item,
      })),
      notes: '',
      isTemplate: false,
      recurring: 'none',
      linkedHorseId: '',
    });
    setNewItemText('');
    setEditingChecklist(null);
    setShowAddModal(true);
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      const { data } = await api.put(`/checklists/templates/${templateId}/toggle-favorite`, { isFavorite: !template.isFavorite });
      setTemplates(templates.map(t => t.id === templateId ? data : t));
    } catch (error) {
      console.error('Toggle favorite error:', error);
      alert('Nie udało się zmienić ulubionych');
    }
  };

  const handleDuplicateChecklist = async (checklist: Checklist) => {
    try {
      const newChecklist: Checklist = {
        ...checklist,
        id: Date.now().toString(),
        name: `${checklist.name} (kopia)`,
        status: 'pending',
        items: checklist.items.map(item => ({
          ...item,
          id: Date.now().toString() + Math.random(),
          completed: false,
          subtasks: item.subtasks.map(st => ({
            ...st,
            id: Date.now().toString() + Math.random(),
            completed: false,
          })),
        })),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const { data } = await api.post('/checklists/duplicate', { ...newChecklist, stableId: activeStableId });
      setChecklists([...checklists, data]);
    } catch (error) {
      console.error('Duplicate checklist error:', error);
      alert('Nie udało się zduplikować listy');
    }
  };

  const handleEdit = (checklist: Checklist) => {
    setFormData({
      name: checklist.name,
      description: checklist.description,
      category: checklist.category,
      assignedTo: checklist.assignedTo,
      dueDate: checklist.dueDate,
      status: checklist.status,
      priority: checklist.priority,
      items: checklist.items,
      notes: checklist.notes,
      isTemplate: checklist.isTemplate,
      recurring: checklist.recurring,
      linkedHorseId: checklist.linkedHorseId || '',
    });
    setNewItemText('');
    setEditingChecklist(checklist);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/checklists/${id}`);
      setChecklists(checklists.filter(c => c.id !== id));
    } catch (error) {
      console.error('Delete checklist error:', error);
      alert('Nie udało się usunąć listy');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChecklist) {
        const { data } = await api.put(`/checklists/${editingChecklist.id}`, formData);
        setChecklists(checklists.map(c => c.id === editingChecklist.id ? data : c));
      } else {
        const { data } = await api.post('/checklists', { ...formData, stableId: activeStableId });
        setChecklists([...checklists, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save checklist error:', error);
      alert('Nie udało się zapisać listy');
    }
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText,
        completed: false,
        subtasks: [],
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
      setNewItemText('');
    }
  };

  const handleAddSubtask = (itemId: string, subtaskText: string) => {
    if (subtaskText.trim()) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                subtasks: [...item.subtasks, { id: Date.now().toString(), text: subtaskText, completed: false }],
              }
            : item
        ),
      });
    }
  };

  const handleToggleSubtask = (itemId: string, subtaskId: string) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              subtasks: item.subtasks.map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : item
      ),
    });
  };

  const handleDeleteSubtask = (itemId: string, subtaskId: string) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              subtasks: item.subtasks.filter(st => st.id !== subtaskId),
            }
          : item
      ),
    });
  };

  const handleToggleItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId),
    });
  };

  const handleToggleItemInList = async (checklistId: string, itemId: string) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) return;
      const item = checklist.items.find(i => i.id === itemId);
      if (!item) return;
      const { data } = await api.put(`/checklists/${checklistId}/items/${itemId}/toggle`, { completed: !item.completed });
      setChecklists(checklists.map(c => c.id === checklistId ? data : c));
    } catch (error) {
      console.error('Toggle item error:', error);
      alert('Nie udało się zmienić statusu elementu');
    }
  };

  const getChecklistStats = () => {
    const totalChecklists = checklists.length;
    const completedChecklists = checklists.filter(c => c.status === 'completed').length;
    const inProgressChecklists = checklists.filter(c => c.status === 'in_progress').length;
    const highPriorityChecklists = checklists.filter(c => c.priority === 'high').length;
    const recurringChecklists = checklists.filter(c => c.recurring !== 'none').length;
    const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
    const completedItems = checklists.reduce((sum, c) => sum + c.items.filter(i => i.completed).length, 0);
    const totalSubtasks = checklists.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.subtasks.length, 0), 0);
    const completedSubtasks = checklists.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.subtasks.filter(st => st.completed).length, 0), 0);

    return {
      totalChecklists,
      completedChecklists,
      inProgressChecklists,
      highPriorityChecklists,
      recurringChecklists,
      totalItems,
      completedItems,
      totalSubtasks,
      completedSubtasks,
    };
  };

  const getFilteredChecklists = () => {
    return checklists.filter(c => {
      const categoryMatch = filterCategory === 'all' || c.category === filterCategory;
      const statusMatch = filterStatus === 'all' || c.status === filterStatus;
      const searchMatch = checklistSearchTerm === '' ||
        c.name.toLowerCase().includes(checklistSearchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(checklistSearchTerm.toLowerCase()) ||
        c.assignedTo.toLowerCase().includes(checklistSearchTerm.toLowerCase());
      return categoryMatch && statusMatch && searchMatch;
    });
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(templateSearchTerm.toLowerCase())
  );

  const stats = getChecklistStats();
  const filteredChecklists = getFilteredChecklists();

  const reportRows = checklists.filter(c => {
    if (!reportStartDate || !reportEndDate) return false;
    if (c.dueDate < reportStartDate || c.dueDate > reportEndDate) return false;
    return reportInstructor === 'all' || c.assignedTo === reportInstructor;
  });

  const completedReportRows = reportRows.filter(r => r.items.length > 0 && r.items.every(i => i.completed));

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
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Operacje</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Listy kontrolne</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Zarządzaj listami zadań, szablonami i zadaniami cyklicznymi.
                </p>
              </div>
              <button
                onClick={handleAdd}
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-deepNavy rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Stats - hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Listy</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalChecklists}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Zakończone</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completedChecklists}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">W trakcie</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgressChecklists}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Cykliczne</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.recurringChecklists}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-marineBlue">Podzadania</span>
              </div>
              <p className="text-2xl font-bold text-teal-600">{stats.totalSubtasks}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('checklists')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'checklists'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Listy kontrolne
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'templates'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Szablony ({templates.length})
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
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Statystyki
            </button>
          </div>

          {/* Filters - only for checklists tab */}
          {activeTab === 'checklists' && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-iceBlue px-3 py-2">
                <Filter className="w-4 h-4 text-marineBlue" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-sm text-deepNavy bg-transparent focus:outline-none"
                >
                  <option value="all">Wszystkie kategorie</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-iceBlue px-3 py-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm text-deepNavy bg-transparent focus:outline-none"
                >
                  <option value="all">Wszystkie statusy</option>
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab !== 'reports' && (
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'checklists' ? 'Szukaj listy...' : 'Szukaj szablonu...'}
                value={activeTab === 'checklists' ? checklistSearchTerm : templateSearchTerm}
                onChange={(e) => activeTab === 'checklists' ? setChecklistSearchTerm(e.target.value) : setTemplateSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
              />
            </div>
          )}

          {/* Checklists Tab */}
          {activeTab === 'checklists' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChecklists.map((checklist) => {
                const completedCount = checklist.items.filter(i => i.completed).length;
                const totalCount = checklist.items.length;
                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const subtasksCount = checklist.items.reduce((sum, i) => sum + i.subtasks.length, 0);
                const completedSubtasksCount = checklist.items.reduce((sum, i) => sum + i.subtasks.filter(st => st.completed).length, 0);

                return (
                  <div key={checklist.id} onClick={() => setSelectedChecklist(checklist)} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{checklist.name}</h3>
                          {checklist.recurring !== 'none' && (
                            <Repeat className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <p className="text-sm text-marineBlue mb-2">{checklist.description}</p>
                        {checklist.linkedHorseName && (
                          <p className="text-xs text-teal-600 mb-2 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {checklist.linkedHorseName}
                          </p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categories.find(c => c.value === checklist.category)?.color || 'bg-gray-100 text-gray-800'}`}>
                            {categories.find(c => c.value === checklist.category)?.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorities.find(p => p.value === checklist.priority)?.color}`}>
                            {priorities.find(p => p.value === checklist.priority)?.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statuses.find(s => s.value === checklist.status)?.color}`}>
                            {statuses.find(s => s.value === checklist.status)?.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicateChecklist(checklist); }}
                          className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                          title="Duplikuj"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(checklist); }}
                          className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(checklist.id); }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-marineBlue">Postęp</span>
                        <span className="text-deepNavy">{progress}%</span>
                      </div>
                      <div className="w-full bg-iceBlue rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-oceanBlue to-marineBlue h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {checklist.items.slice(0, 3).map((item) => {
                        const itemSubtasksCompleted = item.subtasks.filter(st => st.completed).length;
                        const itemSubtasksTotal = item.subtasks.length;
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => { e.stopPropagation(); handleToggleItemInList(checklist.id, item.id); }}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-iceBlue cursor-pointer transition-colors"
                          >
                            {item.completed ? (
                              <CheckSquare className="w-4 h-4 text-green-600" />
                            ) : (
                              <Square className="w-4 h-4 text-marineBlue" />
                            )}
                            <div className="flex-1">
                              <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-deepNavy'}`}>
                                {item.text}
                              </span>
                              {itemSubtasksTotal > 0 && (
                                <span className="text-xs text-marineBlue ml-2">
                                  ({itemSubtasksCompleted}/{itemSubtasksTotal})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {checklist.items.length > 3 && (
                        <p className="text-sm text-marineBlue">+{checklist.items.length - 3} więcej zadań</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-iceBlue">
                      <div className="flex items-center gap-2 text-marineBlue">
                        <User className="w-4 h-4" />
                        <span>{checklist.assignedTo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-marineBlue">
                        <Calendar className="w-4 h-4" />
                        <span>{checklist.dueDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} onClick={() => setSelectedTemplate(template)} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-lg font-bold text-deepNavy">{template.name}</h3>
                        {template.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-marineBlue mb-2">{template.description}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${categories.find(c => c.value === template.category)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {categories.find(c => c.value === template.category)?.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(template.id); }}
                        className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-yellow-500"
                        title="Ulubione"
                      >
                        <Star className={`w-4 h-4 ${template.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreateFromTemplate(template); }}
                        className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                        title="Użyj szablonu"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {template.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-iceBlue/20">
                        <Square className="w-4 h-4 text-marineBlue" />
                        <span className="text-sm text-deepNavy">{item.text}</span>
                        {item.subtasks.length > 0 && (
                          <span className="text-xs text-marineBlue ml-2">
                            ({item.subtasks.length} podzadań)
                          </span>
                        )}
                      </div>
                    ))}
                    {template.items.length > 3 && (
                      <p className="text-sm text-marineBlue">+{template.items.length - 3} więcej zadań</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm pt-4 border-t border-iceBlue">
                    <div className="flex items-center gap-2 text-marineBlue">
                      <CheckSquare className="w-4 h-4" />
                      <span>{template.items.length} zadań</span>
                    </div>
                    <div className="flex items-center gap-2 text-marineBlue">
                      <span>Użyto: {template.usageCount}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-6 mb-6'>
                <h2 className='font-serif text-xl font-bold text-deepNavy mb-4'>Raport realizacji list</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Od</label>
                    <input
                      type='date'
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className='w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm'
                      style={{ boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Do</label>
                    <input
                      type='date'
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className='w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm'
                      style={{ boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-deepNavy mb-2'>Instruktor</label>
                    <select
                      value={reportInstructor}
                      onChange={(e) => setReportInstructor(e.target.value)}
                      className='w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm bg-transparent'
                    >
                      <option value='all'>Wszyscy</option>
                      {instructors.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {reportStartDate && reportEndDate && (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                  <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4'>
                    <p className='text-sm text-marineBlue mb-1'>Przydzielone listy</p>
                    <p className='text-2xl font-bold text-deepNavy'>{reportRows.length}</p>
                  </div>
                  <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4'>
                    <p className='text-sm text-marineBlue mb-1'>Wykonane</p>
                    <p className='text-2xl font-bold text-green-600'>{completedReportRows.length}</p>
                  </div>
                  <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-4'>
                    <p className='text-sm text-marineBlue mb-1'>Wykonanie</p>
                    <p className='text-2xl font-bold text-oceanBlue'>{reportRows.length ? Math.round((completedReportRows.length / reportRows.length) * 100) : 0}%</p>
                  </div>
                </div>
              )}

              {reportRows.length > 0 ? (
                <div className='bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden'>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-iceBlue/30'>
                        <tr>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Data</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Instruktor</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Lista</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell'>Postęp</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-deepNavy'>Wykonane</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-iceBlue'>
                        {reportRows.map(row => {
                          const progress = row.items.length ? Math.round((row.items.filter(i => i.completed).length / row.items.length) * 100) : 0;
                          const isDone = row.items.length > 0 && row.items.every(i => i.completed);
                          return (
                            <tr key={row.id} className='hover:bg-iceBlue/20 transition-colors'>
                              <td className='px-6 py-4 text-sm text-deepNavy'>{row.dueDate}</td>
                              <td className='px-6 py-4 text-sm text-deepNavy'>{row.assignedTo}</td>
                              <td className='px-6 py-4 text-sm text-deepNavy'>{row.name}</td>
                              <td className='px-6 py-4 text-sm text-deepNavy hidden lg:table-cell'>{progress}%</td>
                              <td className='px-6 py-4'>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {isDone ? 'Tak' : 'Nie'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                reportStartDate && reportEndDate && (
                  <div className='bg-white rounded-2xl shadow-lg border border-iceBlue p-8 text-center'>
                    <p className='text-marineBlue'>Brak list kontrolnych w wybranym okresie.</p>
                  </div>
                )
              )}

              <div className='mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200'>
                <p className='text-sm text-blue-800'>
                  <strong>Automatyczne przypisanie:</strong> przy wyborze daty listy zostaje przypisana instruktorowi, który ma w ten dzień dyżur. Możesz to zmienić ręcznie.
                </p>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-oceanBlue" />
                    <span className="text-sm text-marineBlue">Listy</span>
                  </div>
                  <p className="text-2xl font-bold text-deepNavy">{stats.totalChecklists}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-marineBlue">Zakończone</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.completedChecklists}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-marineBlue">W trakcie</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgressChecklists}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-marineBlue">Cykliczne</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.recurringChecklists}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-teal-600" />
                    <span className="text-sm text-marineBlue">Podzadania</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-600">{stats.totalSubtasks}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-marineBlue">Priorytet wysoki</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.highPriorityChecklists}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-oceanBlue" />
                    <span className="text-sm text-marineBlue">Wszystkie zadania</span>
                  </div>
                  <p className="text-2xl font-bold text-deepNavy">{stats.totalItems}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-marineBlue">Wykonane zadania</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.completedItems}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-5 h-5 text-teal-600" />
                    <span className="text-sm text-marineBlue">Wykonane podzadania</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-600">{stats.completedSubtasks}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedChecklist && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedChecklist.name}</h2>
                  <p className='text-sm text-marineBlue'>{selectedChecklist.description}</p>
                </div>
                <div className='flex items-center gap-1'>
                  <button onClick={() => { setEditingChecklist(selectedChecklist); setSelectedChecklist(null); setShowAddModal(true); }} className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors'>
                    <Edit2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => { handleDelete(selectedChecklist.id); setSelectedChecklist(null); }} className='p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors'>
                    <Trash2 className='w-5 h-5' />
                  </button>
                  <button onClick={() => setSelectedChecklist(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                    <X className='w-5 h-5 text-deepNavy' />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Kategoria</p>
                  <p className='text-sm font-medium text-deepNavy'>{categories.find(c => c.value === selectedChecklist.category)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Priorytet</p>
                  <p className='text-sm font-medium text-deepNavy'>{priorities.find(p => p.value === selectedChecklist.priority)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Status</p>
                  <p className='text-sm font-medium text-deepNavy'>{statuses.find(s => s.value === selectedChecklist.status)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Przypisane do</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedChecklist.assignedTo}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Termin</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedChecklist.dueDate}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Cykliczne</p>
                  <p className='text-sm font-medium text-deepNavy'>{recurringOptions.find(r => r.value === selectedChecklist.recurring)?.label}</p>
                </div>
              </div>

              {selectedChecklist.linkedHorseName && (
                <p className='text-sm text-teal-600 mb-4 flex items-center gap-1'>
                  <Activity className='w-4 h-4' />
                  {selectedChecklist.linkedHorseName}
                </p>
              )}

              <div className='mb-4'>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-marineBlue'>Postęp</span>
                  <span className='text-deepNavy'>{Math.round((selectedChecklist.items.filter(i => i.completed).length / (selectedChecklist.items.length || 1)) * 100)}%</span>
                </div>
                <div className='w-full bg-iceBlue rounded-full h-2'>
                  <div className='bg-gradient-to-r from-oceanBlue to-marineBlue h-2 rounded-full transition-all' style={{ width: (Math.round((selectedChecklist.items.filter(i => i.completed).length / (selectedChecklist.items.length || 1)) * 100)) + '%' }} />
                </div>
              </div>

              <div className='space-y-2 mb-4'>
                {selectedChecklist.items.map(item => (
                  <div key={item.id} className='flex items-start gap-2 p-2 rounded-lg bg-iceBlue/20'>
                    {item.completed ? <CheckSquare className='w-4 h-4 text-green-600 mt-0.5' /> : <Square className='w-4 h-4 text-marineBlue mt-0.5' />}
                    <div className='flex-1'>
                      <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-deepNavy'}`}>{item.text}</span>
                      {item.subtasks.length > 0 && (
                        <div className='ml-4 mt-1 space-y-1'>
                          {item.subtasks.map(st => (
                            <div key={st.id} className='flex items-center gap-2'>
                              {st.completed ? <CheckSquare className='w-3 h-3 text-green-600' /> : <Square className='w-3 h-3 text-marineBlue' />}
                              <span className={`text-xs ${st.completed ? 'line-through text-gray-400' : 'text-deepNavy'}`}>{st.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedChecklist.notes && (
                <div className='p-3 bg-yellow-50 rounded-2xl border border-yellow-200'>
                  <p className='text-sm text-yellow-800'>{selectedChecklist.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='font-serif text-2xl font-bold text-deepNavy'>{selectedTemplate.name}</h2>
                  <p className='text-sm text-marineBlue'>{selectedTemplate.description}</p>
                </div>
                <div className='flex items-center gap-1'>
                  <button onClick={() => { setSelectedTemplate(null); handleCreateFromTemplate(selectedTemplate); }} className='p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors'>
                    <Copy className='w-5 h-5' />
                  </button>
                  <button onClick={() => setSelectedTemplate(null)} className='p-2 hover:bg-iceBlue rounded-xl transition-colors'>
                    <X className='w-5 h-5 text-deepNavy' />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Kategoria</p>
                  <p className='text-sm font-medium text-deepNavy'>{categories.find(c => c.value === selectedTemplate.category)?.label}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Zadań</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedTemplate.items.length}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Użycia</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedTemplate.usageCount}</p>
                </div>
                <div className='bg-arcticBlue/30 rounded-2xl p-4'>
                  <p className='text-xs text-marineBlue mb-1'>Ulubiony</p>
                  <p className='text-sm font-medium text-deepNavy'>{selectedTemplate.isFavorite ? 'Tak' : 'Nie'}</p>
                </div>
              </div>

              <div className='space-y-2'>
                {selectedTemplate.items.map((item, idx) => (
                  <div key={idx} className='flex items-start gap-2 p-2 rounded-lg bg-iceBlue/20'>
                    <Square className='w-4 h-4 text-marineBlue mt-0.5' />
                    <div className='flex-1'>
                      <span className='text-sm text-deepNavy'>{item.text}</span>
                      {item.subtasks.length > 0 && (
                        <div className='ml-4 mt-1 space-y-1'>
                          {item.subtasks.map((st, stIdx) => (
                            <div key={stIdx} className='flex items-center gap-2'>
                              <Square className='w-3 h-3 text-marineBlue' />
                              <span className='text-xs text-deepNavy'>{st.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4'>
          <div className='bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto'>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingChecklist ? 'Edytuj listę' : 'Dodaj listę'}
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
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Kategoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Checklist['category'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Priorytet</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Checklist['priority'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {priorities.map((pri) => (
                        <option key={pri.value} value={pri.value}>{pri.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Przypisane do</label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => {
                        const date = e.target.value;
                        const onDuty = date ? getInstructorOnDuty(date) : '';
                        setFormData({
                          ...formData,
                          dueDate: date,
                          assignedTo: formData.assignedTo ? formData.assignedTo : onDuty,
                        });
                      }}
                      className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                      style={{ boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Checklist['status'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Cykliczne</label>
                    <select
                      value={formData.recurring}
                      onChange={(e) => setFormData({ ...formData, recurring: e.target.value as Checklist['recurring'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {recurringOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.category === 'horse_care' && (
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Powiązany koń</label>
                    <select
                      value={formData.linkedHorseId}
                      onChange={(e) => setFormData({ ...formData, linkedHorseId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      <option value="">Wybierz konia</option>
                      {stableHorses.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Zadania</label>
                  <div className="space-y-3 mb-2">
                    {formData.items.map((item) => (
                      <div key={item.id} className="bg-iceBlue/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            className="p-1"
                          >
                            {item.completed ? (
                              <CheckSquare className="w-4 h-4 text-green-600" />
                            ) : (
                              <Square className="w-4 h-4 text-marineBlue" />
                            )}
                          </button>
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                items: formData.items.map(i =>
                                  i.id === item.id ? { ...i, text: e.target.value } : i
                                ),
                              });
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.subtasks.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {item.subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubtask(item.id, subtask.id)}
                                  className="p-1"
                                >
                                  {subtask.completed ? (
                                    <CheckSquare className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Square className="w-3 h-3 text-marineBlue" />
                                  )}
                                </button>
                                <span className={`text-xs ${subtask.completed ? 'line-through text-gray-400' : 'text-deepNavy'}`}>
                                  {subtask.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubtask(item.id, subtask.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="ml-6 flex gap-2">
                          <input
                            type="text"
                            placeholder="Podzadanie"
                            className="flex-1 px-2 py-1 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                handleAddSubtask(item.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Nowe zadanie"
                      className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Notatki</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={2}
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
                    {editingChecklist ? 'Zapisz zmiany' : 'Dodaj'}
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
