import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { api, type Project, type Task, type TaskStats } from '@/services/api';
import { formatDate } from '@/utils/helpers';
import { can } from '@/utils/roles';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from '@/utils/projects';
import { TASK_STATUS_LABELS, TASK_STATUS_STYLES, isTaskOverdue } from '@/utils/tasks';
import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  FolderIcon,
  PlusIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const EMPTY_STATS: TaskStats = {
  total: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
  overdue: 0,
  qa_checked: 0,
  approved: 0,
  revision: 0,
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>(EMPTY_STATS);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(false);

      return;
    }

    let active = true;

    const loadDashboard = async () => {
      setIsLoading(true);

      const [tasksResponse, projectsResponse] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
      ]);

      if (!active) return;

      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data.tasks);
        setStats(tasksResponse.data.stats);
      } else {
        setError(tasksResponse.message || 'Failed to load your tasks.');
      }

      if (projectsResponse.success && projectsResponse.data) {
        setProject(projectsResponse.data.projects[0] ?? null);
      } else {
        setError((current) => current || projectsResponse.message || 'Failed to load your project.');
      }

      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    );
  }

  const projectLabel = project?.name ?? 'your project';
  const subtitle = user?.role === 'qa'
    ? `Review tasks and quality checks for ${projectLabel}.`
    : user?.role === 'client'
      ? `Here's the latest progress on ${projectLabel}.`
      : `Here's what's happening with ${projectLabel}.`;

  const recentTasks = tasks.slice(0, 5);
  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: ClipboardDocumentListIcon,
      color: 'bg-pastel-blue-100 text-pastel-blue-600',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'bg-pastel-green-100 text-pastel-green-600',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: ClockIcon,
      color: 'bg-pastel-orange-100 text-pastel-orange-600',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: XCircleIcon,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Welcome back, {user?.name}!</h1>
        <p className="mt-2 text-neutral-600">{subtitle}</p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
            aria-label="Loading dashboard"
          />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => {
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>
                    Latest tasks from {projectLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTasks.length === 0 ? (
                    <div className="py-12 text-center">
                      <ClipboardDocumentListIcon
                        className="mx-auto h-10 w-10 text-neutral-300"
                        aria-hidden="true"
                      />
                      <p className="mt-3 text-sm font-medium text-neutral-700">No tasks yet</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Tasks for your project will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentTasks.map((task) => {
                        const overdue = isTaskOverdue(task);

                        return (
                          <div
                            key={task.id}
                            className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4 transition-colors hover:bg-neutral-100 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TASK_STATUS_STYLES[task.status]}`}
                              >
                                <ClipboardDocumentListIcon className="h-5 w-5" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-neutral-900">{task.title}</p>
                                <p className="truncate text-sm text-neutral-500">
                                  {task.project?.name ?? projectLabel}
                                  {' · '}
                                  {task.due_date ? `Due ${formatDate(task.due_date)}` : 'No due date'}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {overdue && (
                                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                  Overdue
                                </span>
                              )}
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${TASK_STATUS_STYLES[task.status]}`}
                              >
                                {TASK_STATUS_LABELS[task.status]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Project</CardTitle>
                  <CardDescription>Your assigned project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary-100 p-3 text-primary-600">
                          <FolderIcon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-900">{project.name}</p>
                          <p className="truncate text-sm text-neutral-500">
                            PM: {project.project_manager?.name ?? '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUS_STYLES[project.status]}`}
                        >
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                        <span className="text-xs font-medium text-neutral-500">
                          {project.progress}% complete
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>

                      <p className="text-xs text-neutral-500">
                        {project.task_counts.completed} of {project.task_counts.total} tasks completed
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No project assigned yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks you can perform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {can(user?.role, 'createTasks') && (
                      <Button
                        variant="primary"
                        className="w-full justify-start gap-3"
                        onClick={() => navigate('/tasks')}
                      >
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        Create New Task
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="w-full justify-start gap-3"
                      onClick={() => navigate('/settings')}
                    >
                      <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle>Account Info</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                      <UserIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                        <p className="text-sm text-neutral-500">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                      <Cog6ToothIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Member since</p>
                        <p className="text-sm text-neutral-500">
                          {user?.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
