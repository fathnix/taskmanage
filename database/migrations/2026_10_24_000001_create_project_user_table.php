<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
        });

        DB::table('tasks')
            ->whereNotNull('assigned_to_id')
            ->select('project_id', 'assigned_to_id')
            ->distinct()
            ->get()
            ->each(function (object $task): void {
                DB::table('project_user')->insertOrIgnore([
                    'project_id' => $task->project_id,
                    'user_id' => $task->assigned_to_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_user');
    }
};
