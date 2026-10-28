<?php

namespace App\Http\Controllers;

use App\DTOs\Settings\UpdatePreferencesData;
use App\Http\Requests\Settings\UpdatePreferencesRequest;
use App\Http\Resources\UserResource;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'preferences' => $this->settings->preferences($user),
            ],
        ]);
    }

    public function updatePreferences(UpdatePreferencesRequest $request): JsonResponse
    {
        $preferences = $this->settings->updatePreferences(
            $request->user(),
            UpdatePreferencesData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully',
            'data' => ['preferences' => $preferences],
        ]);
    }
}
