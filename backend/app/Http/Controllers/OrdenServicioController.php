<?php

namespace App\Http\Controllers;

use App\Models\OrdenServicio;
use App\Models\DetalleServicio;
use App\Models\DetalleRepuesto;
use App\Models\EstadoCita;
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
     * 2) Listar sólo las órdenes con cita en estado
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
                'detallesServicios.servicio',
                'detallesRepuestos.repuesto'
            ])
            ->whereHas('cita', function($q) use($mec) {
                $q->where('cedula_mecanico', $mec->cedula)
                ->whereHas('estado', function($q2) {
                    $q2->whereIn('nombre_estado', ['Pendiente','Confirmada','En Proceso','Diagnosticado']);
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
        // 1) Validación de inputs
        $v = $request->validate([
            'progresos'              => 'required|array',
            'progresos.*.id_detalle' => 'required|exists:detalle_servicio,id_detalle',
            'progresos.*.progreso'   => 'required|integer|min:0|max:100',
        ]);

        // 2) Carga la orden con sus detalles y la cita con estado
        $orden = OrdenServicio::with(['detallesServicios', 'cita.estado'])->findOrFail($idOrden);

        // 3) Si la cita ya está cancelada, finalizamos rápido
        if ($orden->cita->estado->nombre_estado === 'Cancelada') {
            $orden->update(['fecha_fin' => now()->toDateString()]);

            $idCancelada = EstadoCita::where('nombre_estado', 'Cancelada')->value('id_estado');
            $orden->cita->update([
                'id_estado' => $idCancelada,
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
                'activo'    => false,
            ]);

            Log::info("Orden {$orden->id_orden} y cita canceladas automáticamente");
            return response()->json(['message' => 'La cita está cancelada. Orden y cita finalizadas.'], 200);
        }

        // 4) Actualizar cada detalle de servicio
        foreach ($v['progresos'] as $p) {
            DetalleServicio::where('id_detalle', $p['id_detalle'])
                ->update(['progreso' => $p['progreso']]);
        }

        // 5) Recalcular progreso global de la orden
        $orden->load('detallesServicios');
        $progresos = $orden->detallesServicios->pluck('progreso');

        $todos100  = $progresos->every(fn($x) => $x === 100);
        $algunMayor= $progresos->contains(fn($x) => $x > 0);

        // 6) IDs de estado para actualizar la cita
        $idAtendida  = EstadoCita::where('nombre_estado', 'Atendida')->value('id_estado');
        $idEnProceso = EstadoCita::where('nombre_estado', 'En Proceso')->value('id_estado');
        $idConfirmada = EstadoCita::where('nombre_estado', 'Confirmada')->value('id_estado');

        // 7) Actualizar cita según el progreso
        if ($todos100) {
            // 7.a) Cerramos orden
            $orden->update(['fecha_fin' => now()->toDateString()]);

            // 7.b) Marcamos la cita como atendida y desactivamos
            $orden->cita->update([
                'id_estado' => $idAtendida,
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
                'activo'    => false,
            ]);

            // 7.c) Enviar notificación por correo
            $this->enviarCorreoOrdenCompletada($orden);
        } elseif ($algunMayor) {
            // En proceso
            $orden->cita->update(['id_estado' => $idEnProceso]);
        } else {
            // Confirmada
            $orden->cita->update(['id_estado' => $idConfirmada]);
        }

        return response()->json(['message' => 'Progresos actualizados correctamente.'], 200);
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
        $orden = OrdenServicio::with(['detallesServicios', 'cita.estado'])->findOrFail($idOrden);

        // 1) Autorizar mecánico
        if ($orden->cita->cedula_mecanico !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // 2) Validar tiempos
        $now    = Carbon::now();
        $inicio = Carbon::parse("{$orden->cita->fecha} {$orden->cita->hora}");
        if ($now->lte($inicio)) {
            return response()->json(['error' => 'Aún no ha iniciado'], 422);
        }
        $hf = $now->format('H:i');
        if ($hf < '07:00' || $hf > '15:00') {
            return response()->json(['error' => "Hora automática {$hf} fuera de 07–15"], 422);
        }
        if (in_array($now->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
            return response()->json(['error' => 'No puede finalizar en fin de semana'], 422);
        }

        // 3) Forzar 100% en todos los detalles
        DetalleServicio::where('id_orden', $idOrden)->update(['progreso' => 100]);

        // 4) Obtener ID de estado "Atendida"
        $idAtendida = EstadoCita::where('nombre_estado', 'Atendida')->value('id_estado');

        // 5) Actualizar cita: fecha, hora, estado y activo=false
        $orden->cita->update([
            'id_estado' => $idAtendida,
            'fecha_fin' => $now->toDateString(),
            'hora_fin'  => $now->toTimeString(),
            'activo'    => false,
        ]);

        // 6) Actualizar orden con fecha fin
        $orden->update(['fecha_fin' => $now->toDateTimeString()]);

        // 7) Envío de correo
        $this->enviarCorreoOrdenCompletada($orden);

        return response()->json(['message' => 'Orden finalizada automáticamente y cita desactivada'], 200);
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
            'detallesServicios.servicio',
            'detallesRepuestos.repuesto'
        ]);

        $vehiculo         = $ordenServicio->vehiculo;
        $detalles         = $ordenServicio->detallesServicios;
        $repuestos       = $ordenServicio->detallesRepuestos;
        $totalServicios   = $ordenServicio->total_servicios;
        $totalRepuestos   = $ordenServicio->total_repuestos;
        $total            = $totalServicios + $totalRepuestos;

        $data = [
            'cliente'          => $cliente,
            'vehiculo'         => $vehiculo,
            'detalles'         => $detalles,
            'repuestos'       => $repuestos,
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