<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/auth/register', [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_user_cannot_login_with_wrong_password(): void
    {
        $user = User::factory()->create([
            'email' => 'wrongpass@example.com',
            'password' => bcrypt('correct_password'),
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'wrongpass@example.com',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_authenticated_user_can_access_me(): void
    {
        $user = User::factory()->create();

        $response = $this->withToken($user->currentAccessToken()->plainTextToken)
            ->getJson('/auth/me');

        $response->assertStatus(200)
            ->assertJson(['user.id' => $user->id]);
    }

    public function test_unauthenticated_user_cannot_access_me(): void
    {
        $response = $this->getJson('/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->withToken($user->currentAccessToken()->plainTextToken)
            ->postJson('/auth/logout');

        $response->assertStatus(204);

        $this->assertNull($user->fresh()->currentAccessToken());
    }

    public function test_guest_cannot_access_protected_routes(): void
    {
        $response = $this->withToken('fake-token')->getJson('/auth/me');

        $response->assertStatus(401);
    }
}