import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import {
  BellIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Name, email, role, and photo',
    icon: UserCircleIcon,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password and account security',
    icon: LockClosedIcon,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Choose the updates you receive',
    icon: BellIcon,
  },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab)
    ? (requestedTab as TabId)
    : 'profile';

  const setActiveTab = (tab: TabId) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-2 text-neutral-600">
          Manage your profile, security, and notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2 lg:flex-col lg:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors lg:min-w-0 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium">{tab.label}</span>
                    <span className="hidden text-xs text-neutral-400 lg:block">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </DashboardLayout>
  );
}
