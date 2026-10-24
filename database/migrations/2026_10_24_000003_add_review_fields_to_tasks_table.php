<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('qa_status')->default('pending')->index()->after('status');
            $table->timestamp('qa_checked_at')->nullable()->after('qa_status');
            $table->foreignId('qa_checked_by_id')->nullable()->after('qa_checked_at')->constrained('users')->nullOnDelete();
            $table->string('approval_status')->default('pending')->index()->after('qa_checked_by_id');
            $table->timestamp('approved_at')->nullable()->after('approval_status');
            $table->foreignId('approved_by_id')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            $table->text('revision_notes')->nullable()->after('approved_by_id');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['qa_checked_by_id']);
            $table->dropForeign(['approved_by_id']);
            $table->dropColumn([
                'qa_status',
                'qa_checked_at',
                'qa_checked_by_id',
                'approval_status',
                'approved_at',
                'approved_by_id',
                'revision_notes',
            ]);
        });
    }
};
