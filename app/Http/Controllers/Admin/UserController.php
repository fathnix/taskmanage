<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $users = User::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (User $user) => $this->present($user));

        return response()->json([
            'success' => true,
            'data' => ['users' => $users],
        ]);
    }

    public function activate(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureNotAdmin($user);

        $user->update([
            'is_active' => true,
            'role' => UserRole::ProjectManager,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User activated as Project Manager',
            'data' => ['user' => $this->present($user)],
        ]);
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureNotAdmin($user);

        $user->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'User deactivated',
            'data' => ['user' => $this->present($user)],
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === UserRole::Admin, 403, 'Only admins can manage users.');
    }

    private function ensureNotAdmin(User $user): void
    {
        abort_if($user->role === UserRole::Admin, 422, 'Admin accounts cannot be deactivated.');
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'role_label' => $user->role->label(),
            'is_active' => $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
