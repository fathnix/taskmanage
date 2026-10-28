<?php

namespace App\DTOs\Task;

use Illuminate\Http\UploadedFile;

readonly class SubmitTaskData
{
    public function __construct(
        public string $submissionDescription,
        public ?string $evidenceLink,
        public ?UploadedFile $evidencePhoto,
        public ?string $difficulty,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            submissionDescription: $data['submission_description'],
            evidenceLink: $data['evidence_link'] ?? null,
            evidencePhoto: $data['evidence_photo'] ?? null,
            difficulty: $data['difficulty'] ?? null,
        );
    }
}
