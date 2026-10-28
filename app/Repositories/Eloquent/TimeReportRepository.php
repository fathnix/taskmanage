<?php

namespace App\Repositories\Eloquent;

use App\Contracts\Repositories\TimeReportRepositoryInterface;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TimeReportRepository implements TimeReportRepositoryInterface
{
    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return Collection<int, TimeLog>
     */
    public function logs(array $filters, int $limit = 100): Collection
    {
        return $this->filteredLogs($filters)
            ->with(['user:id,name', 'task:id,title,project_id', 'task.project:id,name'])
            ->latest('logged_on')
            ->latest('id')
            ->limit($limit)
            ->get();
    }

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return Collection<int, object>
     */
    public function memberTotals(array $filters): Collection
    {
        return $this->aggregate($filters)
            ->join('users', 'users.id', '=', 'time_logs.user_id')
            ->select('users.id', 'users.name', DB::raw('SUM(time_logs.duration_minutes) as total_minutes'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_minutes')
            ->get();
    }

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return Collection<int, object>
     */
    public function projectTotals(array $filters): Collection
    {
        return $this->aggregate($filters)
            ->join('projects', 'projects.id', '=', 'tasks.project_id')
            ->select('projects.id', 'projects.name', DB::raw('SUM(time_logs.duration_minutes) as total_minutes'))
            ->groupBy('projects.id', 'projects.name')
            ->orderByDesc('total_minutes')
            ->get();
    }

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return array{total_minutes: int, log_count: int}
     */
    public function summary(array $filters): array
    {
        $query = $this->filteredLogs($filters);

        return [
            'total_minutes' => (int) $query->sum('duration_minutes'),
            'log_count' => (clone $query)->count(),
        ];
    }

    /**
     * @return Collection<int, User>
     */
    public function users(): Collection
    {
        return User::query()
            ->whereIn('role', [UserRole::Member, UserRole::QA])
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return Collection<int, Project>
     */
    public function projects(): Collection
    {
        return Project::query()->orderBy('name')->get(['id', 'name']);
    }

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     */
    private function filteredLogs(array $filters)
    {
        return TimeLog::query()
            ->whereBetween('logged_on', [$filters['from'], $filters['to']])
            ->when(
                isset($filters['user_id']),
                fn ($query) => $query->where('user_id', $filters['user_id']),
            )
            ->when(
                isset($filters['project_id']),
                fn ($query) => $query->whereHas(
                    'task',
                    fn ($taskQuery) => $taskQuery->where('project_id', $filters['project_id']),
                ),
            );
    }

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     */
    private function aggregate(array $filters): Builder
    {
        return DB::table('time_logs')
            ->join('tasks', 'tasks.id', '=', 'time_logs.task_id')
            ->whereBetween('time_logs.logged_on', [$filters['from'], $filters['to']])
            ->when(
                isset($filters['user_id']),
                fn (Builder $query) => $query->where('time_logs.user_id', $filters['user_id']),
            )
            ->when(
                isset($filters['project_id']),
                fn (Builder $query) => $query->where('tasks.project_id', $filters['project_id']),
            );
    }
}
