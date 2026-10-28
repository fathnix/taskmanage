<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\User\CreateUserData;
use App\DTOs\User\UpdateUserData;
use App\Enums\UserRole;
use App\Exceptions\BusinessRuleException;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AdminUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AuthorizationService $authorization,
    ) {}

    /**
     * @return array{users: Collection<int, User>, stats: array<string, int>}
     */
    public function list(User $viewer, string $search = ''): array
    {
        $this->authorization->ensureCanViewUsers($viewer);

        $search = trim($search);

        if ($viewer->role === UserRole::Admin) {
            return [
                'users' => $this->users->listForAdmin($search),
                'stats' => $this->users->statsForProjects([]),
            ];
        }

        $projectIds = $this->authorization->viewProjectIds($viewer);

        return [
            'users' => $this->users->listForProjects($projectIds, $search),
            'stats' => $this->users->statsForProjects($projectIds),
        ];
    }

    public function show(User $viewer, User $target): User
    {
        $this->authorization->ensureCanViewUsers($viewer);
        $this->authorization->ensureNotAdminUser($target);
        $this->authorization->ensureUserInViewerScope($viewer, $target);

        return $target;
    }

    public function create(User $manager, CreateUserData $data): User
    {
        $this->authorization->ensureManager($manager);
        $this->authorization->ensureHasManagedProject($manager);

        $projectIds = $this->authorization->managedProjectIds($manager);
        $avatar = $data->avatar?->store('avatars', 'public');

        try {
            return DB::transaction(function () use ($data, $avatar, $projectIds): User {
                $user = $this->users->create([
                    'name' => $data->name,
                    'email' => $data->email,
                    'password' => $data->password,
                    'role' => $data->role,
                    'avatar' => $avatar,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                $this->users->attachToProjects($user, $projectIds);

                return $user;
            });
        } catch (Throwable $exception) {
            if ($avatar !== null) {
                Storage::disk('public')->delete($avatar);
            }

            throw $exception;
        }
    }

    public function update(User $manager, User $target, UpdateUserData $data): User
    {
        $this->authorization->ensureManager($manager);
        $this->authorization->ensureNotAdminUser($target);
        $this->authorization->ensureUserInViewerScope($manager, $target);

        $oldAvatar = $target->avatar;
        $newAvatar = $data->avatar?->store('avatars', 'public');
        $removeAvatar = $data->removeAvatar && $data->avatar === null;

        try {
            $attributes = [
                'name' => $data->name,
                'email' => $data->email,
                'role' => $data->role,
            ];

            if ($newAvatar !== null) {
                $attributes['avatar'] = $newAvatar;
            } elseif ($removeAvatar) {
                $attributes['avatar'] = null;
            }

            if (filled($data->password)) {
                $attributes['password'] = $data->password;
            }

            DB::transaction(fn () => $this->users->update($target, $attributes));
        } catch (Throwable $exception) {
            if ($newAvatar !== null) {
                Storage::disk('public')->delete($newAvatar);
            }

            throw $exception;
        }

        if ($oldAvatar !== null && ($newAvatar !== null || $removeAvatar)) {
            Storage::disk('public')->delete($oldAvatar);
        }

        return $target->refresh();
    }

    /**
     * @return array{message: string, deleted: bool}
     */
    public function destroy(User $manager, User $target): array
    {
        $this->authorization->ensureManager($manager);
        $this->authorization->ensureNotAdminUser($target);
        $this->authorization->ensureUserInViewerScope($manager, $target);

        if ($manager->is($target)) {
            throw new BusinessRuleException('user', 'You cannot delete your own account.');
        }

        $projectIds = $this->authorization->managedProjectIds($manager);

        $result = DB::transaction(function () use ($target, $projectIds): array {
            $this->users->detachFromProjects($target, $projectIds);

            if ($this->users->hasProjects($target) || $this->users->managesProjects($target)) {
                return ['deleted' => false, 'avatar' => null];
            }

            $avatar = $target->avatar;

            $this->users->deleteTokens($target);
            $this->users->delete($target);

            return ['deleted' => true, 'avatar' => $avatar];
        });

        if ($result['deleted'] && $result['avatar'] !== null) {
            Storage::disk('public')->delete($result['avatar']);
        }

        return [
            'message' => $result['deleted']
                ? 'User deleted successfully'
                : 'User removed from your project successfully',
            'deleted' => $result['deleted'],
        ];
    }

    public function activate(User $admin, User $target): User
    {
        $this->authorization->ensureAdmin($admin);
        $this->authorization->ensureNotAdminUser($target);

        return $this->users->update($target, [
            'is_active' => true,
            'role' => UserRole::ProjectManager,
        ]);
    }

    public function deactivate(User $admin, User $target): User
    {
        $this->authorization->ensureAdmin($admin);
        $this->authorization->ensureNotAdminUser($target);

        return $this->users->update($target, ['is_active' => false]);
    }
}
