<?php

namespace App\DTOs\Task;

readonly class ReviewTaskData
{
    public function __construct(
        public string $approvalStatus,
        public ?string $revisionNotes,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            approvalStatus: $data['approval_status'],
            revisionNotes: $data['revision_notes'] ?? null,
        );
    }
}
