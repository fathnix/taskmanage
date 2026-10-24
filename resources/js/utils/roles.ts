export type UserRole = 'admin' | 'project_manager' | 'qa' | 'member' | 'client';

export type RolePermission = 'viewProjects' | 'viewTasks' | 'createTasks' | 'manageSettings';

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

// Roles that can be chosen at sign-up. Admin is assigned manually.
export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'project_manager',
    label: 'Project Manager',
    description: 'Manage projects, tasks, and team settings',
  },
  {
    value: 'qa',
    label: 'QA',
    description: 'Review and verify task quality',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Work on assigned tasks',
  },
  {
    value: 'client',
    label: 'Client',
    description: 'View project progress',
  },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  qa: 'QA',
  member: 'Member',
  client: 'Client',
};

const ROLE_PERMISSIONS: Record<UserRole, RolePermission[]> = {
  admin: ['manageSettings'],
  project_manager: ['viewProjects', 'viewTasks', 'createTasks', 'manageSettings'],
  qa: ['viewProjects', 'viewTasks'],
  member: ['viewProjects', 'viewTasks'],
  client: ['viewProjects', 'viewTasks'],
};

export const ALL_ROLES: UserRole[] = ['admin', 'project_manager', 'qa', 'member', 'client'];
export const ADMIN_ROLES: UserRole[] = ['admin'];
export const MANAGER_ROLES: UserRole[] = ['project_manager'];
export const TASK_ROLES: UserRole[] = ['project_manager', 'qa', 'member', 'client'];
export const PROJECT_ROLES: UserRole[] = ['project_manager', 'qa', 'member', 'client'];
export const USER_MANAGEMENT_ROLES: UserRole[] = ['project_manager', 'qa'];
export const USER_PAGE_ROLES: UserRole[] = ['admin', ...USER_MANAGEMENT_ROLES];
export const HELP_ROLES: UserRole[] = ['project_manager', 'qa'];

export function getRoleLabel(role: UserRole | null | undefined): string {
  return role ? ROLE_LABELS[role] : '';
}

export function can(role: UserRole | null | undefined, permission: RolePermission): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}

export function hasRoleAccess(role: UserRole | null | undefined, allowed: UserRole[]): boolean {
  return !!role && allowed.includes(role);
}
