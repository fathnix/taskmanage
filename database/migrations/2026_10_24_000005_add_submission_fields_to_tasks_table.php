<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->text('submission_description')->nullable()->after('description');
            $table->string('submission_link', 2048)->nullable()->after('submission_description');
            $table->string('submission_photo')->nullable()->after('submission_link');
            $table->text('submission_difficulty')->nullable()->after('submission_photo');
            $table->timestamp('submitted_at')->nullable()->after('submission_difficulty');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'submission_description',
                'submission_link',
                'submission_photo',
                'submission_difficulty',
                'submitted_at',
            ]);
        });
    }
};
