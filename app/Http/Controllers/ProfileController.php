<?php

namespace App\Http\Controllers;

use App\DTOs\Profile\UpdateProfileData;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profiles,
    ) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->profiles->update(
            $request->user(),
            UpdateProfileData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => ['user' => new UserResource($user)],
        ]);
    }
}
