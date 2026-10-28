<?php

namespace App\DTOs\TimeReport;

readonly class TimeReportData
{
    public function __construct(
        public ?string $from,
        public ?string $to,
        public ?int $userId,
        public ?int $projectId,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            from: $data['from'] ?? null,
            to: $data['to'] ?? null,
            userId: isset($data['user_id']) ? (int) $data['user_id'] : null,
            projectId: isset($data['project_id']) ? (int) $data['project_id'] : null,
        );
    }
}
