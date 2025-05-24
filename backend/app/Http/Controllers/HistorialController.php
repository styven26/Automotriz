<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; 
use App\Models\OrdenServicio;

class HistorialController extends Controller
{
    /**
     * Obtener el historial de servicios del cliente autenticado.
     */
    public function index()
    {
        $cliente = auth()->user();

        if (! $cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        // 1) Tomo todas las órdenes cuya cita sea de este cliente y esté "Atendida"
        $ordenes = OrdenServicio::whereHas('cita', function($q) use($cliente) {
                $q->where('cedula_cliente', $cliente->cedula)
                  ->whereHas('estado', fn($q2) =>
                      $q2->where('nombre_estado', 'Atendida')
                  );
            })
            ->with([
                'cita:id_cita,fecha,fecha_fin',
                'detallesServicios.servicio:id_servicio,nombre,precio'
            ])
            ->get();

        // 2) Convierto cada detalle en un registro plano de historial
        $historial = $ordenes->flatMap(function($orden) {
            return $orden->detallesServicios->map(function($detalle) use($orden) {
                return [
                    'tipo_servicio' => $detalle->servicio->nombre,
                    'costo'         => $detalle->servicio->precio,
                    'fecha'         => $orden->cita->fecha_fin ?? $orden->cita->fecha,
                ];
            });
        });

        return response()->json($historial, 200);
    }
}