<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class RegisteredUserController extends Controller
{
    public function register(Request $request)
    {
        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50',
            'apellido' => 'required|string|max:50',
            'correo' => 'required|string|email|max:100|unique:usuario,correo',
            'password' => 'required|string|min:8|confirmed',
            'cedula' => 'required|string|size:10|unique:usuario,cedula',
            'telefono' => 'nullable|string|max:20',
            'direccion_domicilio' => 'nullable|string|max:100',
            'fecha_nacimiento' => ['nullable', 'date', function ($attribute, $value, $fail) {
                if ($value) {
                    $edadMinima = Carbon::now()->subYears(18);
                    if (Carbon::parse($value)->greaterThan($edadMinima)) {
                        $fail('Debes tener al menos 18 años para registrarte.');
                    }
                }
            }],
            'especialidad' => 'nullable|string|max:100',
            'genero' => 'nullable|in:masculino,femenino,otro',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique' => 'El :attribute ya está registrado.',
            'email' => 'El campo :attribute debe ser un correo válido.',
            'confirmed' => 'Las contraseñas no coinciden.',
            'size' => 'La cédula debe tener exactamente 10 dígitos.',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Procesar y formatear el teléfono si existe
        $telefono = $request->telefono;
        if ($telefono) {
            if (!str_starts_with($telefono, '+593')) {
                if (substr($telefono, 0, 1) === '0') {
                    $telefono = '+593' . substr($telefono, 1);
                } else {
                    $telefono = '+593' . $telefono;
                }
            }
        }

        // Convertir el valor de fecha_nacimiento al formato 'Y-m-d'
        $fechaNacimiento = $request->fecha_nacimiento 
                            ? Carbon::parse($request->fecha_nacimiento)->format('Y-m-d')
                            : null;

        // Crear el usuario en la tabla 'usuario'
        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'correo' => $request->correo,
            'password' => Hash::make($request->password),
            'cedula' => $request->cedula,
            'telefono' => $telefono,
            'direccion_domicilio' => $request->direccion_domicilio,
            'fecha_nacimiento' => $fechaNacimiento,
            'especialidad' => $request->especialidad,
            'genero' => $request->genero,
        ]);

        // Asignar el rol de cliente (ID=3)
        $usuario->roles()->attach(3);

        // Generar token JWT para el usuario recién registrado
        $token = JWTAuth::fromUser($usuario);

        return response()->json([
            'message' => 'Usuario registrado con éxito',
            'token' => $token,
            'usuario' => $usuario,
        ], 201);
    }

}
