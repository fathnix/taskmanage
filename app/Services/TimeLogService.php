<?php

namespace App\Services;

use App\Contracts\Repositories\TaskRepositoryInterface;
use App\Contracts\Repositories\TimeLogRepositoryInterface;
use App\DTOs\TimeLog\StoreTimeLogData;
use App\Enums\UserRole;
use App\Exceptions\ResourceNotFoundException;
use App\Models\TimeLog;
use App\Models\User;

class TimeLogService
{
    public function __construct(
        private readonly TimeLogRepositoryInterface $timeLogs,
        private readonly TaskRepositoryInterface $tasks,
        private readonly AuthorizationService $authorization,
    ) {}

    public function store(User $user, StoreTimeLogData $data): TimeLog
    {
        $this->authorization->ensureAnyRole($user, [UserRole::Member, UserRole::QA]);

        $task = $this->tasks->find($data->taskId)
            ?? throw new ResourceNotFoundException('Task not found.');

        if ($task->assigned_to_id !== $user->id) {
            throw new ResourceNotFoundException('Task not found.');
        }

        return $this->timeLogs->create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'duration_minutes' => $data->durationMinutes,
            'logged_on' => $data->loggedOn,
            'note' => $data->note,
        ]);
    }
}
