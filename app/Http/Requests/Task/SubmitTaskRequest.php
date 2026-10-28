<?php

namespace App\Http\Requests\Task;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class SubmitTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, [UserRole::Member, UserRole::QA], true);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'submission_description' => ['required', 'string', 'max:5000'],
            'evidence_link' => ['nullable', 'string', 'max:2048', 'url:http,https', 'required_without:evidence_photo'],
            'evidence_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'required_without:evidence_link'],
            'difficulty' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
