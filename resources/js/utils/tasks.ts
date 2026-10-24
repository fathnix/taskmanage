import type { Task, TaskApprovalStatus, TaskQaStatus, TaskStatus } from '@/services/api';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-pastel-blue-100 text-pastel-blue-700',
  completed: 'bg-pastel-green-100 text-pastel-green-700',
};

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export const QA_STATUS_LABELS: Record<TaskQaStatus, string> = {
  pending: 'Waiting for QA',
  checked: 'QA Checked',
};

export const QA_STATUS_STYLES: Record<TaskQaStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  checked: 'bg-pastel-green-100 text-pastel-green-700',
};

export const APPROVAL_STATUS_LABELS: Record<TaskApprovalStatus, string> = {
  pending: 'Waiting Approval',
  approved: 'Approved',
  revision: 'Needs Revision',
};

export const APPROVAL_STATUS_STYLES: Record<TaskApprovalStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  approved: 'bg-pastel-green-100 text-pastel-green-700',
  revision: 'bg-red-100 text-red-700',
};

export const APPROVAL_STATUS_OPTIONS: { value: TaskApprovalStatus; label: string }[] = [
  { value: 'approved', label: 'Approve' },
  { value: 'revision', label: 'Request Revision' },
];

export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed' || !task.due_date) return false;

  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
}
