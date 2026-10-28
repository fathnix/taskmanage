<?php

namespace App\Modules\Auth\Interfaces;

use App\Models\User;
use App\Modules\Auth\DTOs\RegisterDTO;

interface UserRepositoryInterface
{
    public function create(RegisterDTO $dto): User;

    public function findByEmail(string $email): ?User;

    public function findById(int $id): ?User;

    public function updateLastLogin(User $user): void;
}
