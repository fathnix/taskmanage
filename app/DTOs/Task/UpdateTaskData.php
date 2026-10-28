<?php

namespace App\DTOs\Task;

readonly class UpdateTaskData
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
            status: $data['status'],
            assignedToId: (int) $data['assigned_to_id'],
            dueDate: $data['due_date'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toAttributes(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'assigned_to_id' => $this->assignedToId,
            'due_date' => $this->dueDate,
        ];
    }
}
