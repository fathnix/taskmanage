<?php

namespace App\Http\Requests\Task;

use App\Enums\UserRole;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::ProjectManager;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'approval_status' => [
                'required',
                Rule::in([Task::APPROVAL_STATUS_APPROVED, Task::APPROVAL_STATUS_REVISION]),
            ],
            'revision_notes' => ['required_if:approval_status,revision', 'nullable', 'string', 'max:2000'],
        ];
    }
}
