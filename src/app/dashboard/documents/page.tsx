'use client';

export const dynamic = 'force-static';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, X, Edit2, Trash2, FileText, Download, Calendar, User, Check } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'consent' | 'regulation' | 'invoice' | 'other';
  category: string;
  description: string;
  clientId?: string;
  clientName?: string;
  horseId?: string;
  horseName?: string;
  issueDate: string;
  expiryDate?: string;
  status: 'draft' | 'active' | 'expired' | 'cancelled';
  signed: boolean;
  signedBy?: string;
  signedDate?: string;
  fileUrl?: string;
  notes: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'contract' as Document['type'],
    category: '',
    description: '',
    clientId: '',
    clientName: '',
    horseId: '',
    horseName: '',
    issueDate: '',
    expiryDate: '',
    status: 'draft' as Document['status'],
    signed: false,
    signedBy: '',
    signedDate: '',
    fileUrl: '',
    notes: '',
  });

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [documents, setDocuments] = useState<Document[]>([]);
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
        const [docsRes, clientsRes, horsesRes] = await Promise.all([
          api.get(`/documents?stableId=${activeStableId}`),
          api.get(`/clients?stableId=${activeStableId}`),
          api.get(`/horses?stableId=${activeStableId}`)
        ]);
        setDocuments(docsRes.data || []);
        setClients(clientsRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (error) {
        console.error('Load data error:', error);
        setDocuments([]);
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
          <p className="text-marineBlue">Ładowanie dokumentów...</p>
        </div>
      </div>
    );
  }

  const documentTypes = [
    { value: 'contract', label: 'Umowa' },
    { value: 'consent', label: 'Zgoda' },
    { value: 'regulation', label: 'Regulamin' },
    { value: 'invoice', label: 'Faktura' },
    { value: 'other', label: 'Inne' },
  ];

  const documentStatuses = [
    { value: 'draft', label: 'Projekt', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Aktywny', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Wygasły', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Anulowany', color: 'bg-orange-100 text-orange-800' },
  ];

  const categories = [
    { value: 'Pensjonat', label: 'Pensjonat' },
    { value: 'Szkolenie', label: 'Szkolenie' },
    { value: 'Zgody', label: 'Zgody' },
    { value: 'Regulaminy', label: 'Regulaminy' },
    { value: 'Weterynarz', label: 'Weterynarz' },
    { value: 'Inne', label: 'Inne' },
  ];

  const handleAdd = () => {
    setFormData({
      name: '',
      type: 'contract',
      category: '',
      description: '',
      clientId: '',
      clientName: '',
      horseId: '',
      horseName: '',
      issueDate: '',
      expiryDate: '',
      status: 'draft',
      signed: false,
      signedBy: '',
      signedDate: '',
      fileUrl: '',
      notes: '',
    });
    setEditingDocument(null);
    setShowAddModal(true);
  };

  const handleEdit = (document: Document) => {
    setFormData({
      name: document.name,
      type: document.type,
      category: document.category,
      description: document.description,
      clientId: document.clientId || '',
      clientName: document.clientName || '',
      horseId: document.horseId || '',
      horseName: document.horseName || '',
      issueDate: document.issueDate,
      expiryDate: document.expiryDate || '',
      status: document.status,
      signed: document.signed,
      signedBy: document.signedBy || '',
      signedDate: document.signedDate || '',
      fileUrl: document.fileUrl || '',
      notes: document.notes,
    });
    setEditingDocument(document);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (error) {
      console.error('Delete document error:', error);
      alert('Nie udało się usunąć dokumentu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDocument) {
        const { data } = await api.put(`/documents/${editingDocument.id}`, formData);
        setDocuments(documents.map(d => d.id === editingDocument.id ? data : d));
      } else {
        const { data } = await api.post('/documents', { ...formData, stableId: activeStableId });
        setDocuments([...documents, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save document error:', error);
      alert('Nie udało się zapisać dokumentu');
    }
  };

  const handleToggleSigned = async (id: string) => {
    try {
      const doc = documents.find(d => d.id === id);
      if (!doc) return;
      const { data } = await api.put(`/documents/${id}/toggle-signed`, {
        signed: !doc.signed,
        signedBy: !doc.signed ? 'Administrator' : '',
        signedDate: !doc.signed ? new Date().toISOString().split('T')[0] : '',
      });
      setDocuments(documents.map(d => d.id === id ? data : d));
    } catch (error) {
      console.error('Toggle signed error:', error);
      alert('Nie udało się zmienić statusu podpisu');
    }
  };

  const getDocumentStats = () => {
    const totalDocuments = documents.length;
    const activeDocuments = documents.filter(d => d.status === 'active').length;
    const signedDocuments = documents.filter(d => d.signed).length;
    const expiredDocuments = documents.filter(d => d.status === 'expired').length;
    const draftDocuments = documents.filter(d => d.status === 'draft').length;

    return {
      totalDocuments,
      activeDocuments,
      signedDocuments,
      expiredDocuments,
      draftDocuments,
    };
  };

  const stats = getDocumentStats();

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
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Dokumenty</h1>
              <p className="text-marineBlue">Zarządzaj umowami i dokumentami</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-oceanBlue" />
                <span className="text-sm text-marineBlue">Wszystkie</span>
              </div>
              <p className="text-2xl font-bold text-deepNavy">{stats.totalDocuments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-marineBlue">Podpisane</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.signedDocuments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-marineBlue">Aktywne</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.activeDocuments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-marineBlue">Projekty</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.draftDocuments}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-iceBlue p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-red-600" />
                <span className="text-sm text-marineBlue">Wygasłe</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.expiredDocuments}</p>
            </div>
          </div>

          {/* Add Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Dodaj dokument</span>
            </button>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-2xl shadow-lg border border-iceBlue p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-oceanBlue to-marineBlue flex items-center justify-center text-white">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-deepNavy">{document.name}</h3>
                        <p className="text-xs text-marineBlue">{document.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-marineBlue mb-3">{document.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(document)}
                      className="p-2 hover:bg-iceBlue rounded-lg transition-colors text-marineBlue hover:text-deepNavy"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-marineBlue">Typ:</span>
                    <span className="text-deepNavy">{documentTypes.find(t => t.value === document.type)?.label}</span>
                  </div>
                  {document.clientName && (
                    <div className="flex justify-between">
                      <span className="text-marineBlue">Klient:</span>
                      <span className="text-deepNavy">{document.clientName}</span>
                    </div>
                  )}
                  {document.horseName && (
                    <div className="flex justify-between">
                      <span className="text-marineBlue">Koń:</span>
                      <span className="text-deepNavy">{document.horseName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-marineBlue">Data:</span>
                    <span className="text-deepNavy">{document.issueDate}</span>
                  </div>
                  {document.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-marineBlue">Wygaśnięcie:</span>
                      <span className="text-deepNavy">{document.expiryDate}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${documentStatuses.find(s => s.value === document.status)?.color}`}>
                    {documentStatuses.find(s => s.value === document.status)?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${document.signed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {document.signed ? 'Podpisany' : 'Niepodpisany'}
                  </span>
                </div>

                <div className="flex gap-2 pt-4 border-t border-iceBlue">
                  <button
                    onClick={() => handleToggleSigned(document.id)}
                    className="flex-1 px-3 py-2 rounded-lg border border-iceBlue text-deepNavy hover:bg-iceBlue transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    {document.signed ? 'Cofnij podpis' : 'Podpisz'}
                  </button>
                  {document.fileUrl && (
                    <button
                      className="px-3 py-2 rounded-lg bg-oceanBlue text-white hover:bg-marineBlue transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Pobierz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingDocument ? 'Edytuj dokument' : 'Dodaj dokument'}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Typ</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Document['type'] })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Kategoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
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

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Klient</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => {
                      const client = clients.find((c: any) => c.id === e.target.value);
                      setFormData({ ...formData, clientId: e.target.value, clientName: client ? `${client.user.firstName} ${client.user.lastName}` : '' });
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
                    value={formData.horseId}
                    onChange={(e) => {
                      const horse = horses.find((h: any) => h.id === e.target.value);
                      setFormData({ ...formData, horseId: e.target.value, horseName: horse ? horse.name : '' });
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
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deepNavy mb-2">Data wygaśnięcia</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Document['status'] })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {documentStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.signed}
                      onChange={(e) => setFormData({ ...formData, signed: e.target.checked })}
                      className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                    />
                    <span className="text-sm text-deepNavy">Podpisany</span>
                  </label>
                </div>

                {formData.signed && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Podpisany przez</label>
                      <input
                        type="text"
                        value={formData.signedBy}
                        onChange={(e) => setFormData({ ...formData, signedBy: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-deepNavy mb-2">Data podpisu</label>
                      <input
                        type="date"
                        value={formData.signedDate}
                        onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">URL pliku</label>
                  <input
                    type="text"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
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
                    {editingDocument ? 'Zapisz zmiany' : 'Dodaj'}
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
