<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MecanicoController extends Controller
{
    /** Ruta al JSON de opciones */
    protected $optionsPath = 'vehiculo_options.json';

    /**
     * Lee y devuelve el contenido del JSON de opciones.
     *
     * @return array  ['transmissions'=>…, 'fuel_types'=>…, 'especialidades'=>…]
     */
    private function loadOptions(): array
    {
        if (! Storage::exists($this->optionsPath)) {
            Storage::put($this->optionsPath, json_encode([
                'transmissions'   => [],
                'fuel_types'      => [],
                'especialidades'  => [],
            ], JSON_PRETTY_PRINT));
        }

        return json_decode(Storage::get($this->optionsPath), true);
    }

    /**
     * Listar todos los mecánicos.
     */
    public function index(Request $request)
    {
        $admin = auth()->guard('admin')->user();
        if (! $admin) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $mecanicos = Usuario::whereHas('roles', fn($q) =>
            $q->where('nombre', 'mecanico')
        )->get();

        return response()->json($mecanicos, 200);
    }

    /**
     * Crear un nuevo mecánico.
     */
    public function store(Request $request)
    {
        // 1) Obtiene las especialidades válidas del JSON
        $opts = $this->loadOptions();
        $validEspecialidades = array_column($opts['especialidades'], 'name');

        // 2) Validación
        $validated = $request->validate([
            'nombre'              => 'required|string|max:50',
            'apellido'            => 'required|string|max:50',
            'cedula'              => 'required|string|max:10|unique:usuario,cedula',
            'correo'              => 'required|email|max:100|unique:usuario,correo',
            'password'            => 'required|string|min:8|confirmed',
            'telefono'            => 'required|string|max:20',
            'direccion_domicilio' => 'required|string|max:100',
            'especialidad'        => 'required|string|in:' . implode(',', $validEspecialidades),
            'fecha_nacimiento'    => 'required|date|before:18 years ago',
            'genero'              => 'required|in:masculino,femenino,otro',
        ], [
            'fecha_nacimiento.before' => 'El mecánico debe tener al menos 18 años.',
            'especialidad.in'         => 'La especialidad seleccionada no es válida.',
            'genero.in'               => 'El género seleccionado no es válido.',
        ]);

        // 3) Formatea el teléfono
        $telefono = $this->formatTelefonoEcuador($validated['telefono']);

        // 4) Transacción para crear el usuario y asignar roles
        DB::transaction(function() use ($validated, $telefono, $request) {
            $usuario = new Usuario($validated);
            $usuario->password = Hash::make($request->password);
            $usuario->telefono = $telefono;
            $usuario->save();

            $rolM = Rol::where('nombre', 'mecanico')->firstOrFail();
            $rolC = Rol::where('nombre', 'cliente')->firstOrFail();

            $usuario->roles()->attach([$rolM->id_rol, $rolC->id_rol]);
        });

        return response()->json(['message' => 'Mecánico creado con éxito.'], 201);
    }

    /**
     * Actualizar un mecánico existente.
     */
    public function update(Request $request, $id)
    {
        $mecanico = Usuario::where('cedula', $id)
            ->whereHas('roles', fn($q) => $q->where('nombre', 'mecanico'))
            ->firstOrFail();

        $opts = $this->loadOptions();
        $validEspecialidades = array_column($opts['especialidades'], 'name');

        $validated = $request->validate([
            'nombre'              => 'required|string|max:50',
            'apellido'            => 'required|string|max:50',
            'cedula'              => "required|string|max:10|unique:usuario,cedula,{$id},cedula",
            'correo'              => "required|email|max:100|unique:usuario,correo,{$id},cedula",
            'telefono'            => 'required|string|max:20',
            'direccion_domicilio' => 'required|string|max:100',
            'fecha_nacimiento'    => 'required|date|before:18 years ago',
            'especialidad'        => 'required|string|in:' . implode(',', $validEspecialidades),
        ], [
            'fecha_nacimiento.before' => 'El mecánico debe tener al menos 18 años.',
            'especialidad.in'         => 'La especialidad seleccionada no es válida.',
        ]);

        $telefono = $this->formatTelefonoEcuador($validated['telefono']);

        $mecanico->fill($validated);
        $mecanico->telefono = $telefono;

        if ($request->filled('password')) {
            $mecanico->password = Hash::make($request->password);
        }

        $mecanico->save();

        return response()->json(['message' => 'Mecánico actualizado con éxito'], 200);
    }

    /**
     * Borrado lógico de un mecánico.
     */
    public function destroy($id)
    {
        $mecanico = Usuario::where('cedula', $id)
            ->whereHas('roles', fn($q) => $q->where('nombre', 'mecanico'))
            ->firstOrFail();

        $mecanico->delete();

        return response()->json(['message' => 'Mecánico eliminado con éxito'], 200);
    }

    /**
     * Formatea un número de teléfono a +593XXXXXXXXX.
     */
    private function formatTelefonoEcuador(string $telefono): string
    {
        return str_starts_with($telefono, '+593')
            ? $telefono
            : '+593' . ltrim($telefono, '0');
    }
}
