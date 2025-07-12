<?php

namespace App\Http\Controllers;

use App\Models\Repuesto;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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

    /**
     * Generar un PDF con la lista de repuestos.
     */
    public function descargarInventarioActual(Request $request)
    {
        try {
            // Autenticación
            $vendedor = Auth::user();

            if (!$vendedor || !$vendedor->hasRole('vendedor')) {
                \Log::warning("Acceso no autorizado al reporte de inventario.");
                return response()->json(['error' => 'No autorizado.'], 403);
            }

            // Obtener todos los repuestos activos (puede estar vacío)
            $repuestos = Repuesto::orderBy('nombre')->get();

            // Log informativo si está vacío
            if ($repuestos->isEmpty()) {
                \Log::info("Generando PDF sin repuestos: inventario vacío.");
            }

            // Generar PDF con la vista, pasando también el vendedor
            $pdf = Pdf::loadView('reportes.inventario', [
                'repuestos' => $repuestos,
                'vendedor' => $vendedor
            ]);

            return $pdf->download('reportes-inventario-actual.pdf');

        } catch (\Exception $e) {
            \Log::error('Error al generar el reporte de inventario: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error interno al generar el reporte.'], 500);
        }
    }
}
