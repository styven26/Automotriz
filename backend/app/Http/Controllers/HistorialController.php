<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\OrdenServicio;
use Carbon\Carbon;

class HistorialController extends Controller
{
    public function index()
    {
        $cliente = Auth::guard('cliente')->user();
        if (! $cliente) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $ordenes = OrdenServicio::whereHas('cita', function($q) use($cliente) {
                $q->where('cedula_cliente', $cliente->cedula)
                  ->whereHas('estado', fn($q2)=> $q2->where('nombre_estado','Atendida'));
            })
            ->with([
                'cita:id_cita,fecha,hora,fecha_fin,hora_fin',
                'vehiculo:id_vehiculo,marca,modelo',
                'detallesServicios.servicio:id_servicio,nombre',
            ])
            ->get()
            ->map(function(OrdenServicio $orden) {
                $c    = $orden->cita;
                $inicio = Carbon::parse("{$c->fecha} {$c->hora}")
                                ->format('d/m/Y H:i');
                $fin    = $c->fecha_fin && $c->hora_fin
                          ? Carbon::parse("{$c->fecha_fin} {$c->hora_fin}")
                                   ->format('d/m/Y H:i')
                          : '—';

                // Servicios: tomamos precio_unitario y subtotal ya guardados
                $servicios = $orden->detallesServicios->map(fn($ds) => [
                    'nombre'          => $ds->servicio->nombre,
                    'cantidad'        => $ds->cantidad,
                    'precio_unitario' => number_format($ds->precio_unitario, 2, '.', ','),
                    'subtotal'        => number_format($ds->subtotal,        2, '.', ','),
                ])->toArray();

                // Total servicios: suma de subtotales
                $totalServicios = collect($servicios)
                                  ->sum(fn($s) => (float) str_replace(',','',$s['subtotal']));

                // Repuestos igual que antes...
                $repuestos = $orden->detallesRepuestos->map(fn($dr)=> [
                    'nombre'    => $dr->repuesto->nombre,
                    'cantidad'  => $dr->cantidad,
                    'subtotal'  => number_format($dr->subtotal, 2, '.', ','),
                ])->toArray();
                $totalRepuestos = collect($repuestos)
                                  ->sum(fn($r)=> (float) str_replace(',','',$r['subtotal']));

                return [
                    'cita_id'          => $orden->id_cita,
                    'inicio'           => $inicio,
                    'fin'              => $fin,
                    'vehiculo'         => "{$orden->vehiculo->marca} {$orden->vehiculo->modelo}",
                    'servicios'        => $servicios,
                    'repuestos'        => $repuestos,
                    'total_servicios'  => round($totalServicios,  2),
                    'total_repuestos'  => round($totalRepuestos, 2),
                    'total_general'    => round($totalServicios + $totalRepuestos, 2),
                ];
            });

        return response()->json(['ordenes' => $ordenes]);
    }
}
