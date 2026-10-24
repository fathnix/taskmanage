import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Textarea,
} from '@/components/ui';
import { api, type Project, type ProjectHealth, type ProjectPayload, type ProjectStatus } from '@/services/api';
import { firstErrors, formatDate, getInitials } from '@/utils/helpers';
import {
  DEADLINE_LABELS,
  DEADLINE_STYLES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_STYLES,
} from '@/utils/projects';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

interface ProjectDetailProps {
  project: Project;
  canEdit: boolean;
  onUpdated: (project: Project) => void;
}

interface ProjectFormState {
  name: string;
  description: string;
  status: ProjectStatus;
  budget: string;
  startDate: string;
  endDate: string;
  isIndefinite: boolean;
}

const healthStyles: Record<ProjectHealth['status'], string> = {
  on_track: 'bg-pastel-green-100 text-pastel-green-700',
  completed: 'bg-pastel-green-100 text-pastel-green-700',
  at_risk: 'bg-pastel-orange-100 text-pastel-orange-700',
  off_track: 'bg-red-100 text-red-700',
  in_progress: 'bg-pastel-blue-100 text-pastel-blue-700',
  not_started: 'bg-neutral-100 text-neutral-600',
};

const progressColors: Record<ProjectHealth['status'], string> = {
  on_track: '#22c55e',
  completed: '#22c55e',
  at_risk: '#f97316',
  off_track: '#ef4444',
  in_progress: '#3b82f6',
  not_started: '#a3a3a3',
};

const PROGRESS_RADIUS = 52;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

function projectToForm(project: Project): ProjectFormState {
  return {
    name: project.name,
    description: project.description ?? '',
    status: project.status,
    budget: project.budget !== null ? String(project.budget) : '',
    startDate: project.start_date ?? '',
    endDate: project.end_date ?? '',
    isIndefinite: project.is_indefinite,
  };
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'Not set';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function deadlineText(project: Project): string {
  if (project.is_indefinite) {
    return 'This project has no fixed end date.';
  }

  if (project.days_remaining === null) {
    return 'No end date has been set.';
  }

  if (project.days_remaining < 0) {
    return `${Math.abs(project.days_remaining)} days past the end date.`;
  }

  if (project.days_remaining === 0) {
    return 'This project is due today.';
  }

  return `${project.days_remaining} days remaining.`;
}

export function ProjectDetail({ project, canEdit, onUpdated }: ProjectDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(() => projectToForm(project));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEdit = () => {
    setForm(projectToForm(project));
    setFieldErrors({});
    setFormError('');
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (isSubmitting) return;

    setEditOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!form.isIndefinite && !form.endDate) {
      setFieldErrors({ end_date: 'End date is required unless the project is indefinite.' });

      return;
    }

    if (!form.isIndefinite && form.startDate && form.endDate && form.endDate < form.startDate) {
      setFieldErrors({ end_date: 'End date must be on or after the start date.' });

      return;
    }

    const budget = form.budget.trim() === '' ? null : Number(form.budget);

    if (budget !== null && Number.isNaN(budget)) {
      setFieldErrors({ budget: 'Enter a valid budget amount.' });

      return;
    }

    const payload: ProjectPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      budget,
      start_date: form.startDate || null,
      end_date: form.isIndefinite ? null : (form.endDate || null),
      is_indefinite: form.isIndefinite,
    };

    setIsSubmitting(true);

    const response = await api.updateProject(project.id, payload);

    if (response.success && response.data) {
      onUpdated(response.data.project);
      setEditOpen(false);
      setSuccess('Project updated successfully.');
    } else {
      setFormError(response.message || 'Failed to update project.');
      setFieldErrors(firstErrors(response.errors));
    }

    setIsSubmitting(false);
  };

  const taskRows = [
    {
      label: 'Completed',
      value: project.task_counts.completed,
      color: 'bg-pastel-green-500',
      text: 'text-pastel-green-700',
    },
    {
      label: 'In Progress',
      value: project.task_counts.in_progress,
      color: 'bg-pastel-blue-500',
      text: 'text-pastel-blue-700',
    },
    {
      label: 'Pending',
      value: project.task_counts.pending,
      color: 'bg-neutral-400',
      text: 'text-neutral-600',
    },
    {
      label: 'Overdue',
      value: project.task_counts.overdue,
      color: 'bg-red-500',
      text: 'text-red-600',
    },
  ];

  const taskStats = [
    {
      label: 'Total Tasks',
      value: project.task_counts.total,
      icon: ChartBarIcon,
    },
    {
      label: 'Completed',
      value: project.task_counts.completed,
      icon: CheckCircleIcon,
    },
    {
      label: 'In Progress',
      value: project.task_counts.in_progress,
      icon: ArrowPathIcon,
    },
    {
      label: 'Pending',
      value: project.task_counts.pending,
      icon: ClockIcon,
    },
    {
      label: 'Overdue',
      value: project.task_counts.overdue,
      icon: ExclamationTriangleIcon,
    },
  ];

  const progressOffset = PROGRESS_CIRCUMFERENCE - (project.progress / 100) * PROGRESS_CIRCUMFERENCE;

  return (
    <div className="space-y-6">
      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card variant="elevated" padding="lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-neutral-900">{project.name}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PROJECT_STATUS_STYLES[project.status]}`}>
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${healthStyles[project.health.status]}`}>
                {project.health.label}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              {project.description || 'No description has been added yet.'}
            </p>
          </div>

          {canEdit && (
            <Button type="button" onClick={openEdit} className="shrink-0">
              <PencilSquareIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Edit Project
            </Button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
              Budget
            </div>
            <p className="mt-2 text-lg font-semibold text-neutral-900">{formatCurrency(project.budget)}</p>
          </div>

          <div className="rounded-xl bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              Start Date
            </div>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {project.start_date ? formatDate(project.start_date) : 'Not set'}
            </p>
          </div>

          <div className="rounded-xl bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              End Date
            </div>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {project.is_indefinite
                ? 'Indefinite'
                : project.end_date
                  ? formatDate(project.end_date)
                  : 'Not set'}
            </p>
          </div>

          <div className="rounded-xl bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              Duration
            </div>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {project.duration_days !== null
                ? `${project.duration_days} days`
                : project.is_indefinite && project.start_date
                  ? 'Ongoing'
                  : 'Not set'}
            </p>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Task Statistics</CardTitle>
          <CardDescription>All tasks in this project by current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {taskStats.map((stat) => {
              const StatIcon = stat.icon;

              return (
                <div key={stat.label} className="min-w-[8.5rem] flex-1 rounded-xl bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    <StatIcon className="h-4 w-4" aria-hidden="true" />
                    {stat.label}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-neutral-900">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card variant="elevated" padding="lg" className="xl:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Task completion and overall project health</CardDescription>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${healthStyles[project.health.status]}`}>
                {project.health.label}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative h-32 w-32 shrink-0">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle
                    cx="60"
                    cy="60"
                    r={PROGRESS_RADIUS}
                    fill="none"
                    strokeWidth="12"
                    className="stroke-neutral-100"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={PROGRESS_RADIUS}
                    fill="none"
                    strokeWidth="12"
                    strokeLinecap="round"
                    stroke={progressColors[project.health.status]}
                    style={{
                      strokeDasharray: PROGRESS_CIRCUMFERENCE,
                      strokeDashoffset: progressOffset,
                    }}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-neutral-900">{project.progress}%</p>
                  <p className="text-xs text-neutral-500">complete</p>
                </div>
              </div>

              <div className="w-full min-w-0 flex-1">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-900">{project.task_counts.completed}</span> of{' '}
                  <span className="font-semibold text-neutral-900">{project.task_counts.total}</span> tasks completed
                </p>
                <p className="mt-1 text-xs font-medium text-neutral-400">
                  {project.overdue_rate}% of tasks are overdue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>People assigned to this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {getInitials(project.project_manager?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Project Manager</p>
                <p className="truncate text-sm font-medium text-neutral-900">
                  {project.project_manager?.name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-pastel-blue-50 p-3">
                <p className="text-lg font-semibold text-pastel-blue-700">{project.team_counts.qa}</p>
                <p className="text-xs text-pastel-blue-600">QA</p>
              </div>
              <div className="rounded-xl bg-pastel-green-50 p-3">
                <p className="text-lg font-semibold text-pastel-green-700">{project.team_counts.member}</p>
                <p className="text-xs text-pastel-green-600">Member</p>
              </div>
              <div className="rounded-xl bg-pastel-orange-50 p-3">
                <p className="text-lg font-semibold text-pastel-orange-700">{project.team_counts.client}</p>
                <p className="text-xs text-pastel-orange-600">Client</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-neutral-500">
              {project.team_counts.total} team member{project.team_counts.total === 1 ? '' : 's'} assigned
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Task Breakdown</CardTitle>
            <CardDescription>Distribution of tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700">{row.label}</span>
                    <span className={`font-semibold ${row.text}`}>{row.value}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full ${row.color} transition-all duration-500`}
                      style={{
                        width: `${project.task_counts.total > 0 ? (row.value / project.task_counts.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-50 p-3 text-sm">
              <span className="text-neutral-600">Overdue rate</span>
              <span className={`font-semibold ${project.overdue_rate > 0 ? 'text-red-600' : 'text-pastel-green-600'}`}>
                {project.overdue_rate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Schedule and deadline health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-neutral-500">Start date</span>
                <span className="font-medium text-neutral-900">
                  {project.start_date ? formatDate(project.start_date) : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-neutral-500">End date</span>
                <span className="font-medium text-neutral-900">
                  {project.is_indefinite
                    ? 'Indefinite'
                    : project.end_date
                      ? formatDate(project.end_date)
                      : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-neutral-500">Deadline status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEADLINE_STYLES[project.deadline_status]}`}>
                  {DEADLINE_LABELS[project.deadline_status]}
                </span>
              </div>
            </div>

            <p className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">{deadlineText(project)}</p>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={editOpen}
        onClose={closeEdit}
        title="Edit Project"
        description="Update the project title, description, budget, timeline, and status."
        size="lg"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeEdit} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="project-edit-form" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <form id="project-edit-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            label="Project Title"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            error={fieldErrors.name}
            placeholder="Project title"
            required
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            error={fieldErrors.description}
            placeholder="Describe the project, its goals, and scope."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-status" className="label">
                Status
              </label>
              <select
                id="project-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))
                }
                className="input-field"
              >
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.status && <p className="mt-1.5 text-sm text-red-600">{fieldErrors.status}</p>}
            </div>

            <Input
              label="Budget (IDR)"
              type="number"
              min="0"
              step="1"
              value={form.budget}
              onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
              error={fieldErrors.budget}
              placeholder="e.g. 75000000"
              hint="Leave blank if the budget is not set yet."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              error={fieldErrors.start_date}
            />

            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              error={fieldErrors.end_date}
              disabled={form.isIndefinite}
              hint={form.isIndefinite ? 'Disabled because the project is indefinite.' : undefined}
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <input
              type="checkbox"
              checked={form.isIndefinite}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isIndefinite: event.target.checked,
                  endDate: event.target.checked ? '' : current.endDate,
                }))
              }
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">No fixed end date</span>
              <span className="block text-xs text-neutral-500">
                Choose this for ongoing projects. The end date will be shown as indefinite.
              </span>
            </span>
          </label>
        </form>
      </Modal>
    </div>
  );
}
