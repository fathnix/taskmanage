<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Settings\UpdatePreferencesData;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SettingsService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    /**
     * @return array<string, bool>
     */
    public function preferences(User $user): array
    {
        return array_merge([
            'email_notifications' => true,
            'task_updates' => true,
            'qa_updates' => true,
            'approval_updates' => true,
        ], $user->notification_preferences ?? []);
    }

    /**
     * @return array<string, bool>
     */
    public function updatePreferences(User $user, UpdatePreferencesData $data): array
    {
        DB::transaction(fn () => $this->users->update($user, [
            'notification_preferences' => array_merge($this->preferences($user), $data->toArray()),
        ]));

        return $this->preferences($user->refresh());
    }
}
