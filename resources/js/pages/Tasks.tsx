import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Input,
  Modal,
  Textarea,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api, type Task, type TaskPayload, type TaskStats, type TaskStatus, type TaskUser } from '@/services/api';
import { firstErrors, formatDate, getInitials } from '@/utils/helpers';
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_STYLES,
  QA_STATUS_LABELS,
  QA_STATUS_STYLES,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_STYLES,
  isTaskOverdue,
} from '@/utils/tasks';
import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  assignedToId: string;
  dueDate: string;
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  status: 'pending',
  assignedToId: '',
  dueDate: '',
};

type ReviewMode = 'approved' | 'revision';

function taskToForm(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    assignedToId: task.assigned_to ? String(task.assigned_to.id) : '',
    dueDate: task.due_date ?? '',
  };
}

export function Tasks() {
  const { user } = useAuth();
  const role = user?.role;
  const isManager = role === 'project_manager';
  const isQa = role === 'qa';
  const isMember = role === 'member';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [assignees, setAssignees] = useState<TaskUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<Task | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('approved');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadTasks = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }

    const response = await api.getTasks(debouncedSearch || undefined);

    if (response.success && response.data) {
      setTasks(response.data.tasks);
      setStats(response.data.stats);
      setError('');
    } else {
      setError(response.message || 'Failed to load tasks.');
    }

    setIsLoading(false);
    setIsFetching(false);
  }, [debouncedSearch]);

  useEffect(() => {
    loadTasks(true);
  }, [loadTasks]);

  useEffect(() => {
    if (!isManager) return;

    const loadAssignees = async () => {
      const response = await api.getTaskAssignees();

      if (response.success && response.data) {
        setAssignees(response.data.assignees);
      }
    };

    loadAssignees();
  }, [isManager]);

  const openCreateForm = () => {
    setEditingTask(null);
    setForm({ ...emptyForm, assignedToId: assignees[0] ? String(assignees[0].id) : '' });
    setFieldErrors({});
    setFormError('');
    setSuccess('');
    setFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setForm(taskToForm(task));
    setFieldErrors({});
    setFormError('');
    setSuccess('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;

    setFormOpen(false);
    setEditingTask(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!form.assignedToId) {
      setFieldErrors({ assigned_to_id: 'Choose who will work on this task.' });

      return;
    }

    const payload: TaskPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      assigned_to_id: Number(form.assignedToId),
      due_date: form.dueDate || null,
    };

    setIsSubmitting(true);

    const response = editingTask
      ? await api.updateTask(editingTask.id, payload)
      : await api.createTask(payload);

    if (response.success && response.data) {
      setFormOpen(false);
      setEditingTask(null);
      setForm(emptyForm);
      setSuccess(editingTask ? 'Task updated successfully.' : 'Task created successfully.');
      await loadTasks();
    } else {
      setFormError(response.message || 'Failed to save task.');
      setFieldErrors(firstErrors(response.errors));
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    const response = await api.deleteTask(deleteTarget.id);

    if (response.success) {
      setDeleteTarget(null);
      setSuccess('Task deleted successfully.');
      await loadTasks();
    } else {
      setError(response.message || 'Failed to delete task.');
    }

    setIsDeleting(false);
  };

  const handleQaCheck = async (task: Task) => {
    setBusyTaskId(task.id);
    setSuccess('');

    const response = await api.checkTaskByQa(task.id);

    if (response.success) {
      setSuccess('Task marked as checked by QA.');
      await loadTasks();
    } else {
      setError(response.message || 'Failed to check task.');
    }

    setBusyTaskId(null);
  };

  const handleMemberStatus = async (task: Task, status: TaskStatus) => {
    setBusyTaskId(task.id);
    setSuccess('');

    const response = await api.updateTaskStatus(task.id, status);

    if (response.success) {
      setSuccess('Task status updated.');
      await loadTasks();
    } else {
      setError(response.message || 'Failed to update task status.');
    }

    setBusyTaskId(null);
  };

  const openReview = (task: Task, mode: ReviewMode) => {
    setReviewTarget(task);
    setReviewMode(mode);
    setRevisionNotes('');
    setReviewError('');
    setSuccess('');
  };

  const closeReview = () => {
    if (isReviewing) return;

    setReviewTarget(null);
    setRevisionNotes('');
    setReviewError('');
  };

  const handleReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewTarget) return;

    setIsReviewing(true);
    setReviewError('');

    const response = await api.reviewTask(reviewTarget.id, {
      approval_status: reviewMode,
      revision_notes: reviewMode === 'revision' ? revisionNotes.trim() : null,
    });

    if (response.success) {
      setReviewTarget(null);
      setRevisionNotes('');
      setSuccess(reviewMode === 'approved' ? 'Task approved successfully.' : 'Task sent back for revision.');
      await loadTasks();
    } else {
      setReviewError(response.message || 'Failed to review task.');
    }

    setIsReviewing(false);
  };

  const canApprove = (task: Task) =>
    isManager && task.status === 'completed' && task.qa_status === 'checked' && task.approval_status !== 'approved';

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Tasks</h1>
        <p className="mt-2 text-neutral-600">
          {isManager
            ? 'Search, create, and review tasks for your project.'
            : isQa
              ? 'Check completed tasks and verify their quality.'
              : isMember
                ? 'Update the status of tasks assigned to you.'
                : 'Follow the latest task progress on your project.'}
        </p>
      </div>

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess('')} className="mb-6">
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
          {error}
        </Alert>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks or assignee..."
            aria-label="Search tasks or assignee"
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
        </div>

        {isManager && (
          <Button type="button" onClick={openCreateForm} className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            Create New Task
          </Button>
        )}
      </div>

      <Card variant="elevated" padding="lg">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <CardTitle>Task List</CardTitle>
            <CardDescription>
              {stats
                ? `${stats.total} total · ${stats.qa_checked} QA checked · ${stats.approved} approved · ${stats.revision} needs revision`
                : 'All tasks visible to you'}
            </CardDescription>
          </div>
          {isFetching && tasks.length > 0 && (
            <span className="text-xs font-medium text-neutral-400">Updating...</span>
          )}
        </div>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
                aria-label="Loading"
              />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-neutral-700">No tasks found</p>
              <p className="mt-1 text-sm text-neutral-500">
                {debouncedSearch
                  ? 'Try a different search term.'
                  : isManager
                    ? 'Create your first task to get started.'
                    : 'No tasks have been assigned to your project yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const overdue = isTaskOverdue(task);
                const memberCanUpdate = isMember
                  && task.assigned_to?.id === user?.id
                  && task.approval_status !== 'approved';

                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-colors hover:border-neutral-200 hover:bg-white"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-neutral-900">{task.title}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TASK_STATUS_STYLES[task.status]}`}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                          {overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                              <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="mt-1 max-w-2xl text-sm text-neutral-500">{task.description}</p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[9px] font-semibold text-primary-700">
                              {getInitials(task.assigned_to?.name)}
                            </span>
                            {task.assigned_to?.name ?? 'Unassigned'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <FolderIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {task.project?.name ?? 'Project'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {task.due_date ? formatDate(task.due_date) : 'No due date'}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${QA_STATUS_STYLES[task.qa_status]}`}>
                            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {QA_STATUS_LABELS[task.qa_status]}
                            {task.qa_checked_by ? ` · ${task.qa_checked_by.name}` : ''}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${APPROVAL_STATUS_STYLES[task.approval_status]}`}>
                            <CheckBadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {APPROVAL_STATUS_LABELS[task.approval_status]}
                            {task.approved_by ? ` · ${task.approved_by.name}` : ''}
                          </span>
                        </div>

                        {task.approval_status === 'revision' && task.revision_notes && (
                          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                            Revision note: {task.revision_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end">
                        {canApprove(task) && (
                          <>
                            <Button size="sm" onClick={() => openReview(task, 'approved')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openReview(task, 'revision')}>
                              Revision
                            </Button>
                          </>
                        )}

                        {isQa && task.status === 'completed' && task.qa_status === 'pending' && task.approval_status !== 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleQaCheck(task)}
                            isLoading={busyTaskId === task.id}
                          >
                            Mark as Checked
                          </Button>
                        )}

                        {memberCanUpdate && (
                          <select
                            value={task.status}
                            onChange={(event) => handleMemberStatus(task, event.target.value as TaskStatus)}
                            disabled={busyTaskId === task.id}
                            aria-label={`Update status for ${task.title}`}
                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            {TASK_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {isManager && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(task)}
                              className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-pastel-blue-50 hover:text-pastel-blue-600"
                              title="Edit task"
                              aria-label={`Edit ${task.title}`}
                            >
                              <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSuccess('');
                                setDeleteTarget(task);
                              }}
                              className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete task"
                              aria-label={`Delete ${task.title}`}
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        description={
          editingTask
            ? 'Update the task details, assignee, or workflow status.'
            : 'Add a task and choose who will work on it.'
        }
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" isLoading={isSubmitting}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            label="Task Title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            error={fieldErrors.title}
            placeholder="What needs to be done?"
            required
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            error={fieldErrors.description}
            placeholder="Add context, acceptance criteria, or notes."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="assignee" className="label">
                Assignee
              </label>
              <select
                id="assignee"
                value={form.assignedToId}
                onChange={(event) => setForm((current) => ({ ...current, assignedToId: event.target.value }))}
                className="input-field"
                required
                disabled={assignees.length === 0}
              >
                {assignees.length === 0 ? (
                  <option value="">No QA or member available</option>
                ) : (
                  <>
                    <option value="">Select a person</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} ({assignee.role_label})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {fieldErrors.assigned_to_id && (
                <p className="mt-1.5 text-sm text-red-600">{fieldErrors.assigned_to_id}</p>
              )}
              {assignees.length === 0 && (
                <p className="mt-1.5 text-xs text-neutral-400">
                  Add a QA or member to your project first.
                </p>
              )}
            </div>

            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              error={fieldErrors.due_date}
            />
          </div>

          <div>
            <label htmlFor="task-status" className="label">
              Status
            </label>
            <select
              id="task-status"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              className="input-field"
            >
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.status && <p className="mt-1.5 text-sm text-red-600">{fieldErrors.status}</p>}
          </div>
        </form>
      </Modal>

      <Modal
        open={reviewTarget !== null}
        onClose={closeReview}
        title={reviewMode === 'approved' ? 'Approve Task' : 'Request Revision'}
        description={
          reviewMode === 'approved'
            ? 'Confirm that this task is ready to be approved.'
            : 'Tell the assignee what needs to be revised.'
        }
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeReview} disabled={isReviewing}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="review-form"
              variant={reviewMode === 'revision' ? 'danger' : 'primary'}
              isLoading={isReviewing}
            >
              {reviewMode === 'approved' ? 'Approve Task' : 'Send Revision'}
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={handleReview} className="space-y-5">
          {reviewError && <Alert variant="error">{reviewError}</Alert>}

          {reviewTarget && (
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="font-medium text-neutral-900">{reviewTarget.title}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {reviewTarget.assigned_to?.name ?? 'Unassigned'}
                {reviewTarget.project ? ` · ${reviewTarget.project.name}` : ''}
              </p>
            </div>
          )}

          {reviewMode === 'revision' && (
            <Textarea
              label="Revision Notes"
              value={revisionNotes}
              onChange={(event) => setRevisionNotes(event.target.value)}
              placeholder="Explain what needs to be fixed."
              required
            />
          )}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => (!isDeleting ? setDeleteTarget(null) : undefined)}
        title="Delete Task"
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete Task
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          Delete <span className="font-medium text-neutral-900">{deleteTarget?.title}</span>? This action cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
