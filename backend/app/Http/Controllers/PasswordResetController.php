<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use App\Models\Usuario;

class PasswordResetController extends Controller
{
    /**
     * Enviar enlace de recuperación de contraseña.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate(['correo' => 'required|email']);

        $correo = $request->correo;

        // Buscar usuario en la tabla usuarios
        $user = Usuario::where('correo', $correo)->first();

        if (!$user) {
            return response()->json(['message' => 'Correo no encontrado'], 404);
        }

        // Obtener el primer rol del usuario
        $role = $user->roles()->first()->nombre ?? 'usuario';

        // Generar el token
        $token = Password::getRepository()->createNewToken();

        // Guardar el token en la base de datos
        try {
            \DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $correo],
                [
                    'token' => $token,
                    'created_at' => now(),
                ]
            );

            // Enviar el correo con los datos del usuario
            Mail::send('emails.password-reset', [
                'token' => $token,
                'role' => $role,
                'nombre' => $user->nombre ?? 'Usuario',
                'apellido' => $user->apellido ?? '',
            ], function ($message) use ($correo) {
                $message->to($correo)->subject('Recuperación de Contraseña');
            });

            return response()->json(['message' => 'Correo de recuperación enviado'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al enviar el correo', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Restablecer la contraseña del usuario.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'password' => 'required|min:6|confirmed',
        ]);

        $resetEntry = \DB::table('password_reset_tokens')->where('token', $request->token)->first();

        if (!$resetEntry) {
            return response()->json(['message' => 'Token inválido o expirado'], 400);
        }

        // Buscar al usuario en la tabla usuarios
        $user = Usuario::where('correo', $resetEntry->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Actualizar la contraseña
        $user->update([
            'password' => bcrypt($request->password),
        ]);

        // Eliminar el token de la tabla
        \DB::table('password_reset_tokens')->where('token', $request->token)->delete();

        return response()->json(['message' => 'Contraseña restablecida con éxito'], 200);
    }
}
