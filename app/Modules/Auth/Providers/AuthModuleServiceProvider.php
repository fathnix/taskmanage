<?php

namespace App\Modules\Auth\Providers;

use App\Modules\Auth\Handlers\AuthHandler;
use App\Modules\Auth\Interfaces\UserRepositoryInterface;
use App\Modules\Auth\Repositories\UserRepository;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Support\ServiceProvider;

class AuthModuleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->singleton(AuthService::class, function ($app) {
            return new AuthService($app->make(UserRepositoryInterface::class));
        });
        $this->app->singleton(AuthHandler::class, function ($app) {
            return new AuthHandler($app->make(AuthService::class));
        });
    }

    public function boot(): void
    {
        //
    }
}
