<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\Usuario;

class AuthenticatedSessionController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('correo', 'password');

        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        $user = Auth::guard('api')->user();

        // Obtener todos los roles del usuario
        $roles = $user->roles->pluck('nombre')->toArray();

        return response()->json([
            'token' => $token,
            'roles' => $roles,
            'user' => [
                'id' => $user->cedula,
                'nombre' => $user->nombre,
                'apellido' => $user->apellido,
                'correo' => $user->correo,
            ],
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
        ]);
    }

    public function cambiarRol(Request $request)
    {
        $nuevoRol = $request->input('rol');
        $user = Auth::guard('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        // Verificar si el usuario tiene roles cargados
        if (!$user->roles || $user->roles->isEmpty()) {
            return response()->json(['error' => 'El usuario no tiene roles asignados'], 500);
        }

        // Verificar si el rol solicitado está asignado al usuario
        if ($user->roles->pluck('nombre')->contains($nuevoRol)) {
            return response()->json(['rol_activo' => $nuevoRol]);
        }

        return response()->json(['error' => 'Rol no asignado al usuario'], 403);
    }

    public function logout(Request $request)
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Sesión cerrada correctamente']);
        } catch (JWTException $e) {
            return response()->json(['error' => 'No se pudo cerrar la sesión'], 500);
        }
    }
}
