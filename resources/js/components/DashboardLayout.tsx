import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { getInitials } from '@/utils/helpers';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ClockIcon,
  FolderIcon,
  LifebuoyIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  ADMIN_ROLES,
  ALL_ROLES,
  HELP_ROLES,
  USER_MANAGEMENT_ROLES,
  PROJECT_ROLES,
  TASK_ROLES,
  getRoleLabel,
  hasRoleAccess,
  type UserRole,
} from '@/utils/roles';

interface NavigationChild {
  name: string;
  href: string;
  icon: typeof Squares2X2Icon;
  roles: UserRole[];
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: typeof Squares2X2Icon;
  roles: UserRole[];
  children?: NavigationChild[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon, roles: ALL_ROLES },
  {
    name: 'Project',
    icon: FolderIcon,
    roles: PROJECT_ROLES,
    children: [
      { name: 'Overview', href: '/projects', icon: FolderIcon, roles: PROJECT_ROLES },
      { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, roles: TASK_ROLES },
    ],
  },
  { name: 'Project Managers', href: '/users', icon: UsersIcon, roles: ADMIN_ROLES },
  { name: 'Time & Productivity', href: '/time-report', icon: ClockIcon, roles: ADMIN_ROLES },
  { name: 'Users', href: '/users', icon: UsersIcon, roles: USER_MANAGEMENT_ROLES },
  { name: 'Help', href: '/help', icon: LifebuoyIcon, roles: HELP_ROLES },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ALL_ROLES },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Project: true });
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileOpen]);

  const visibleNavigation = navigation
    .filter((item) => hasRoleAccess(user?.role, item.roles))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => hasRoleAccess(user?.role, child.roles)),
    }))
    .filter((item) => !item.children || item.children.length > 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Open navigation"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <Link to="/dashboard">
                <Logo />
              </Link>
            </div>
            <div ref={profileRef} className="relative flex items-center gap-3">
              <span className="hidden md:inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {getRoleLabel(user?.role)}
              </span>

              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Profile"
                title="Profile"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-7 w-7" aria-hidden="true" />
                )}
                {!profileOpen && (
                  <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    Profile
                  </span>
                )}
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
                >
                  <div className="flex items-center gap-3 p-4">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-700">
                        {getInitials(user?.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-900">{user?.name}</p>
                      <p className="truncate text-sm text-neutral-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-neutral-100 p-2">
                    <Link
                      to="/settings?tab=profile"
                      onClick={() => setProfileOpen(false)}
                      className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Edit Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-neutral-900/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-neutral-200 transition-transform duration-200 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200 md:hidden">
            <Logo />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
              aria-label="Close navigation"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const isGroupActive = item.children.some((child) => location.pathname === child.href);
                const isOpen = openGroups[item.name] ?? isGroupActive;

                return (
                  <div key={item.name}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [item.name]: !(current[item.name] ?? isGroupActive),
                        }))
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isGroupActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.href;

                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                isChildActive
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                              }`}
                            >
                              <ChildIcon className="h-4 w-4" aria-hidden="true" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href ?? '#'}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
