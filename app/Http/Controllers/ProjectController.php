<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;

class ProjectController extends Controller
{
    public function index(): JsonResponse
    {
        $projects = Project::query()
            ->with('projectManager:id,name,email')
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($query) => $query->where('status', Task::STATUS_COMPLETED),
                'tasks as in_progress_tasks_count' => fn ($query) => $query->where('status', Task::STATUS_IN_PROGRESS),
                'tasks as pending_tasks_count' => fn ($query) => $query->where('status', Task::STATUS_PENDING),
                'tasks as overdue_tasks_count' => fn ($query) => $query
                    ->where('status', '!=', Task::STATUS_COMPLETED)
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<', now()->toDateString()),
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Project $project) => $this->present($project));

        return response()->json([
            'success' => true,
            'data' => ['projects' => $projects],
        ]);
    }

    private function present(Project $project): array
    {
        $total = $project->tasks_count;
        $completed = $project->completed_tasks_count;
        $overdue = $project->overdue_tasks_count;
        $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        return [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status,
            'due_date' => $project->due_date?->toDateString(),
            'project_manager' => $project->projectManager ? [
                'id' => $project->projectManager->id,
                'name' => $project->projectManager->name,
                'email' => $project->projectManager->email,
            ] : null,
            'task_counts' => [
                'total' => $total,
                'completed' => $completed,
                'in_progress' => $project->in_progress_tasks_count,
                'pending' => $project->pending_tasks_count,
                'overdue' => $overdue,
            ],
            'progress' => $progress,
            'health' => $this->health($total, $completed, $overdue, $progress),
        ];
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
}
