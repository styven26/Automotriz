<?php

namespace App\Http\Controllers;

use App\Models\OrdenServicio;
use App\Models\DetalleServicio;
use App\Models\Cita;
use Illuminate\Http\Request;
use App\Events\TrabajoActualizado;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OrdenServicioController extends Controller
{
    /**
     * 1) Listar las órdenes asignadas a un mecánico autenticado.
     */
    public function index()
    {
        $mec = Auth::user();
        if (! $mec || ! $mec->tieneRol('mecanico')) {
            return response()->json(['error'=>'Acceso no autorizado'], 403);
        }

        $ordenes = OrdenServicio::with([
                'cita.cliente',
                'vehiculo',
                'detallesServicios.servicio'
            ])
            ->whereHas('cita', fn($q) => $q->where('cedula_mecanico', $mec->cedula))
            ->get();

        return response()->json($ordenes, 200);
    }

    /**
     * 2) Listar sólo las órdenes con cita en estado "confirmada" o "diagnosticado".
     */
    public function listarOrdenesConfirmadas()
    {
        $mec = Auth::user();
        if (! $mec || ! $mec->tieneRol('mecanico')) {
            return response()->json(['error'=>'Acceso no autorizado'], 403);
        }

        $ordenes = OrdenServicio::with([
                'cita.cliente',
                'vehiculo',
                'detallesServicios.servicio'
            ])
            ->whereHas('cita', function($q) use($mec) {
                $q->where('cedula_mecanico', $mec->cedula)
                ->whereHas('estado', function($q2) {
                    $q2->whereIn('nombre_estado', ['Confirmada','Diagnosticado']);
                });
            })
            ->get();

        return response()->json($ordenes, 200);
    }

    /**
     * 3) Actualizar el progreso de los detalles de servicio.
     *    Recibe: { progresos: [ { id_detalle, progreso } ] }
     */
    public function actualizarProgreso(Request $request, $idOrden)
    {
        // 1) Validación
        $v = $request->validate([
            'progresos'              => 'required|array',
            'progresos.*.id_detalle' => 'required|exists:detalle_servicio,id_detalle',
            'progresos.*.progreso'   => 'required|integer|min:0|max:100',
        ]);

        // 2) Carga la orden con cita y detalles
        $orden = OrdenServicio::with(['detallesServicios', 'cita.estado'])->findOrFail($idOrden);

        // 3) Si la cita ya está cancelada, marcamos fin y salimos
        if ($orden->cita->estado->nombre_estado === 'Cancelada') {
            // 3.a) Cerramos la orden de servicio
            $orden->update([
                'fecha_fin' => now()->toDateString(),
            ]);

            // 3.b) Marcamos fecha/hora de fin y estado en la cita
            $idCancelada = EstadoCita::where('nombre_estado', 'Cancelada')->value('id_estado');
            $orden->cita->update([
                'id_estado' => $idCancelada,
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
            ]);

            Log::info("Orden {$orden->id_orden} y cita canceladas automáticamente");
            return response()->json([
                'message' => 'La cita está cancelada. Orden y cita finalizadas.'
            ], 200);
        }

        // 4) Actualizar cada detalle de servicio
        foreach ($v['progresos'] as $p) {
            DetalleServicio::where('id_detalle', $p['id_detalle'])
                ->update(['progreso' => $p['progreso']]);
        }

        // 5) Recalcular progreso global
        $orden->load('detallesServicios');
        $progresos = $orden->detallesServicios->pluck('progreso');

        $todos100  = $progresos->every(fn($x) => $x === 100);
        $algunMayor= $progresos->contains(fn($x) => $x > 0);

        // 6) Obtención de IDs de estado
        $idAtendida   = EstadoCita::where('nombre_estado', 'Atendida')->value('id_estado');
        $idEnProceso  = EstadoCita::where('nombre_estado', 'En Proceso')->value('id_estado');
        $idPendiente  = EstadoCita::where('nombre_estado', 'Pendiente')->value('id_estado');

        // 7) Actualizar fechas y estado según progreso
        if ($todos100) {
            // 7.a) Cerramos orden y cita
            $orden->update(['fecha_fin' => now()->toDateString()]);

            $orden->cita->update([
                'id_estado' => $idAtendida,
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
            ]);

            // 7.b) Opcional: enviar correo de completado
            $this->enviarCorreoOrdenCompletada($orden);
        }
        elseif ($algunMayor) {
            // 7.c) En proceso
            $orden->cita->update(['id_estado' => $idEnProceso]);
        }
        else {
            // 7.d) Sigue pendiente
            $orden->cita->update(['id_estado' => $idPendiente]);
        }

        return response()->json([
            'message' => 'Progresos actualizados correctamente.'
        ], 200);
    }

    /**
     * 4) Completar la orden (requiere fecha_fin y hora_fin por parte del mecánico).
     */
    public function completarOrden(Request $request, $idOrden)
    {
        $orden = OrdenServicio::with('detallesServicios','cita')->findOrFail($idOrden);

        // validar que todos los detalles estén 100%
        $progs = $orden->detallesServicios->pluck('progreso');
        if (! $progs->every(fn($x)=> $x==100)) {
            return response()->json(['error'=>'No todos los servicios al 100%'],400);
        }
        // autorizar mecánico
        if ($orden->cita->cedula_mecanico !== Auth::id()) {
            return response()->json(['error'=>'No autorizado'],403);
        }

        $v = $request->validate([
            'fecha_fin'=>'required|date_format:Y-m-d',
            'hora_fin' =>'required|date_format:H:i'
        ]);

        $inicio = Carbon::parse("{$orden->cita->fecha} {$orden->cita->hora}");
        $fin    = Carbon::parse("{$v['fecha_fin']} {$v['hora_fin']}");

        if ($fin->lte($inicio)) {
            return response()->json(['error'=>'Finalización debe ser posterior al inicio'],422);
        }
        $hfin = $v['hora_fin'];
        if ($hfin < '07:00' || $hfin > '15:00') {
            return response()->json(['error'=>'Hora de fin fuera de 07:00–15:00'],422);
        }
        if (in_array($fin->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
            return response()->json(['error'=>'No puede terminar en fin de semana'],422);
        }

        // actualizar cita
        $orden->cita->update([
            'fecha_fin'=> $v['fecha_fin'],
            'hora_fin' => $v['hora_fin'],
            'estado'   => 'atendida'
        ]);
        // actualizar orden
        $orden->update(['fecha_fin'=> $fin->toDateTimeString()]);

        // correo
        $this->enviarCorreoOrdenCompletada($orden);

        return response()->json([
            'message'=>'Orden y cita finalizadas correctamente',
            'fecha_fin'=>$v['fecha_fin'],
            'hora_fin' =>$v['hora_fin']
        ],200);
    }

    /**
     * 5) Finalizar automáticamente (sin input) cuando el mecánico lo indique.
     */
    public function finalizarOrdenAutomatico(Request $request, $idOrden)
    {
        $orden = OrdenServicio::with('detallesServicios','cita')->findOrFail($idOrden);

        // autorizar
        if ($orden->cita->cedula_mecanico !== Auth::id()) {
            return response()->json(['error'=>'No autorizado'],403);
        }

        $now = Carbon::now();
        $inicio = Carbon::parse("{$orden->cita->fecha} {$orden->cita->hora}");
        if ($now->lte($inicio)) {
            return response()->json(['error'=>'Aún no ha iniciado'],422);
        }

        $hf = $now->format('H:i');
        if ($hf < '07:00' || $hf > '15:00') {
            return response()->json(['error'=>"Hora automática {$hf} fuera de 07–15"],422);
        }
        if (in_array($now->dayOfWeek,[Carbon::SATURDAY,Carbon::SUNDAY])) {
            return response()->json(['error'=>'No puede finalizar en fin de semana'],422);
        }

        // forzar 100% en todos los detalles
        DetalleServicio::where('id_orden',$idOrden)
            ->update(['progreso'=>100]);

        // actualizar cita
        $orden->cita->update([
            'fecha_fin'=> $now->toDateString(),
            'hora_fin' => $now->toTimeString(),
            'estado'   => 'atendida'
        ]);

        // actualizar orden
        $orden->update(['fecha_fin'=>$now->toDateTimeString()]);

        // correo
        $this->enviarCorreoOrdenCompletada($orden);

        return response()->json(['message'=>'Orden finalizada automáticamente'],200);
    }

    /**
     * 6) Mostrar una sola orden.
     */
    public function show($idOrden)
    {
        $orden = OrdenServicio::with([
            'cita.cliente',
            'vehiculo',
            'detallesServicios.servicio'
        ])->findOrFail($idOrden);

        return response()->json($orden,200);
    }

    /**
     * 7) Actualizar sólo las descripciones de detalle_servicio.
     *    Recibe: { descripciones: [ { id_detalle, descripcion } ] }
     */
    public function actualizarDescripcion(Request $request, $idOrden)
    {
        // 1) Validación
        $v = $request->validate([
            'descripciones'               => 'required|array',
            'descripciones.*.id_detalle'  => 'required|exists:detalle_servicio,id_detalle',
            'descripciones.*.descripcion' => 'required|string|max:1000',
        ]);

        // 2) Actualizamos cada DetalleServicio
        foreach ($v['descripciones'] as $d) {
            DetalleServicio::where('id_detalle', $d['id_detalle'])
                ->update(['descripcion' => $d['descripcion']]);
            Log::info("Detalle {$d['id_detalle']} descripción actualizada");
        }

        // 3) Recargamos la orden con las relaciones correctas
        $orden = OrdenServicio::with([
            'cita.estado',                      // estado de la cita
            'cita.vehiculo',                    // vehículo relacionado
            'detallesServicios.servicio'        // servicios de cada detalle
        ])->findOrFail($idOrden);

        // 4) Disparamos el evento usando la relación correcta
        event(new TrabajoActualizado($orden));

        // 5) Devolvemos respuesta
        return response()->json([
            'message' => 'Descripciones actualizadas y evento emitido.'
        ], 200);
    }

    /**
     * Auxiliar: envía un correo al cliente cuando la orden queda completada.
     */
    protected function enviarCorreoOrdenCompletada(OrdenServicio $ordenServicio)
    {
        $cliente = $ordenServicio->cita->cliente;
        if (! $cliente->correo) {
            Log::warning("Cliente {$cliente->cedula} sin correo, no se envía email");
            return;
        }

        // Cargamos relaciones necesarias
        $ordenServicio->load([
            'vehiculo',
            'detallesServicios.servicio'
        ]);

        $vehiculo         = $ordenServicio->vehiculo;
        $detalles         = $ordenServicio->detallesServicios;
        $totalServicios   = $ordenServicio->total_servicios;
        $totalRepuestos   = $ordenServicio->total_repuestos;
        $total            = $totalServicios + $totalRepuestos;

        $data = [
            'cliente'          => $cliente,
            'vehiculo'         => $vehiculo,
            'detalles'         => $detalles,
            'totalServicios'   => $totalServicios,
            'totalRepuestos'   => $totalRepuestos,
            'total'            => $total,
        ];

        try {
            Mail::send('emails.orden-completada', $data, function($m) use($cliente) {
                $m->to($cliente->correo)
                ->subject('¡Su servicio está completado! 🚗');
            });
            Log::info("Email de orden completada enviado a {$cliente->correo}");
        } catch (\Throwable $e) {
            Log::error("Error enviando correo: ".$e->getMessage());
        }
    }
}
