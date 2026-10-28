<?php

namespace App\DTOs\Project;

readonly class UpdateProjectData
{
    public function __construct(
        public string $name,
        public ?string $description,
        public string $status,
        public ?float $budget,
        public ?string $startDate,
        public ?string $endDate,
        public bool $isIndefinite,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            description: $data['description'] ?? null,
            status: $data['status'],
            budget: isset($data['budget']) ? (float) $data['budget'] : null,
            startDate: $data['start_date'] ?? null,
            endDate: $data['end_date'] ?? null,
            isIndefinite: (bool) ($data['is_indefinite'] ?? false),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toAttributes(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'budget' => $this->budget,
            'start_date' => $this->startDate,
            'due_date' => $this->isIndefinite ? null : $this->endDate,
        ];
    }
}
