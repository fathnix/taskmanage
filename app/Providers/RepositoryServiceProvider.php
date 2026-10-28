<?php

namespace App\Providers;

use App\Contracts\Repositories\ProjectRepositoryInterface;
use App\Contracts\Repositories\TaskRepositoryInterface;
use App\Contracts\Repositories\TimeLogRepositoryInterface;
use App\Contracts\Repositories\TimeReportRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\Eloquent\ProjectRepository;
use App\Repositories\Eloquent\TaskRepository;
use App\Repositories\Eloquent\TimeLogRepository;
use App\Repositories\Eloquent\TimeReportRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ProjectRepositoryInterface::class, ProjectRepository::class);
        $this->app->bind(TaskRepositoryInterface::class, TaskRepository::class);
        $this->app->bind(TimeLogRepositoryInterface::class, TimeLogRepository::class);
        $this->app->bind(TimeReportRepositoryInterface::class, TimeReportRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }
}
