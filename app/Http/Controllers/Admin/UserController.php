<?php

namespace App\Http\Controllers\Admin;

use App\DTOs\User\CreateUserData;
use App\DTOs\User\UpdateUserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $users,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $result = $this->users->list($request->user(), $request->string('search')->toString());

        return response()->json([
            'success' => true,
            'data' => [
                'users' => UserResource::collection($result['users']),
                'stats' => $result['stats'],
            ],
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->create(
            $request->user(),
            CreateUserData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => ['user' => new UserResource($user)],
        ], 201);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['user' => new UserResource($this->users->show($request->user(), $user))],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->users->update(
            $request->user(),
            $user,
            UpdateUserData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => ['user' => new UserResource($user)],
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $result = $this->users->destroy($request->user(), $user);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    public function activate(Request $request, User $user): JsonResponse
    {
        $user = $this->users->activate($request->user(), $user);

        return response()->json([
            'success' => true,
            'message' => 'User activated as Project Manager',
            'data' => ['user' => new UserResource($user)],
        ]);
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        $user = $this->users->deactivate($request->user(), $user);

        return response()->json([
            'success' => true,
            'message' => 'User deactivated',
            'data' => ['user' => new UserResource($user)],
        ]);
    }
}
