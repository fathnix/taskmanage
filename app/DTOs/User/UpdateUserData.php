<?php

namespace App\DTOs\User;

use App\Enums\UserRole;
use Illuminate\Http\UploadedFile;

readonly class UpdateUserData
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $password,
        public UserRole $role,
        public ?UploadedFile $avatar,
        public bool $removeAvatar,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'] ?? null,
            role: UserRole::from($data['role']),
            avatar: $data['avatar'] ?? null,
            removeAvatar: (bool) ($data['remove_avatar'] ?? false),
        );
    }
}
