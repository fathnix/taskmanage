import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { api, type Project, type ProjectHealth } from '@/services/api';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from '@/utils/projects';
import {
  ChartBarIcon,
  CheckCircleIcon,
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

export function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      const response = await api.getProjects();

      if (response.success && response.data) {
        setProjects(response.data.projects);
      } else {
        setError(response.message || 'Failed to load dashboard data.');
      }

      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  const onTrack = projects.filter(
    (project) => project.health.status === 'on_track' || project.health.status === 'completed',
  ).length;
  const needsAttention = projects.filter(
    (project) => project.health.status === 'at_risk' || project.health.status === 'off_track',
  ).length;
  const averageProgress = projects.length > 0
    ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
    : 0;

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: FolderIcon,
      color: 'bg-pastel-blue-100 text-pastel-blue-600',
    },
    {
      label: 'On Track',
      value: onTrack,
      icon: CheckCircleIcon,
      color: 'bg-pastel-green-100 text-pastel-green-600',
    },
    {
      label: 'Needs Attention',
      value: needsAttention,
      icon: ExclamationTriangleIcon,
      color: 'bg-pastel-orange-100 text-pastel-orange-600',
    },
    {
      label: 'Average Progress',
      value: `${averageProgress}%`,
      icon: ChartBarIcon,
      color: 'bg-pastel-purple-100 text-pastel-purple-600',
    },
  ];

  return (
    <>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-2 text-neutral-600">
          Project ownership and health across the team.
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" aria-label="Loading" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <div className={`rounded-xl p-3 ${stat.color}`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card variant="elevated" padding="lg">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Project managers and current project health</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="py-12 text-center">
                  <FolderIcon className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-neutral-700">No projects yet</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Projects will appear here once a project manager is assigned.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:border-neutral-200 hover:bg-white"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-neutral-900">{project.name}</p>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUS_STYLES[project.status]}`}>
                              {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${healthStyles[project.health.status]}`}>
                              {project.health.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-neutral-500">
                            PM: {project.project_manager?.name ?? 'Unassigned'}
                            {project.project_manager?.email ? ` · ${project.project_manager.email}` : ''}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center lg:min-w-[18rem]">
                          <div>
                            <p className="text-lg font-semibold text-neutral-900">{project.progress}%</p>
                            <p className="text-xs text-neutral-500">Progress</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-neutral-900">
                              {project.task_counts.completed}/{project.task_counts.total}
                            </p>
                            <p className="text-xs text-neutral-500">Tasks</p>
                          </div>
                          <div>
                            <p className={`text-lg font-semibold ${project.task_counts.overdue > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
                              {project.task_counts.overdue}
                            </p>
                            <p className="text-xs text-neutral-500">Overdue</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
