<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectManagementTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $manager, array $attributes = []): Project
    {
        return Project::create(array_merge([
            'name' => 'Test Project',
            'description' => 'A project used for testing.',
            'budget' => 50000000,
            'project_manager_id' => $manager->id,
            'status' => Project::STATUS_ACTIVE,
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(10)->toDateString(),
        ], $attributes));
    }

    public function test_project_manager_index_only_returns_their_primary_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $first = $this->project($manager, ['name' => 'First Project']);
        $this->project($manager, ['name' => 'Second Project']);

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $this->project($otherManager, ['name' => 'Other Project']);

        Sanctum::actingAs($manager);

        $response = $this->getJson('/api/projects');

        $response->assertOk()
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonPath('data.projects.0.id', $first->id)
            ->assertJsonPath('data.projects.0.name', 'First Project');
    }

    public function test_admin_can_see_all_projects(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $firstManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $secondManager = User::factory()->create(['role' => UserRole::ProjectManager]);

        $this->project($firstManager, ['name' => 'First Project']);
        $this->project($secondManager, ['name' => 'Second Project']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(2, 'data.projects');
    }

    public function test_member_only_sees_projects_they_belong_to(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $first = $this->project($manager, ['name' => 'First Project']);
        $this->project($manager, ['name' => 'Second Project']);

        $first->users()->attach($member->id);

        Sanctum::actingAs($member);

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonPath('data.projects.0.id', $first->id);
    }

    public function test_team_members_only_see_their_primary_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $first = $this->project($manager, ['name' => 'First Project']);
        $second = $this->project($otherManager, ['name' => 'Second Project']);

        $first->users()->attach($member->id);
        $second->users()->attach($member->id);

        Sanctum::actingAs($member);

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonPath('data.projects.0.id', $first->id)
            ->assertJsonPath('data.projects.0.name', 'First Project');

        $this->getJson("/api/projects/{$second->id}")->assertForbidden();
    }

    public function test_project_detail_includes_complete_statistics(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $client = User::factory()->create(['role' => UserRole::Client]);
        $project = $this->project($manager);

        $project->users()->attach([$qa->id, $member->id, $client->id]);

        Task::create([
            'project_id' => $project->id,
            'assigned_to_id' => $member->id,
            'title' => 'Completed task',
            'status' => Task::STATUS_COMPLETED,
            'due_date' => now()->subDays(2)->toDateString(),
        ]);

        Task::create([
            'project_id' => $project->id,
            'assigned_to_id' => $member->id,
            'title' => 'Overdue task',
            'status' => Task::STATUS_IN_PROGRESS,
            'due_date' => now()->subDay()->toDateString(),
        ]);

        Task::create([
            'project_id' => $project->id,
            'assigned_to_id' => $qa->id,
            'title' => 'Pending task',
            'status' => Task::STATUS_PENDING,
            'due_date' => now()->addDays(3)->toDateString(),
        ]);

        Sanctum::actingAs($manager);

        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertOk()
            ->assertJsonPath('data.project.name', 'Test Project')
            ->assertJsonPath('data.project.budget', 50000000)
            ->assertJsonPath('data.project.status', Project::STATUS_ACTIVE)
            ->assertJsonPath('data.project.start_date', now()->toDateString())
            ->assertJsonPath('data.project.end_date', now()->addDays(10)->toDateString())
            ->assertJsonPath('data.project.is_indefinite', false)
            ->assertJsonPath('data.project.duration_days', 11)
            ->assertJsonPath('data.project.days_remaining', 10)
            ->assertJsonPath('data.project.deadline_status', 'on_schedule')
            ->assertJsonPath('data.project.task_counts.total', 3)
            ->assertJsonPath('data.project.task_counts.completed', 1)
            ->assertJsonPath('data.project.task_counts.in_progress', 1)
            ->assertJsonPath('data.project.task_counts.pending', 1)
            ->assertJsonPath('data.project.task_counts.overdue', 1)
            ->assertJsonPath('data.project.progress', 33)
            ->assertJsonPath('data.project.overdue_rate', 33)
            ->assertJsonPath('data.project.team_counts.total', 3)
            ->assertJsonPath('data.project.team_counts.qa', 1)
            ->assertJsonPath('data.project.team_counts.member', 1)
            ->assertJsonPath('data.project.team_counts.client', 1)
            ->assertJsonPath('data.project.health.status', 'off_track');
    }

    public function test_project_manager_can_update_budget_dates_and_status(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = $this->project($manager);

        Sanctum::actingAs($manager);

        $startDate = now()->subDays(5)->toDateString();
        $endDate = now()->addDays(30)->toDateString();

        $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Updated Project',
            'description' => 'Updated description.',
            'budget' => 99000000,
            'status' => Project::STATUS_ON_HOLD,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_indefinite' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.project.name', 'Updated Project')
            ->assertJsonPath('data.project.budget', 99000000)
            ->assertJsonPath('data.project.status', Project::STATUS_ON_HOLD)
            ->assertJsonPath('data.project.start_date', $startDate)
            ->assertJsonPath('data.project.end_date', $endDate)
            ->assertJsonPath('data.project.is_indefinite', false);

        $project->refresh();

        $this->assertSame('Updated Project', $project->name);
        $this->assertSame('Updated description.', $project->description);
        $this->assertSame(99000000.0, (float) $project->budget);
        $this->assertSame(Project::STATUS_ON_HOLD, $project->status);
        $this->assertSame($startDate, $project->start_date->toDateString());
        $this->assertSame($endDate, $project->due_date->toDateString());
    }

    public function test_project_manager_can_set_an_indefinite_end_date(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = $this->project($manager);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/projects/{$project->id}", [
            'name' => $project->name,
            'description' => $project->description,
            'budget' => 50000000,
            'status' => Project::STATUS_ACTIVE,
            'start_date' => now()->toDateString(),
            'is_indefinite' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.project.is_indefinite', true)
            ->assertJsonPath('data.project.end_date', null)
            ->assertJsonPath('data.project.deadline_status', 'indefinite');

        $this->assertNull($project->refresh()->due_date);
    }

    public function test_project_manager_cannot_manage_another_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $this->project($manager);

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherProject = $this->project($otherManager, ['name' => 'Other Project']);

        Sanctum::actingAs($manager);

        $this->getJson("/api/projects/{$otherProject->id}")->assertForbidden();
        $this->patchJson("/api/projects/{$otherProject->id}", [
            'name' => 'Hijacked',
            'status' => Project::STATUS_ACTIVE,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
        ])->assertForbidden();

        $this->assertDatabaseHas('projects', [
            'id' => $otherProject->id,
            'name' => 'Other Project',
        ]);
    }

    public function test_non_managers_cannot_update_projects(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = $this->project($manager);
        $member = User::factory()->create(['role' => UserRole::Member]);

        $project->users()->attach($member->id);

        Sanctum::actingAs($member);

        $this->getJson("/api/projects/{$project->id}")->assertOk();
        $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Hijacked',
            'status' => Project::STATUS_ACTIVE,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
        ])->assertForbidden();
    }

    public function test_member_cannot_view_a_project_they_do_not_belong_to(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = $this->project($manager);
        $member = User::factory()->create(['role' => UserRole::Member]);

        Sanctum::actingAs($member);

        $this->getJson("/api/projects/{$project->id}")->assertForbidden();
    }

    public function test_project_update_validates_the_date_range(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = $this->project($manager);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Invalid Dates',
            'status' => Project::STATUS_ACTIVE,
            'start_date' => now()->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
            'is_indefinite' => false,
        ])->assertStatus(422)->assertJsonValidationErrors('end_date');

        $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Missing End Date',
            'status' => Project::STATUS_ACTIVE,
            'start_date' => now()->toDateString(),
            'is_indefinite' => false,
        ])->assertStatus(422)->assertJsonValidationErrors('end_date');
    }

    public function test_admin_cannot_open_or_update_a_project_workspace(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = $this->project($manager);

        Sanctum::actingAs($admin);

        $this->getJson("/api/projects/{$project->id}")->assertForbidden();

        $this->patchJson("/api/projects/{$project->id}", [
            'name' => 'Admin Updated',
            'description' => $project->description,
            'budget' => 123000000,
            'status' => Project::STATUS_COMPLETED,
            'start_date' => $project->start_date->toDateString(),
            'end_date' => $project->due_date->toDateString(),
            'is_indefinite' => false,
        ])->assertForbidden();

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'name' => 'Test Project',
        ]);
    }
}
