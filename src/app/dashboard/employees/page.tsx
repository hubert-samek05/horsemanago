'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileNav from '@/components/dashboard/MobileNav';
import Image from 'next/image';
import { Menu, Plus, Search, X, Edit2, Trash2, User, Shield, Key, Mail, Phone, Calendar, Lock, Copy, Check } from 'lucide-react';
import api from '@/lib/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'instructor' | 'school' | 'boarder';
  color: string;
  hireDate: string;
  specialization?: string;
  certifications?: string[];
  hourlyRate?: number;
  ridesCount: number;
  workingDays: number;
  workingHours?: Record<string, { open: string; close: string; enabled: boolean }>;
  absences?: Array<{ id: string; startDate: string; endDate: string; type: 'vacation' | 'sick' | 'other'; reason?: string }>;
  permissions: {
    manageCalendar: boolean;
    manageHorses: boolean;
    manageClients: boolean;
    manageEmployees: boolean;
    manageFinances: boolean;
    viewAllData: boolean;
  };
  hasAccount: boolean;
  accountUsername?: string;
  accountPassword?: string;
  accountStatus?: 'active' | 'pending' | 'suspended';
}

interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultPermissions: {
    manageCalendar: boolean;
    manageHorses: boolean;
    manageClients: boolean;
    manageEmployees: boolean;
    manageFinances: boolean;
    viewAllData: boolean;
  };
  color: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isAuthenticated, activeStableId } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'permissions' | 'stats' | 'schedule' | 'absences'>('info');
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceFormData, setAbsenceFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation' as 'vacation' | 'sick' | 'other',
    reason: '',
  });
  const [selectedEmployeeForAccount, setSelectedEmployeeForAccount] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'instructor' as Employee['role'],
    color: 'bg-oceanBlue',
    hireDate: '',
    specialization: '',
    certifications: [] as string[],
    hourlyRate: '',
    workingHours: {
      'Poniedziałek': { open: '08:00', close: '20:00', enabled: true },
      'Wtorek': { open: '08:00', close: '20:00', enabled: true },
      'Środa': { open: '08:00', close: '20:00', enabled: true },
      'Czwartek': { open: '08:00', close: '20:00', enabled: true },
      'Piątek': { open: '08:00', close: '20:00', enabled: true },
      'Sobota': { open: '09:00', close: '18:00', enabled: true },
      'Niedziela': { open: '09:00', close: '16:00', enabled: true },
    } as Record<string, { open: string; close: string; enabled: boolean }>,
  });

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    id: '',
    name: '',
    label: '',
    description: '',
    defaultPermissions: {
      manageCalendar: false,
      manageHorses: false,
      manageClients: false,
      manageEmployees: false,
      manageFinances: false,
      viewAllData: false,
    },
    color: 'bg-oceanBlue',
  });

  const [accountFormData, setAccountFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [sendInvite, setSendInvite] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  if (!isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStableId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadData = async () => {
      try {
        const { data } = await api.get(`/employees?stableId=${activeStableId}`);
        setEmployees(data || []);
      } catch (error) {
        console.error('Load employees error:', error);
        setEmployees([]);
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
          <p className="text-marineBlue">Ładowanie pracowników...</p>
        </div>
      </div>
    );
  }

  const colors = [
    { value: 'bg-oceanBlue', label: 'Ocean Blue' },
    { value: 'bg-marineBlue', label: 'Marine Blue' },
    { value: 'bg-deepNavy', label: 'Deep Navy' },
    { value: 'bg-arcticBlue', label: 'Arctic Blue' },
    { value: 'bg-red-500', label: 'Czerwony' },
    { value: 'bg-green-500', label: 'Zielony' },
    { value: 'bg-yellow-500', label: 'Żółty' },
    { value: 'bg-orange-500', label: 'Pomarańczowy' },
    { value: 'bg-purple-500', label: 'Fioletowy' },
    { value: 'bg-pink-500', label: 'Różowy' },
    { value: 'bg-gray-500', label: 'Szary' },
    { value: 'bg-teal-500', label: 'Turkusowy' },
    { value: 'bg-indigo-500', label: 'Indygo' },
  ];

  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'owner',
      name: 'owner',
      label: 'Właściciel',
      description: 'Pełna kontrola nad stajnią',
      defaultPermissions: {
        manageCalendar: true,
        manageHorses: true,
        manageClients: true,
        manageEmployees: true,
        manageFinances: true,
        viewAllData: true,
      },
      color: 'bg-deepNavy',
    },
    {
      id: 'manager',
      name: 'manager',
      label: 'Menadżer',
      description: 'Zarządzanie operacyjne stajni',
      defaultPermissions: {
        manageCalendar: true,
        manageHorses: true,
        manageClients: true,
        manageEmployees: true,
        manageFinances: true,
        viewAllData: true,
      },
      color: 'bg-marineBlue',
    },
    {
      id: 'instructor',
      name: 'instructor',
      label: 'Instruktor',
      description: 'Prowadzi lekcje jazdy konnej',
      defaultPermissions: {
        manageCalendar: true,
        manageHorses: true,
        manageClients: true,
        manageEmployees: false,
        manageFinances: false,
        viewAllData: false,
      },
      color: 'bg-oceanBlue',
    },
    {
      id: 'school',
      name: 'school',
      label: 'Szkółka',
      description: 'Zarządzanie szkołą jazdy',
      defaultPermissions: {
        manageCalendar: true,
        manageHorses: true,
        manageClients: true,
        manageEmployees: false,
        manageFinances: false,
        viewAllData: false,
      },
      color: 'bg-arcticBlue',
    },
    {
      id: 'boarder',
      name: 'boarder',
      label: 'Pensjonariusze',
      description: 'Właściciele koni w pensjonacie',
      defaultPermissions: {
        manageCalendar: false,
        manageHorses: false,
        manageClients: false,
        manageEmployees: false,
        manageFinances: false,
        viewAllData: false,
      },
      color: 'bg-arcticBlue',
    },
  ]);

  const roleLabels: Record<Employee['role'], string> = {
    owner: 'Właściciel',
    manager: 'Menadżer',
    instructor: 'Instruktor',
    school: 'Szkółka',
    boarder: 'Pensjonariusze',
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone.includes(searchTerm)
  );

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditRole = (role: Role) => {
    setRoleFormData({
      id: role.id,
      name: role.name,
      label: role.label,
      description: role.description,
      defaultPermissions: { ...role.defaultPermissions },
      color: role.color,
    });
    setEditingRole(role);
    setShowEditRoleModal(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    setRoles(roles.map(r => 
      r.id === roleFormData.id ? { ...roleFormData } : r
    ));
    setShowEditRoleModal(false);
    setEditingRole(null);
  };

  const handleAddEmployee = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      role: 'instructor', 
      color: 'bg-oceanBlue',
      hireDate: '',
      specialization: '',
      certifications: [],
      hourlyRate: '',
      workingHours: {
        'Poniedziałek': { open: '08:00', close: '20:00', enabled: true },
        'Wtorek': { open: '08:00', close: '20:00', enabled: true },
        'Środa': { open: '08:00', close: '20:00', enabled: true },
        'Czwartek': { open: '08:00', close: '20:00', enabled: true },
        'Piątek': { open: '08:00', close: '20:00', enabled: true },
        'Sobota': { open: '09:00', close: '18:00', enabled: true },
        'Niedziela': { open: '09:00', close: '16:00', enabled: true },
      } as Record<string, { open: string; close: string; enabled: boolean }>,
    });
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const handleCreateAccount = (employee: Employee) => {
    setSelectedEmployeeForAccount(employee);
    setAccountFormData({
      username: employee.email.split('@')[0],
      password: '',
      confirmPassword: '',
    });
    setGeneratedPassword('');
    setShowAccountModal(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    setAccountFormData({ ...accountFormData, password, confirmPassword: password });
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeForAccount || !activeStableId) {
      alert('Błąd: Brak danych pracownika lub stajni');
      return;
    }

    try {
      const roleMapping: Record<string, 'INSTRUCTOR' | 'STABLE_WORKER'> = {
        instructor: 'INSTRUCTOR',
        school: 'INSTRUCTOR',
        boarder: 'STABLE_WORKER',
        manager: 'STABLE_WORKER',
      };

      const apiRole = roleMapping[selectedEmployeeForAccount.role] || 'STABLE_WORKER';

      await api.post('/auth/create-employee', {
        email: selectedEmployeeForAccount.email,
        firstName: selectedEmployeeForAccount.name.split(' ')[0] || selectedEmployeeForAccount.name,
        lastName: selectedEmployeeForAccount.name.split(' ').slice(1).join('') || 'Pracownik',
        role: apiRole,
        stableId: activeStableId,
      });

      setEmployees(employees.map(e =>
        e.id === selectedEmployeeForAccount.id
          ? {
              ...e,
              hasAccount: true,
              accountUsername: selectedEmployeeForAccount.email.split('@')[0],
              accountStatus: 'pending',
            }
          : e
      ));

      alert(`Zaproszenie zostało wysłane na ${selectedEmployeeForAccount.email}. Pracownik otrzyma maila z linkiem do ustawienia hasła.`);
      setShowAccountModal(false);
    } catch (error: any) {
      console.error('Create employee account error:', error);
      alert(error.response?.data?.error || 'Nie udało się utworzyć konta pracownika');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      color: employee.color,
      hireDate: employee.hireDate,
      specialization: employee.specialization || '',
      certifications: employee.certifications || [],
      hourlyRate: employee.hourlyRate?.toString() || '',
      workingHours: employee.workingHours || {
        'Poniedziałek': { open: '08:00', close: '20:00', enabled: true },
        'Wtorek': { open: '08:00', close: '20:00', enabled: true },
        'Środa': { open: '08:00', close: '20:00', enabled: true },
        'Czwartek': { open: '08:00', close: '20:00', enabled: true },
        'Piątek': { open: '08:00', close: '20:00', enabled: true },
        'Sobota': { open: '09:00', close: '18:00', enabled: true },
        'Niedziela': { open: '09:00', close: '16:00', enabled: true },
      } as Record<string, { open: string; close: string; enabled: boolean }>,
    });
    setEditingEmployee(employee);
    setShowAddModal(true);
  };

  const handleUpdatePermissions = (employeeId: string, permission: keyof Employee['permissions'], value: boolean) => {
    setEmployees(employees.map(e => 
      e.id === employeeId 
        ? { ...e, permissions: { ...e.permissions, [permission]: value } }
        : e
    ));
  };

  const handleApplyRolePermissions = (employeeId: string, roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setEmployees(employees.map(e => 
        e.id === employeeId 
          ? { ...e, permissions: { ...role.defaultPermissions } }
          : e
      ));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(employees.filter(e => e.id !== id));
    } catch (error) {
      console.error('Delete employee error:', error);
      alert('Nie udało się usunąć pracownika');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = roles.find(r => r.id === formData.role);
    const employeeData = {
      ...formData,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      ridesCount: 0,
      workingDays: 0,
      workingHours: formData.workingHours,
      absences: [],
      permissions: role ? { ...role.defaultPermissions } : {
        manageCalendar: false,
        manageHorses: false,
        manageClients: false,
        manageEmployees: false,
        manageFinances: false,
        viewAllData: false,
      },
      hasAccount: false,
      stableId: activeStableId,
    };

    try {
      if (editingEmployee) {
        const { data } = await api.put(`/employees/${editingEmployee.id}`, employeeData);
        setEmployees(employees.map(e => e.id === editingEmployee.id ? data : e));
      } else {
        const { data } = await api.post('/employees', employeeData);
        setEmployees([...employees, data]);
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Save employee error:', error);
      alert('Nie udało się zapisać pracownika');
    }
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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-deepNavy mb-1">Pracownicy</h1>
              <p className="text-marineBlue text-sm">Zarządzaj personelem, rolami i kontami</p>
            </div>
            <button
              onClick={handleAddEmployee}
              className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-5 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Dodaj pracownika</span>
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marineBlue w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj pracownika lub roli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-iceBlue rounded-2xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy placeholder:text-marineBlue/60"
            />
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                activeTab === 'employees'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Pracownicy
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                activeTab === 'roles'
                  ? 'bg-gradient-to-r from-oceanBlue to-marineBlue text-white shadow-md'
                  : 'bg-white text-deepNavy hover:bg-iceBlue'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Role
            </button>
          </div>

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              <div className="hidden lg:block bg-white rounded-3xl shadow-lg border border-iceBlue overflow-hidden">
                <table className="w-full">
                  <thead className="bg-arcticBlue/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Pracownik</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Kontakt</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Rola</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Specjalizacja</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-deepNavy">Konto</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-deepNavy">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-iceBlue">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} onClick={() => setSelectedEmployee(employee)} className="hover:bg-iceBlue/20 cursor-pointer transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${employee.color} flex items-center justify-center text-white font-bold shadow-md`}>
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-deepNavy">{employee.name}</div>
                              {employee.hourlyRate ? <div className="text-xs text-marineBlue">{employee.hourlyRate} zł/h</div> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-sm text-marineBlue">
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {employee.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {employee.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-iceBlue text-deepNavy">
                            {roleLabels[employee.role as keyof typeof roleLabels] || employee.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-marineBlue">{employee.specialization || '-'}</td>
                        <td className="px-6 py-4">
                          {employee.hasAccount ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${employee.accountStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {employee.accountStatus === 'pending' ? 'Oczekujące' : 'Aktywne'}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCreateAccount(employee); }}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue hover:text-white transition-colors"
                            >
                              Utwórz konto
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditEmployee(employee); }}
                              className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee.id); }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
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

              {filteredEmployees.length === 0 && (
                <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-10 h-10 text-oceanBlue" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak pracowników</h3>
                  <p className="text-marineBlue mb-6">Dodaj pierwszego pracownika i zarządzaj zespołem</p>
                  <button
                    onClick={handleAddEmployee}
                    className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Dodaj pierwszego pracownika
                  </button>
                </div>
              )}

              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredEmployees.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-lg border border-iceBlue p-8 text-center sm:col-span-2">
                    <div className="w-20 h-20 rounded-full bg-arcticBlue/50 flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-10 h-10 text-oceanBlue" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-deepNavy mb-2">Brak pracowników</h3>
                    <p className="text-marineBlue mb-6">Dodaj pierwszego pracownika i zarządzaj zespołem</p>
                    <button
                      onClick={handleAddEmployee}
                      className="bg-gradient-to-r from-oceanBlue to-marineBlue text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Dodaj pierwszego pracownika
                    </button>
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div key={employee.id} onClick={() => setSelectedEmployee(employee)} className="bg-white rounded-2xl p-4 shadow-md border border-iceBlue hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${employee.color} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-deepNavy">{employee.name}</div>
                            <div className="text-xs text-marineBlue">{roleLabels[employee.role as keyof typeof roleLabels] || employee.role}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-marineBlue space-y-1 mb-3">
                        <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {employee.email}</div>
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {employee.phone}</div>
                        <div>{employee.specialization || 'Brak specjalizacji'}</div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {employee.hasAccount ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${employee.accountStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {employee.accountStatus === 'pending' ? 'Oczekujące' : 'Aktywne'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCreateAccount(employee)}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-oceanBlue/10 text-oceanBlue hover:bg-oceanBlue hover:text-white transition-colors"
                          >
                            Utwórz konto
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditEmployee(employee)} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteEmployee(employee.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-2xl p-5 shadow-md border border-iceBlue hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${role.color} flex items-center justify-center text-white shadow-md`}>
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-deepNavy">{role.label}</h3>
                        <p className="text-xs text-marineBlue">{role.description}</p>
                      </div>
                    </div>
                    <button onClick={() => handleEditRole(role)} className="p-2 text-oceanBlue hover:bg-oceanBlue/10 rounded-xl transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(role.defaultPermissions).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        manageCalendar: 'Kalendarz',
                        manageHorses: 'Konie',
                        manageClients: 'Klienci',
                        manageEmployees: 'Pracownicy',
                        manageFinances: 'Finanse',
                        viewAllData: 'Wszystkie dane',
                      };
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-marineBlue">{labels[key]}</span>
                          <span className={value ? 'text-green-600 font-semibold' : 'text-gray-400'}>{value ? 'Tak' : 'Nie'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-iceBlue shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full ${selectedEmployee.color} flex items-center justify-center text-white text-xl font-bold shadow-md`}>
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-deepNavy">{selectedEmployee.name}</h2>
                    <p className="text-sm text-marineBlue">{roleLabels[selectedEmployee.role]} · {selectedEmployee.specialization || 'Brak specjalizacji'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-iceBlue rounded-xl transition-colors">
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="bg-arcticBlue/40 rounded-2xl p-3 text-center">
                  <p className="text-xs text-marineBlue">Jazdy</p>
                  <p className="text-xl font-bold text-deepNavy">{selectedEmployee.ridesCount}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-3 text-center">
                  <p className="text-xs text-marineBlue">Dni pracy</p>
                  <p className="text-xl font-bold text-oceanBlue">{selectedEmployee.workingDays}</p>
                </div>
                <div className="bg-arcticBlue/40 rounded-2xl p-3 text-center">
                  <p className="text-xs text-marineBlue">Stawka</p>
                  <p className="text-xl font-bold text-marineBlue">{selectedEmployee.hourlyRate ? `${selectedEmployee.hourlyRate} zł/h` : '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex border-b border-iceBlue shrink-0 overflow-x-auto">
              {(['info','permissions','stats','schedule','absences'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${detailTab === tab ? 'text-oceanBlue border-b-2 border-oceanBlue bg-oceanBlue/5' : 'text-marineBlue hover:text-deepNavy'}`}
                >
                  {tab === 'info' ? 'Informacje' : tab === 'permissions' ? 'Uprawnienia' : tab === 'stats' ? 'Statystyki' : tab === 'schedule' ? 'Harmonogram' : 'Nieobecności'}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
              {detailTab === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-arcticBlue/40 rounded-2xl p-4 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Email</p>
                      <p className="font-semibold text-deepNavy text-sm">{selectedEmployee.email}</p>
                    </div>
                  </div>
                  <div className="bg-arcticBlue/40 rounded-2xl p-4 flex items-center gap-3">
                    <Phone className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Telefon</p>
                      <p className="font-semibold text-deepNavy text-sm">{selectedEmployee.phone}</p>
                    </div>
                  </div>
                  <div className="bg-arcticBlue/40 rounded-2xl p-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Rola</p>
                      <p className="font-semibold text-deepNavy text-sm">{roleLabels[selectedEmployee.role]}</p>
                    </div>
                  </div>
                  <div className="bg-arcticBlue/40 rounded-2xl p-4 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-oceanBlue" />
                    <div>
                      <p className="text-xs text-marineBlue">Data zatrudnienia</p>
                      <p className="font-semibold text-deepNavy text-sm">{selectedEmployee.hireDate}</p>
                    </div>
                  </div>
                  {selectedEmployee.certifications && selectedEmployee.certifications.length > 0 && (
                    <div className="bg-arcticBlue/40 rounded-2xl p-4 sm:col-span-2">
                      <p className="text-xs text-marineBlue mb-2">Certyfikaty</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployee.certifications.map((cert, i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white text-deepNavy border border-iceBlue">{cert}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-arcticBlue/40 rounded-2xl p-4 sm:col-span-2">
                    <p className="text-xs text-marineBlue mb-1">Konto</p>
                    <p className="font-semibold text-deepNavy text-sm">
                      {selectedEmployee.hasAccount ? (selectedEmployee.accountStatus === 'pending' ? 'Oczekujące zaproszenie' : 'Aktywne') : 'Nieutworzone'}
                    </p>
                  </div>
                </div>
              )}
              {detailTab === 'permissions' && (
                <div className="space-y-2">
                  {Object.entries(selectedEmployee.permissions).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      manageCalendar: 'Kalendarz',
                      manageHorses: 'Konie',
                      manageClients: 'Klienci',
                      manageEmployees: 'Pracownicy',
                      manageFinances: 'Finanse',
                      viewAllData: 'Wszystkie dane',
                    };
                    return (
                      <div key={key} className="bg-white border border-iceBlue rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <span className="text-sm text-deepNavy font-medium">{labels[key]}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{value ? 'Tak' : 'Nie'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {detailTab === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-oceanBlue to-marineBlue rounded-2xl p-5 text-white shadow-md">
                    <p className="text-sm opacity-90 mb-1">Przepracowane jazdy</p>
                    <p className="text-3xl font-bold">{selectedEmployee.ridesCount}</p>
                  </div>
                  <div className="bg-white border border-iceBlue rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-marineBlue mb-1">Dni pracy</p>
                    <p className="text-3xl font-bold text-deepNavy">{selectedEmployee.workingDays}</p>
                  </div>
                  <div className="bg-white border border-iceBlue rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-marineBlue mb-1">Średnia jazd / dzień</p>
                    <p className="text-3xl font-bold text-deepNavy">{selectedEmployee.workingDays ? (selectedEmployee.ridesCount / selectedEmployee.workingDays).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="bg-white border border-iceBlue rounded-2xl p-5 shadow-sm sm:col-span-3">
                    <p className="text-xs text-marineBlue mb-1">Stawka godzinowa</p>
                    <p className="text-2xl font-bold text-deepNavy">{selectedEmployee.hourlyRate ? `${selectedEmployee.hourlyRate} zł/h` : 'Nieokreślona'}</p>
                  </div>
                </div>
              )}
              {detailTab === 'schedule' && (
                <div className="space-y-3">
                  {selectedEmployee.workingHours ? (() => {
                    const hours = selectedEmployee.workingHours;
                    return Object.keys(hours).map((day) => (
                      <div key={day} className="bg-white border border-iceBlue rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${hours[day].enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="font-medium text-deepNavy">{day}</span>
                          </div>
                          <div className="text-sm text-marineBlue">
                            {hours[day].enabled
                              ? `${hours[day].open} - ${hours[day].close}`
                              : 'Niepracuje'}
                          </div>
                        </div>
                      </div>
                    ));
                  })() : (
                    <div className="text-center py-8 text-marineBlue">
                      Brak harmonogramu pracy
                    </div>
                  )}
                </div>
              )}
              {detailTab === 'absences' && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setAbsenceFormData({ startDate: '', endDate: '', type: 'vacation', reason: '' });
                      setShowAbsenceModal(true);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Dodaj nieobecność
                  </button>
                  <div className="space-y-2">
                    {selectedEmployee.absences && selectedEmployee.absences.length > 0 ? (
                      selectedEmployee.absences.map((absence) => (
                        <div key={absence.id} className="bg-white border border-iceBlue rounded-2xl p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  absence.type === 'vacation' ? 'bg-blue-100 text-blue-700' :
                                  absence.type === 'sick' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {absence.type === 'vacation' ? 'Urlop' : absence.type === 'sick' ? 'Choroba' : 'Inne'}
                                </span>
                                <span className="text-sm text-deepNavy font-medium">{absence.startDate} - {absence.endDate}</span>
                              </div>
                              {absence.reason && <p className="text-sm text-marineBlue">{absence.reason}</p>}
                            </div>
                            <button
                              onClick={() => {
                                setEmployees(employees.map(e =>
                                  e.id === selectedEmployee.id
                                    ? { ...e, absences: e.absences?.filter((a: any) => a.id !== absence.id) || [] }
                                    : e
                                ));
                                setSelectedEmployee({
                                  ...selectedEmployee,
                                  absences: selectedEmployee.absences?.filter((a: any) => a.id !== absence.id) || []
                                });
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-marineBlue">
                        Brak nieobecności
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 sm:p-6 border-t border-iceBlue shrink-0 flex gap-3">
              <button onClick={() => { setSelectedEmployee(null); handleEditEmployee(selectedEmployee); }} className="flex-1 px-4 py-3 border border-oceanBlue text-oceanBlue rounded-2xl font-semibold hover:bg-oceanBlue/5 transition-colors">Edytuj pracownika</button>
              <button onClick={() => { setSelectedEmployee(null); handleDeleteEmployee(selectedEmployee.id); }} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors">Usuń pracownika</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-none shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  {editingEmployee ? 'Edytuj pracownika' : 'Dodaj pracownika'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Imię i nazwisko</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Rola</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Employee['role'] })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-marineBlue mt-1">Uprawnienia zostaną ustawione automatycznie na podstawie roli</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data zatrudnienia</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                    style={{ boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Specjalizacja</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="np. Ujeżdżenie, Skoki, Pielęgnacja"
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Certyfikaty (oddzielone przecinkami)</label>
                  <input
                    type="text"
                    value={formData.certifications.join(', ')}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
                    placeholder="np. PZJ Instruktor, Trener II klasy"
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Stawka godzinowa (zł)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="np. 80"
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Kolor w kalendarzu</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.color === color.value
                            ? `${color.value} border-transparent shadow-lg`
                            : 'border-iceBlue hover:border-oceanBlue'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded ${color.value} mx-auto`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Harmonogram pracy</label>
                  <div className="space-y-2">
                    {Object.keys(formData.workingHours).map((day) => (
                      <div key={day} className="flex items-center gap-2 p-2 bg-arcticBlue/30 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.workingHours[day].enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            workingHours: {
                              ...formData.workingHours,
                              [day]: { ...formData.workingHours[day], enabled: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                        />
                        <span className="flex-1 text-sm text-deepNavy">{day}</span>
                        <input
                          type="time"
                          value={formData.workingHours[day].open}
                          onChange={(e) => setFormData({
                            ...formData,
                            workingHours: {
                              ...formData.workingHours,
                              [day]: { ...formData.workingHours[day], open: e.target.value }
                            }
                          })}
                          className="w-24 px-2 py-1 bg-white border border-iceBlue rounded-lg text-sm text-deepNavy"
                          disabled={!formData.workingHours[day].enabled}
                        />
                        <span className="text-sm text-marineBlue">-</span>
                        <input
                          type="time"
                          value={formData.workingHours[day].close}
                          onChange={(e) => setFormData({
                            ...formData,
                            workingHours: {
                              ...formData.workingHours,
                              [day]: { ...formData.workingHours[day], close: e.target.value }
                            }
                          })}
                          className="w-24 px-2 py-1 bg-white border border-iceBlue rounded-lg text-sm text-deepNavy"
                          disabled={!formData.workingHours[day].enabled}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-iceBlue rounded-2xl text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl hover:shadow-lg transition-all font-semibold"
                  >
                    {editingEmployee ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Account Creation Modal */}
      {showAccountModal && selectedEmployeeForAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-none shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  Utwórz konto dla {selectedEmployeeForAccount.name}
                </h2>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-iceBlue/30 rounded-xl">
                  <p className="text-sm text-deepNavy mb-2">
                    <strong>Email:</strong> {selectedEmployeeForAccount.email}
                  </p>
                  <p className="text-sm text-deepNavy mb-2">
                    <strong>Rola:</strong> {roleLabels[selectedEmployeeForAccount.role]}
                  </p>
                </div>

                <div className="p-4 bg-oceanBlue/10 rounded-xl border border-oceanBlue/20">
                  <p className="text-sm text-deepNavy">
                    Po kliknięciu "Wyślij zaproszenie", pracownik otrzyma email z linkiem do ustawienia hasła. Link będzie aktywny przez 48 godzin.
                  </p>
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(false)}
                      className="flex-1 px-4 py-3 border border-iceBlue rounded-2xl text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl hover:shadow-lg transition-all font-semibold"
                    >
                      Wyślij zaproszenie
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Absence Modal */}
      {showAbsenceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-none shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  Dodaj nieobecność dla {selectedEmployee.name}
                </h2>
                <button
                  onClick={() => setShowAbsenceModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const newAbsence = {
                  id: Date.now().toString(),
                  startDate: absenceFormData.startDate,
                  endDate: absenceFormData.endDate,
                  type: absenceFormData.type,
                  reason: absenceFormData.reason,
                };
                setEmployees(employees.map(emp =>
                  emp.id === selectedEmployee.id
                    ? { ...emp, absences: [...(emp.absences || []), newAbsence] }
                    : emp
                ));
                setSelectedEmployee({
                  ...selectedEmployee,
                  absences: [...(selectedEmployee.absences || []), newAbsence],
                });
                setShowAbsenceModal(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Typ nieobecności</label>
                  <select
                    value={absenceFormData.type}
                    onChange={(e) => setAbsenceFormData({ ...absenceFormData, type: e.target.value as 'vacation' | 'sick' | 'other' })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  >
                    <option value="vacation">Urlop</option>
                    <option value="sick">Choroba</option>
                    <option value="other">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data rozpoczęcia</label>
                  <input
                    type="date"
                    value={absenceFormData.startDate}
                    onChange={(e) => setAbsenceFormData({ ...absenceFormData, startDate: e.target.value })}
                    className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                    style={{ boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Data zakończenia</label>
                  <input
                    type="date"
                    value={absenceFormData.endDate}
                    onChange={(e) => setAbsenceFormData({ ...absenceFormData, endDate: e.target.value })}
                    className="w-full max-w-[200px] px-2 py-2 rounded-lg border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-xs sm:text-sm"
                    style={{ boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Powód (opcjonalnie)</label>
                  <textarea
                    value={absenceFormData.reason}
                    onChange={(e) => setAbsenceFormData({ ...absenceFormData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAbsenceModal(false)}
                    className="flex-1 px-4 py-3 border border-iceBlue rounded-2xl text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl hover:shadow-lg transition-all font-semibold"
                  >
                    Dodaj
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && editingRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-none shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold text-deepNavy">
                  Edytuj rolę: {roleFormData.label}
                </h2>
                <button
                  onClick={() => setShowEditRoleModal(false)}
                  className="p-2 hover:bg-iceBlue rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-deepNavy" />
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Nazwa roli</label>
                  <input
                    type="text"
                    value={roleFormData.label}
                    onChange={(e) => setRoleFormData({ ...roleFormData, label: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Opis</label>
                  <input
                    type="text"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    className="w-full max-w-full px-3 sm:px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:border-oceanBlue text-deepNavy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-3">Uprawnienia</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleFormData.defaultPermissions.manageCalendar}
                        onChange={(e) => setRoleFormData({ ...roleFormData, defaultPermissions: { ...roleFormData.defaultPermissions, manageCalendar: e.target.checked } })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zarządzaj kalendarzem</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleFormData.defaultPermissions.manageHorses}
                        onChange={(e) => setRoleFormData({ ...roleFormData, defaultPermissions: { ...roleFormData.defaultPermissions, manageHorses: e.target.checked } })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zarządzaj końmi</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleFormData.defaultPermissions.manageClients}
                        onChange={(e) => setRoleFormData({ ...roleFormData, defaultPermissions: { ...roleFormData.defaultPermissions, manageClients: e.target.checked } })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zarządzaj klientami</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleFormData.defaultPermissions.manageEmployees}
                        onChange={(e) => setRoleFormData({ ...roleFormData, defaultPermissions: { ...roleFormData.defaultPermissions, manageEmployees: e.target.checked } })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zarządzaj pracownikami</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleFormData.defaultPermissions.manageFinances}
                        onChange={(e) => setRoleFormData({ ...roleFormData, defaultPermissions: { ...roleFormData.defaultPermissions, manageFinances: e.target.checked } })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Zarządzaj finansami</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleFormData.defaultPermissions.viewAllData}
                        onChange={(e) => setRoleFormData({ ...roleFormData, defaultPermissions: { ...roleFormData.defaultPermissions, viewAllData: e.target.checked } })}
                        className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span className="text-sm text-deepNavy">Podgląd wszystkich danych</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deepNavy mb-2">Kolor</label>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setRoleFormData({ ...roleFormData, color: color.value })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          roleFormData.color === color.value
                            ? `${color.value} border-transparent shadow-lg`
                            : 'border-iceBlue hover:border-oceanBlue'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded ${color.value} mx-auto`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditRoleModal(false)}
                    className="flex-1 px-4 py-3 border border-iceBlue rounded-2xl text-deepNavy hover:bg-iceBlue/20 transition-colors font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-oceanBlue to-marineBlue text-white rounded-2xl hover:shadow-lg transition-all font-semibold"
                  >
                    Zapisz
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
