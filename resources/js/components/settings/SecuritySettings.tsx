import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { firstErrors } from '@/utils/helpers';

export function SecuritySettings() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setFieldErrors({});

    const response = await api.updateProfile({
      name: user?.name ?? '',
      currentPassword,
      password,
      passwordConfirmation,
    });

    if (response.success) {
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
    } else {
      setError(response.message || 'Failed to update password.');
      setFieldErrors(firstErrors(response.errors));
    }

    setIsSubmitting(false);
  };

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Use a strong password that you do not use elsewhere.</CardDescription>
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              error={fieldErrors.current_password}
              autoComplete="current-password"
              required
            />

            <div className="hidden sm:block" />

            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              autoComplete="new-password"
              hint="Minimum 8 characters."
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
