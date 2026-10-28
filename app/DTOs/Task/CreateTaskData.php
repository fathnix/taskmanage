<?php

namespace App\DTOs\Task;

use App\Models\Task;

readonly class CreateTaskData
{
    public function __construct(
        public string $title,
        public ?string $description,
        public string $status,
        public int $assignedToId,
        public ?string $dueDate,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'],
            description: $data['description'] ?? null,
            status: $data['status'] ?? Task::STATUS_PENDING,
            assignedToId: (int) $data['assigned_to_id'],
            dueDate: $data['due_date'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toAttributes(int $projectId): array
    {
        return [
            'project_id' => $projectId,
            'assigned_to_id' => $this->assignedToId,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'qa_status' => Task::QA_STATUS_PENDING,
            'approval_status' => Task::APPROVAL_STATUS_PENDING,
            'due_date' => $this->dueDate,
        ];
    }
}
