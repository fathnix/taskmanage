<?php

namespace App\DTOs\Settings;

readonly class UpdatePreferencesData
{
    public function __construct(
        public bool $emailNotifications,
        public bool $taskUpdates,
        public bool $qaUpdates,
        public bool $approvalUpdates,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            emailNotifications: (bool) $data['email_notifications'],
            taskUpdates: (bool) $data['task_updates'],
            qaUpdates: (bool) $data['qa_updates'],
            approvalUpdates: (bool) $data['approval_updates'],
        );
    }

    /**
     * @return array<string, bool>
     */
    public function toArray(): array
    {
        return [
            'email_notifications' => $this->emailNotifications,
            'task_updates' => $this->taskUpdates,
            'qa_updates' => $this->qaUpdates,
            'approval_updates' => $this->approvalUpdates,
        ];
    }
}
