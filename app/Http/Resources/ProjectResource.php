<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $total = (int) $this->tasks_count;
        $completed = (int) $this->completed_tasks_count;
        $overdue = (int) $this->overdue_tasks_count;
        $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;
        $startDate = $this->start_date;
        $endDate = $this->due_date;
        $daysRemaining = $this->daysRemaining($endDate);
        $durationDays = ($startDate && $endDate)
            ? (int) $startDate->copy()->startOfDay()->diffInDays($endDate->copy()->startOfDay()) + 1
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'budget' => $this->budget !== null ? (float) $this->budget : null,
            'status' => $this->status,
            'start_date' => $startDate?->toDateString(),
            'end_date' => $endDate?->toDateString(),
            'due_date' => $endDate?->toDateString(),
            'is_indefinite' => $endDate === null,
            'duration_days' => $durationDays,
            'days_remaining' => $daysRemaining,
            'deadline_status' => $this->deadlineStatus($endDate, $daysRemaining),
            'project_manager' => $this->projectManager ? [
                'id' => $this->projectManager->id,
                'name' => $this->projectManager->name,
                'email' => $this->projectManager->email,
            ] : null,
            'team_counts' => [
                'total' => (int) $this->team_count,
                'qa' => (int) $this->team_qa_count,
                'member' => (int) $this->team_member_count,
                'client' => (int) $this->team_client_count,
            ],
            'task_counts' => [
                'total' => $total,
                'completed' => $completed,
                'in_progress' => (int) $this->in_progress_tasks_count,
                'pending' => (int) $this->pending_tasks_count,
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

    private function deadlineStatus(?Carbon $endDate, ?int $daysRemaining): string
    {
        if ($this->status === 'completed') {
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
}
