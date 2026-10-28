<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class HelpRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->id,
            'title' => $this->title,
            'project' => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null,
            'assignee' => $this->assignee ? new UserSummaryResource($this->assignee) : null,
            'difficulty' => $this->submission_difficulty,
            'submission_description' => $this->submission_description,
            'submission_link' => $this->submission_link,
            'submission_photo_url' => $this->submission_photo
                ? Storage::disk('public')->url($this->submission_photo)
                : null,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'status' => $this->status,
            'qa_status' => $this->qa_status,
            'approval_status' => $this->approval_status,
        ];
    }
}
