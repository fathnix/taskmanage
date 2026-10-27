<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TimeTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_report_groups_logged_minutes_by_member_and_project(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 20)->startOfDay());
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $member = User::factory()->create(['name' => 'Team Member', 'role' => UserRole::Member]);
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = Project::create(['name' => 'Website', 'project_manager_id' => $manager->id]);
        $task = $this->createTask($project, $member, 'Build page');

        TimeLog::create([
            'user_id' => $member->id,
            'task_id' => $task->id,
            'duration_minutes' => 90,
            'logged_on' => '2026-10-10',
            'note' => 'Layout work',
        ]);
        TimeLog::create([
            'user_id' => $member->id,
            'task_id' => $task->id,
            'duration_minutes' => 30,
            'logged_on' => '2026-10-14',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/time-report?from=2026-10-01&to=2026-10-20')
            ->assertOk()
            ->assertJsonPath('data.summary.total_minutes', 120)
            ->assertJsonPath('data.summary.total_hours', 2)
            ->assertJsonPath('data.summary.log_count', 2)
            ->assertJsonPath('data.member_totals.0.name', 'Team Member')
            ->assertJsonPath('data.member_totals.0.total_minutes', 120)
            ->assertJsonPath('data.project_totals.0.name', 'Website')
            ->assertJsonPath('data.project_totals.0.total_minutes', 120)
            ->assertJsonPath('data.logs.0.task.title', 'Build page');
    }

    public function test_non_admin_receives_forbidden_when_opening_time_report(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::ProjectManager]));

        $this->getJson('/api/admin/time-report')->assertForbidden();
    }

    public function test_assignee_can_record_work_time_for_their_task(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = Project::create(['name' => 'Website', 'project_manager_id' => $manager->id]);
        $task = $this->createTask($project, $member, 'Build page');
        Sanctum::actingAs($member);

        $this->postJson('/api/time-logs', [
            'task_id' => $task->id,
            'duration_minutes' => 75,
            'logged_on' => now()->toDateString(),
            'note' => 'Implemented the header',
        ])
            ->assertCreated()
            ->assertJsonPath('data.time_log.duration_minutes', 75)
            ->assertJsonPath('data.time_log.user_id', $member->id);

        $this->assertDatabaseHas('time_logs', [
            'user_id' => $member->id,
            'task_id' => $task->id,
            'duration_minutes' => 75,
            'note' => 'Implemented the header',
        ]);
    }

    public function test_member_receives_not_found_when_recording_time_for_another_members_task(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $otherMember = User::factory()->create(['role' => UserRole::Member]);
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $project = Project::create(['name' => 'Website', 'project_manager_id' => $manager->id]);
        $task = $this->createTask($project, $otherMember, 'Build page');
        Sanctum::actingAs($member);

        $this->postJson('/api/time-logs', [
            'task_id' => $task->id,
            'duration_minutes' => 45,
            'logged_on' => now()->toDateString(),
        ])->assertNotFound();

        $this->assertDatabaseCount('time_logs', 0);
    }

    public function test_admin_cannot_record_time_and_invalid_duration_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $manager = User::factory()->create(['role' => UserRole::ProjectManager]);
        $member = User::factory()->create(['role' => UserRole::Member]);
        $project = Project::create(['name' => 'Website', 'project_manager_id' => $manager->id]);
        $task = $this->createTask($project, $member, 'Build page');
        Sanctum::actingAs($admin);

        $this->postJson('/api/time-logs', [
            'task_id' => $task->id,
            'duration_minutes' => 45,
            'logged_on' => now()->toDateString(),
        ])->assertForbidden();

        Sanctum::actingAs($member);

        $this->postJson('/api/time-logs', [
            'task_id' => $task->id,
            'duration_minutes' => 1441,
            'logged_on' => now()->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors('duration_minutes');

        $this->assertDatabaseCount('time_logs', 0);
    }

    private function createTask(Project $project, User $assignee, string $title): Task
    {
        return Task::create([
            'project_id' => $project->id,
            'assigned_to_id' => $assignee->id,
            'title' => $title,
            'status' => Task::STATUS_IN_PROGRESS,
        ]);
    }
}
