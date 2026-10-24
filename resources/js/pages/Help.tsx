import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, Card, CardContent, CardDescription, CardTitle } from '@/components/ui';
import { api, type HelpRequest } from '@/services/api';
import { formatDate, getInitials } from '@/utils/helpers';
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_STYLES,
  QA_STATUS_LABELS,
  QA_STATUS_STYLES,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
} from '@/utils/tasks';
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
} from '@heroicons/react/24/outline';

export function Help() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadHelpRequests = async () => {
      const response = await api.getHelpRequests();

      if (!active) return;

      if (response.success && response.data) {
        setHelpRequests(response.data.help_requests);
      } else {
        setError(response.message || 'Failed to load help requests.');
      }

      setIsLoading(false);
    };

    void loadHelpRequests();

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Help</h1>
        <p className="mt-2 text-neutral-600">
          Difficulties reported by members when they submitted their task results.
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      <Card variant="elevated" padding="lg">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <CardTitle>Reported Difficulties</CardTitle>
            <CardDescription>
              {helpRequests.length > 0
                ? `${helpRequests.length} report${helpRequests.length === 1 ? '' : 's'} from your project`
                : 'Reports from your project will appear here'}
            </CardDescription>
          </div>
        </div>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
                aria-label="Loading"
              />
            </div>
          ) : helpRequests.length === 0 ? (
            <div className="py-12 text-center">
              <LifebuoyIcon className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-neutral-700">No difficulties reported</p>
              <p className="mt-1 text-sm text-neutral-500">
                When a member reports a difficulty while submitting a task, it will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {helpRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:border-neutral-200 hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-neutral-900">{request.title}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TASK_STATUS_STYLES[request.status]}`}>
                          {TASK_STATUS_LABELS[request.status]}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[9px] font-semibold text-primary-700">
                            {getInitials(request.assignee?.name)}
                          </span>
                          {request.assignee?.name ?? 'Unassigned'}
                        </span>
                        <span>{request.project?.name ?? 'Project'}</span>
                        <span>
                          Submitted {request.submitted_at ? formatDate(request.submitted_at) : '-'}
                        </span>
                      </div>

                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                          <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                          Difficulty
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm text-amber-900">{request.difficulty}</p>
                      </div>

                      {request.submission_description && (
                        <p className="mt-3 text-sm text-neutral-600">{request.submission_description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {request.submission_link && (
                          <a
                            href={request.submission_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            View evidence
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}

                        {request.submission_photo_url && (
                          <a
                            href={request.submission_photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={request.submission_photo_url}
                              alt={`Evidence for ${request.title}`}
                              className="h-16 w-16 rounded-lg border border-neutral-200 object-cover"
                            />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${QA_STATUS_STYLES[request.qa_status]}`}>
                        {QA_STATUS_LABELS[request.qa_status]}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${APPROVAL_STATUS_STYLES[request.approval_status]}`}>
                        {APPROVAL_STATUS_LABELS[request.approval_status]}
                      </span>
                    </div>
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
