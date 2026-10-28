<?php

namespace App\Repositories\Eloquent;

use App\Contracts\Repositories\TaskRepositoryInterface;
use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class TaskRepository implements TaskRepositoryInterface
{
    /**
     * @return Collection<int, Task>
     */
    public function listForProject(int $projectId, string $search = ''): Collection
    {
        return Task::query()
            ->with($this->relations())
            ->where('project_id', $projectId)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas(
                            'assignee',
                            fn (Builder $query) => $query->where('name', 'like', "%{$search}%"),
                        );
                });
            })
            ->latest()
            ->get();
    }

    /**
     * @return Collection<int, Task>
     */
    public function helpRequestsForProject(int $projectId): Collection
    {
        return Task::query()
            ->with([
                'project:id,name',
                'assignee:id,name,email,role,avatar',
            ])
            ->where('project_id', $projectId)
            ->whereNotNull('submission_difficulty')
            ->where('submission_difficulty', '!=', '')
            ->latest('submitted_at')
            ->get();
    }

    public function find(int $taskId): ?Task
    {
        return Task::query()->find($taskId);
    }

    public function loadRelations(Task $task): Task
    {
        return $task->load($this->relations());
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Task
    {
        return Task::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Task $task, array $attributes): Task
    {
        $task->fill($attributes);
        $task->save();

        return $task;
    }

    public function delete(Task $task): bool
    {
        return (bool) $task->delete();
    }

    /**
     * @return Collection<int, User>
     */
    public function assigneesForProject(int $projectId): Collection
    {
        return User::query()
            ->whereIn('role', [UserRole::QA, UserRole::Member])
            ->whereHas('projects', fn (Builder $query) => $query->where('projects.id', $projectId))
            ->orderBy('name')
            ->get();
    }

    public function assigneeBelongsToProject(int $projectId, int $userId): bool
    {
        return User::query()
            ->whereKey($userId)
            ->whereIn('role', [UserRole::QA, UserRole::Member])
            ->whereHas('projects', fn (Builder $query) => $query->where('projects.id', $projectId))
            ->exists();
    }

    /**
     * @return array<int, string>
     */
    private function relations(): array
    {
        return [
            'project:id,name',
            'assignee:id,name,email,role,avatar',
            'qaChecker:id,name,email,role,avatar',
            'approver:id,name,email,role,avatar',
        ];
    }
}
