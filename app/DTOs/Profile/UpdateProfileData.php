<?php

namespace App\DTOs\Profile;

use Illuminate\Http\UploadedFile;

readonly class UpdateProfileData
{
    public function __construct(
        public string $name,
        public ?string $currentPassword,
        public ?string $password,
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
            currentPassword: $data['current_password'] ?? null,
            password: $data['password'] ?? null,
            avatar: $data['avatar'] ?? null,
            removeAvatar: (bool) ($data['remove_avatar'] ?? false),
        );
    }
}
