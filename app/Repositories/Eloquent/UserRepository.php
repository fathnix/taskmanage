<?php

namespace App\Repositories\Eloquent;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class UserRepository implements UserRepositoryInterface
{
    /**
     * @return Collection<int, User>
     */
    public function listForAdmin(string $search = ''): Collection
    {
        return User::query()
            ->where('role', '!=', UserRole::Admin->value)
            ->where(function (Builder $query): void {
                $query->where('role', UserRole::ProjectManager->value)
                    ->orWhere('is_active', false);
            })
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', '%'.$search.'%'))
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @param  array<int, int>  $projectIds
     * @return Collection<int, User>
     */
    public function listForProjects(array $projectIds, string $search = ''): Collection
    {
        if ($projectIds === []) {
            return collect();
        }

        return User::query()
            ->where('role', '!=', UserRole::Admin->value)
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', '%'.$search.'%'))
            ->whereHas('projects', fn (Builder $query) => $query->whereIn('projects.id', $projectIds))
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @param  array<int, int>  $projectIds
     * @return array<string, int>
     */
    public function statsForProjects(array $projectIds): array
    {
        $stats = collect(UserRole::selfAssignable())
            ->mapWithKeys(fn (string $role) => [$role => 0])
            ->all();

        if ($projectIds === []) {
            return $stats;
        }

        $roleCounts = User::query()
            ->whereIn('role', UserRole::selfAssignable())
            ->whereHas('projects', fn (Builder $query) => $query->whereIn('projects.id', $projectIds))
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        foreach (UserRole::selfAssignable() as $role) {
            $stats[$role] = (int) ($roleCounts[$role] ?? 0);
        }

        $stats['project_manager'] = Project::query()
            ->whereIn('id', $projectIds)
            ->distinct()
            ->count('project_manager_id');

        return $stats;
    }

    public function find(int $userId): ?User
    {
        return User::query()->find($userId);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): User
    {
        return User::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, array $attributes): User
    {
        $user->fill($attributes);
        $user->save();

        return $user;
    }

    /**
     * @param  array<int, int>  $projectIds
     */
    public function attachToProjects(User $user, array $projectIds): void
    {
        $user->projects()->attach($projectIds);
    }

    /**
     * @param  array<int, int>  $projectIds
     */
    public function detachFromProjects(User $user, array $projectIds): void
    {
        $user->projects()->detach($projectIds);
    }

    public function hasProjects(User $user): bool
    {
        return $user->projects()->exists();
    }

    public function managesProjects(User $user): bool
    {
        return Project::query()->where('project_manager_id', $user->id)->exists();
    }

    public function deleteTokens(User $user): void
    {
        $user->tokens()->delete();
    }

    public function delete(User $user): bool
    {
        return (bool) $user->delete();
    }
}
