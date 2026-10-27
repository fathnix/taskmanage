<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimeReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === UserRole::Admin, 403);

        $validated = $request->validate([
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'before_or_equal:today'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'project_id' => ['sometimes', 'integer', 'exists:projects,id'],
        ]);

        $from = $validated['from'] ?? now()->startOfMonth()->toDateString();
        $to = $validated['to'] ?? now()->toDateString();

        if ($from > $to) {
            return response()->json([
                'message' => 'The selected date range is invalid.',
                'errors' => ['from' => ['The start date must be on or before the end date.']],
            ], 422);
        }

        $filteredLogs = TimeLog::query()
            ->whereBetween('logged_on', [$from, $to])
            ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
            ->when(isset($validated['project_id']), fn ($query) => $query->whereHas(
                'task', fn ($taskQuery) => $taskQuery->where('project_id', $validated['project_id']),
            ));

        $logs = (clone $filteredLogs)
            ->with(['user:id,name', 'task:id,title,project_id', 'task.project:id,name'])
            ->latest('logged_on')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (TimeLog $log): array => [
                'id' => $log->id,
                'user' => ['id' => $log->user->id, 'name' => $log->user->name],
                'project' => ['id' => $log->task->project->id, 'name' => $log->task->project->name],
                'task' => ['id' => $log->task->id, 'title' => $log->task->title],
                'duration_minutes' => $log->duration_minutes,
                'logged_on' => $log->logged_on->toDateString(),
                'note' => $log->note,
            ]);

        $aggregate = fn (): Builder => DB::table('time_logs')
            ->join('tasks', 'tasks.id', '=', 'time_logs.task_id')
            ->whereBetween('time_logs.logged_on', [$from, $to])
            ->when(isset($validated['user_id']), fn (Builder $query) => $query->where('time_logs.user_id', $validated['user_id']))
            ->when(isset($validated['project_id']), fn (Builder $query) => $query->where('tasks.project_id', $validated['project_id']));

        $memberTotals = $aggregate()
            ->join('users', 'users.id', '=', 'time_logs.user_id')
            ->select('users.id', 'users.name', DB::raw('SUM(time_logs.duration_minutes) as total_minutes'))
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total_minutes')
            ->get();

        $projectTotals = $aggregate()
            ->join('projects', 'projects.id', '=', 'tasks.project_id')
            ->select('projects.id', 'projects.name', DB::raw('SUM(time_logs.duration_minutes) as total_minutes'))
            ->groupBy('projects.id', 'projects.name')
            ->orderByDesc('total_minutes')
            ->get();

        $totalMinutes = (clone $filteredLogs)->sum('duration_minutes');

        return response()->json([
            'success' => true,
            'message' => 'Time report loaded successfully.',
            'data' => [
                'filters' => ['from' => $from, 'to' => $to],
                'summary' => [
                    'total_minutes' => $totalMinutes,
                    'total_hours' => round($totalMinutes / 60, 2),
                    'log_count' => (clone $filteredLogs)->count(),
                ],
                'member_totals' => $memberTotals->map(fn ($row): array => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'total_minutes' => (int) $row->total_minutes,
                    'total_hours' => round($row->total_minutes / 60, 2),
                ]),
                'project_totals' => $projectTotals->map(fn ($row): array => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'total_minutes' => (int) $row->total_minutes,
                    'total_hours' => round($row->total_minutes / 60, 2),
                ]),
                'logs' => $logs,
                'users' => User::query()
                    ->whereIn('role', [UserRole::Member, UserRole::QA])
                    ->orderBy('name')
                    ->get(['id', 'name']),
                'projects' => Project::query()->orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }
}
