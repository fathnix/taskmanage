<?php

namespace App\Http\Controllers;

use App\DTOs\TimeLog\StoreTimeLogData;
use App\Http\Requests\TimeLog\StoreTimeLogRequest;
use App\Http\Resources\TimeLogResource;
use App\Services\TimeLogService;
use Illuminate\Http\JsonResponse;

class TimeLogController extends Controller
{
    public function __construct(
        private readonly TimeLogService $timeLogs,
    ) {}

    public function store(StoreTimeLogRequest $request): JsonResponse
    {
        $timeLog = $this->timeLogs->store(
            $request->user(),
            StoreTimeLogData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Work time recorded successfully.',
            'data' => ['time_log' => new TimeLogResource($timeLog)],
        ], 201);
    }
}
