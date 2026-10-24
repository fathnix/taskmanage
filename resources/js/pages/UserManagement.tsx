import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Alert, Button, Card, CardContent, Input, Modal } from '@/components/ui';
import { api, type AdminUser, type UserPayload, type UserStats } from '@/services/api';
import { ROLE_OPTIONS, type UserRole } from '@/utils/roles';
import { firstErrors, formatDate, getInitials } from '@/utils/helpers';
import {
  BeakerIcon,
  BriefcaseIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const EMPTY_STATS: UserStats = {
  project_manager: 0,
  qa: 0,
  member: 0,
  client: 0,
};

const roleBadgeStyles: Record<UserRole, string> = {
  admin: 'bg-neutral-100 text-neutral-600',
  project_manager: 'bg-pastel-purple-100 text-pastel-purple-700',
  qa: 'bg-pastel-blue-100 text-pastel-blue-700',
  member: 'bg-pastel-green-100 text-pastel-green-700',
  client: 'bg-pastel-orange-100 text-pastel-orange-700',
};

const statCards = [
  {
    key: 'project_manager' as const,
    label: 'Project Manager',
    icon: BriefcaseIcon,
    color: 'bg-pastel-purple-100 text-pastel-purple-600',
  },
  {
    key: 'qa' as const,
    label: 'QA',
    icon: BeakerIcon,
    color: 'bg-pastel-blue-100 text-pastel-blue-600',
  },
  {
    key: 'member' as const,
    label: 'Member',
    icon: UserGroupIcon,
    color: 'bg-pastel-green-100 text-pastel-green-600',
  },
  {
    key: 'client' as const,
    label: 'Client',
    icon: UserIcon,
    color: 'bg-pastel-orange-100 text-pastel-orange-600',
  },
];

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar: File | null;
  removeAvatar: boolean;
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'qa',
  avatar: null,
  removeAvatar: false,
};

function UserAvatar({ user, size = 'md' }: { user: AdminUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700`}
    >
      {getInitials(user.name)}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const canManage = currentUser?.role === 'project_manager';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState<UserFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const objectUrlRef = useRef<string | null>(null);

  const clearObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => clearObjectUrl(), [clearObjectUrl]);

  const loadUsers = useCallback(async (query: string) => {
    setIsFetching(true);

    const response = await api.getUsers(query);

    if (response.success && response.data) {
      setUsers(response.data.users);
      setStats(response.data.stats);
      setError('');
    } else {
      setError(response.message || 'Failed to load users.');
    }

    setIsFetching(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void loadUsers(debouncedSearch);
  }, [debouncedSearch, loadUsers]);

  const openCreateForm = () => {
    clearObjectUrl();
    setEditingUser(null);
    setFormData(emptyForm);
    setAvatarPreview(null);
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (user: AdminUser) => {
    clearObjectUrl();
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      avatar: null,
      removeAvatar: false,
    });
    setAvatarPreview(user.avatar_url);
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const resetForm = () => {
    clearObjectUrl();
    setFormOpen(false);
    setEditingUser(null);
    setFormData(emptyForm);
    setAvatarPreview(null);
    setFieldErrors({});
    setFormError('');
  };

  const closeForm = () => {
    if (isSubmitting) return;

    resetForm();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    clearObjectUrl();
    setFormData((current) => ({ ...current, avatar: file, removeAvatar: false }));

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAvatarPreview(url);
    } else {
      setAvatarPreview(editingUser?.avatar_url ?? null);
    }
  };

  const handleRemoveAvatar = () => {
    clearObjectUrl();
    setFormData((current) => ({ ...current, avatar: null, removeAvatar: true }));
    setAvatarPreview(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setFormError('');
    setFieldErrors({});

    const payload: UserPayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      password: formData.password || undefined,
      avatar: formData.avatar,
      removeAvatar: formData.removeAvatar,
    };

    const response = editingUser
      ? await api.updateUser(editingUser.id, payload)
      : await api.createUser(payload);

    if (response.success) {
      resetForm();
      setSuccess(editingUser ? 'User updated successfully.' : 'User added successfully.');
      setSearch('');
      setDebouncedSearch('');
      await loadUsers('');
    } else {
      setFormError(response.message || 'Failed to save user.');
      setFieldErrors(firstErrors(response.errors));
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    const response = await api.deleteUser(deleteTarget.id);

    if (response.success) {
      setDeleteTarget(null);
      setSuccess(response.message || 'User removed successfully.');
      await loadUsers(debouncedSearch);
    } else {
      setError(response.message || 'Failed to delete user.');
      setDeleteTarget(null);
    }

    setIsDeleting(false);
  };

  const statValues: Record<(typeof statCards)[number]['key'], number> = stats;

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Users</h1>
        <p className="mt-2 text-neutral-600">
          {canManage
            ? 'Manage the people assigned to your project, their roles, and profile photos.'
            : 'View the people assigned to your project and their roles.'}
        </p>
      </div>

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess('')} className="mb-6">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.key}
              variant="elevated"
              padding="lg"
              className="animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-neutral-900">{statValues[stat.key]}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by name..."
            aria-label="Search users by name"
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
        </div>

        {canManage && (
          <Button type="button" onClick={openCreateForm} className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            Add User
          </Button>
        )}
      </div>

      <Card variant="elevated" padding="lg">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">User List</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {users.length} user{users.length === 1 ? '' : 's'} found
            </p>
          </div>
          {isFetching && users.length > 0 && (
            <span className="text-xs font-medium text-neutral-400">Updating...</span>
          )}
        </div>

        <CardContent>
          {isFetching && users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
                aria-label="Loading"
              />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <UserGroupIcon className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-neutral-700">No users found</p>
              <p className="mt-1 text-sm text-neutral-500">
                {search
                  ? 'Try a different name or clear the search.'
                  : canManage
                    ? 'Add your first team member to get started.'
                    : 'No team members in your project yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:border-neutral-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar user={user} />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-neutral-900">{user.name}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyles[user.role]}`}
                        >
                          {user.role_label}
                        </span>
                        {!user.is_active && (
                          <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-neutral-500">{user.email}</p>
                      <p className="text-xs text-neutral-400">
                        Joined {user.created_at ? formatDate(user.created_at) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setDetailUser(user)}
                      className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                      title="Detail"
                      aria-label={`View details of ${user.name}`}
                    >
                      <EyeIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditForm(user)}
                          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-pastel-blue-50 hover:text-pastel-blue-600"
                          title="Edit"
                          aria-label={`Edit ${user.name}`}
                        >
                          <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccess('');
                            setDeleteTarget(user);
                          }}
                          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                          aria-label={`Delete ${user.name}`}
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingUser ? 'Edit User' : 'Add User'}
        description={
          editingUser
            ? 'Update this team member\'s profile and role.'
            : 'Create a new team member account. Admin role is not available here.'
        }
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" isLoading={isSubmitting}>
              {editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile preview"
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                {getInitials(formData.name || editingUser?.name)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="avatar">
                Profile photo <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="mt-1 text-xs text-neutral-400">PNG, JPG, or WEBP. Max 2MB.</p>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remove photo
                </button>
              )}
              {fieldErrors.avatar && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.avatar}</p>
              )}
            </div>
          </div>

          <Input
            label="Name"
            value={formData.name}
            onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
            error={fieldErrors.name}
            placeholder="Full name"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            error={fieldErrors.email}
            placeholder="name@company.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            error={fieldErrors.password}
            hint={editingUser ? 'Leave blank to keep the current password.' : 'Minimum 8 characters.'}
            placeholder={editingUser ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
            required={!editingUser}
          />

          <div>
            <label htmlFor="role" className="label">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(event) =>
                setFormData((current) => ({ ...current, role: event.target.value as UserRole }))
              }
              className="input-field"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && <p className="mt-1.5 text-sm text-red-600">{fieldErrors.role}</p>}
          </div>
        </form>
      </Modal>

      <Modal
        open={detailUser !== null}
        onClose={() => setDetailUser(null)}
        title="User Details"
        footer={
          <Button type="button" variant="secondary" onClick={() => setDetailUser(null)}>
            Close
          </Button>
        }
      >
        {detailUser && (
          <>
            <div className="flex items-center gap-4">
              <UserAvatar user={detailUser} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-neutral-900">{detailUser.name}</p>
                <p className="truncate text-sm text-neutral-500">{detailUser.email}</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyles[detailUser.role]}`}
                >
                  {detailUser.role_label}
                </span>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Status" value={detailUser.is_active ? 'Active' : 'Inactive'} />
              <DetailItem
                label="Joined"
                value={detailUser.created_at ? formatDate(detailUser.created_at) : '—'}
              />
              <DetailItem
                label="Last Login"
                value={detailUser.last_login_at ? formatDate(detailUser.last_login_at) : 'Never'}
              />
              <DetailItem label="User ID" value={`#${detailUser.id}`} />
            </dl>
          </>
        )}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => (!isDeleting ? setDeleteTarget(null) : undefined)}
        title="Remove User"
        description="Remove this user from your project."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Remove User
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          Remove <span className="font-semibold text-neutral-900">{deleteTarget?.name}</span> from
          your project? If they are not assigned to any other project and do not manage one, their
          account will be deleted. This cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
