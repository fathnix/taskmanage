<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email_notifications' => ['required', 'boolean'],
            'task_updates' => ['required', 'boolean'],
            'qa_updates' => ['required', 'boolean'],
            'approval_updates' => ['required', 'boolean'],
        ];
    }
}
