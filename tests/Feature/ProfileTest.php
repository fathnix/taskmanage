<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_their_name_without_changing_email_or_role(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
            'role' => UserRole::Member,
            'password' => 'password123',
        ]);

        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', [
            'name' => 'New Name',
            'email' => 'hacked@example.com',
            'role' => UserRole::Admin->value,
        ])
            ->assertOk()
            ->assertJsonPath('data.user.name', 'New Name')
            ->assertJsonPath('data.user.email', 'old@example.com')
            ->assertJsonPath('data.user.role', UserRole::Member->value);

        $user->refresh();

        $this->assertSame('New Name', $user->name);
        $this->assertSame('old@example.com', $user->email);
        $this->assertSame(UserRole::Member, $user->role);
    }

    public function test_user_can_change_their_password_with_the_current_password(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', [
            'name' => $user->name,
            'current_password' => 'password123',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpassword123', $user->refresh()->password));
    }

    public function test_user_cannot_change_password_with_a_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', [
            'name' => $user->name,
            'current_password' => 'wrong-password',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('password123', $user->refresh()->password));
    }

    public function test_current_password_is_required_when_changing_password(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', [
            'name' => $user->name,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('password123', $user->refresh()->password));
    }

    public function test_user_can_upload_and_remove_their_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['password' => 'password123']);

        Sanctum::actingAs($user);

        $response = $this->post('/api/profile', [
            '_method' => 'PATCH',
            'name' => $user->name,
            'avatar' => UploadedFile::fake()->image('avatar.png'),
        ]);

        $response->assertOk();

        $user->refresh();
        $avatar = $user->avatar;

        $this->assertNotNull($avatar);
        Storage::disk('public')->assertExists($avatar);
        $response->assertJsonPath('data.user.avatar_url', Storage::disk('public')->url($avatar));

        $this->patchJson('/api/profile', [
            'name' => $user->name,
            'remove_avatar' => true,
        ])->assertOk();

        $this->assertNull($user->refresh()->avatar);
        Storage::disk('public')->assertMissing($avatar);
    }

    public function test_guest_cannot_update_a_profile(): void
    {
        $this->patchJson('/api/profile', [
            'name' => 'Guest',
        ])->assertUnauthorized();
    }
}
