<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Profile\UpdateProfileData;
use App\Exceptions\BusinessRuleException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProfileService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function update(User $user, UpdateProfileData $data): User
    {
        if (filled($data->password) && ! Hash::check($data->currentPassword ?? '', $user->password)) {
            throw new BusinessRuleException(
                'current_password',
                'The provided password does not match your current password.',
            );
        }

        $oldAvatar = $user->avatar;
        $newAvatar = $data->avatar?->store('avatars', 'public');
        $removeAvatar = $data->removeAvatar && $data->avatar === null;

        try {
            $attributes = ['name' => $data->name];

            if ($newAvatar !== null) {
                $attributes['avatar'] = $newAvatar;
            } elseif ($removeAvatar) {
                $attributes['avatar'] = null;
            }

            if (filled($data->password)) {
                $attributes['password'] = $data->password;
            }

            DB::transaction(fn () => $this->users->update($user, $attributes));
        } catch (Throwable $exception) {
            if ($newAvatar !== null) {
                Storage::disk('public')->delete($newAvatar);
            }

            throw $exception;
        }

        if ($oldAvatar !== null && ($newAvatar !== null || $removeAvatar)) {
            Storage::disk('public')->delete($oldAvatar);
        }

        return $user->refresh();
    }
}
