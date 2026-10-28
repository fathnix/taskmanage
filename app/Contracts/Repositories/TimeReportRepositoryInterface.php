<?php

namespace App\Contracts\Repositories;

use App\Models\Project;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Support\Collection;

interface TimeReportRepositoryInterface
{
    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return Collection<int, TimeLog>
     */
    public function logs(array $filters, int $limit = 100): Collection;

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return Collection<int, object>
     */
    public function memberTotals(array $filters): Collection;

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return Collection<int, object>
     */
    public function projectTotals(array $filters): Collection;

    /**
     * @param  array{from: string, to: string, user_id?: int|null, project_id?: int|null}  $filters
     * @return array{total_minutes: int, log_count: int}
     */
    public function summary(array $filters): array;

    /**
     * @return Collection<int, User>
     */
    public function users(): Collection;

    /**
     * @return Collection<int, Project>
     */
    public function projects(): Collection;
}
