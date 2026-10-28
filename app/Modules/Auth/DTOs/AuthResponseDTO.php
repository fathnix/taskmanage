<?php

namespace App\Modules\Auth\DTOs;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

readonly class AuthResponseDTO
{
    public function __construct(
        public User $user,
        public string $token,
        public string $tokenType = 'Bearer',
    ) {}

    public function toArray(): array
    {
        return [
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'role' => $this->user->role->value,
                'role_label' => $this->user->role->label(),
                'is_active' => $this->user->is_active,
                'avatar_url' => $this->user->avatar ? Storage::disk('public')->url($this->user->avatar) : null,
                'email_verified_at' => $this->user->email_verified_at?->toISOString(),
                'created_at' => $this->user->created_at->toISOString(),
            ],
            'token' => $this->token,
            'token_type' => $this->tokenType,
        ];
    }
}
