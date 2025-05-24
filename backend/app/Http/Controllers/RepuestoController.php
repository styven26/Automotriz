<?php

namespace App\Http\Controllers;

use App\Models\Repuesto;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class RepuestoController extends Controller
{
    /**
     * Listar todos los repuestos.
     */
    public function index()
    {
        return response()->json(Repuesto::all());
    }

    /**
     * Mostrar un repuesto específico.
     */
    public function show($id)
    {
        $rep = Repuesto::findOrFail($id);
        return response()->json($rep);
    }

    /**
     * Crear un nuevo repuesto.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'nombre'       => ['required','string','max:50', Rule::unique('repuestos','nombre')],
            'precio_base'  => ['required','numeric','min:0'],
            'iva'          => ['required','integer','between:0,100'],
            'stock'        => ['required','integer','min:0'],
            'stock_minimo' => ['nullable','integer','min:0'],
            'created_at'   => ['nullable','date'],
        ]);

        $data['cedula'] = $user->cedula;
        $rep = new Repuesto($data);
        $rep->save();        // aquí graba tanto created_at manual (si viene) como timestamp
        return response()->json($rep, 201);
    }

    /**
     * Actualizar un repuesto existente.
     */
    public function update(Request $request, $id)
    {
        $rep = Repuesto::findOrFail($id);

        $data = $request->validate([
            'cedula'        => ['sometimes','exists:usuario,cedula'],
            'nombre'        => ['sometimes','string','max:50', Rule::unique('repuestos','nombre')->ignore($rep->id_repuesto,'id_repuesto')],
            'precio_base'   => ['sometimes','numeric','min:0'],
            'iva'           => ['sometimes','integer','between:0,100'],
            'stock'         => ['sometimes','integer','min:0'],
            'stock_minimo'  => ['sometimes','integer','min:0'],
        ]);

        $rep->update($data);
        return response()->json($rep);
    }

    /**
     * Eliminar (soft delete) un repuesto.
     */
    public function destroy($id)
    {
        $rep = Repuesto::findOrFail($id);
        $rep->delete();
        return response()->json(['message'=>'Repuesto eliminado.']);
    }
}
