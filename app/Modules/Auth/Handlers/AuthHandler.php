<?php

namespace App\Modules\Auth\Handlers;

use App\Models\User;
use App\Modules\Auth\DTOs\RegisterDTO;
use App\Modules\Auth\DTOs\LoginDTO;
use App\Modules\Auth\DTOs\AuthResponseDTO;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AuthHandler
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function handleRegister(array $data): JsonResponse
    {
        try {
            $dto = RegisterDTO::fromArray($data);
            $response = $this->authService->register($dto);

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => $response->toArray(),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function handleLogin(array $data): JsonResponse
    {
        try {
            $dto = LoginDTO::fromArray($data);
            $response = $this->authService->login($dto);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $response->toArray(),
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors' => $e->errors(),
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function handleLogout(User $user): JsonResponse
    {
        try {
            $this->authService->logout($user);

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function handleMe(User $user): JsonResponse
    {
        try {
            $user = $this->authService->getAuthenticatedUser($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                    'created_at' => $user->created_at->toISOString(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}