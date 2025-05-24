<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role)
    {
        $guard = auth()->getDefaultDriver(); // Detectar el guard activo
    
        if ($role === 'admin' && $guard !== 'admin') {
            return response()->json(['message' => 'Acceso denegado. Solo administradores.'], 403);
        }
    
        if ($role === 'mecanico' && $guard !== 'mecanico') {
            return response()->json(['message' => 'Acceso denegado. Solo mecánicos.'], 403);
        }
    
        if ($role === 'cliente' && $guard !== 'cliente') {
            return response()->json(['message' => 'Acceso denegado. Solo clientes.'], 403);
        }
    
        return $next($request);
    }
    
}
