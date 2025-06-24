<?php

namespace App\Http\Controllers;

use App\Models\DetalleRepuesto;
use App\Models\Repuesto;
use App\Models\OrdenServicio;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class DetalleRepuestoController extends Controller
{
    /**
     * Listar todos los detalles de repuesto.
     */
    public function index()
    {
        return response()->json(DetalleRepuesto::with('repuesto','orden')->get());
    }

    /**
     * Mostrar un detalle específico.
     */
    public function show($id)
    {
        $det = DetalleRepuesto::with('repuesto','orden')->findOrFail($id);
        return response()->json($det);
    }

    /**
     * Crear un nuevo detalle de repuesto y descontar stock.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'id_repuesto' => ['required','exists:repuestos,id_repuesto'],
            'id_orden'    => ['required','exists:orden_servicio,id_orden'],
            'cantidad'    => ['required','integer','min:1'],
            'precio'      => ['required','numeric','min:0'],
        ]);

        return DB::transaction(function() use($data) {
            // 1) Verificar & descontar stock…
            $rep = Repuesto::findOrFail($data['id_repuesto']);
            if ($rep->stock < $data['cantidad']) {
                return response()->json(['error'=>'Stock insuficiente.'], 422);
            }
            $rep->decrement('stock', $data['cantidad']);

            // 2) Crear detalle
            $data['subtotal'] = round($data['cantidad'] * $data['precio'], 2);
            $det = DetalleRepuesto::create($data);

            // 3) **Recalcular total_repuestos en la orden padre**
            $orden = OrdenServicio::findOrFail($data['id_orden']);
            $nuevoTotal = $orden
                ->detallesRepuestos()
                ->sum('subtotal');
            $orden->update(['total_repuestos' => $nuevoTotal]);

            return response()->json($det, 201);
        });
    }

    /**
     * Actualizar un detalle de repuesto.
     * (Aquí no ajustamos stock; si necesitas soporte, hazlo manualmente.)
     */
    public function update(Request $request, $id)
    {
        $det = DetalleRepuesto::findOrFail($id);

        $data = $request->validate([
            'cantidad' => ['sometimes','integer','min:1'],
            'precio'   => ['sometimes','numeric','min:0'],
        ]);

        // 1) Recalcular subtotal
        if (isset($data['cantidad']) || isset($data['precio'])) {
            $cantidad = $data['cantidad'] ?? $det->cantidad;
            $precio   = $data['precio']   ?? $det->precio;
            $data['subtotal'] = round($cantidad * $precio, 2);
        }

        // 2) Actualizar el detalle
        $det->update($data);

        // 3) Recalcular el total de repuestos en la orden padre
        $orden = OrdenServicio::findOrFail($det->id_orden);
        $nuevoTotal = $orden->detallesRepuestos()->sum('subtotal');
        $orden->update(['total_repuestos' => $nuevoTotal]);

        return response()->json($det);
    }

    /**
     * Eliminar (soft delete) un detalle y restaurar stock.
     */
    public function destroy($id)
    {
        $det = DetalleRepuesto::findOrFail($id);

        return DB::transaction(function() use($det) {
            // Restaurar stock
            $rep = Repuesto::findOrFail($det->id_repuesto);
            $rep->increment('stock', $det->cantidad);

            // Soft-delete
            $det->delete();

            // **Recalcular total_repuestos en la orden padre**
            $orden = OrdenServicio::findOrFail($det->id_orden);
            $nuevoTotal = $orden
                ->detallesRepuestos()
                ->sum('subtotal');
            $orden->update(['total_repuestos' => $nuevoTotal]);

            return response()->json(['message'=>'Detalle de repuesto eliminado y stock restaurado.']);
        });
    }
}
