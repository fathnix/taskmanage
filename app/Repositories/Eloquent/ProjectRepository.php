<?php

namespace App\Repositories\Eloquent;

use App\Contracts\Repositories\ProjectRepositoryInterface;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ProjectRepository implements ProjectRepositoryInterface
{
    /**
     * @return Collection<int, Project>
     */
    public function allWithStats(?int $projectId = null): Collection
    {
        return Project::query()
            ->with('projectManager:id,name,email')
            ->withCount($this->counts())
            ->when($projectId !== null, fn (Builder $query) => $query->whereKey($projectId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findWithStats(int $projectId): ?Project
    {
        return Project::query()
            ->with('projectManager:id,name,email')
            ->withCount($this->counts())
            ->find($projectId);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project
    {
        $project->fill($attributes);
        $project->save();

        return $project;
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
}
