'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, FileText, Type, CheckSquare, Calendar, Mail, Phone, Settings, Link, Copy, Users, Share2, ExternalLink, Square } from 'lucide-react';
import api from '@/lib/api';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  submittedAt: string;
  data: Record<string, any>;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'camp_registration' | 'consent' | 'feedback' | 'survey' | 'other';
  linkedCampId?: string;
  linkedCampName?: string;
  linkedSessionId?: string;
  linkedSessionName?: string;
  fields: FormField[];
  status: 'draft' | 'active' | 'archived';
  shareLink: string;
  createdAt: string;
  updatedAt: string;
  submissions: FormSubmission[];
}

export default function FormsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'camp_registration' as FormTemplate['category'],
    linkedCampId: '' as string,
    linkedCampName: '' as string,
    linkedSessionId: '' as string,
    linkedSessionName: '' as string,
    fields: [] as FormField[],
    status: 'draft' as FormTemplate['status'],
  });

  const [newField, setNewField] = useState({
    type: 'text' as FormField['type'],
    label: '',
    placeholder: '',
    required: false,
    options: [] as string[],
  });

  const [newOption, setNewOption] = useState('');
  const [activeTab, setActiveTab] = useState<'forms' | 'submissions'>('forms');
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedFormSubmissions, setSelectedFormSubmissions] = useState<FormSubmission[]>([]);

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [camps, setCamps] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const [formsRes, campsRes] = await Promise.all([
          api.get(`/forms?stableId=${activeStableId}`),
          api.get(`/camps?stableId=${activeStableId}`)
        ]);
        setForms(formsRes.data || []);
        setCamps(campsRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setForms([]);
        setCamps([]);
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
          <p className="text-marineBlue">Ładowanie formularzy...</p>
        </div>
      </div>
    );
  }

  const fieldTypes = [
    { value: 'text', label: 'Tekst', icon: Type },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Telefon', icon: Phone },
    { value: 'number', label: 'Liczba', icon: Type },
    { value: 'date', label: 'Data', icon: Calendar },
    { value: 'textarea', label: 'Tekst długi', icon: FileText },
    { value: 'select', label: 'Wybór', icon: Settings },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'radio', label: 'Radio', icon: Settings },
  ];

  const categories = [
    { value: 'camp_registration', label: 'Zapis na obóz' },
    { value: 'consent', label: 'Zgody' },
    { value: 'feedback', label: 'Opinie' },
    { value: 'survey', label: 'Ankiety' },
    { value: 'other', label: 'Inne' },
  ];

  const submissionStatuses = [
    { value: 'pending', label: 'Oczekujące', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reviewed', label: 'Przeglądane', color: 'bg-blue-100 text-blue-800' },
    { value: 'approved', label: 'Zaakceptowane', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Odrzucone', color: 'bg-red-100 text-red-800' },
  ];

  const statuses = [
    { value: 'draft', label: 'Projekt', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Aktywny', color: 'bg-green-100 text-green-800' },
    { value: 'archived', label: 'Zarchiwizowany', color: 'bg-orange-100 text-orange-800' },
  ];

  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      category: 'camp_registration',
      linkedCampId: '',
      linkedCampName: '',
      linkedSessionId: '',
      linkedSessionName: '',
      fields: [],
      status: 'draft',
    });
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
    });
    setNewOption('');
    setEditingForm(null);
    setShowAddModal(true);
  };

  const handleCopyLink = (link: string) => {
    const url = link.startsWith('http') ? link : `${typeof window !== 'undefined' ? window.location.origin : ''}${link}`;
    navigator.clipboard.writeText(url);
  };

  const handleViewSubmissions = (form: FormTemplate) => {
    setSelectedFormSubmissions(form.submissions);
    setShowSubmissionsModal(true);
  };

  const handleUpdateSubmissionStatus = (submissionId: string, newStatus: FormSubmission['status']) => {
    setForms(forms.map(form => ({
      ...form,
      submissions: form.submissions.map(sub => 
        sub.id === submissionId ? { ...sub, status: newStatus } : sub
      ),
    })));
    setSelectedFormSubmissions(selectedFormSubmissions.map(sub => 
      sub.id === submissionId ? { ...sub, status: newStatus } : sub
    ));
  };

  const handleEdit = (form: FormTemplate) => {
    setFormData({
      name: form.name,
      description: form.description,
      category: form.category,
      linkedCampId: form.linkedCampId || '',
      linkedCampName: form.linkedCampName || '',
      linkedSessionId: form.linkedSessionId || '',
      linkedSessionName: form.linkedSessionName || '',
      fields: form.fields,
      status: form.status,
    });
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
    });
    setNewOption('');
    setEditingForm(form);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
    } catch (error) {
      console.error('Delete form error:', error);
      alert('Nie udało się usunąć formularza');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingForm) {
        const { data } = await api.put(`/forms/${editingForm.id}`, { ...formData, stableId: activeStableId });
        setForms(forms.map(f => f.id === editingForm.id ? data : f));
      } else {
        const { data } = await api.post('/forms', { ...formData, stableId: activeStableId });
        setForms([...forms, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save form error:', error);
      alert('Nie udało się zapisać formularza');
    }
  };

  const handleAddField = () => {
    if (newField.label.trim()) {
      const field: FormField = {
        id: Date.now().toString(),
        type: newField.type,
        label: newField.label,
        placeholder: newField.placeholder,
        required: newField.required,
        options: newField.options.length > 0 ? [...newField.options] : undefined,
      };
      setFormData({ ...formData, fields: [...formData.fields, field] });
      setNewField({
        type: 'text',
        label: '',
        placeholder: '',
        required: false,
        options: [],
      });
      setNewOption('');
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(f => f.id !== fieldId),
    });
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setNewField({ ...newField, options: [...newField.options, newOption] });
      setNewOption('');
    }
  };

  const handleDeleteOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index),
    });
  };

  const getFormStats = () => {
    const totalForms = forms.length;
    const activeForms = forms.filter(f => f.status === 'active').length;
    const totalFields = forms.reduce((sum, f) => sum + f.fields.length, 0);
    const totalSubmissions = forms.reduce((sum, f) => sum + f.submissions.length, 0);
    const pendingSubmissions = forms.reduce((sum, f) => sum + f.submissions.filter(s => s.status === 'pending').length, 0);

    return {
      totalForms,
      activeForms,
      totalFields,
      totalSubmissions,
      pendingSubmissions,
    };
  };

  const stats = getFormStats();

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
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1 sm:mb-2">Narzędzia</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">Kreator formularzy</h1>
                <p className="text-white/75 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 max-w-md hidden sm:block">
                  Twórz formularze, udostępniaj linki i zarządzaj zgłoszeniami.
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

          {/* Stats */}
          <div className="hidden md:grid md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Formularze</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalForms}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Aktywne</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.activeForms}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Pola</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalFields}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-marineBlue">Zgłoszenia</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalSubmissions}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Square className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-marineBlue">Oczekujące</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingSubmissions}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'forms'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Formularze
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'submissions'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              Zgłoszenia
            </button>
          </div>


          {/* Forms Tab */}
          {activeTab === 'forms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <div key={form.id} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-deepNavy">{form.name}</h3>
                          <p className="text-xs text-marineBlue">{categories.find(c => c.value === form.category)?.label}</p>
                        </div>
                      </div>
                      <p className="text-sm text-marineBlue mb-3">{form.description}</p>
                      {form.linkedCampName && (
                        <p className="text-xs text-oceanBlue mb-1">📍 {form.linkedCampName} - {form.linkedSessionName}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(form)}
                        className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-marineBlue">Pola:</span>
                      <span className="text-deepNavy">{form.fields.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marineBlue">Zgłoszenia:</span>
                      <span className="text-deepNavy">{form.submissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-marineBlue">Utworzono:</span>
                      <span className="text-deepNavy">{form.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statuses.find(s => s.value === form.status)?.color}`}>
                      {statuses.find(s => s.value === form.status)?.label}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-iceBlue space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-marineBlue">
                        <Link className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{form.shareLink}</span>
                      </div>
                      <button
                        onClick={() => handleCopyLink(form.shareLink)}
                        className="p-1 hover:bg-iceBlue rounded transition-colors text-oceanBlue"
                        title="Kopiuj link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewSubmissions(form)}
                        className="flex-1 px-3 py-2 rounded-lg bg-iceBlue/20 text-deepNavy hover:bg-iceBlue/40 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Zgłoszenia ({form.submissions.length})
                      </button>
                      <a
                        href={form.shareLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue/20 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-iceBlue/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Formularz</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden lg:table-cell">Dane</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-iceBlue">
                    {forms.flatMap(form => 
                      form.submissions.map(submission => ({ ...submission, formName: form.name }))
                    ).map((submission) => (
                      <tr key={submission.id} className="hover:bg-iceBlue/20 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-deepNavy">{submission.formName}</p>
                            <p className="text-xs text-marineBlue">ID: {submission.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-deepNavy hidden md:table-cell">{submission.submittedAt}</td>
                        <td className="px-6 py-4 text-sm text-marineBlue hidden lg:table-cell">
                          <div className="max-w-xs truncate">
                            {Object.entries(submission.data).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-deepNavy">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${submissionStatuses.find(s => s.value === submission.status)?.color}`}>
                            {submissionStatuses.find(s => s.value === submission.status)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={submission.status}
                            onChange={(e) => handleUpdateSubmissionStatus(submission.id, e.target.value as FormSubmission['status'])}
                            className="px-2 py-1 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs"
                          >
                            {submissionStatuses.map((status) => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingForm ? 'Edytuj formularz' : 'Nowy formularz'}
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
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Kategoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as FormTemplate['category'] })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as FormTemplate['status'] })}
                      className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.category === 'camp_registration' && (
                  <div className="bg-iceBlue/20 rounded-xl p-4">
                    <h3 className="font-semibold text-deepNavy mb-3 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Integracja z obozami
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Obóz (opcjonalnie)</label>
                        <select
                          value={formData.linkedCampId}
                          onChange={(e) => {
                            const selectedCamp = camps.find((c: any) => c.id === e.target.value);
                            setFormData({ 
                              ...formData, 
                              linkedCampId: e.target.value,
                              linkedCampName: selectedCamp?.name || '',
                              linkedSessionId: '',
                              linkedSessionName: ''
                            });
                          }}
                          className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        >
                          <option value="">Wybierz obóz</option>
                          {camps.map((camp: any) => (
                            <option key={camp.id} value={camp.id}>{camp.name}</option>
                          ))}
                        </select>
                      </div>
                      {formData.linkedCampId && (
                        <div>
                          <label className="block text-sm font-medium text-deepNavy mb-2">Turnus (opcjonalnie)</label>
                          <select
                            value={formData.linkedSessionId}
                            onChange={(e) => {
                              const camp = camps.find((c: any) => c.id === formData.linkedCampId);
                              const session = camp?.sessions?.find((s: any) => s.id === e.target.value);
                              setFormData({ 
                                ...formData, 
                                linkedSessionId: e.target.value,
                                linkedSessionName: session?.name || ''
                              });
                            }}
                            className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                          >
                            <option value="">Wybierz turnus</option>
                            {camps.find((c: any) => c.id === formData.linkedCampId)?.sessions?.map((session: any) => (
                              <option key={session.id} value={session.id}>{session.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-iceBlue pt-4">
                  <h3 className="font-serif text-lg font-bold text-deepNavy mb-4">Pola formularza</h3>
                  
                  <div className="space-y-2 mb-4">
                    {formData.fields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-iceBlue/20 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-deepNavy">{field.label}</p>
                          <p className="text-xs text-marineBlue">{fieldTypes.find(t => t.value === field.type)?.label} {field.required && '(wymagane)'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-iceBlue/30 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Typ pola</label>
                        <select
                          value={newField.type}
                          onChange={(e) => setNewField({ ...newField, type: e.target.value as FormField['type'] })}
                          className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        >
                          {fieldTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Etykieta</label>
                        <input
                          type="text"
                          value={newField.label}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Placeholder</label>
                      <input
                        type="text"
                        value={newField.placeholder}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Pole wymagane</span>
                    </div>

                    {(newField.type === 'select' || newField.type === 'radio') && (
                      <div>
                        <label className="block text-sm font-medium text-deepNavy mb-2">Opcje</label>
                        <div className="space-y-2 mb-2">
                          {newField.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                              <span className="text-sm text-deepNavy">{option}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(index)}
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
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            placeholder="Nowa opcja"
                            className="flex-1 px-3 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddField}
                      className="w-full px-4 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors text-sm"
                    >
                      Dodaj pole
                    </button>
                  </div>
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
                    {editingForm ? 'Zapisz zmiany' : 'Utwórz formularz'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">Zgłoszenia formularza</h2>
                <button
                  onClick={() => setShowSubmissionsModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-iceBlue overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-iceBlue/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Data</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy hidden md:table-cell">Dane</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-iceBlue">
                      {selectedFormSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-iceBlue/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-deepNavy">{submission.submittedAt}</td>
                          <td className="px-6 py-4 text-sm text-marineBlue hidden md:table-cell">
                            <div className="max-w-xs truncate">
                              {Object.entries(submission.data).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-deepNavy">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${submissionStatuses.find(s => s.value === submission.status)?.color}`}>
                              {submissionStatuses.find(s => s.value === submission.status)?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select
                              value={submission.status}
                              onChange={(e) => handleUpdateSubmissionStatus(submission.id, e.target.value as FormSubmission['status'])}
                              className="px-2 py-1 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs"
                            >
                              {submissionStatuses.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {selectedFormSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-marineBlue">
                            Brak zgłoszeń
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav user={user} />
    </div>
  );
}
