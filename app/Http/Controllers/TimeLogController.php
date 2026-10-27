<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless(in_array($user->role, [UserRole::Member, UserRole::QA], true), 403);

        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'logged_on' => ['required', 'date', 'before_or_equal:today'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $task = Task::query()->findOrFail($validated['task_id']);

        abort_unless($task->assigned_to_id === $user->id, 404);

        $timeLog = TimeLog::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'duration_minutes' => $validated['duration_minutes'],
            'logged_on' => $validated['logged_on'],
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Work time recorded successfully.',
            'data' => ['time_log' => $timeLog],
        ], 201);
    }
}
