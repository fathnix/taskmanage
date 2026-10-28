<?php

namespace App\Repositories\Eloquent;

use App\Contracts\Repositories\TimeLogRepositoryInterface;
use App\Models\TimeLog;

class TimeLogRepository implements TimeLogRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): TimeLog
    {
        return TimeLog::query()->create($attributes);
    }
}
