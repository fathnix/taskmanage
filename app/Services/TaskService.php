<?php

namespace App\Services;

use App\Contracts\Repositories\TaskRepositoryInterface;
use App\DTOs\Task\CreateTaskData;
use App\DTOs\Task\ReviewTaskData;
use App\DTOs\Task\SubmitTaskData;
use App\DTOs\Task\UpdateTaskData;
use App\Enums\UserRole;
use App\Exceptions\AccessDeniedException;
use App\Exceptions\BusinessRuleException;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class TaskService
{
    public function __construct(
        private readonly TaskRepositoryInterface $tasks,
        private readonly AuthorizationService $authorization,
    ) {}

    /**
     * @return array{tasks: Collection<int, Task>, stats: array<string, int>}
     */
    public function listFor(User $user, string $search = ''): array
    {
        $this->authorization->ensureTaskAccess($user);

        $projectId = $user->primaryProjectId();
        $tasks = $projectId === null
            ? collect()
            : $this->tasks->listForProject($projectId, trim($search));

        return ['tasks' => $tasks, 'stats' => $this->stats($tasks)];
    }

    public function show(User $user, Task $task): Task
    {
        $this->authorization->ensureCanViewTask($user, $task);

        return $this->tasks->loadRelations($task);
    }

    public function create(User $user, CreateTaskData $data): Task
    {
        $this->authorization->ensureRole($user, UserRole::ProjectManager);

        $projectId = $user->primaryProjectId();

        if ($projectId === null) {
            throw new BusinessRuleException('project', 'You need a project before you can create tasks.');
        }

        $this->authorization->ensureAssigneeBelongsToProject($projectId, $data->assignedToId);

        $task = DB::transaction(fn () => $this->tasks->create($data->toAttributes($projectId)));

        return $this->tasks->loadRelations($task);
    }

    public function update(User $user, Task $task, UpdateTaskData $data): Task
    {
        $this->authorization->ensureCanManageTask($user, $task);
        $this->authorization->ensureAssigneeBelongsToProject($task->project_id, $data->assignedToId);

        $reviewNeedsReset = $task->title !== $data->title
            || ($task->description ?? null) !== $data->description
            || $task->assigned_to_id !== $data->assignedToId
            || $task->status !== $data->status;

        $attributes = $data->toAttributes();

        if ($reviewNeedsReset) {
            $attributes = array_merge($attributes, $this->resetReviewAttributes());
        }

        DB::transaction(fn () => $this->tasks->update($task, $attributes));

        return $this->tasks->loadRelations($task);
    }

    public function updateStatus(User $user, Task $task): Task
    {
        $this->authorization->ensureAnyRole($user, [UserRole::Member, UserRole::QA]);
        $this->authorization->ensureCanViewTask($user, $task);

        if ($task->assigned_to_id !== $user->id) {
            throw new AccessDeniedException;
        }

        if ($task->approval_status === Task::APPROVAL_STATUS_APPROVED) {
            throw new BusinessRuleException('task', 'This task has already been approved.');
        }

        if ($task->status !== Task::STATUS_PENDING) {
            throw new BusinessRuleException('status', 'Only pending tasks can be started.');
        }

        $task = $this->tasks->update($task, ['status' => Task::STATUS_IN_PROGRESS]);

        return $this->tasks->loadRelations($task);
    }

    public function submit(User $user, Task $task, SubmitTaskData $data): Task
    {
        $this->authorization->ensureAnyRole($user, [UserRole::Member, UserRole::QA]);
        $this->authorization->ensureCanViewTask($user, $task);

        if ($task->assigned_to_id !== $user->id) {
            throw new AccessDeniedException;
        }

        if ($task->approval_status === Task::APPROVAL_STATUS_APPROVED) {
            throw new BusinessRuleException('task', 'This task has already been approved.');
        }

        if ($task->status !== Task::STATUS_IN_PROGRESS) {
            throw new BusinessRuleException('task', 'Start the task before submitting your result.');
        }

        $oldPhoto = $task->submission_photo;
        $newPhoto = null;

        try {
            if ($data->evidencePhoto !== null) {
                $newPhoto = $data->evidencePhoto->store('task-evidence', 'public');
            }

            $attributes = array_merge([
                'status' => Task::STATUS_COMPLETED,
                'submission_description' => $data->submissionDescription,
                'submission_link' => $data->evidenceLink,
                'submission_photo' => $newPhoto,
                'submission_difficulty' => $data->difficulty,
                'submitted_at' => now(),
            ], $this->resetReviewAttributes());

            DB::transaction(fn () => $this->tasks->update($task, $attributes));
        } catch (Throwable $exception) {
            if ($newPhoto !== null) {
                Storage::disk('public')->delete($newPhoto);
            }

            throw $exception;
        }

        if ($oldPhoto !== null && $oldPhoto !== $newPhoto) {
            Storage::disk('public')->delete($oldPhoto);
        }

        return $this->tasks->loadRelations($task);
    }

    public function qaCheck(User $user, Task $task): Task
    {
        $this->authorization->ensureRole($user, UserRole::QA);
        $this->authorization->ensureCanViewTask($user, $task);

        if ($task->status !== Task::STATUS_COMPLETED) {
            throw new BusinessRuleException('task', 'Only completed tasks can be checked by QA.');
        }

        if ($task->approval_status === Task::APPROVAL_STATUS_APPROVED) {
            throw new BusinessRuleException('task', 'This task is already approved.');
        }

        $task = $this->tasks->update($task, [
            'qa_status' => Task::QA_STATUS_CHECKED,
            'qa_checked_at' => now(),
            'qa_checked_by_id' => $user->id,
            'approval_status' => Task::APPROVAL_STATUS_PENDING,
            'approved_at' => null,
            'approved_by_id' => null,
        ]);

        return $this->tasks->loadRelations($task);
    }

    public function review(User $user, Task $task, ReviewTaskData $data): Task
    {
        $this->authorization->ensureCanManageTask($user, $task);

        if ($task->qa_status !== Task::QA_STATUS_CHECKED) {
            throw new BusinessRuleException('task', 'QA must check this task before you can review it.');
        }

        $attributes = $data->approvalStatus === Task::APPROVAL_STATUS_APPROVED
            ? [
                'approval_status' => Task::APPROVAL_STATUS_APPROVED,
                'approved_at' => now(),
                'approved_by_id' => $user->id,
                'revision_notes' => null,
            ]
            : [
                'status' => Task::STATUS_IN_PROGRESS,
                'approval_status' => Task::APPROVAL_STATUS_REVISION,
                'approved_at' => null,
                'approved_by_id' => $user->id,
                'revision_notes' => $data->revisionNotes,
                'qa_status' => Task::QA_STATUS_PENDING,
                'qa_checked_at' => null,
                'qa_checked_by_id' => null,
            ];

        $task = $this->tasks->update($task, $attributes);

        return $this->tasks->loadRelations($task);
    }

    public function destroy(User $user, Task $task): void
    {
        $this->authorization->ensureCanManageTask($user, $task);

        $photo = $task->submission_photo;

        DB::transaction(fn () => $this->tasks->delete($task));

        if ($photo !== null) {
            Storage::disk('public')->delete($photo);
        }
    }

    /**
     * @return Collection<int, User>
     */
    public function assignees(User $user): Collection
    {
        $this->authorization->ensureManager($user);

        $projectId = $user->primaryProjectId();

        return $projectId === null
            ? collect()
            : $this->tasks->assigneesForProject($projectId);
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array<string, int>
     */
    private function stats(Collection $tasks): array
    {
        return [
            'total' => $tasks->count(),
            'pending' => $tasks->where('status', Task::STATUS_PENDING)->count(),
            'in_progress' => $tasks->where('status', Task::STATUS_IN_PROGRESS)->count(),
            'completed' => $tasks->where('status', Task::STATUS_COMPLETED)->count(),
            'overdue' => $tasks->filter(
                fn (Task $task) => $task->status !== Task::STATUS_COMPLETED
                    && $task->due_date !== null
                    && $task->due_date->toDateString() < now()->toDateString(),
            )->count(),
            'qa_checked' => $tasks->where('qa_status', Task::QA_STATUS_CHECKED)->count(),
            'approved' => $tasks->where('approval_status', Task::APPROVAL_STATUS_APPROVED)->count(),
            'revision' => $tasks->where('approval_status', Task::APPROVAL_STATUS_REVISION)->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resetReviewAttributes(): array
    {
        return [
            'qa_status' => Task::QA_STATUS_PENDING,
            'qa_checked_at' => null,
            'qa_checked_by_id' => null,
            'approval_status' => Task::APPROVAL_STATUS_PENDING,
            'approved_at' => null,
            'approved_by_id' => null,
        ];
    }
}
