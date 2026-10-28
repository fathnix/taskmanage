<?php

namespace App\Http\Requests\Project;

use App\Enums\UserRole;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
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
        $isIndefinite = $this->boolean('is_indefinite');

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(Project::STATUSES)],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => $isIndefinite
                ? ['nullable']
                : ['required', 'date', 'after_or_equal:start_date'],
            'is_indefinite' => ['sometimes', 'boolean'],
        ];
    }
}
