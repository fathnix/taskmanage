<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_roles_can_access_their_settings(): void
    {
        foreach (UserRole::cases() as $role) {
            $user = User::factory()->create(['role' => $role]);

            Sanctum::actingAs($user);

            $this->getJson('/api/settings')
                ->assertOk()
                ->assertJsonPath('data.user.id', $user->id)
                ->assertJsonPath('data.user.role', $role->value)
                ->assertJsonPath('data.preferences.email_notifications', true)
                ->assertJsonPath('data.preferences.task_updates', true)
                ->assertJsonPath('data.preferences.qa_updates', true)
                ->assertJsonPath('data.preferences.approval_updates', true);
        }
    }

    public function test_user_can_update_notification_preferences(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->patchJson('/api/settings/preferences', [
            'email_notifications' => false,
            'task_updates' => true,
            'qa_updates' => false,
            'approval_updates' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.preferences.email_notifications', false)
            ->assertJsonPath('data.preferences.task_updates', true)
            ->assertJsonPath('data.preferences.qa_updates', false)
            ->assertJsonPath('data.preferences.approval_updates', true);

        $this->assertSame([
            'email_notifications' => false,
            'task_updates' => true,
            'qa_updates' => false,
            'approval_updates' => true,
        ], $user->refresh()->notification_preferences);
    }

    public function test_notification_preferences_are_validated(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->patchJson('/api/settings/preferences', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'email_notifications',
                'task_updates',
                'qa_updates',
                'approval_updates',
            ]);

        $this->patchJson('/api/settings/preferences', [
            'email_notifications' => 'not-a-boolean',
            'task_updates' => true,
            'qa_updates' => true,
            'approval_updates' => true,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email_notifications');
    }

    public function test_guest_cannot_access_settings(): void
    {
        $this->getJson('/api/settings')->assertUnauthorized();
        $this->patchJson('/api/settings/preferences', [])->assertUnauthorized();
    }
}
