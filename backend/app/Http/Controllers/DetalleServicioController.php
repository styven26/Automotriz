<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Vehiculo;
use App\Models\OrdenServicio;
use App\Models\DetalleServicio;

class DetalleServicioController extends Controller
{
    // Listar todos los detalles de servicio
    public function index()
    {
        // Si quieres con relaciones:
        $detalles = DetalleServicio::with(['orden', 'servicio'])->get();
        return response()->json($detalles, 200);
    }

    // Crear un nuevo detalle de servicio
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_orden' => 'required|exists:orden_servicio,id_orden',
            'id_servicio' => 'required|exists:servicios,id_servicio',
            'descripcion' => 'nullable|string',
            'progreso' => 'nullable|integer|min:0|max:100',
        ]);

        $detalle = DetalleServicio::create($validated);
        return response()->json($detalle, 201);
    }

    // Mostrar un detalle por id
    public function show($id)
    {
        $detalle = DetalleServicio::with(['orden', 'servicio'])->findOrFail($id);
        return response()->json($detalle, 200);
    }

    // Actualizar un detalle
    public function update(Request $request, $id)
    {
        $detalle = DetalleServicio::findOrFail($id);

        $validated = $request->validate([
            'id_orden' => 'sometimes|exists:orden_servicio,id_orden',
            'id_servicio' => 'sometimes|exists:servicios,id_servicio',
            'descripcion' => 'nullable|string',
            'progreso' => 'nullable|integer|min:0|max:100',
        ]);

        $detalle->update($validated);
        return response()->json($detalle, 200);
    }

    // Eliminar un detalle
    public function destroy($id)
    {
        $detalle = DetalleServicio::findOrFail($id);
        $detalle->delete();
        return response()->json(['message' => 'Detalle de servicio eliminado'], 200);
    }

    // Monitoreo de vehículos del cliente
    public function monitoreosCliente(Request $request)
    {
        $cliente = Auth::user();
        $vehiculos = Vehiculo::where('cedula', $cliente->cedula)->get();
        $monitoreos = [];

        foreach ($vehiculos as $v) {
            $orden = OrdenServicio::where('id_vehiculo', $v->id_vehiculo)
                       ->orderByDesc('fecha_inicio')
                       ->first();
            if (! $orden) continue;

            $detalles = DetalleServicio::with('servicio')
                         ->where('id_orden', $orden->id_orden)
                         ->get();

            $servicios = $detalles->map(fn($d) => [
                'nombre'   => $d->servicio->nombre,
                'progreso' => $d->progreso,
            ])->toArray();

            // Lógica sencilla de etapa
            $etapa = 'Diagnóstico';
            if (count($servicios) && collect($servicios)->every(fn($s)=>$s['progreso']>=100)) {
                $etapa = 'Finalización';
            } elseif (collect($servicios)->some(fn($s)=> $s['progreso']>0 && $s['progreso']<100)) {
                $etapa = 'Reparación';
            }

            $monitoreos[] = [
                'id'       => $v->id_vehiculo,
                'vehiculo' => [
                    'marca'  => $v->marca,
                    'modelo' => $v->modelo,
                ],
                'etapa'     => $etapa,
                'servicios' => $servicios,
            ];
        }

        return response()->json($monitoreos, 200);
    }

    /**
     * Devuelve el monitoreo de un solo vehículo por su ID.
     */
    public function monitoreoVehiculo(Request $request, $idVehiculo)
    {
        $v = Vehiculo::findOrFail($idVehiculo);

        $orden = OrdenServicio::where('id_vehiculo', $v->id_vehiculo)
                   ->orderByDesc('fecha_inicio')
                   ->first();

        if (! $orden) {
            return response()->json([], 200);
        }

        $detalles = DetalleServicio::with('servicio')
                     ->where('id_orden', $orden->id_orden)
                     ->get();

        $servicios = $detalles->map(fn($d) => [
            'nombre'   => $d->servicio->nombre,
            'progreso' => $d->progreso,
        ])->toArray();

        $etapa = 'Diagnóstico';
        if (count($servicios) && collect($servicios)->every(fn($s)=>$s['progreso']>=100)) {
            $etapa = 'Finalización';
        } elseif (collect($servicios)->some(fn($s)=> $s['progreso']>0 && $s['progreso']<100)) {
            $etapa = 'Reparación';
        }

        $monitoreo = [
            'id'       => $v->id_vehiculo,
            'vehiculo' => [
                'marca'  => $v->marca,
                'modelo' => $v->modelo,
            ],
            'etapa'     => $etapa,
            'servicios' => $servicios,
        ];

        return response()->json($monitoreo, 200);
    }
}
