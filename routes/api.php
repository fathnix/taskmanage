<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Modules\Auth\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ProjectController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'active'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}/activate', [UserController::class, 'activate']);
    Route::patch('/users/{user}/deactivate', [UserController::class, 'deactivate']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:sanctum', 'active']);