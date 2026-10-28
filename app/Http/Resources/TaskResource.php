<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'project' => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null,
            'title' => $this->title,
            'description' => $this->description,
            'submission_description' => $this->submission_description,
            'submission_link' => $this->submission_link,
            'submission_photo_url' => $this->submission_photo
                ? Storage::disk('public')->url($this->submission_photo)
                : null,
            'submission_difficulty' => $this->submission_difficulty,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'status' => $this->status,
            'due_date' => $this->due_date?->toDateString(),
            'assigned_to' => $this->assignee ? new UserSummaryResource($this->assignee) : null,
            'qa_status' => $this->qa_status,
            'qa_checked_at' => $this->qa_checked_at?->toISOString(),
            'qa_checked_by' => $this->qaChecker ? new UserSummaryResource($this->qaChecker) : null,
            'approval_status' => $this->approval_status,
            'approved_at' => $this->approved_at?->toISOString(),
            'approved_by' => $this->approver ? new UserSummaryResource($this->approver) : null,
            'revision_notes' => $this->revision_notes,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
