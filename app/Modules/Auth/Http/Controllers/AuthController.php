<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Auth\Handlers\AuthHandler;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthHandler $authHandler
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        return $this->authHandler->handleRegister($request->validated());
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->authHandler->handleLogin($request->validated());
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->authHandler->handleLogout($request->user());
    }

    public function me(Request $request): JsonResponse
    {
        return $this->authHandler->handleMe($request->user());
    }
}