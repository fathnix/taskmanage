<?php

namespace App\Contracts\Repositories;

use App\Models\Project;
use Illuminate\Support\Collection;

interface ProjectRepositoryInterface
{
    /**
     * @return Collection<int, Project>
     */
    public function allWithStats(?int $projectId = null): Collection;

    public function findWithStats(int $projectId): ?Project;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes): Project;
}
