<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'], // Habilita CORS solo en rutas API

    'allowed_methods' => ['*'],  // Permitir todos los métodos HTTP

    'allowed_origins' => ['http://localhost:4200'],  // Dominio del frontend (Angular)

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],  // Permitir todos los encabezados

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,  // Cambiar a 'true' si usas cookies, pero con JWT no es necesario

];
