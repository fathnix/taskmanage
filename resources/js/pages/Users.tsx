import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { api, type AdminUser } from '@/services/api';
import { getInitials } from '@/utils/helpers';

type Filter = 'all' | 'pending' | 'active';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
];

export function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const loadUsers = async () => {
      const response = await api.getUsers();

      if (response.success && response.data) {
        setUsers(response.data.users);
      } else {
        setError(response.message || 'Failed to load users.');
      }

      setIsLoading(false);
    };

    loadUsers();
  }, []);

  const toggleUser = async (user: AdminUser) => {
    setBusyId(user.id);
    setError('');

    const response = user.is_active
      ? await api.deactivateUser(user.id)
      : await api.activateUser(user.id);

    if (response.success && response.data) {
      setUsers((current) => current.map((item) => (item.id === user.id ? response.data!.user : item)));
    } else {
      setError(response.message || 'Failed to update user.');
    }

    setBusyId(null);
  };

  const filteredUsers = users.filter((user) => {
    if (filter === 'pending') return !user.is_active;
    if (filter === 'active') return user.is_active;
    return true;
  });

  const pendingCount = users.filter((user) => !user.is_active).length;

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">List User</h1>
        <p className="mt-2 text-neutral-600">
          Activate new registrations. Activated users automatically get the Project Manager role.
        </p>
        {pendingCount > 0 && (
          <p className="mt-2 text-sm font-medium text-amber-600">
            {pendingCount} user{pendingCount > 1 ? 's' : ''} waiting for approval
          </p>
        )}
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === item.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage access for registered accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" aria-label="Loading" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">No users found.</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-neutral-900">{user.name}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.is_active
                            ? 'bg-pastel-green-100 text-pastel-green-700'
                            : 'bg-pastel-orange-100 text-pastel-orange-700'
                        }`}>
                          {user.is_active ? 'Active' : 'Pending'}
                        </span>
                      </div>
                      <p className="truncate text-sm text-neutral-500">{user.email}</p>
                      <p className="text-xs text-neutral-400">{user.role_label}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                    {user.role === 'admin' ? (
                      <span className="text-xs font-medium text-neutral-400">Admin account</span>
                    ) : (
                      <Button
                        variant={user.is_active ? 'secondary' : 'primary'}
                        size="sm"
                        isLoading={busyId === user.id}
                        onClick={() => toggleUser(user)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
