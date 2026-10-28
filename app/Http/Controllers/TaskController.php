<?php

namespace App\Http\Controllers;

use App\DTOs\Task\CreateTaskData;
use App\DTOs\Task\ReviewTaskData;
use App\DTOs\Task\SubmitTaskData;
use App\DTOs\Task\UpdateTaskData;
use App\Http\Requests\Task\ReviewTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\SubmitTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Requests\Task\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserSummaryResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(
        private readonly TaskService $tasks,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $result = $this->tasks->listFor($request->user(), $request->string('search')->toString());

        return response()->json([
            'success' => true,
            'message' => 'Tasks loaded successfully',
            'data' => [
                'tasks' => TaskResource::collection($result['tasks']),
                'stats' => $result['stats'],
            ],
        ]);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Task loaded successfully',
            'data' => ['task' => new TaskResource($this->tasks->show($request->user(), $task))],
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->tasks->create(
            $request->user(),
            CreateTaskData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => ['task' => new TaskResource($task)],
        ], 201);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->update(
            $request->user(),
            $task,
            UpdateTaskData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => ['task' => new TaskResource($task)],
        ]);
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->updateStatus($request->user(), $task);

        return response()->json([
            'success' => true,
            'message' => 'Task started successfully',
            'data' => ['task' => new TaskResource($task)],
        ]);
    }

    public function submit(SubmitTaskRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->submit(
            $request->user(),
            $task,
            SubmitTaskData::fromArray($request->validated()),
        );

        return response()->json([
            'success' => true,
            'message' => 'Task result submitted successfully',
            'data' => ['task' => new TaskResource($task)],
        ]);
    }

    public function qaCheck(Request $request, Task $task): JsonResponse
    {
        $task = $this->tasks->qaCheck($request->user(), $task);

        return response()->json([
            'success' => true,
            'message' => 'Task marked as checked by QA',
            'data' => ['task' => new TaskResource($task)],
        ]);
    }

    public function approval(ReviewTaskRequest $request, Task $task): JsonResponse
    {
        $data = ReviewTaskData::fromArray($request->validated());
        $task = $this->tasks->review($request->user(), $task, $data);

        return response()->json([
            'success' => true,
            'message' => $data->approvalStatus === Task::APPROVAL_STATUS_APPROVED
                ? 'Task approved successfully'
                : 'Task sent back for revision',
            'data' => ['task' => new TaskResource($task)],
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->tasks->destroy($request->user(), $task);

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    public function assignees(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Assignees loaded successfully',
            'data' => [
                'assignees' => UserSummaryResource::collection($this->tasks->assignees($request->user())),
            ],
        ]);
    }
}
