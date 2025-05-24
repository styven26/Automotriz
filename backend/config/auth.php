<?php

return [

    'guards' => [
        'api' => [
            'driver' => 'jwt', // Usa el driver JWT
            'provider' => 'usuarios', // Define el proveedor como 'usuarios'
        ],

        'admin' => [
            'driver' => 'jwt', // Driver JWT
            'provider' => 'usuarios', // Provider para la tabla usuario
        ],

        'mecanico' => [
            'driver' => 'jwt', // Driver JWT
            'provider' => 'usuarios', // Provider para la tabla usuario
        ],

        'vendedor' => [
            'driver' => 'jwt', // Driver JWT
            'provider' => 'usuarios', // Provider para la tabla usuario
        ],

        'cliente' => [
            'driver' => 'jwt', // Driver JWT
            'provider' => 'usuarios', // Provider para la tabla usuario
        ],
    ],

    'providers' => [
        'usuarios' => [
            'driver' => 'eloquent',
            'model' => App\Models\Usuario::class, // Modelo del usuario
        ],
    ],

    'passwords' => [
        'usuarios' => [
            'provider' => 'usuarios',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,
];
