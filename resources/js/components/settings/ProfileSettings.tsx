import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { firstErrors, getInitials } from '@/utils/helpers';

export function ProfileSettings() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const objectUrlRef = useRef<string | null>(null);

  const clearObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => clearObjectUrl(), [clearObjectUrl]);

  useEffect(() => {
    setName(user?.name ?? '');
    setAvatarPreview(user?.avatar_url ?? null);
  }, [user?.name, user?.avatar_url]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    clearObjectUrl();
    setAvatar(file);
    setRemoveAvatar(false);

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAvatarPreview(url);
    } else {
      setAvatarPreview(user?.avatar_url ?? null);
    }
  };

  const handleRemoveAvatar = () => {
    clearObjectUrl();
    setAvatar(null);
    setRemoveAvatar(true);
    setAvatarPreview(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    const response = await api.updateProfile({
      name: name.trim(),
      avatar,
      removeAvatar,
    });

    if (response.success && response.data) {
      setSuccess(response.message || 'Profile updated successfully.');
      setAvatar(null);
      setRemoveAvatar(false);
      clearObjectUrl();
      setName(response.data.user.name);
      setAvatarPreview(response.data.user.avatar_url);
      await refreshUser();
    } else {
      setError(response.message || 'Failed to update profile.');
      setFieldErrors(firstErrors(response.errors));
    }

    setIsSubmitting(false);
  };

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your name and profile photo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <Alert variant="success" dismissible onDismiss={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert variant="error" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}

          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile preview"
                className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
                {getInitials(name || user?.name)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <label className="label" htmlFor="settings-avatar">
                Profile photo <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="settings-avatar"
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={fieldErrors.name}
              placeholder="Full name"
              required
            />

            <Input
              label="Email"
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="bg-neutral-50 text-neutral-500"
              hint="Email cannot be changed."
            />

            <Input
              label="Role"
              value={user?.role_label ?? ''}
              readOnly
              className="bg-neutral-50 text-neutral-500"
              hint="Role cannot be changed from your settings."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
