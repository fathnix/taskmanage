<?php

namespace App\Services;

use App\Contracts\Repositories\TaskRepositoryInterface;
use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;

class HelpService
{
    public function __construct(
        private readonly TaskRepositoryInterface $tasks,
        private readonly AuthorizationService $authorization,
    ) {}

    /**
     * @return Collection<int, Task>
     */
    public function listFor(User $user): Collection
    {
        $this->authorization->ensureAnyRole($user, [UserRole::ProjectManager, UserRole::QA]);

        $projectId = $user->primaryProjectId();

        return $projectId === null
            ? collect()
            : $this->tasks->helpRequestsForProject($projectId);
    }
}
