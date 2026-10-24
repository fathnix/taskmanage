<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Project}
     */
    private function actingAsManager(): array
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = Project::create([
            'name' => 'Managed Project',
            'project_manager_id' => $manager->id,
        ]);

        Sanctum::actingAs($manager);

        return [$manager, $project];
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function addToProject(Project $project, User ...$users): void
    {
        $project->users()->attach(collect($users)->pluck('id')->all());
    }

    public function test_project_manager_can_create_a_user_with_an_avatar(): void
    {
        Storage::fake('public');
        [, $project] = $this->actingAsManager();

        $response = $this->post('/api/admin/users', [
            'name' => 'New QA',
            'email' => 'new-qa@example.com',
            'password' => 'password123',
            'role' => UserRole::QA->value,
            'avatar' => UploadedFile::fake()->image('avatar.png'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.name', 'New QA')
            ->assertJsonPath('data.user.role', UserRole::QA->value)
            ->assertJsonPath('data.user.is_active', true);

        $user = User::where('email', 'new-qa@example.com')->firstOrFail();

        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->avatar);
        $this->assertDatabaseHas('project_user', [
            'project_id' => $project->id,
            'user_id' => $user->id,
        ]);
        Storage::disk('public')->assertExists($user->avatar);
        $response->assertJsonPath('data.user.avatar_url', Storage::disk('public')->url($user->avatar));
    }

    public function test_project_manager_cannot_create_a_user_with_the_admin_role(): void
    {
        $this->actingAsManager();

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Sneaky Admin',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'role' => UserRole::Admin->value,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'sneaky@example.com']);
    }

    public function test_project_manager_without_a_project_cannot_create_users(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        Sanctum::actingAs($manager);

        $this->postJson('/api/admin/users', [
            'name' => 'New QA',
            'email' => 'new-qa@example.com',
            'password' => 'password123',
            'role' => UserRole::QA->value,
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'new-qa@example.com']);
    }

    public function test_user_list_is_scoped_to_the_managers_projects_and_searchable(): void
    {
        [$manager, $project] = $this->actingAsManager();

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherProject = Project::create([
            'name' => 'Other Project',
            'project_manager_id' => $otherManager->id,
        ]);

        $aliceQa = User::factory()->create(['name' => 'Alice QA', 'role' => UserRole::QA]);
        $aliceMember = User::factory()->create(['name' => 'Alice Member', 'role' => UserRole::Member]);
        $aliceAdmin = User::factory()->create(['name' => 'Alice Admin', 'role' => UserRole::Admin]);

        $this->addToProject($project, $aliceQa);
        $this->addToProject($otherProject, $aliceMember);

        $response = $this->getJson('/api/admin/users?search=Alice');

        $response->assertOk()
            ->assertJsonCount(1, 'data.users')
            ->assertJsonPath('data.users.0.name', 'Alice QA')
            ->assertJsonPath('data.stats.qa', 1)
            ->assertJsonPath('data.stats.member', 0)
            ->assertJsonPath('data.stats.client', 0)
            ->assertJsonPath('data.stats.project_manager', 1);

        $this->assertNotContains($aliceAdmin->email, collect($response->json('data.users'))->pluck('email'));
    }

    public function test_user_management_only_uses_the_managers_primary_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $primary = Project::create([
            'name' => 'Primary Project',
            'project_manager_id' => $manager->id,
        ]);
        $secondary = Project::create([
            'name' => 'Secondary Project',
            'project_manager_id' => $manager->id,
        ]);

        $primaryUser = User::factory()->create(['role' => UserRole::Member]);
        $secondaryUser = User::factory()->create(['role' => UserRole::Member]);

        $primary->users()->attach($primaryUser->id);
        $secondary->users()->attach($secondaryUser->id);

        Sanctum::actingAs($manager);

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(1, 'data.users')
            ->assertJsonPath('data.users.0.id', $primaryUser->id);

        $this->postJson('/api/admin/users', [
            'name' => 'New Member',
            'email' => 'new-member@example.com',
            'password' => 'password123',
            'role' => UserRole::Member->value,
        ])->assertCreated();

        $newUser = User::where('email', 'new-member@example.com')->firstOrFail();

        $this->assertDatabaseHas('project_user', [
            'project_id' => $primary->id,
            'user_id' => $newUser->id,
        ]);
        $this->assertDatabaseMissing('project_user', [
            'project_id' => $secondary->id,
            'user_id' => $newUser->id,
        ]);
    }

    public function test_admin_list_only_contains_project_managers_and_pending_accounts(): void
    {
        $this->actingAsAdmin();

        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $pending = User::factory()->create([
            'role' => UserRole::Member,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/admin/users');

        $response->assertOk()->assertJsonCount(2, 'data.users');

        $emails = collect($response->json('data.users'))->pluck('email');

        $this->assertTrue($emails->contains($manager->email));
        $this->assertTrue($emails->contains($pending->email));
        $this->assertFalse($emails->contains($qa->email));
        $this->assertFalse($emails->contains($member->email));
    }

    public function test_admin_can_view_users_for_approval_but_cannot_manage_them(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/admin/users')->assertOk();

        $this->postJson('/api/admin/users', [
            'name' => 'Admin Created',
            'email' => 'admin-created@example.com',
            'password' => 'password123',
            'role' => UserRole::QA->value,
        ])->assertForbidden();
    }

    public function test_admin_can_activate_a_pending_user_as_project_manager(): void
    {
        $this->actingAsAdmin();

        $pending = User::factory()->create([
            'role' => UserRole::Member,
            'is_active' => false,
        ]);

        $this->patchJson("/api/admin/users/{$pending->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.user.is_active', true)
            ->assertJsonPath('data.user.role', UserRole::ProjectManager->value);
    }

    public function test_project_manager_can_update_a_user_in_their_project_without_changing_the_password(): void
    {
        [, $project] = $this->actingAsManager();

        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com',
            'role' => UserRole::Member,
            'password' => 'password123',
        ]);

        $this->addToProject($project, $user);

        $response = $this->patchJson("/api/admin/users/{$user->id}", [
            'name' => 'New Name',
            'email' => 'new@example.com',
            'role' => UserRole::Client->value,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.name', 'New Name')
            ->assertJsonPath('data.user.email', 'new@example.com')
            ->assertJsonPath('data.user.role', UserRole::Client->value);

        $user->refresh();

        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertSame(UserRole::Client, $user->role);
    }

    public function test_project_manager_cannot_manage_a_user_from_another_project(): void
    {
        $this->actingAsManager();

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherProject = Project::create([
            'name' => 'Other Project',
            'project_manager_id' => $otherManager->id,
        ]);
        $otherUser = User::factory()->create(['role' => UserRole::Member]);

        $this->addToProject($otherProject, $otherUser);

        $this->getJson("/api/admin/users/{$otherUser->id}")->assertForbidden();

        $this->patchJson("/api/admin/users/{$otherUser->id}", [
            'name' => 'Hijacked',
            'email' => $otherUser->email,
            'role' => UserRole::Member->value,
        ])->assertForbidden();

        $this->deleteJson("/api/admin/users/{$otherUser->id}")->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $otherUser->id]);
        $this->assertDatabaseHas('project_user', [
            'project_id' => $otherProject->id,
            'user_id' => $otherUser->id,
        ]);
    }

    public function test_project_manager_deletes_a_user_only_assigned_to_their_project(): void
    {
        [, $project] = $this->actingAsManager();

        $user = User::factory()->create(['role' => UserRole::Member]);

        $this->addToProject($project, $user);

        $this->deleteJson("/api/admin/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('message', 'User deleted successfully');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('project_user', [
            'project_id' => $project->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_project_manager_removes_a_shared_user_without_deleting_the_account(): void
    {
        [, $project] = $this->actingAsManager();

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherProject = Project::create([
            'name' => 'Other Project',
            'project_manager_id' => $otherManager->id,
        ]);

        $user = User::factory()->create(['role' => UserRole::Member]);

        $this->addToProject($project, $user);
        $this->addToProject($otherProject, $user);

        $this->deleteJson("/api/admin/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('message', 'User removed from your project successfully');

        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('project_user', [
            'project_id' => $project->id,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('project_user', [
            'project_id' => $otherProject->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_project_manager_removing_a_project_manager_keeps_the_account(): void
    {
        [, $project] = $this->actingAsManager();

        $targetManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        Project::create([
            'name' => 'Target Managed Project',
            'project_manager_id' => $targetManager->id,
        ]);

        $this->addToProject($project, $targetManager);

        $this->deleteJson("/api/admin/users/{$targetManager->id}")->assertOk();

        $this->assertDatabaseHas('users', ['id' => $targetManager->id]);
        $this->assertDatabaseMissing('project_user', [
            'project_id' => $project->id,
            'user_id' => $targetManager->id,
        ]);
    }

    public function test_admin_accounts_cannot_be_managed_from_the_user_page(): void
    {
        $this->actingAsManager();

        $otherAdmin = User::factory()->create(['role' => UserRole::Admin]);

        $this->patchJson("/api/admin/users/{$otherAdmin->id}", [
            'name' => 'Renamed Admin',
            'email' => $otherAdmin->email,
            'role' => UserRole::QA->value,
        ])->assertStatus(422);

        $this->deleteJson("/api/admin/users/{$otherAdmin->id}")->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $otherAdmin->id]);
    }

    public function test_qa_can_view_users_in_their_project_but_cannot_manage_them(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = Project::create([
            'name' => 'Managed Project',
            'project_manager_id' => $manager->id,
        ]);

        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['name' => 'Visible Member', 'role' => UserRole::Member]);
        $project->users()->attach([$qa->id, $member->id]);

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherProject = Project::create([
            'name' => 'Other Project',
            'project_manager_id' => $otherManager->id,
        ]);
        $otherMember = User::factory()->create(['name' => 'Hidden Member', 'role' => UserRole::Member]);
        $otherProject->users()->attach($otherMember->id);

        Sanctum::actingAs($qa);

        $response = $this->getJson('/api/admin/users');

        $response->assertOk()
            ->assertJsonCount(2, 'data.users')
            ->assertJsonPath('data.stats.qa', 1)
            ->assertJsonPath('data.stats.member', 1)
            ->assertJsonPath('data.stats.project_manager', 1);

        $emails = collect($response->json('data.users'))->pluck('email');

        $this->assertTrue($emails->contains($member->email));
        $this->assertFalse($emails->contains($otherMember->email));

        $this->getJson("/api/admin/users/{$member->id}")->assertOk();
        $this->getJson("/api/admin/users/{$otherMember->id}")->assertForbidden();

        $this->postJson('/api/admin/users', [
            'name' => 'QA Created',
            'email' => 'qa-created@example.com',
            'password' => 'password123',
            'role' => UserRole::Member->value,
        ])->assertForbidden();

        $this->patchJson("/api/admin/users/{$member->id}", [
            'name' => 'QA Updated',
            'email' => $member->email,
            'role' => UserRole::Member->value,
        ])->assertForbidden();

        $this->deleteJson("/api/admin/users/{$member->id}")->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'name' => 'Visible Member',
        ]);
    }

    public function test_member_and_client_cannot_view_or_manage_users(): void
    {
        foreach ([UserRole::Member, UserRole::Client] as $role) {
            $user = User::factory()->create(['role' => $role]);
            Sanctum::actingAs($user);

            $this->getJson('/api/admin/users')->assertForbidden();
            $this->postJson('/api/admin/users', [])->assertForbidden();
        }
    }
}
