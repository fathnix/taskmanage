<?php

namespace App\Services;

use App\Contracts\Repositories\TaskRepositoryInterface;
use App\Enums\UserRole;
use App\Exceptions\AccessDeniedException;
use App\Exceptions\BusinessRuleException;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class AuthorizationService
{
    public function __construct(
        private readonly TaskRepositoryInterface $tasks,
    ) {}

    public function ensureRole(User $user, UserRole ...$roles): void
    {
        if (! in_array($user->role, $roles, true)) {
            throw new AccessDeniedException;
        }
    }

    /**
     * @param  array<int, UserRole>  $roles
     */
    public function ensureAnyRole(User $user, array $roles): void
    {
        if (! in_array($user->role, $roles, true)) {
            throw new AccessDeniedException;
        }
    }

    public function ensureAdmin(User $user): void
    {
        if ($user->role !== UserRole::Admin) {
            throw new AccessDeniedException('Only admins can perform this action.');
        }
    }

    public function ensureManager(User $user): void
    {
        if ($user->role !== UserRole::ProjectManager) {
            throw new AccessDeniedException('Only project managers can perform this action.');
        }
    }

    public function ensureCanViewUsers(User $user): void
    {
        $this->ensureAnyRole($user, [UserRole::Admin, UserRole::ProjectManager, UserRole::QA]);
    }

    public function ensureTaskAccess(User $user): void
    {
        $this->ensureAnyRole($user, [
            UserRole::ProjectManager,
            UserRole::QA,
            UserRole::Member,
            UserRole::Client,
        ]);
    }

    public function ensureNotAdminUser(User $user): void
    {
        if ($user->role === UserRole::Admin) {
            throw new BusinessRuleException('user', 'Admin accounts cannot be managed from this page.');
        }
    }

    public function ensureCanViewProject(User $user, Project $project): void
    {
        if ($user->role === UserRole::Admin) {
            throw new AccessDeniedException('Admins cannot open the project workspace.');
        }

        if ($user->role === UserRole::ProjectManager) {
            if ($user->primaryProjectId() !== $project->id) {
                throw new AccessDeniedException('You can only view your own project.');
            }

            return;
        }

        if ($user->primaryProjectId() !== $project->id) {
            throw new AccessDeniedException('You are not part of this project.');
        }
    }

    public function ensureCanManageProject(User $user, Project $project): void
    {
        if ($user->role === UserRole::Admin) {
            throw new AccessDeniedException('Admins cannot edit projects.');
        }

        if ($user->role !== UserRole::ProjectManager || $user->primaryProjectId() !== $project->id) {
            throw new AccessDeniedException('Only the project manager assigned to this project can edit it.');
        }
    }

    public function ensureCanViewTask(User $user, Task $task): void
    {
        $this->ensureTaskAccess($user);
        $this->ensurePrimaryProjectTask($user, $task);
    }

    public function ensureCanManageTask(User $user, Task $task): void
    {
        $this->ensureManager($user);
        $this->ensurePrimaryProjectTask($user, $task);
    }

    public function ensurePrimaryProjectTask(User $user, Task $task): void
    {
        if ($task->project_id !== $user->primaryProjectId()) {
            throw new AccessDeniedException;
        }
    }

    public function ensureAssigneeBelongsToProject(int $projectId, int $assigneeId): void
    {
        if (! $this->tasks->assigneeBelongsToProject($projectId, $assigneeId)) {
            throw new BusinessRuleException(
                'assigned_to_id',
                'Choose a QA or member who belongs to this project.',
            );
        }
    }

    public function ensureUserInViewerScope(User $viewer, User $target): void
    {
        $projectIds = $this->viewProjectIds($viewer);

        if ($projectIds === [] || ! $target->projects()->whereIn('projects.id', $projectIds)->exists()) {
            throw new AccessDeniedException('This user is not part of your project.');
        }
    }

    public function ensureHasManagedProject(User $manager): void
    {
        if ($this->managedProjectIds($manager) === []) {
            throw new BusinessRuleException('project', 'You are not managing any project yet.');
        }
    }

    /**
     * @return array<int, int>
     */
    public function managedProjectIds(User $manager): array
    {
        $projectId = Project::query()
            ->where('project_manager_id', $manager->id)
            ->orderBy('id')
            ->value('id');

        return $projectId !== null ? [(int) $projectId] : [];
    }

    /**
     * @return array<int, int>
     */
    public function viewProjectIds(User $viewer): array
    {
        $projectId = $viewer->primaryProjectId();

        return $projectId !== null ? [$projectId] : [];
    }
}
