import type { ProjectDeadlineStatus, ProjectStatus } from '@/services/api';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PROJECT_STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map(
  (value) => ({ value, label: PROJECT_STATUS_LABELS[value] })
);

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  planning: 'bg-pastel-purple-100 text-pastel-purple-700',
  active: 'bg-pastel-blue-100 text-pastel-blue-700',
  on_hold: 'bg-pastel-orange-100 text-pastel-orange-700',
  completed: 'bg-pastel-green-100 text-pastel-green-700',
  cancelled: 'bg-neutral-200 text-neutral-600',
};

export const DEADLINE_LABELS: Record<ProjectDeadlineStatus, string> = {
  completed: 'Completed',
  indefinite: 'No end date',
  overdue: 'Overdue',
  due_soon: 'Due soon',
  on_schedule: 'On schedule',
};

export const DEADLINE_STYLES: Record<ProjectDeadlineStatus, string> = {
  completed: 'bg-pastel-green-100 text-pastel-green-700',
  indefinite: 'bg-neutral-100 text-neutral-600',
  overdue: 'bg-red-100 text-red-700',
  due_soon: 'bg-pastel-orange-100 text-pastel-orange-700',
  on_schedule: 'bg-pastel-blue-100 text-pastel-blue-700',
};
