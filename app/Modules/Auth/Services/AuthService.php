<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use App\Modules\Auth\DTOs\AuthResponseDTO;
use App\Modules\Auth\DTOs\LoginDTO;
use App\Modules\Auth\DTOs\RegisterDTO;
use App\Modules\Auth\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function register(RegisterDTO $dto): User
    {
        $existingUser = $this->userRepository->findByEmail($dto->email);
        if ($existingUser) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        return $this->userRepository->create($dto);
    }

    public function login(LoginDTO $dto): AuthResponseDTO
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account is waiting for admin approval.'],
            ]);
        }

        $this->userRepository->updateLastLogin($user);
        $token = $user->createToken('auth-token', ['*'], $dto->remember ? now()->addDays(30) : null)->plainTextToken;

        return new AuthResponseDTO($user, $token);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    public function getAuthenticatedUser(User $user): User
    {
        return $user;
    }
}
