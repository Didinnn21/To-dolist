<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UploadController;

// Auth Routes (Public)
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated Routes
Route::middleware(['jwt.auth'])->group(function () {
    // Auth Routes (Private)
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Users Routes
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::put('/users/{id}/password', [UserController::class, 'updatePassword']);
    Route::put('/users/{id}/status', [UserController::class, 'updateStatus']);
    Route::put('/users/{id}/avatar', [UserController::class, 'updateAvatar']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Tasks Routes
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::put('/tasks/{id}/status', [TaskController::class, 'updateStatus']);
    Route::post('/tasks/{id}/progress', [TaskController::class, 'addProgress']);
    Route::delete('/tasks/{id}/progress/{progressId}', [TaskController::class, 'deleteProgress']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

    // Categories Routes
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Notifications Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::put('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'read']);

    // Upload Routes
    Route::post('/upload', [UploadController::class, 'upload']);
    Route::delete('/upload', [UploadController::class, 'destroy']);
    Route::get('/upload/download', [UploadController::class, 'download']);
});
