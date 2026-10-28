<?php

namespace App\Contracts\Repositories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;

interface TaskRepositoryInterface
{
    /**
     * @return Collection<int, Task>
     */
    public function listForProject(int $projectId, string $search = ''): Collection;

    /**
     * @return Collection<int, Task>
     */
    public function helpRequestsForProject(int $projectId): Collection;

    public function find(int $taskId): ?Task;

    public function loadRelations(Task $task): Task;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Task;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Task $task, array $attributes): Task;

    public function delete(Task $task): bool;

    /**
     * @return Collection<int, User>
     */
    public function assigneesForProject(int $projectId): Collection;

    public function assigneeBelongsToProject(int $projectId, int $userId): bool;
}
