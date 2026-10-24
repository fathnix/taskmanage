<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_member_can_start_only_their_own_task(): void
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
            'status' => Task::STATUS_IN_PROGRESS,
        ])
            ->assertOk()
            ->assertJsonPath('data.task.status', Task::STATUS_IN_PROGRESS);

        $this->patchJson("/api/tasks/{$otherTask->id}/status", [
            'status' => Task::STATUS_IN_PROGRESS,
        ])->assertForbidden();
    }

    public function test_member_must_submit_evidence_instead_of_marking_a_task_complete_directly(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);

        Sanctum::actingAs($member);

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => Task::STATUS_COMPLETED,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
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

    public function test_member_can_submit_a_task_result_with_a_link_and_difficulty(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);

        Sanctum::actingAs($member);

        $this->postJson("/api/tasks/{$task->id}/submit", [
            'submission_description' => 'Implemented the landing page and verified the responsive layout.',
            'evidence_link' => 'https://example.com/evidence/landing-page',
            'difficulty' => 'The CMS preview was slow during testing.',
        ])
            ->assertOk()
            ->assertJsonPath('data.task.status', Task::STATUS_COMPLETED)
            ->assertJsonPath('data.task.submission_description', 'Implemented the landing page and verified the responsive layout.')
            ->assertJsonPath('data.task.submission_link', 'https://example.com/evidence/landing-page')
            ->assertJsonPath('data.task.submission_difficulty', 'The CMS preview was slow during testing.')
            ->assertJsonPath('data.task.qa_status', Task::QA_STATUS_PENDING)
            ->assertJsonPath('data.task.approval_status', Task::APPROVAL_STATUS_PENDING)
            ->assertJsonPath('data.task.submitted_at', fn ($value) => $value !== null);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => Task::STATUS_COMPLETED,
            'submission_description' => 'Implemented the landing page and verified the responsive layout.',
            'submission_link' => 'https://example.com/evidence/landing-page',
            'submission_difficulty' => 'The CMS preview was slow during testing.',
            'submission_photo' => null,
        ]);
    }

    public function test_member_submission_requires_a_description_and_evidence(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);

        Sanctum::actingAs($member);

        $this->postJson("/api/tasks/{$task->id}/submit", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'submission_description',
                'evidence_link',
                'evidence_photo',
            ]);

        $this->postJson("/api/tasks/{$task->id}/submit", [
            'submission_description' => 'Work is complete.',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['evidence_link', 'evidence_photo']);

        $this->postJson("/api/tasks/{$task->id}/submit", [
            'evidence_link' => 'https://example.com/evidence',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('submission_description');
    }

    public function test_member_can_submit_photo_evidence(): void
    {
        Storage::fake('public');

        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);

        Sanctum::actingAs($member);

        $this->post("/api/tasks/{$task->id}/submit", [
            'submission_description' => 'Completed the task and attached a screenshot.',
            'evidence_photo' => UploadedFile::fake()->image('evidence.jpg', 1200, 800),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.task.status', Task::STATUS_COMPLETED)
            ->assertJsonPath('data.task.submission_photo_url', fn ($value) => is_string($value) && $value !== '');

        $task->refresh();

        $this->assertNotNull($task->submission_photo);
        Storage::disk('public')->assertExists($task->submission_photo);
    }

    public function test_member_must_start_a_task_before_submitting_it(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_PENDING,
        ]);

        Sanctum::actingAs($member);

        $this->postJson("/api/tasks/{$task->id}/submit", [
            'submission_description' => 'Completed the task.',
            'evidence_link' => 'https://example.com/evidence',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('task');
    }

    public function test_member_cannot_submit_a_task_assigned_to_someone_else(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $project = $this->project($manager);
        $this->addToProject($project, $member, $otherMember);

        $task = $this->task($project, [
            'assigned_to_id' => $otherMember->id,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);

        Sanctum::actingAs($member);

        $this->postJson("/api/tasks/{$task->id}/submit", [
            'submission_description' => "Trying to submit someone else's task.",
            'evidence_link' => 'https://example.com/evidence',
        ])->assertForbidden();
    }

    public function test_help_requests_are_visible_to_project_managers_and_qa_only(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $client = User::factory()->create(['role' => UserRole::Client]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa, $member, $client);

        $task = $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
            'submission_description' => 'Completed the work.',
            'submission_link' => 'https://example.com/evidence',
            'submission_difficulty' => 'The API documentation was incomplete.',
            'submitted_at' => now(),
        ]);

        $this->task($project, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
            'submission_description' => 'Completed without difficulties.',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/help')
            ->assertOk()
            ->assertJsonCount(1, 'data.help_requests')
            ->assertJsonPath('data.help_requests.0.task_id', $task->id)
            ->assertJsonPath('data.help_requests.0.difficulty', 'The API documentation was incomplete.')
            ->assertJsonPath('data.help_requests.0.assignee.id', $member->id);

        Sanctum::actingAs($qa);

        $this->getJson('/api/help')
            ->assertOk()
            ->assertJsonCount(1, 'data.help_requests');

        Sanctum::actingAs($member);

        $this->getJson('/api/help')->assertForbidden();

        Sanctum::actingAs($client);

        $this->getJson('/api/help')->assertForbidden();
    }

    public function test_help_requests_are_scoped_to_the_primary_project(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $otherManager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $firstProject = $this->project($manager, ['name' => 'First Project']);
        $secondProject = $this->project($otherManager, ['name' => 'Second Project']);
        $this->addToProject($firstProject, $member);
        $this->addToProject($secondProject, $otherMember);

        $this->task($firstProject, [
            'assigned_to_id' => $member->id,
            'status' => Task::STATUS_COMPLETED,
            'submission_difficulty' => 'First project difficulty.',
            'submitted_at' => now(),
        ]);

        $this->task($secondProject, [
            'assigned_to_id' => $otherMember->id,
            'status' => Task::STATUS_COMPLETED,
            'submission_difficulty' => 'Second project difficulty.',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/help')
            ->assertOk()
            ->assertJsonCount(1, 'data.help_requests')
            ->assertJsonPath('data.help_requests.0.difficulty', 'First project difficulty.');

        Sanctum::actingAs($otherManager);

        $this->getJson('/api/help')
            ->assertOk()
            ->assertJsonCount(1, 'data.help_requests')
            ->assertJsonPath('data.help_requests.0.difficulty', 'Second project difficulty.');
    }

    public function test_qa_can_start_and_submit_their_own_assigned_task(): void
    {
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $qa = User::factory()->create(['role' => UserRole::QA]);
        $project = $this->project($manager);
        $this->addToProject($project, $qa);

        $task = $this->task($project, [
            'assigned_to_id' => $qa->id,
            'status' => Task::STATUS_PENDING,
        ]);

        Sanctum::actingAs($qa);

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => Task::STATUS_IN_PROGRESS,
        ])
            ->assertOk()
            ->assertJsonPath('data.task.status', Task::STATUS_IN_PROGRESS);

        $this->postJson("/api/tasks/{$task->id}/submit", [
            'submission_description' => 'Completed the cross-browser checks.',
            'evidence_link' => 'https://example.com/evidence/cross-browser',
            'difficulty' => 'Safari rendered one component differently.',
        ])
            ->assertOk()
            ->assertJsonPath('data.task.status', Task::STATUS_COMPLETED)
            ->assertJsonPath('data.task.submission_difficulty', 'Safari rendered one component differently.')
            ->assertJsonPath('data.task.qa_status', Task::QA_STATUS_PENDING)
            ->assertJsonPath('data.task.approval_status', Task::APPROVAL_STATUS_PENDING);
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
