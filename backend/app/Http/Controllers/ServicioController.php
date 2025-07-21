<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use App\Models\TipoServicio;
use Illuminate\Http\Request;

class ServicioController extends Controller
{
    public function index()
    {
        // Incluimos el tipo para no hacer N+1
        $servicios = Servicio::with('tipoServicio')->get(); // sin filtro 'activo'
        return response()->json($servicios);
    }

    public function indexActivos()
    {
        // Solo servicios activos
        $servicios = Servicio::with('tipoServicio')->where('activo', true)->get();
        return response()->json($servicios);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_tipo'       => 'required|exists:tipo_servicio,id_tipo',
            'nombre'        => 'required|string|max:50|unique:servicios,nombre',
            'descripcion'   => 'nullable|string',
            'precio_base'   => 'required|numeric|min:0',
            'iva'           => 'required|integer|min:0',
            'precio'        => 'required|numeric|min:0',
        ]);

        // Campo añadido por defecto
        $validated['activo'] = true;

        $servicio = Servicio::create($validated);

        return response()->json([
            'message'  => 'Servicio creado exitosamente',
            'servicio' => $servicio
        ], 201);
    }

    public function show($id)
    {
        $servicio = Servicio::with('tipoServicio')->findOrFail($id);
        return response()->json($servicio);
    }

    public function update(Request $request, $id)
    {
        $servicio = Servicio::findOrFail($id);

        $validated = $request->validate([
            'id_tipo'       => 'required|exists:tipo_servicio,id_tipo',
            'nombre'        => "required|string|max:50|unique:servicios,nombre,{$id},id_servicio",
            'descripcion'   => 'nullable|string',
            'precio_base'   => 'required|numeric|min:0',
            'iva'           => 'required|integer|min:0',
            'precio'        => 'required|numeric|min:0',
            'activo'        => 'sometimes|boolean',
        ]);

        $servicio->update($validated);

        return response()->json([
            'message'  => 'Servicio actualizado exitosamente',
            'servicio' => $servicio
        ]);
    }

    public function destroy($id)
    {
        $servicio = Servicio::findOrFail($id);
        $servicio->activo = false;
        $servicio->save();

        return response()->json([
            'message' => 'Servicio desactivado exitosamente'
        ]);
    }

    public function reactivar($id)
    {
        $servicio = Servicio::findOrFail($id);
        $servicio->activo = true;
        $servicio->save();

        return response()->json([
            'message' => 'Servicio reactivado exitosamente',
            'servicio' => $servicio
        ]);
    }

    public function verificarNombreExiste($nombre)
    {
        $existe = Servicio::where('nombre', $nombre)->exists();
        return response()->json($existe);
    }
}
