<?php

namespace App\Contracts\Repositories;

use App\Models\User;
use Illuminate\Support\Collection;

interface UserRepositoryInterface
{
    /**
     * @return Collection<int, User>
     */
    public function listForAdmin(string $search = ''): Collection;

    /**
     * @param  array<int, int>  $projectIds
     * @return Collection<int, User>
     */
    public function listForProjects(array $projectIds, string $search = ''): Collection;

    /**
     * @param  array<int, int>  $projectIds
     * @return array<string, int>
     */
    public function statsForProjects(array $projectIds): array;

    public function find(int $userId): ?User;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): User;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, array $attributes): User;

    /**
     * @param  array<int, int>  $projectIds
     */
    public function attachToProjects(User $user, array $projectIds): void;

    /**
     * @param  array<int, int>  $projectIds
     */
    public function detachFromProjects(User $user, array $projectIds): void;

    public function hasProjects(User $user): bool;

    public function managesProjects(User $user): bool;

    public function deleteTokens(User $user): void;

    public function delete(User $user): bool;
}
