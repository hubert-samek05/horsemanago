export type Role = 'owner' | 'manager' | 'instructor' | 'receptionist' | 'groom' | 'stable_worker' | 'client';

export interface MenuItem {
  iconName: string;
  label: string;
  href: string;
  submenu?: { label: string; href: string; iconName: string }[];
}

export const roleLabels: Record<Role, string> = {
  owner: 'Właściciel',
  manager: 'Manager',
  instructor: 'Instruktor',
  receptionist: 'Recepcja',
  groom: 'Osoba do koni',
  stable_worker: 'Pracownik stajni',
  client: 'Klient',
};

export const roleMenuAccess: Record<Role, string[]> = {
  owner: [
    'dashboard', 'calendar', 'clients', 'employees', 'services', 'locations',
    'horses', 'veterinarians', 'farriers', 'boarding', 'camps', 'forms',
    'consents', 'checklists', 'competitions', 'passes', 'ride-payments',
    'statistics', 'finances', 'settings',
  ],
  manager: [
    'dashboard', 'calendar', 'clients', 'employees', 'services', 'locations',
    'horses', 'veterinarians', 'farriers', 'boarding', 'camps',
    'consents', 'checklists', 'competitions', 'passes', 'ride-payments',
    'statistics', 'finances', 'settings',
  ],
  instructor: [
    'dashboard', 'calendar', 'clients', 'horses', 'competitions', 'checklists', 'passes', 'ride-payments', 'settings',
  ],
  receptionist: [
    'dashboard', 'calendar', 'clients', 'services', 'locations', 'passes',
    'ride-payments', 'finances', 'checklists', 'settings',
  ],
  groom: [
    'dashboard', 'horses', 'veterinarians', 'farriers', 'checklists', 'settings',
  ],
  stable_worker: [
    'dashboard', 'calendar', 'horses', 'checklists', 'settings',
  ],
  client: ['dashboard', 'bookings', 'horses', 'subscriptions', 'settings'],
};

export function canAccess(role: Role | string, page: string): boolean {
  const r = (role || 'client') as Role;
  const allowed = roleMenuAccess[r] || [];
  return allowed.includes(page);
}

export const roleNameMap: Record<string, Role> = {
  STABLE_OWNER: 'owner',
  ADMIN: 'owner',
  OWNER: 'owner',
  MANAGER: 'manager',
  INSTRUCTOR: 'instructor',
  RECEPTIONIST: 'receptionist',
  GROOM: 'groom',
  STABLE_WORKER: 'stable_worker',
  CLIENT: 'client',
  owner: 'owner',
  manager: 'manager',
  instructor: 'instructor',
  receptionist: 'receptionist',
  groom: 'groom',
  stable_worker: 'stable_worker',
  client: 'client',
};

export function normalizeRole(raw?: string | null): Role {
  if (!raw) return 'owner';
  return roleNameMap[raw] || (raw.toLowerCase() as Role) || 'owner';
}

export function getDashboardRoute(role: Role | string): string {
  const r = normalizeRole(role);
  if (r === 'client') return '/dashboard';
  return '/dashboard';
}
