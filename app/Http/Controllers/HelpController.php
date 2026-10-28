<?php

namespace App\Http\Controllers;

use App\Http\Resources\HelpRequestResource;
use App\Services\HelpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HelpController extends Controller
{
    public function __construct(
        private readonly HelpService $help,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Help requests loaded successfully',
            'data' => [
                'help_requests' => HelpRequestResource::collection($this->help->listFor($request->user())),
            ],
        ]);
    }
}
