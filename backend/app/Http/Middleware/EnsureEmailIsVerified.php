<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Verificar si el usuario está autenticado y si pertenece a uno de los roles
        if (!$user) {
            return response()->json(['message' => 'No estás autenticado.'], 401);
        }

        // Si el usuario es un administrador
        if (auth()->guard('admin')->check()) {
            if ($user instanceof MustVerifyEmail && !$user->hasVerifiedEmail()) {
                return response()->json(['message' => 'Tu correo electrónico no está verificado.'], 409);
            }
        }

        // Si el usuario es un mecánico
        if (auth()->guard('mecanico')->check()) {
            if ($user instanceof MustVerifyEmail && !$user->hasVerifiedEmail()) {
                return response()->json(['message' => 'Tu correo electrónico no está verificado.'], 409);
            }
        }

        // Si el usuario es un cliente
        if (auth()->guard('cliente')->check()) {
            if ($user instanceof MustVerifyEmail && !$user->hasVerifiedEmail()) {
                return response()->json(['message' => 'Tu correo electrónico no está verificado.'], 409);
            }
        }

        return $next($request);
    }
}
