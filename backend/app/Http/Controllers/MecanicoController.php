<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class MecanicoController extends Controller
{
    /**
     * Listar todos los mecánicos.
     */
    public function index(Request $request)
    {
        // Verificar autenticación del administrador
        $admin = auth()->guard('admin')->user();

        if (!$admin) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        // Obtener los usuarios con el rol de "mecánico"
        $mecanicos = Usuario::whereHas('roles', function ($query) {
            $query->where('nombre', 'mecanico');
        })->get();

        return response()->json($mecanicos, 200);
    }

    /**
     * Crear un nuevo mecánico.
     */
    public function store(Request $request)
    {
        // Definir especialidades permitidas
        $especialidadesDisponibles = ['Mecánico General'];

        // Validar los datos del mecánico
        $validated = $request->validate([
            'nombre' => 'required|string|max:50',
            'apellido' => 'required|string|max:50',
            'cedula' => 'required|string|unique:usuario,cedula|max:10',
            'correo' => 'required|string|email|max:100|unique:usuario,correo',
            'password' => 'required|string|min:8|confirmed',
            'telefono' => 'required|string|max:20',
            'direccion_domicilio' => 'required|string|max:100',
            'especialidad' => 'required|string|max:100|in:' . implode(',', $especialidadesDisponibles),
            'fecha_nacimiento' => 'required|date|before:18 years ago',
            'genero' => 'required|in:masculino,femenino,otro',
        ], [
            'fecha_nacimiento.before' => 'El mecánico debe tener al menos 18 años.',
            'especialidad.in' => 'La especialidad seleccionada no es válida.',
            'genero.in' => 'El género seleccionado no es válido.',
        ]);

        // Formatear el teléfono con el prefijo +593
        $telefono = $this->formatTelefonoEcuador($request->telefono);

        // Iniciar una transacción
        DB::transaction(function () use ($validated, $request, $telefono) {
            // Crear el usuario como mecánico
            $usuario = new Usuario($validated);
            $usuario->password = Hash::make($request->password);
            $usuario->telefono = $telefono;
            $usuario->save();

            // Obtener los roles de "mecanico" y "cliente"
            $rolMecanico = Rol::where('nombre', 'mecanico')->first();
            $rolCliente = Rol::where('nombre', 'cliente')->first();

            if (!$rolMecanico || !$rolCliente) {
                throw new \Exception("Roles 'mecanico' o 'cliente' no encontrados.");
            }

            // Asignar los roles al usuario
            $usuario->roles()->attach([$rolMecanico->id_rol, $rolCliente->id_rol]);
        });

        return response()->json(['message' => 'Mecánico creado con éxito y rol cliente asignado.'], 201);
    }

    /**
     * Actualizar un mecánico existente.
     */
    public function update(Request $request, $id)
    {
        // Buscar el usuario con rol de mecánico por su cédula
        $mecanico = Usuario::where('cedula', $id)
            ->whereHas('roles', function ($query) {
                $query->where('nombre', 'mecanico');
            })->firstOrFail();

        // Definir especialidades permitidas
        $especialidadesDisponibles = ['Mecánico General'];

        // Validar los datos del mecánico
        $validated = $request->validate([
            'nombre' => 'required|string|max:50',
            'apellido' => 'required|string|max:50',
            // Para la validación única se debe especificar la columna PK ('cedula')
            'cedula' => 'required|string|max:10|unique:usuario,cedula,' . $id . ',cedula',
            'correo' => 'required|string|email|max:100|unique:usuario,correo,' . $id . ',cedula',
            'telefono' => 'required|string|max:20',
            'direccion_domicilio' => 'required|string|max:100',
            'especialidad' => 'required|string|max:100|in:' . implode(',', $especialidadesDisponibles),
        ], [
            'especialidad.in' => 'La especialidad seleccionada no es válida.',
        ]);

        // Formatear el teléfono con el prefijo +593
        $telefono = $this->formatTelefonoEcuador($request->telefono);

        // Actualizar los datos del mecánico
        $mecanico->fill($validated);
        $mecanico->telefono = $telefono;

        if ($request->has('password')) {
            $mecanico->password = Hash::make($request->password);
        }

        $mecanico->save();

        return response()->json(['message' => 'Mecánico actualizado con éxito'], 200);
    }

    /**
     * Eliminar (borrado lógico) un mecánico.
     */
    public function destroy($id)
    {
        // Buscar el usuario con rol de mecánico por su cédula
        $mecanico = Usuario::where('cedula', $id)
            ->whereHas('roles', function ($query) {
                $query->where('nombre', 'mecanico');
            })->firstOrFail();

        // Eliminar el mecánico (borrado lógico)
        $mecanico->delete();

        return response()->json(['message' => 'Mecánico eliminado con éxito'], 200);
    }

    /**
     * Formatear número de teléfono con el prefijo +593.
     */
    private function formatTelefonoEcuador($telefono)
    {
        return str_starts_with($telefono, '+593') ? $telefono : '+593' . ltrim($telefono, '0');
    }
}