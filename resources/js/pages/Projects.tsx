import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { api, type Project, type ProjectHealth } from '@/services/api';
import { formatDate, getInitials } from '@/utils/helpers';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const healthStyles: Record<ProjectHealth['status'], string> = {
  on_track: 'bg-pastel-green-100 text-pastel-green-700',
  completed: 'bg-pastel-green-100 text-pastel-green-700',
  at_risk: 'bg-pastel-orange-100 text-pastel-orange-700',
  off_track: 'bg-red-100 text-red-700',
  in_progress: 'bg-pastel-blue-100 text-pastel-blue-700',
  not_started: 'bg-neutral-100 text-neutral-600',
};

const progressStyles: Record<ProjectHealth['status'], string> = {
  on_track: 'from-pastel-green-400 to-pastel-green-600',
  completed: 'from-pastel-green-400 to-pastel-green-600',
  at_risk: 'from-pastel-orange-400 to-pastel-orange-600',
  off_track: 'from-red-400 to-red-600',
  in_progress: 'from-primary-400 to-primary-600',
  not_started: 'from-neutral-300 to-neutral-400',
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      const response = await api.getProjects();

      if (response.success && response.data) {
        setProjects(response.data.projects);
      } else {
        setError(response.message || 'Failed to load projects.');
      }

      setIsLoading(false);
    };

    loadProjects();
  }, []);

  const onTrack = projects.filter(
    (project) => project.health.status === 'on_track' || project.health.status === 'completed'
  ).length;
  const needsAttention = projects.filter(
    (project) => project.health.status === 'at_risk' || project.health.status === 'off_track'
  ).length;

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Projects</h1>
        <p className="mt-2 text-neutral-600">
          Track project owners, task volume, and overall task health.
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
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Total Projects</p>
                  <p className="mt-1 text-3xl font-bold text-neutral-900">{projects.length}</p>
                </div>
                <div className="p-3 bg-pastel-blue-100 rounded-xl text-pastel-blue-600">
                  <FolderIcon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">On Track</p>
                  <p className="mt-1 text-3xl font-bold text-neutral-900">{onTrack}</p>
                </div>
                <div className="p-3 bg-pastel-green-100 rounded-xl text-pastel-green-600">
                  <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Needs Attention</p>
                  <p className="mt-1 text-3xl font-bold text-neutral-900">{needsAttention}</p>
                </div>
                <div className="p-3 bg-pastel-orange-100 rounded-xl text-pastel-orange-600">
                  <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Card>
          </div>

          {projects.length === 0 ? (
            <Card variant="elevated" padding="lg">
              <p className="py-12 text-center text-sm text-neutral-500">No projects yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id} variant="elevated" padding="lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>{project.name}</CardTitle>
                          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-600">
                            {project.status}
                          </span>
                        </div>
                        <CardDescription>{project.description || 'No description'}</CardDescription>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${healthStyles[project.health.status]}`}>
                        {project.health.label}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {getInitials(project.project_manager?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                          Project Manager
                        </p>
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {project.project_manager?.name || 'Unassigned'}
                        </p>
                      </div>
                      {project.due_date && (
                        <div className="ml-auto hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex">
                          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                          {formatDate(project.due_date)}
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                          <span className="font-semibold text-neutral-900">{project.task_counts.completed}</span>
                          {' '}of {project.task_counts.total} tasks completed
                        </span>
                        <span className="font-semibold text-neutral-900">{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${progressStyles[project.health.status]}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-pastel-blue-50 p-3 text-center">
                        <p className="text-lg font-semibold text-pastel-blue-700">{project.task_counts.in_progress}</p>
                        <p className="text-xs text-pastel-blue-600">In Progress</p>
                      </div>
                      <div className="rounded-xl bg-neutral-50 p-3 text-center">
                        <p className="text-lg font-semibold text-neutral-700">{project.task_counts.pending}</p>
                        <p className="text-xs text-neutral-500">Pending</p>
                      </div>
                      <div className={`rounded-xl p-3 text-center ${project.task_counts.overdue > 0 ? 'bg-red-50' : 'bg-neutral-50'}`}>
                        <p className={`text-lg font-semibold ${project.task_counts.overdue > 0 ? 'text-red-600' : 'text-neutral-700'}`}>
                          {project.task_counts.overdue}
                        </p>
                        <p className={`text-xs ${project.task_counts.overdue > 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                          Overdue
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-1.5 text-xs text-neutral-400">
                      <ClockIcon className="h-4 w-4" aria-hidden="true" />
                      {project.task_counts.total} total tasks
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
