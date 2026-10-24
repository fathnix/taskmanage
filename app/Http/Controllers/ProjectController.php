<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = $this->baseQuery()
            ->when(
                $user->role !== UserRole::Admin,
                fn (Builder $query) => $query->whereKey($user->primaryProjectId() ?? 0),
            )
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Project $project) => $this->present($project));

        return response()->json([
            'success' => true,
            'data' => ['projects' => $projects],
        ]);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->ensureCanView($request, $project);

        return response()->json([
            'success' => true,
            'data' => ['project' => $this->present($this->loadStats($project))],
        ]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->ensureCanManage($request, $project);

        $isIndefinite = $request->boolean('is_indefinite');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(Project::STATUSES)],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => $isIndefinite
                ? ['nullable']
                : ['required', 'date', 'after_or_equal:start_date'],
            'is_indefinite' => ['sometimes', 'boolean'],
        ]);

        $project->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'budget' => $validated['budget'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $isIndefinite ? null : ($validated['end_date'] ?? null),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => ['project' => $this->present($this->loadStats($project->refresh()))],
        ]);
    }

    private function baseQuery(): Builder
    {
        return Project::query()
            ->with('projectManager:id,name,email')
            ->withCount($this->counts());
    }

    private function loadStats(Project $project): Project
    {
        return $project
            ->load('projectManager:id,name,email')
            ->loadCount($this->counts());
    }

    /**
     * @return array<string, mixed>
     */
    private function counts(): array
    {
        return [
            'tasks',
            'tasks as completed_tasks_count' => fn (Builder $query) => $query->where('status', Task::STATUS_COMPLETED),
            'tasks as in_progress_tasks_count' => fn (Builder $query) => $query->where('status', Task::STATUS_IN_PROGRESS),
            'tasks as pending_tasks_count' => fn (Builder $query) => $query->where('status', Task::STATUS_PENDING),
            'tasks as overdue_tasks_count' => fn (Builder $query) => $query
                ->where('status', '!=', Task::STATUS_COMPLETED)
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now()->toDateString()),
            'users as team_count',
            'users as team_qa_count' => fn (Builder $query) => $query->where('users.role', UserRole::QA->value),
            'users as team_member_count' => fn (Builder $query) => $query->where('users.role', UserRole::Member->value),
            'users as team_client_count' => fn (Builder $query) => $query->where('users.role', UserRole::Client->value),
        ];
    }

    private function present(Project $project): array
    {
        $total = (int) $project->tasks_count;
        $completed = (int) $project->completed_tasks_count;
        $overdue = (int) $project->overdue_tasks_count;
        $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;
        $startDate = $project->start_date;
        $endDate = $project->due_date;
        $daysRemaining = $this->daysRemaining($endDate);
        $durationDays = ($startDate && $endDate)
            ? (int) $startDate->copy()->startOfDay()->diffInDays($endDate->copy()->startOfDay()) + 1
            : null;

        return [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'budget' => $project->budget !== null ? (float) $project->budget : null,
            'status' => $project->status,
            'start_date' => $startDate?->toDateString(),
            'end_date' => $endDate?->toDateString(),
            'due_date' => $endDate?->toDateString(),
            'is_indefinite' => $endDate === null,
            'duration_days' => $durationDays,
            'days_remaining' => $daysRemaining,
            'deadline_status' => $this->deadlineStatus($project, $endDate, $daysRemaining),
            'project_manager' => $project->projectManager ? [
                'id' => $project->projectManager->id,
                'name' => $project->projectManager->name,
                'email' => $project->projectManager->email,
            ] : null,
            'team_counts' => [
                'total' => (int) $project->team_count,
                'qa' => (int) $project->team_qa_count,
                'member' => (int) $project->team_member_count,
                'client' => (int) $project->team_client_count,
            ],
            'task_counts' => [
                'total' => $total,
                'completed' => $completed,
                'in_progress' => (int) $project->in_progress_tasks_count,
                'pending' => (int) $project->pending_tasks_count,
                'overdue' => $overdue,
            ],
            'progress' => $progress,
            'overdue_rate' => $total > 0 ? (int) round(($overdue / $total) * 100) : 0,
            'health' => $this->health($total, $completed, $overdue, $progress),
        ];
    }

    private function daysRemaining(?Carbon $endDate): ?int
    {
        if ($endDate === null) {
            return null;
        }

        $today = now()->startOfDay();
        $end = $endDate->copy()->startOfDay();

        return $end->greaterThanOrEqualTo($today)
            ? (int) $today->diffInDays($end)
            : -(int) $end->diffInDays($today);
    }

    private function deadlineStatus(Project $project, ?Carbon $endDate, ?int $daysRemaining): string
    {
        if ($project->status === Project::STATUS_COMPLETED) {
            return 'completed';
        }

        if ($endDate === null) {
            return 'indefinite';
        }

        if ($daysRemaining !== null && $daysRemaining < 0) {
            return 'overdue';
        }

        if ($daysRemaining !== null && $daysRemaining <= 7) {
            return 'due_soon';
        }

        return 'on_schedule';
    }

    /**
     * @return array{status: string, label: string}
     */
    private function health(int $total, int $completed, int $overdue, int $progress): array
    {
        if ($total === 0) {
            return ['status' => 'not_started', 'label' => 'Not Started'];
        }

        if ($completed === $total) {
            return ['status' => 'completed', 'label' => 'Completed'];
        }

        if ($overdue > 0 && ($overdue / $total) >= 0.2) {
            return ['status' => 'off_track', 'label' => 'Off Track'];
        }

        if ($overdue > 0) {
            return ['status' => 'at_risk', 'label' => 'At Risk'];
        }

        if ($progress >= 50) {
            return ['status' => 'on_track', 'label' => 'On Track'];
        }

        return ['status' => 'in_progress', 'label' => 'In Progress'];
    }

    private function ensureCanView(Request $request, Project $project): void
    {
        $user = $request->user();

        abort_if(
            $user->role === UserRole::Admin,
            403,
            'Admins cannot open the project workspace.',
        );

        if ($user->role === UserRole::ProjectManager) {
            abort_unless(
                $user->primaryProjectId() === $project->id,
                403,
                'You can only view your own project.',
            );

            return;
        }

        abort_unless(
            $user->primaryProjectId() === $project->id,
            403,
            'You are not part of this project.',
        );
    }

    private function ensureCanManage(Request $request, Project $project): void
    {
        $user = $request->user();

        abort_if(
            $user->role === UserRole::Admin,
            403,
            'Admins cannot edit projects.',
        );

        abort_unless(
            $user->role === UserRole::ProjectManager && $user->primaryProjectId() === $project->id,
            403,
            'Only the project manager assigned to this project can edit it.',
        );
    }
}
