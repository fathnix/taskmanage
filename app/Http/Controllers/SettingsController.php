<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->present($user),
                'preferences' => $this->preferences($user),
            ],
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_notifications' => ['required', 'boolean'],
            'task_updates' => ['required', 'boolean'],
            'qa_updates' => ['required', 'boolean'],
            'approval_updates' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $user->notification_preferences = array_merge($this->preferences($user), $validated);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully',
            'data' => ['preferences' => $this->preferences($user->refresh())],
        ]);
    }

    /**
     * @return array<string, bool>
     */
    private function preferences(User $user): array
    {
        return array_merge([
            'email_notifications' => true,
            'task_updates' => true,
            'qa_updates' => true,
            'approval_updates' => true,
        ], $user->notification_preferences ?? []);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'role_label' => $user->role->label(),
            'is_active' => $user->is_active,
            'avatar_url' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
