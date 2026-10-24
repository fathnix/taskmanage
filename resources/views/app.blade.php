<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
    <link rel="alternate icon" href="/favicon.ico?v=2">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">

    <title>{{ config('app.name', 'Manage your task') }}</title>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body class="bg-white">
    <div id="app"></div>
</body>
</html>