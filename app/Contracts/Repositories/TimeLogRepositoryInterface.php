<?php

namespace App\Contracts\Repositories;

use App\Models\TimeLog;

interface TimeLogRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): TimeLog;
}
