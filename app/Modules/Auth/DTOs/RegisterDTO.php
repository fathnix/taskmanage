<?php

namespace App\Modules\Auth\DTOs;

use App\Enums\UserRole;

readonly class RegisterDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public UserRole $role = UserRole::Member,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
            role: UserRole::from($data['role'] ?? UserRole::Member->value),
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'password' => $this->password,
            'role' => $this->role->value,
        ];
    }
}
