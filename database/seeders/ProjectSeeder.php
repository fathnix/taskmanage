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
        $manager = User::where('email', 'pm@taskmanage.com')->first();
        $qa = User::where('email', 'qa@taskmanage.com')->first();
        $member = User::where('email', 'member@taskmanage.com')->first();

        if (! $manager) {
            return;
        }

        $projects = [
            [
                'name' => 'Website Redesign',
                'description' => 'Refresh the marketing site with a new design system and CMS.',
                'status' => 'active',
                'due_date' => now()->addDays(21)->toDateString(),
                'tasks' => [
                    ['Design new landing page', 'in_progress', -2, $member],
                    ['Build responsive navigation', 'completed', -10, $member],
                    ['Migrate blog content', 'completed', -8, $member],
                    ['Implement pricing page', 'completed', -6, $member],
                    ['Accessibility audit', 'in_progress', 4, $qa],
                    ['SEO metadata cleanup', 'completed', -4, $member],
                    ['Set up CMS collections', 'completed', -3, $member],
                    ['Contact form validation', 'pending', 7, $member],
                    ['Cross-browser testing', 'pending', 10, $qa],
                    ['Performance optimization', 'completed', -1, $member],
                ],
            ],
            [
                'name' => 'Mobile App MVP',
                'description' => 'Ship the first version of the mobile app for iOS and Android.',
                'status' => 'active',
                'due_date' => now()->addDays(45)->toDateString(),
                'tasks' => [
                    ['Set up authentication flow', 'completed', -14, $member],
                    ['Build onboarding screens', 'completed', -12, $member],
                    ['Push notification service', 'completed', -9, $member],
                    ['Offline data cache', 'in_progress', 6, $member],
                    ['Profile settings screen', 'completed', -7, $member],
                    ['Deep linking support', 'in_progress', 9, $member],
                    ['Crash reporting integration', 'completed', -5, $qa],
                    ['App store assets', 'pending', 15, $qa],
                    ['Regression test pass', 'completed', -4, $qa],
                    ['Release candidate build', 'completed', -2, $member],
                    ['Beta feedback review', 'completed', -1, $qa],
                    ['Analytics events', 'completed', -3, $member],
                ],
            ],
            [
                'name' => 'Backend API',
                'description' => 'Public API for integrations, reporting, and mobile clients.',
                'status' => 'active',
                'due_date' => now()->addDays(14)->toDateString(),
                'tasks' => [
                    ['Rate limiting middleware', 'completed', -6, $member],
                    ['Webhook retry queue', 'in_progress', -1, $member],
                    ['OpenAPI documentation', 'pending', 5, $qa],
                    ['Pagination for list endpoints', 'in_progress', -3, $member],
                    ['Token rotation', 'pending', 8, $member],
                    ['Error response format', 'completed', -5, $member],
                    ['Integration tests', 'pending', 3, $qa],
                    ['Load testing', 'pending', 10, $qa],
                ],
            ],
            [
                'name' => 'Client Portal',
                'description' => 'Self-service portal for clients to follow project progress.',
                'status' => 'completed',
                'due_date' => now()->subDays(5)->toDateString(),
                'tasks' => [
                    ['Client login', 'completed', -20, $member],
                    ['Progress dashboard', 'completed', -18, $member],
                    ['Invoice history', 'completed', -15, $member],
                    ['Support request form', 'completed', -12, $qa],
                    ['Email notifications', 'completed', -10, $member],
                    ['UAT sign-off', 'completed', -8, $qa],
                ],
            ],
            [
                'name' => 'Internal Tools',
                'description' => 'Upcoming tooling improvements for the operations team.',
                'status' => 'planning',
                'due_date' => now()->addDays(60)->toDateString(),
                'tasks' => [],
            ],
        ];

        foreach ($projects as $projectData) {
            $project = Project::updateOrCreate(
                ['name' => $projectData['name']],
                [
                    'description' => $projectData['description'],
                    'project_manager_id' => $manager->id,
                    'status' => $projectData['status'],
                    'due_date' => $projectData['due_date'],
                ],
            );

            $project->tasks()->delete();

            foreach ($projectData['tasks'] as [$title, $status, $dueOffset, $assignee]) {
                Task::create([
                    'project_id' => $project->id,
                    'assigned_to_id' => $assignee?->id,
                    'title' => $title,
                    'status' => $status,
                    'due_date' => now()->addDays($dueOffset)->toDateString(),
                ]);
            }
        }
    }
}
