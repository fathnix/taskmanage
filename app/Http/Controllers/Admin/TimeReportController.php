<?php

namespace App\Http\Controllers\Admin;

use App\DTOs\TimeReport\TimeReportData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TimeReportRequest;
use App\Http\Resources\TimeReportResource;
use App\Services\TimeReportService;
use Illuminate\Http\JsonResponse;

class TimeReportController extends Controller
{
    public function __construct(
        private readonly TimeReportService $reports,
    ) {}

    public function index(TimeReportRequest $request): JsonResponse
    {
        $report = $this->reports->report(
            $request->user(),
            TimeReportData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Time report loaded successfully.',
            'data' => new TimeReportResource($report),
        ]);
    }
}
