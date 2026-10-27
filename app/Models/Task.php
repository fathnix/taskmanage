<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
    ];

    public const QA_STATUS_PENDING = 'pending';

    public const QA_STATUS_CHECKED = 'checked';

    public const QA_STATUSES = [
        self::QA_STATUS_PENDING,
        self::QA_STATUS_CHECKED,
    ];

    public const APPROVAL_STATUS_PENDING = 'pending';

    public const APPROVAL_STATUS_APPROVED = 'approved';

    public const APPROVAL_STATUS_REVISION = 'revision';

    public const APPROVAL_STATUSES = [
        self::APPROVAL_STATUS_PENDING,
        self::APPROVAL_STATUS_APPROVED,
        self::APPROVAL_STATUS_REVISION,
    ];

    protected $fillable = [
        'project_id',
        'assigned_to_id',
        'title',
        'description',
        'submission_description',
        'submission_link',
        'submission_photo',
        'submission_difficulty',
        'submitted_at',
        'status',
        'qa_status',
        'qa_checked_at',
        'qa_checked_by_id',
        'approval_status',
        'approved_at',
        'approved_by_id',
        'revision_notes',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'submitted_at' => 'datetime',
            'qa_checked_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    public function qaChecker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'qa_checked_by_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }
}
