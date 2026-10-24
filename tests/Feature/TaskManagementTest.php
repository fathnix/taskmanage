<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskManagementTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $manager, array $attributes = []): Project
    {
        return Project::create(array_merge([
            'name' => 'Test Project',
            'project_manager_id' => $manager->id,
            'status' => Project::STATUS_ACTIVE,
        ], $attributes));
    }

    private function task(Project $project, array $attributes = []): Task
    {
        return Task::create(array_merge([
            'project_id' => $project->id,
            'title' => 'Test Task',
            'status' => Task::STATUS_PENDING,
            'due_date' => now()->addDays(3)->toDateString(),
        ], $attributes));
    }

    private function addToProject(Project $project, User ...$users): void
    {
        $project->users()->attach(collect($users)->pluck('id')->all());
    }

    public function test_project_manager_only_sees_tasks_from_their_primary_project_and_can_search(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['name' => 'Alice Member', 'role' => UserRole::Member]);
        $primary = $this->project($manager, ['name' => 'Primary Project']);
        $secondary = $this->project($manager, ['name' => 'Secondary Project']);
        $this->addToProject($primary, $member);
        $this->addToProject($secondary, $member);

        $this->task($primary, ['title' => 'Build landing page', 'assigned_to_id' => $member->id]);
        $this->task($secondary, ['title' => 'Secret task', 'assigned_to_id' => $member->id]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonPath('data.tasks.0.title', 'Build landing page');

        $this->getJson('/api/tasks?search=Alice')
            ->assertOk()
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonPath('data.tasks.0.title', 'Build landing page');
    }

    public function test_admin_cannot_access_tasks(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/tasks')->assertForbidden();
    }

    public function test_client_can_view_tasks_but_cannot_change_them(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $client = User::factory()->create(['role' => UserRole::Client]);
        $project = $this->project($manager);
        $this->addToProject($project, $member, $client);
        $task = $this->task($project, ['assigned_to_id' => $member->id]);

        Sanctum::actingAs($client);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data.tasks');

        $this->postJson('/api/tasks', [
            'title' => 'Client task',
            'assigned_to_id' => $member->id,
        ])->assertForbidden();

        $this->patchJson("/api/tasks/{$task->id}/qa-check")->assertForbidden();
    }

    public function test_project_manager_can_create_a_task_for_a_project_member(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);

        Sanctum::actingAs($manager);

        $this->postJson('/api/tasks', [
            'title' => 'Prepare release notes',
            'description' => 'Summarize the changes.',
            'assigned_to_id' => $member->id,
            'due_date' => now()->addDays(5)->toDateString(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.task.title', 'Prepare release notes')
            ->assertJsonPath('data.task.status', Task::STATUS_PENDING)
            ->assertJsonPath('data.task.qa_status', Task::QA_STATUS_PENDING)
            ->assertJsonPath('data.task.approval_status', Task::APPROVAL_STATUS_PENDING)
            ->assertJsonPath('data.task.assigned_to.id', $member->id);

        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'assigned_to_id' => $member->id,
            'title' => 'Prepare release notes',
        ]);
    }

    public function test_project_manager_cannot_assign_a_task_to_a_user_outside_the_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $outsider = User::factory()->create(['role' => UserRole::Member]);
        $this->project($manager);

        Sanctum::actingAs($manager);

        $this->postJson('/api/tasks', [
            'title' => 'Invalid task',
            'assigned_to_id' => $outsider->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('assigned_to_id');
    }

    public function test_member_can_update_only_their_own_task_status(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member, $otherMember);

        $ownTask = $this->task($project, ['title' => 'Own task', 'assigned_to_id' => $member->id]);
        $otherTask = $this->task($project, ['title' => 'Other task', 'assigned_to_id' => $otherMember->id]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/tasks/{$ownTask->id}/status", [
            'status' => Task::STATUS_COMPLETED,
        ])
            ->assertOk()
            ->assertJsonPath('data.task.status', Task::STATUS_COMPLETED)
            ->assertJsonPath('data.task.qa_status', Task::QA_STATUS_PENDING)
            ->assertJsonPath('data.task.approval_status', Task::APPROVAL_STATUS_PENDING);

        $this->patchJson("/api/tasks/{$otherTask->id}/status", [
            'status' => Task::STATUS_COMPLETED,
        ])->assertForbidden();
    }

    public function test_member_cannot_update_an_approved_task(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
            'qa_status' => Task::QA_STATUS_CHECKED,
            'qa_checked_at' => now(),
            'qa_checked_by_id' => $qa->id,
            'approval_status' => Task::APPROVAL_STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by_id' => $manager->id,
        ]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => Task::STATUS_IN_PROGRESS,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('task');
    }

    public function test_qa_can_check_a_completed_task(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
        ]);

        Sanctum::actingAs($qa);

        $this->patchJson("/api/tasks/{$task->id}/qa-check")
            ->assertOk()
            ->assertJsonPath('data.task.qa_status', Task::QA_STATUS_CHECKED)
            ->assertJsonPath('data.task.qa_checked_by.id', $qa->id);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'qa_status' => Task::QA_STATUS_CHECKED,
            'qa_checked_by_id' => $qa->id,
        ]);
    }

    public function test_qa_cannot_check_a_task_that_is_not_completed(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa, $member);
        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);

        Sanctum::actingAs($qa);

        $this->patchJson("/api/tasks/{$task->id}/qa-check")
            ->assertStatus(422)
            ->assertJsonValidationErrors('task');
    }

    public function test_only_qa_can_check_tasks(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);
        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
        ]);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/tasks/{$task->id}/qa-check")->assertForbidden();

        Sanctum::actingAs($member);

        $this->patchJson("/api/tasks/{$task->id}/qa-check")->assertForbidden();
    }

    public function test_project_manager_can_approve_a_task_after_qa_checks_it(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
            'qa_status' => Task::QA_STATUS_CHECKED,
            'qa_checked_at' => now(),
            'qa_checked_by_id' => $qa->id,
        ]);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/tasks/{$task->id}/approval", [
            'approval_status' => Task::APPROVAL_STATUS_APPROVED,
        ])
            ->assertOk()
            ->assertJsonPath('data.task.approval_status', Task::APPROVAL_STATUS_APPROVED)
            ->assertJsonPath('data.task.approved_by.id', $manager->id);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'approval_status' => Task::APPROVAL_STATUS_APPROVED,
            'approved_by_id' => $manager->id,
        ]);
    }

    public function test_project_manager_cannot_approve_before_qa_checks_the_task(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);
        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
        ]);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/tasks/{$task->id}/approval", [
            'approval_status' => Task::APPROVAL_STATUS_APPROVED,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('task');
    }

    public function test_project_manager_can_request_revision_and_reset_qa(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
            'qa_status' => Task::QA_STATUS_CHECKED,
            'qa_checked_at' => now(),
            'qa_checked_by_id' => $qa->id,
        ]);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/tasks/{$task->id}/approval", [
            'approval_status' => Task::APPROVAL_STATUS_REVISION,
            'revision_notes' => 'Please fix the responsive layout.',
        ])
            ->assertOk()
            ->assertJsonPath('data.task.approval_status', Task::APPROVAL_STATUS_REVISION)
            ->assertJsonPath('data.task.status', Task::STATUS_IN_PROGRESS)
            ->assertJsonPath('data.task.qa_status', Task::QA_STATUS_PENDING)
            ->assertJsonPath('data.task.revision_notes', 'Please fix the responsive layout.');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'approval_status' => Task::APPROVAL_STATUS_REVISION,
            'status' => Task::STATUS_IN_PROGRESS,
            'qa_status' => Task::QA_STATUS_PENDING,
            'qa_checked_by_id' => null,
        ]);
    }

    public function test_project_manager_can_update_and_delete_tasks_in_their_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);
        $task = $this->task($project, ['assigned_to_id' => $member->id, 'title' => 'Old title']);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/tasks/{$task->id}", [
            'title' => 'New title',
            'description' => 'Updated description',
            'status' => Task::STATUS_IN_PROGRESS,
            'assigned_to_id' => $member->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ])
            ->assertOk()
            ->assertJsonPath('data.task.title', 'New title')
            ->assertJsonPath('data.task.status', Task::STATUS_IN_PROGRESS);

        $this->deleteJson("/api/tasks/{$task->id}")->assertOk();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_qa_only_sees_tasks_from_their_primary_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $firstProject = $this->project($manager, ['name' => 'First Project']);
        $secondProject = $this->project($otherManager, ['name' => 'Second Project']);
        $this->addToProject($firstProject, $qa);
        $this->addToProject($secondProject, $qa);

        $this->task($firstProject, ['title' => 'My project task']);
        $otherTask = $this->task($secondProject, [
            'title' => 'Another project task',
            'status' => Task::STATUS_COMPLETED,
        ]);

        Sanctum::actingAs($qa);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonPath('data.tasks.0.title', 'My project task')
            ->assertJsonPath('data.tasks.0.project.name', 'First Project');

        $this->patchJson("/api/tasks/{$otherTask->id}/qa-check")->assertForbidden();
    }

    public function test_project_manager_cannot_manage_tasks_from_another_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $this->project($manager);

        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $otherProject = $this->project($otherManager, ['name' => 'Other Project']);
        $this->addToProject($otherProject, $otherMember);
        $otherTask = $this->task($otherProject, ['assigned_to_id' => $otherMember->id]);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/tasks/{$otherTask->id}", [
            'title' => 'Hijacked',
            'status' => Task::STATUS_PENDING,
            'assigned_to_id' => $otherMember->id,
        ])->assertForbidden();

        $this->deleteJson("/api/tasks/{$otherTask->id}")->assertForbidden();
        $this->patchJson("/api/tasks/{$otherTask->id}/approval", [
            'approval_status' => Task::APPROVAL_STATUS_APPROVED,
        ])->assertForbidden();
    }
}
