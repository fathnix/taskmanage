<?php

namespace App\Services;

use App\Contracts\Repositories\ProjectRepositoryInterface;
use App\DTOs\Project\UpdateProjectData;
use App\Enums\UserRole;
use App\Exceptions\ResourceNotFoundException;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    public function __construct(
        private readonly ProjectRepositoryInterface $projects,
        private readonly AuthorizationService $authorization,
    ) {}

    /**
     * @return Collection<int, Project>
     */
    public function listFor(User $user): Collection
    {
        $projectId = $user->role === UserRole::Admin
            ? null
            : ($user->primaryProjectId() ?? 0);

        return $this->projects->allWithStats($projectId);
    }

    public function show(User $user, Project $project): Project
    {
        $this->authorization->ensureCanViewProject($user, $project);

        return $this->projects->findWithStats($project->id)
            ?? throw new ResourceNotFoundException('Project not found.');
    }

    public function update(User $user, Project $project, UpdateProjectData $data): Project
    {
        $this->authorization->ensureCanManageProject($user, $project);

        DB::transaction(fn () => $this->projects->update($project, $data->toAttributes()));

        return $this->projects->findWithStats($project->id)
            ?? throw new ResourceNotFoundException('Project not found.');
    }
}
