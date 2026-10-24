<?php

namespace App\Providers;

use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            Event::listen(CommandStarting::class, function (CommandStarting $event): void {
                if ($event->command === 'serve') {
                    $this->removeStaleViteHotFile();
                }
            });
        }
    }

    /**
     * Remove the Vite hot file when its dev server is no longer reachable.
     *
     * Otherwise a hot file left behind by a crashed or killed dev server makes
     * Laravel keep pointing every asset at a port that is no longer listening.
     */
    protected function removeStaleViteHotFile(): void
    {
        $hotFile = Vite::hotFile();

        if (! File::exists($hotFile)) {
            return;
        }

        $url = trim((string) File::get($hotFile));
        $parts = parse_url($url);
        $host = $parts['host'] ?? null;

        if ($host === null) {
            File::delete($hotFile);

            return;
        }

        $port = $parts['port'] ?? (($parts['scheme'] ?? 'http') === 'https' ? 443 : 80);
        $connection = @fsockopen($host, $port, $errno, $errstr, 0.2);

        if ($connection === false) {
            File::delete($hotFile);

            return;
        }

        fclose($connection);
    }
}
