<?php

namespace App\DTOs\User;

use App\Enums\UserRole;
use Illuminate\Http\UploadedFile;

readonly class CreateUserData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public UserRole $role,
        public ?UploadedFile $avatar,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
            role: UserRole::from($data['role']),
            avatar: $data['avatar'] ?? null,
        );
    }
}
