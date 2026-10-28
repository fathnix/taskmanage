<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class TimeReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'before_or_equal:today'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'project_id' => ['sometimes', 'integer', 'exists:projects,id'],
        ];
    }
}
