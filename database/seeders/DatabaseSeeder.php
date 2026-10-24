<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Admin User', 'email' => 'admin@taskmanage.com', 'role' => UserRole::Admin],
            ['name' => 'Website Project Manager', 'email' => 'pm@taskmanage.com', 'role' => UserRole::ProjectManager],
            ['name' => 'Mobile Project Manager', 'email' => 'pm.mobile@taskmanage.com', 'role' => UserRole::ProjectManager],
            ['name' => 'API Project Manager', 'email' => 'pm.api@taskmanage.com', 'role' => UserRole::ProjectManager],
            ['name' => 'Portal Project Manager', 'email' => 'pm.portal@taskmanage.com', 'role' => UserRole::ProjectManager],
            ['name' => 'Operations Project Manager', 'email' => 'pm.ops@taskmanage.com', 'role' => UserRole::ProjectManager],
            ['name' => 'QA Engineer', 'email' => 'qa@taskmanage.com', 'role' => UserRole::QA],
            ['name' => 'Team Member', 'email' => 'member@taskmanage.com', 'role' => UserRole::Member],
            ['name' => 'Client', 'email' => 'client@taskmanage.com', 'role' => UserRole::Client],
            ['name' => 'Mobile QA Engineer', 'email' => 'qa.mobile@taskmanage.com', 'role' => UserRole::QA],
            ['name' => 'Mobile Team Member', 'email' => 'member.mobile@taskmanage.com', 'role' => UserRole::Member],
            ['name' => 'Mobile Client', 'email' => 'client.mobile@taskmanage.com', 'role' => UserRole::Client],
            ['name' => 'API QA Engineer', 'email' => 'qa.api@taskmanage.com', 'role' => UserRole::QA],
            ['name' => 'API Team Member', 'email' => 'member.api@taskmanage.com', 'role' => UserRole::Member],
            ['name' => 'API Client', 'email' => 'client.api@taskmanage.com', 'role' => UserRole::Client],
            ['name' => 'Portal QA Engineer', 'email' => 'qa.portal@taskmanage.com', 'role' => UserRole::QA],
            ['name' => 'Portal Team Member', 'email' => 'member.portal@taskmanage.com', 'role' => UserRole::Member],
            ['name' => 'Portal Client', 'email' => 'client.portal@taskmanage.com', 'role' => UserRole::Client],
            ['name' => 'Operations QA Engineer', 'email' => 'qa.ops@taskmanage.com', 'role' => UserRole::QA],
            ['name' => 'Operations Team Member', 'email' => 'member.ops@taskmanage.com', 'role' => UserRole::Member],
            ['name' => 'Operations Client', 'email' => 'client.ops@taskmanage.com', 'role' => UserRole::Client],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password123'),
                    'role' => $account['role'],
                    'email_verified_at' => now(),
                ],
            );
        }

        $this->call(ProjectSeeder::class);
    }
}
