<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureCanViewUsers($request);

        $viewer = $request->user();
        $search = trim((string) $request->query('search', ''));
        $projectIds = $viewer->role === UserRole::Admin
            ? []
            : $this->viewProjectIds($viewer);

        $query = User::query()
            ->where('role', '!=', UserRole::Admin->value)
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', '%'.$search.'%'));

        if ($viewer->role === UserRole::Admin) {
            $query->where(function (Builder $query): void {
                $query->where('role', UserRole::ProjectManager->value)
                    ->orWhere('is_active', false);
            });
        } elseif ($projectIds === []) {
            $query->whereRaw('1 = 0');
        } else {
            $query->whereHas('projects', fn (Builder $query) => $query->whereIn('projects.id', $projectIds));
        }

        $users = $query
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (User $user) => $this->present($user));

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'stats' => $this->stats($projectIds),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureManager($request);

        $projectIds = $this->managedProjectIds($request->user());

        abort_if($projectIds === [], 422, 'You are not managing any project yet.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
            'role' => ['required', Rule::in(UserRole::selfAssignable())],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'avatar' => $request->file('avatar')?->store('avatars', 'public'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $user->projects()->attach($projectIds);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => ['user' => $this->present($user)],
        ], 201);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->ensureCanViewUsers($request);
        $this->ensureNotAdmin($user);
        $this->ensureUserIsInViewerScope($request, $user);

        return response()->json([
            'success' => true,
            'data' => ['user' => $this->present($user)],
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureManager($request);
        $this->ensureNotAdmin($user);
        $this->ensureUserIsInViewerScope($request, $user);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', Password::min(8)],
            'role' => ['required', Rule::in(UserRole::selfAssignable())],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
        ]);

        $avatar = $user->avatar;

        if ($request->hasFile('avatar')) {
            $this->deleteAvatar($user);
            $avatar = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar')) {
            $this->deleteAvatar($user);
            $avatar = null;
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'avatar' => $avatar,
            ...(filled($validated['password'] ?? null) ? ['password' => $validated['password']] : []),
        ]);

        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => ['user' => $this->present($user)],
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureManager($request);
        $this->ensureNotAdmin($user);
        $this->ensureUserIsInViewerScope($request, $user);

        abort_if($request->user()->is($user), 422, 'You cannot delete your own account.');

        $user->projects()->detach($this->managedProjectIds($request->user()));

        $stillAssigned = $user->projects()->exists();
        $managesProjects = Project::where('project_manager_id', $user->id)->exists();

        if ($stillAssigned || $managesProjects) {
            return response()->json([
                'success' => true,
                'message' => 'User removed from your project successfully',
            ]);
        }

        $this->deleteAvatar($user);
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
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

    /**
     * @return array<int, int>
     */
    private function managedProjectIds(User $manager): array
    {
        $projectId = Project::where('project_manager_id', $manager->id)->orderBy('id')->value('id');

        return $projectId !== null ? [(int) $projectId] : [];
    }

    /**
     * @param  array<int, int>  $projectIds
     * @return array<string, int>
     */
    private function stats(array $projectIds): array
    {
        $stats = collect(UserRole::selfAssignable())
            ->mapWithKeys(fn (string $role) => [$role => 0])
            ->all();

        if ($projectIds === []) {
            return $stats;
        }

        $roleCounts = User::query()
            ->whereIn('role', UserRole::selfAssignable())
            ->whereHas('projects', fn (Builder $query) => $query->whereIn('projects.id', $projectIds))
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        foreach (UserRole::selfAssignable() as $role) {
            $stats[$role] = (int) ($roleCounts[$role] ?? 0);
        }

        $stats['project_manager'] = Project::whereIn('id', $projectIds)
            ->distinct()
            ->count('project_manager_id');

        return $stats;
    }

    private function ensureUserIsInViewerScope(Request $request, User $user): void
    {
        $projectIds = $this->viewProjectIds($request->user());

        abort_unless(
            $projectIds !== [] && $user->projects()->whereIn('projects.id', $projectIds)->exists(),
            403,
            'This user is not part of your project.',
        );
    }

    /**
     * @return array<int, int>
     */
    private function viewProjectIds(User $viewer): array
    {
        $projectId = $viewer->primaryProjectId();

        return $projectId !== null ? [(int) $projectId] : [];
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === UserRole::Admin, 403, 'Only admins can approve registrations.');
    }

    private function ensureCanViewUsers(Request $request): void
    {
        abort_unless(
            in_array($request->user()?->role, [UserRole::Admin, UserRole::ProjectManager, UserRole::QA], true),
            403,
            'Only admins, project managers, and QA can view users.',
        );
    }

    private function ensureManager(Request $request): void
    {
        abort_unless($request->user()?->role === UserRole::ProjectManager, 403, 'Only project managers can manage users.');
    }

    private function ensureNotAdmin(User $user): void
    {
        abort_if($user->role === UserRole::Admin, 422, 'Admin accounts cannot be managed from this page.');
    }

    private function deleteAvatar(User $user): void
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }
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
            'avatar_url' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
