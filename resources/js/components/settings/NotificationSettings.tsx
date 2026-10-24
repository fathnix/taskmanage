import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { api, type NotificationPreferences } from '@/services/api';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  task_updates: true,
  qa_updates: true,
  approval_updates: true,
};

const preferences = [
  {
    key: 'email_notifications' as const,
    label: 'Email notifications',
    description: 'Receive important account and project updates by email.',
  },
  {
    key: 'task_updates' as const,
    label: 'Task updates',
    description: 'Get notified when tasks are assigned or their status changes.',
  },
  {
    key: 'qa_updates' as const,
    label: 'QA updates',
    description: 'Get notified when QA checks or updates a task.',
  },
  {
    key: 'approval_updates' as const,
    label: 'Approval updates',
    description: 'Get notified when tasks are approved or need revision.',
  },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-500' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function NotificationSettings() {
  const [preferencesState, setPreferencesState] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      const response = await api.getSettings();

      if (!active) return;

      if (response.success && response.data) {
        setPreferencesState(response.data.preferences);
      } else {
        setError(response.message || 'Failed to load notification preferences.');
      }

      setIsLoading(false);
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferencesState((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    const response = await api.updateNotificationPreferences(preferencesState);

    if (response.success && response.data) {
      setPreferencesState(response.data.preferences);
      setSuccess(response.message || 'Notification preferences updated successfully.');
    } else {
      setError(response.message || 'Failed to update notification preferences.');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-center py-16">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
            aria-label="Loading settings"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which updates you want to receive.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
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

          <div className="divide-y divide-neutral-100">
            {preferences.map((preference) => (
              <div
                key={preference.key}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{preference.label}</p>
                  <p className="mt-1 text-sm text-neutral-500">{preference.description}</p>
                </div>
                <Toggle
                  checked={preferencesState[preference.key]}
                  onChange={(checked) => updatePreference(preference.key, checked)}
                  label={preference.label}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-neutral-100 pt-5">
            <Button type="button" onClick={handleSave} isLoading={isSaving}>
              Save Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
