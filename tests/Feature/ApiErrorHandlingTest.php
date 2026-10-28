<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_api_resources_return_a_json_error_envelope(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/projects/999999')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Resource not found.');
    }

    public function test_unauthenticated_requests_return_a_json_error_envelope(): void
    {
        $this->getJson('/api/settings')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_validation_errors_return_a_json_error_envelope(): void
    {
        $user = User::factory()->create(['role' => UserRole::Member]);

        Sanctum::actingAs($user);

        $this->patchJson('/api/settings/preferences', [])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['email_notifications']);
    }

    public function test_forbidden_requests_return_a_json_error_envelope(): void
    {
        $user = User::factory()->create(['role' => UserRole::Member]);

        Sanctum::actingAs($user);

        $this->getJson('/api/admin/users')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }
}
