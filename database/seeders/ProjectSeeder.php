<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            [
                'name' => 'Website Redesign',
                'manager_email' => 'pm@taskmanage.com',
                'description' => 'Refresh the marketing site with a new design system and CMS.',
                'budget' => 75000000,
                'status' => Project::STATUS_ACTIVE,
                'start_date' => now()->subDays(30)->toDateString(),
                'due_date' => now()->addDays(21)->toDateString(),
                'team' => [
                    'qa' => 'qa@taskmanage.com',
                    'member' => 'member@taskmanage.com',
                    'client' => 'client@taskmanage.com',
                ],
                'tasks' => [
                    ['Design new landing page', 'in_progress', -2, 'member'],
                    ['Build responsive navigation', 'completed', -10, 'member'],
                    ['Migrate blog content', 'completed', -8, 'member'],
                    ['Implement pricing page', 'completed', -6, 'member'],
                    ['Accessibility audit', 'in_progress', 4, 'qa'],
                    ['SEO metadata cleanup', 'completed', -4, 'member'],
                    ['Set up CMS collections', 'completed', -3, 'member'],
                    ['Contact form validation', 'pending', 7, 'member'],
                    ['Cross-browser testing', 'pending', 10, 'qa'],
                    ['Performance optimization', 'completed', -1, 'member'],
                ],
            ],
            [
                'name' => 'Mobile App MVP',
                'manager_email' => 'pm.mobile@taskmanage.com',
                'description' => 'Ship the first version of the mobile app for iOS and Android.',
                'budget' => 150000000,
                'status' => Project::STATUS_ACTIVE,
                'start_date' => now()->subDays(45)->toDateString(),
                'due_date' => now()->addDays(45)->toDateString(),
                'team' => [
                    'qa' => 'qa.mobile@taskmanage.com',
                    'member' => 'member.mobile@taskmanage.com',
                    'client' => 'client.mobile@taskmanage.com',
                ],
                'tasks' => [
                    ['Set up authentication flow', 'completed', -14, 'member'],
                    ['Build onboarding screens', 'completed', -12, 'member'],
                    ['Push notification service', 'completed', -9, 'member'],
                    ['Offline data cache', 'in_progress', 6, 'member'],
                    ['Profile settings screen', 'completed', -7, 'member'],
                    ['Deep linking support', 'in_progress', 9, 'member'],
                    ['Crash reporting integration', 'completed', -5, 'qa'],
                    ['App store assets', 'pending', 15, 'qa'],
                    ['Regression test pass', 'completed', -4, 'qa'],
                    ['Release candidate build', 'completed', -2, 'member'],
                    ['Beta feedback review', 'completed', -1, 'qa'],
                    ['Analytics events', 'completed', -3, 'member'],
                ],
            ],
            [
                'name' => 'Backend API',
                'manager_email' => 'pm.api@taskmanage.com',
                'description' => 'Public API for integrations, reporting, and mobile clients.',
                'budget' => 90000000,
                'status' => Project::STATUS_ACTIVE,
                'start_date' => now()->subDays(25)->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'team' => [
                    'qa' => 'qa.api@taskmanage.com',
                    'member' => 'member.api@taskmanage.com',
                    'client' => 'client.api@taskmanage.com',
                ],
                'tasks' => [
                    ['Rate limiting middleware', 'completed', -6, 'member'],
                    ['Webhook retry queue', 'in_progress', -1, 'member'],
                    ['OpenAPI documentation', 'pending', 5, 'qa'],
                    ['Pagination for list endpoints', 'in_progress', -3, 'member'],
                    ['Token rotation', 'pending', 8, 'member'],
                    ['Error response format', 'completed', -5, 'member'],
                    ['Integration tests', 'pending', 3, 'qa'],
                    ['Load testing', 'pending', 10, 'qa'],
                ],
            ],
            [
                'name' => 'Client Portal',
                'manager_email' => 'pm.portal@taskmanage.com',
                'description' => 'Self-service portal for clients to follow project progress.',
                'budget' => 60000000,
                'status' => Project::STATUS_COMPLETED,
                'start_date' => now()->subDays(60)->toDateString(),
                'due_date' => now()->subDays(5)->toDateString(),
                'team' => [
                    'qa' => 'qa.portal@taskmanage.com',
                    'member' => 'member.portal@taskmanage.com',
                    'client' => 'client.portal@taskmanage.com',
                ],
                'tasks' => [
                    ['Client login', 'completed', -20, 'member'],
                    ['Progress dashboard', 'completed', -18, 'member'],
                    ['Invoice history', 'completed', -15, 'member'],
                    ['Support request form', 'completed', -12, 'qa'],
                    ['Email notifications', 'completed', -10, 'member'],
                    ['UAT sign-off', 'completed', -8, 'qa'],
                ],
            ],
            [
                'name' => 'Internal Tools',
                'manager_email' => 'pm.ops@taskmanage.com',
                'description' => 'Upcoming tooling improvements for the operations team.',
                'budget' => 40000000,
                'status' => Project::STATUS_PLANNING,
                'start_date' => now()->addDays(5)->toDateString(),
                'due_date' => null,
                'team' => [
                    'qa' => 'qa.ops@taskmanage.com',
                    'member' => 'member.ops@taskmanage.com',
                    'client' => 'client.ops@taskmanage.com',
                ],
                'tasks' => [],
            ],
        ];

        foreach ($projects as $projectData) {
            $manager = User::where('email', $projectData['manager_email'])->first();

            if (! $manager) {
                $this->command?->warn("Skipping {$projectData['name']}: manager {$projectData['manager_email']} not found.");

                continue;
            }

            $qa = User::where('email', $projectData['team']['qa'])->first();
            $member = User::where('email', $projectData['team']['member'])->first();
            $client = User::where('email', $projectData['team']['client'])->first();

            if (! $qa || ! $member || ! $client) {
                $this->command?->warn("Skipping {$projectData['name']}: one or more team members not found.");

                continue;
            }

            $project = Project::updateOrCreate(
                ['name' => $projectData['name']],
                [
                    'description' => $projectData['description'],
                    'budget' => $projectData['budget'],
                    'project_manager_id' => $manager->id,
                    'status' => $projectData['status'],
                    'start_date' => $projectData['start_date'],
                    'due_date' => $projectData['due_date'],
                ],
            );

            $project->users()->sync([$qa->id, $member->id, $client->id]);

            $project->tasks()->delete();

            $reviewIndex = 0;

            foreach ($projectData['tasks'] as [$title, $status, $dueOffset, $assigneeRole]) {
                $assignee = $assigneeRole === 'qa' ? $qa : $member;
                $qaStatus = Task::QA_STATUS_PENDING;
                $qaCheckedAt = null;
                $qaCheckedById = null;
                $approvalStatus = Task::APPROVAL_STATUS_PENDING;
                $approvedAt = null;
                $approvedById = null;
                $revisionNotes = null;

                if ($status === Task::STATUS_COMPLETED) {
                    $reviewSlot = $reviewIndex % 4;
                    $reviewIndex++;

                    if ($reviewSlot !== 3) {
                        $qaStatus = Task::QA_STATUS_CHECKED;
                        $qaCheckedAt = now()->subDays(1);
                        $qaCheckedById = $qa->id;
                    }

                    if ($reviewSlot === 0) {
                        $approvalStatus = Task::APPROVAL_STATUS_APPROVED;
                        $approvedAt = now()->subHours(12);
                        $approvedById = $manager->id;
                    } elseif ($reviewSlot === 2) {
                        $status = Task::STATUS_IN_PROGRESS;
                        $qaStatus = Task::QA_STATUS_PENDING;
                        $qaCheckedAt = null;
                        $qaCheckedById = null;
                        $approvalStatus = Task::APPROVAL_STATUS_REVISION;
                        $approvedById = $manager->id;
                        $revisionNotes = 'Please address the reviewer feedback before resubmitting.';
                    }
                }

                Task::create([
                    'project_id' => $project->id,
                    'assigned_to_id' => $assignee->id,
                    'title' => $title,
                    'status' => $status,
                    'qa_status' => $qaStatus,
                    'qa_checked_at' => $qaCheckedAt,
                    'qa_checked_by_id' => $qaCheckedById,
                    'approval_status' => $approvalStatus,
                    'approved_at' => $approvedAt,
                    'approved_by_id' => $approvedById,
                    'revision_notes' => $revisionNotes,
                    'due_date' => now()->addDays($dueOffset)->toDateString(),
                ]);
            }
        }

        $websiteProject = Project::where('name', 'Website Redesign')->first();

        if ($websiteProject) {
            User::whereIn('email', [
                'qa@taskmanage.com',
                'member@taskmanage.com',
                'client@taskmanage.com',
            ])->get()->each(fn (User $user) => $user->projects()->sync([$websiteProject->id]));
        }
    }
}
