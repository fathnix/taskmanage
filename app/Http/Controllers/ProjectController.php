<?php

namespace App\Http\Controllers;

use App\DTOs\Project\UpdateProjectData;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectService $projects,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'projects' => ProjectResource::collection($this->projects->listFor($request->user())),
            ],
        ]);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'project' => new ProjectResource($this->projects->show($request->user(), $project)),
            ],
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project = $this->projects->update(
            $request->user(),
            $project,
            UpdateProjectData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => ['project' => new ProjectResource($project)],
        ]);
    }
}
