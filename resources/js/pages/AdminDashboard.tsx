import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { api, type AdminUser } from '@/services/api';
import { ROLE_OPTIONS } from '@/utils/roles';
import {
  ChartBarIcon,
  FolderIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      const [usersResponse, projectsResponse] = await Promise.all([
        api.getUsers(),
        api.getProjects(),
      ]);

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data.users);
      } else {
        setError(usersResponse.message || 'Failed to load dashboard data.');
      }

      if (projectsResponse.success && projectsResponse.data) {
        setTotalProjects(projectsResponse.data.projects.length);
      }

      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const productivity = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const activeWorkload = ROLE_OPTIONS.map((role) => ({
    role: role.label,
    count: users.filter((user) => user.role === role.value && user.is_active).length,
  }));
  const maxWorkload = Math.max(1, ...activeWorkload.map((item) => item.count));

  const stats = [
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: FolderIcon,
      color: 'bg-pastel-blue-100 text-pastel-blue-600',
    },
    {
      label: 'Active Users',
      value: activeUsers,
      icon: UsersIcon,
      color: 'bg-pastel-green-100 text-pastel-green-600',
    },
    {
      label: 'Inactive Users',
      value: inactiveUsers,
      icon: UserMinusIcon,
      color: 'bg-pastel-orange-100 text-pastel-orange-600',
    },
    {
      label: 'Productivity',
      value: `${productivity}%`,
      icon: ChartBarIcon,
      color: 'bg-pastel-purple-100 text-pastel-purple-600',
    },
  ];

  return (
    <>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-2 text-neutral-600">
          Overview of projects, users, and team workload.
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" aria-label="Loading" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <Card
                  key={stat.label}
                  variant="elevated"
                  padding="lg"
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold text-neutral-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Productivity Metrics</CardTitle>
                <CardDescription>Active accounts across the team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold text-neutral-900">{productivity}%</p>
                    <p className="text-sm text-neutral-500">of accounts are active</p>
                  </div>
                  <span className="rounded-full bg-pastel-green-100 px-3 py-1 text-xs font-medium text-pastel-green-700">
                    {activeUsers} active
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pastel-green-400 to-pastel-green-600 transition-all duration-500"
                    style={{ width: `${productivity}%` }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">{totalUsers}</p>
                    <p className="text-xs text-neutral-500">Total users</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-pastel-green-600">{activeUsers}</p>
                    <p className="text-xs text-neutral-500">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-pastel-orange-600">{inactiveUsers}</p>
                    <p className="text-xs text-neutral-500">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
                <CardDescription>Active users grouped by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeWorkload.map((item) => (
                    <div key={item.role}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-700">{item.role}</span>
                        <span className="text-neutral-500">{item.count}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                          style={{ width: `${(item.count / maxWorkload) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
