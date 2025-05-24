<?php

use Illuminate\Support\Facades\Route;

// Puedes dejar la ruta principal si lo necesitas
Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Cargar cualquier otra ruta web relacionada
require __DIR__.'/auth.php';
