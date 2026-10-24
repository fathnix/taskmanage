<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->ensureTaskAccess($user);

        $query = Task::query()
            ->with([
                'project:id,name',
                'assignee:id,name,email,role,avatar',
                'qaChecker:id,name,email,role,avatar',
                'approver:id,name,email,role,avatar',
            ]);

        $projectId = $user->primaryProjectId();

        if ($projectId === null) {
            return $this->tasksResponse(collect());
        }

        $query->where('project_id', $projectId);

        $search = trim($request->string('search')->toString());

        if ($search !== '') {
            $query->where(function (Builder $query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas(
                        'assignee',
                        fn (Builder $query) => $query->where('name', 'like', "%{$search}%"),
                    );
            });
        }

        return $this->tasksResponse($query->latest()->get());
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        $this->ensureCanViewTask($request->user(), $task);

        $task->load([
            'project:id,name',
            'assignee:id,name,email,role,avatar',
            'qaChecker:id,name,email,role,avatar',
            'approver:id,name,email,role,avatar',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task loaded successfully',
            'data' => ['task' => $this->present($task)],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->role === UserRole::ProjectManager, 403);

        $projectId = $user->primaryProjectId();

        if ($projectId === null) {
            throw ValidationException::withMessages([
                'project' => 'You need a project before you can create tasks.',
            ]);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(Task::STATUSES)],
            'assigned_to_id' => ['required', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        $this->ensureAssigneeBelongsToProject($projectId, (int) $validated['assigned_to_id']);

        $task = Task::create([
            'project_id' => $projectId,
            'assigned_to_id' => $validated['assigned_to_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? Task::STATUS_PENDING,
            'qa_status' => Task::QA_STATUS_PENDING,
            'approval_status' => Task::APPROVAL_STATUS_PENDING,
            'due_date' => $validated['due_date'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => ['task' => $this->present($this->loadTask($task))],
        ], 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->role === UserRole::ProjectManager, 403);
        $this->ensurePrimaryProjectTask($user, $task);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(Task::STATUSES)],
            'assigned_to_id' => ['required', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        $this->ensureAssigneeBelongsToProject($task->project_id, (int) $validated['assigned_to_id']);

        $reviewNeedsReset = $task->title !== $validated['title']
            || ($task->description ?? null) !== ($validated['description'] ?? null)
            || $task->assigned_to_id !== (int) $validated['assigned_to_id']
            || $task->status !== $validated['status'];

        $task->fill([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'assigned_to_id' => $validated['assigned_to_id'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        if ($reviewNeedsReset) {
            $task->fill($this->resetReviewAttributes());
        }

        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => ['task' => $this->present($this->loadTask($task))],
        ]);
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless(in_array($user->role, [UserRole::Member, UserRole::QA], true), 403);
        $this->ensureCanViewTask($user, $task);

        abort_unless($task->assigned_to_id === $user->id, 403);

        if ($task->approval_status === Task::APPROVAL_STATUS_APPROVED) {
            throw ValidationException::withMessages([
                'task' => 'This task has already been approved.',
            ]);
        }

        $request->validate([
            'status' => ['required', Rule::in([Task::STATUS_IN_PROGRESS])],
        ]);

        if ($task->status !== Task::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'status' => 'Only pending tasks can be started.',
            ]);
        }

        $task->status = Task::STATUS_IN_PROGRESS;
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Task started successfully',
            'data' => ['task' => $this->present($this->loadTask($task))],
        ]);
    }

    public function submit(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless(in_array($user->role, [UserRole::Member, UserRole::QA], true), 403);
        $this->ensureCanViewTask($user, $task);

        abort_unless($task->assigned_to_id === $user->id, 403);

        if ($task->approval_status === Task::APPROVAL_STATUS_APPROVED) {
            throw ValidationException::withMessages([
                'task' => 'This task has already been approved.',
            ]);
        }

        if ($task->status !== Task::STATUS_IN_PROGRESS) {
            throw ValidationException::withMessages([
                'task' => 'Start the task before submitting your result.',
            ]);
        }

        $validated = $request->validate([
            'submission_description' => ['required', 'string', 'max:5000'],
            'evidence_link' => ['nullable', 'string', 'max:2048', 'url:http,https', 'required_without:evidence_photo'],
            'evidence_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'required_without:evidence_link'],
            'difficulty' => ['nullable', 'string', 'max:2000'],
        ]);

        $oldPhoto = $task->submission_photo;
        $photoPath = null;

        if ($request->hasFile('evidence_photo')) {
            $photoPath = $request->file('evidence_photo')->store('task-evidence', 'public');
        }

        if ($oldPhoto && $oldPhoto !== $photoPath) {
            Storage::disk('public')->delete($oldPhoto);
        }

        $task->fill([
            'status' => Task::STATUS_COMPLETED,
            'submission_description' => $validated['submission_description'],
            'submission_link' => $validated['evidence_link'] ?? null,
            'submission_photo' => $photoPath,
            'submission_difficulty' => $validated['difficulty'] ?? null,
            'submitted_at' => now(),
        ]);
        $task->fill($this->resetReviewAttributes());
        $task->save();

        return response()->json([
            'success' => true,
            'message' => 'Task result submitted successfully',
            'data' => ['task' => $this->present($this->loadTask($task))],
        ]);
    }

    public function qaCheck(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->role === UserRole::QA, 403);
        $this->ensureCanViewTask($user, $task);

        if ($task->status !== Task::STATUS_COMPLETED) {
            throw ValidationException::withMessages([
                'task' => 'Only completed tasks can be checked by QA.',
            ]);
        }

        if ($task->approval_status === Task::APPROVAL_STATUS_APPROVED) {
            throw ValidationException::withMessages([
                'task' => 'This task is already approved.',
            ]);
        }

        $task->update([
            'qa_status' => Task::QA_STATUS_CHECKED,
            'qa_checked_at' => now(),
            'qa_checked_by_id' => $user->id,
            'approval_status' => Task::APPROVAL_STATUS_PENDING,
            'approved_at' => null,
            'approved_by_id' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task marked as checked by QA',
            'data' => ['task' => $this->present($this->loadTask($task))],
        ]);
    }

    public function approval(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->role === UserRole::ProjectManager, 403);
        $this->ensurePrimaryProjectTask($user, $task);

        $validated = $request->validate([
            'approval_status' => ['required', Rule::in([Task::APPROVAL_STATUS_APPROVED, Task::APPROVAL_STATUS_REVISION])],
            'revision_notes' => ['required_if:approval_status,revision', 'nullable', 'string', 'max:2000'],
        ]);

        if ($task->qa_status !== Task::QA_STATUS_CHECKED) {
            throw ValidationException::withMessages([
                'task' => 'QA must check this task before you can review it.',
            ]);
        }

        if ($validated['approval_status'] === Task::APPROVAL_STATUS_APPROVED) {
            $task->update([
                'approval_status' => Task::APPROVAL_STATUS_APPROVED,
                'approved_at' => now(),
                'approved_by_id' => $user->id,
                'revision_notes' => null,
            ]);
        } else {
            $task->update([
                'status' => Task::STATUS_IN_PROGRESS,
                'approval_status' => Task::APPROVAL_STATUS_REVISION,
                'approved_at' => null,
                'approved_by_id' => $user->id,
                'revision_notes' => $validated['revision_notes'],
                'qa_status' => Task::QA_STATUS_PENDING,
                'qa_checked_at' => null,
                'qa_checked_by_id' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $validated['approval_status'] === Task::APPROVAL_STATUS_APPROVED
                ? 'Task approved successfully'
                : 'Task sent back for revision',
            'data' => ['task' => $this->present($this->loadTask($task))],
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->role === UserRole::ProjectManager, 403);
        $this->ensurePrimaryProjectTask($user, $task);

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    public function assignees(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->role === UserRole::ProjectManager, 403);

        $projectId = $user->primaryProjectId();

        if ($projectId === null) {
            return response()->json([
                'success' => true,
                'message' => 'Assignees loaded successfully',
                'data' => ['assignees' => []],
            ]);
        }

        $assignees = User::query()
            ->whereIn('role', [UserRole::QA, UserRole::Member])
            ->whereHas('projects', fn (Builder $query) => $query->where('projects.id', $projectId))
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->presentUser($user))
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Assignees loaded successfully',
            'data' => ['assignees' => $assignees],
        ]);
    }

    private function tasksResponse($tasks): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Tasks loaded successfully',
            'data' => [
                'tasks' => $tasks->map(fn (Task $task) => $this->present($task))->values(),
                'stats' => [
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
                ],
            ],
        ]);
    }

    private function loadTask(Task $task): Task
    {
        return $task->load([
            'project:id,name',
            'assignee:id,name,email,role,avatar',
            'qaChecker:id,name,email,role,avatar',
            'approver:id,name,email,role,avatar',
        ]);
    }

    private function present(Task $task): array
    {
        return [
            'id' => $task->id,
            'project_id' => $task->project_id,
            'project' => $task->project ? [
                'id' => $task->project->id,
                'name' => $task->project->name,
            ] : null,
            'title' => $task->title,
            'description' => $task->description,
            'submission_description' => $task->submission_description,
            'submission_link' => $task->submission_link,
            'submission_photo_url' => $task->submission_photo
                ? Storage::disk('public')->url($task->submission_photo)
                : null,
            'submission_difficulty' => $task->submission_difficulty,
            'submitted_at' => $task->submitted_at?->toISOString(),
            'status' => $task->status,
            'due_date' => $task->due_date?->toDateString(),
            'assigned_to' => $task->assignee ? $this->presentUser($task->assignee) : null,
            'qa_status' => $task->qa_status,
            'qa_checked_at' => $task->qa_checked_at?->toISOString(),
            'qa_checked_by' => $task->qaChecker ? $this->presentUser($task->qaChecker) : null,
            'approval_status' => $task->approval_status,
            'approved_at' => $task->approved_at?->toISOString(),
            'approved_by' => $task->approver ? $this->presentUser($task->approver) : null,
            'revision_notes' => $task->revision_notes,
            'created_at' => $task->created_at?->toISOString(),
        ];
    }

    private function presentUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->value,
            'role_label' => $user->role?->label(),
            'avatar_url' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
        ];
    }

    private function ensureTaskAccess(User $user): void
    {
        abort_if(! in_array($user->role, [
            UserRole::ProjectManager,
            UserRole::QA,
            UserRole::Member,
            UserRole::Client,
        ], true), 403);
    }

    private function ensureCanViewTask(User $user, Task $task): void
    {
        $this->ensureTaskAccess($user);
        $this->ensurePrimaryProjectTask($user, $task);
    }

    private function ensurePrimaryProjectTask(User $user, Task $task): void
    {
        abort_unless($task->project_id === $user->primaryProjectId(), 403);
    }

    private function ensureAssigneeBelongsToProject(int $projectId, int $assigneeId): void
    {
        $assignee = User::query()
            ->whereKey($assigneeId)
            ->whereIn('role', [UserRole::QA, UserRole::Member])
            ->whereHas('projects', fn (Builder $query) => $query->where('projects.id', $projectId))
            ->exists();

        if (! $assignee) {
            throw ValidationException::withMessages([
                'assigned_to_id' => 'Choose a QA or member who belongs to this project.',
            ]);
        }
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
