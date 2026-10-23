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
            ['name' => 'Project Manager', 'email' => 'pm@taskmanage.com', 'role' => UserRole::ProjectManager],
            ['name' => 'QA Engineer', 'email' => 'qa@taskmanage.com', 'role' => UserRole::QA],
            ['name' => 'Team Member', 'email' => 'member@taskmanage.com', 'role' => UserRole::Member],
            ['name' => 'Client', 'email' => 'client@taskmanage.com', 'role' => UserRole::Client],
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
