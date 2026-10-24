<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HelpController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless(in_array($user->role, [UserRole::ProjectManager, UserRole::QA], true), 403);

        $projectId = $user->primaryProjectId();

        if ($projectId === null) {
            return response()->json([
                'success' => true,
                'message' => 'Help requests loaded successfully',
                'data' => ['help_requests' => []],
            ]);
        }

        $tasks = Task::query()
            ->with([
                'project:id,name',
                'assignee:id,name,email,role,avatar',
            ])
            ->where('project_id', $projectId)
            ->whereNotNull('submission_difficulty')
            ->where('submission_difficulty', '!=', '')
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Help requests loaded successfully',
            'data' => [
                'help_requests' => $tasks->map(fn (Task $task) => $this->present($task))->values(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Task $task): array
    {
        return [
            'id' => $task->id,
            'task_id' => $task->id,
            'title' => $task->title,
            'project' => $task->project ? [
                'id' => $task->project->id,
                'name' => $task->project->name,
            ] : null,
            'assignee' => $task->assignee ? $this->presentUser($task->assignee) : null,
            'difficulty' => $task->submission_difficulty,
            'submission_description' => $task->submission_description,
            'submission_link' => $task->submission_link,
            'submission_photo_url' => $task->submission_photo
                ? Storage::disk('public')->url($task->submission_photo)
                : null,
            'submitted_at' => $task->submitted_at?->toISOString(),
            'status' => $task->status,
            'qa_status' => $task->qa_status,
            'approval_status' => $task->approval_status,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->value,
            'role_label' => $user->role?->label(),
            'avatar_url' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
        ];
    }
}
