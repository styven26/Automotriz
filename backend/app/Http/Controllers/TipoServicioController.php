<?php

namespace App\Http\Controllers;

use App\Models\TipoServicio;
use Illuminate\Http\Request;

class TipoServicioController extends Controller
{
    /** Listar todos los tipos */
    public function index()
    {
        return response()->json(TipoServicio::all());
    }

    /** Crear un nuevo tipo */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:tipo_servicio,nombre',
        ], [
            'nombre.required' => 'Debes enviar un nombre.',
            'nombre.unique'   => 'Ese tipo de servicio ya existe.',
        ]);

        $validated['activo'] = true;
        return response()->json(TipoServicio::create($validated), 201);
    }

    /** Mostrar un tipo específico (Route Model Binding) */
    public function show(TipoServicio $tipoServicio)
    {
        return response()->json($tipoServicio);
    }

    /** Actualizar un tipo (binding) */
    public function update(Request $request, TipoServicio $tipoServicio)
    {
        $validated = $request->validate([
            // Asegúrate de usar el nombre real de la PK en la regla unique
            'nombre' => "required|string|max:100|unique:tipo_servicio,nombre,{$tipoServicio->id_tipo},id_tipo",
            'activo' => 'sometimes|boolean',
        ], [
            'nombre.required' => 'Debes enviar un nombre.',
            'nombre.unique'   => 'Ese tipo de servicio ya existe.',
        ]);

        $tipoServicio->update($validated);
        return response()->json($tipoServicio);
    }

    /** Eliminar un tipo (binding) */
    public function destroy(TipoServicio $tipoServicio)
    {
        $tipoServicio->activo = false;
        $tipoServicio->save();

        return response()->json(['message' => 'Tipo de servicio desactivado'], 200);
    }

    /** Verificar si un nombre ya existe */
    public function verificarNombreExiste($nombre)
    {
        $existe = TipoServicio::where('nombre', $nombre)->exists();
        return response()->json($existe);
    }

    /** Reactivar un tipo */
    public function reactivar(TipoServicio $tipoServicio)
    {
        $tipoServicio->activo = true;
        $tipoServicio->save();

        return response()->json(['message' => 'Tipo de servicio reactivado'], 200);
    }
}
