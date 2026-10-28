<?php

namespace App\Services;

use App\Contracts\Repositories\TimeReportRepositoryInterface;
use App\DTOs\TimeReport\TimeReportData;
use App\Exceptions\BusinessRuleException;
use App\Models\TimeLog;
use App\Models\User;

class TimeReportService
{
    public function __construct(
        private readonly TimeReportRepositoryInterface $reports,
        private readonly AuthorizationService $authorization,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function report(User $user, TimeReportData $data): array
    {
        $this->authorization->ensureAdmin($user);

        $from = $data->from ?? now()->startOfMonth()->toDateString();
        $to = $data->to ?? now()->toDateString();

        if ($from > $to) {
            throw new BusinessRuleException('from', 'The start date must be on or before the end date.');
        }

        $filters = ['from' => $from, 'to' => $to];

        if ($data->userId !== null) {
            $filters['user_id'] = $data->userId;
        }

        if ($data->projectId !== null) {
            $filters['project_id'] = $data->projectId;
        }

        $summary = $this->reports->summary($filters);

        $logs = $this->reports->logs($filters)
            ->map(function (TimeLog $log): array {
                $task = $log->task;
                $project = $task?->project;

                return [
                    'id' => $log->id,
                    'user' => ['id' => $log->user?->id, 'name' => $log->user?->name],
                    'project' => ['id' => $project?->id, 'name' => $project?->name],
                    'task' => ['id' => $task?->id, 'title' => $task?->title],
                    'duration_minutes' => $log->duration_minutes,
                    'logged_on' => $log->logged_on->toDateString(),
                    'note' => $log->note,
                ];
            })
            ->values();

        $memberTotals = $this->reports->memberTotals($filters)
            ->map(fn ($row): array => [
                'id' => $row->id,
                'name' => $row->name,
                'total_minutes' => (int) $row->total_minutes,
                'total_hours' => round($row->total_minutes / 60, 2),
            ])
            ->values();

        $projectTotals = $this->reports->projectTotals($filters)
            ->map(fn ($row): array => [
                'id' => $row->id,
                'name' => $row->name,
                'total_minutes' => (int) $row->total_minutes,
                'total_hours' => round($row->total_minutes / 60, 2),
            ])
            ->values();

        return [
            'filters' => ['from' => $from, 'to' => $to],
            'summary' => [
                'total_minutes' => $summary['total_minutes'],
                'total_hours' => round($summary['total_minutes'] / 60, 2),
                'log_count' => $summary['log_count'],
            ],
            'member_totals' => $memberTotals,
            'project_totals' => $projectTotals,
            'logs' => $logs,
            'users' => $this->reports->users(),
            'projects' => $this->reports->projects(),
        ];
    }
}
