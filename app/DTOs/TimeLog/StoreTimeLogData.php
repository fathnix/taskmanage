<?php

namespace App\DTOs\TimeLog;

readonly class StoreTimeLogData
{
    public function __construct(
        public int $taskId,
        public int $durationMinutes,
        public string $loggedOn,
        public ?string $note,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            taskId: (int) $data['task_id'],
            durationMinutes: (int) $data['duration_minutes'],
            loggedOn: $data['logged_on'],
            note: $data['note'] ?? null,
        );
    }
}
