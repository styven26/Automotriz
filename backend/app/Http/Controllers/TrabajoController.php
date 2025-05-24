<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Models\OrdenServicio;
use App\Models\Cita;
use Illuminate\Support\Facades\Log;
use App\Models\Servicio;
use App\Events\TrabajoActualizado;
use Carbon\Carbon;

class TrabajoController extends Controller
{
    /**
     * Listar los trabajos asignados a un mecánico autenticado.
     */
    public function index()
    {
        $mecanico = Auth::user();
        if (! $mecanico || ! $mecanico->tieneRol('mecanico')) {
            return response()->json(['error' => 'Acceso no autorizado.'], 403);
        }

        $ordenes = OrdenServicio::whereHas('cita', function($q) use ($mecanico) {
                $q->where('cedula_mecanico', $mecanico->cedula);
            })
            ->with([
                // datos del cliente
                'cita.cliente:cedula,nombre,apellido',
                // datos del vehículo desde la cita
                'cita.vehiculo:id_vehiculo,marca,modelo,numero_placa',
                // detalles de servicio con nombre de servicio
                'detallesServicios.servicio:id_servicio,nombre,precio'
            ])
            ->get();

        return response()->json($ordenes, 200);
    }

    /**
     * Listar las citas confirmadas (o diagnosticadas) para el mecánico.
     */
    public function listarCitasConfirmadas()
    {
        $mecanico = auth()->user();
        if (! $mecanico || ! $mecanico->tieneRol('mecanico')) {
            return response()->json(['error' => 'Acceso no autorizado.'], 403);
        }

        $ordenes = \App\Models\OrdenServicio::whereHas('cita', function($q) use ($mecanico) {
                // Solo citas asignadas a este mecánico
                $q->where('cedula_mecanico', $mecanico->cedula)
                // Y cuyo estado sea "Confirmada" o "Diagnosticado"
                ->whereHas('estado', function($q2) {
                    $q2->whereIn('nombre_estado', ['Confirmada', 'Diagnosticado']);
                });
            })
            ->with([
                // Datos básicos de la cita y el cliente
                'cita.cliente:cedula,nombre,apellido',
                // Vehículo asociado a la cita
                'cita.vehiculo:id_vehiculo,marca,modelo,numero_placa',
                // Detalles de servicio con su nombre
                'detallesServicios.servicio:id_servicio,nombre'
            ])
            ->get();

        return response()->json($ordenes, 200);
    }

    /**
     * Actualizar el progreso de los subtipos asociados al trabajo.
     * - Estado del trabajo:
     *    * 'pendiente': si todos los progresos son 0.
     *    * 'en_proceso': si al menos uno es > 0 pero no todos son 100.
     *    * (La finalización se valida en completarTrabajo).
     * - Etapa del monitoreo:
     *    * 'diagnóstico': si todos los progresos son ≤ 20.
     *    * 'reparación': si al menos uno es > 20 y no todos son 100.
     */
    public function actualizarProgreso(Request $request, $id)
    {
        // Valida que se reciba un array de progresos
        $validated = $request->validate([
            'progresos' => 'required|array',
            'progresos.*.id_subtipo' => 'required|exists:subtipos_servicios,id',
            'progresos.*.progreso' => 'required|numeric|min:0|max:100',
        ]);

        // Encuentra el trabajo con las relaciones necesarias
        $trabajo = Trabajo::with('cita.subtipos', 'monitoreo')->findOrFail($id);

        // Manejar la lógica si la cita está cancelada
        if ($trabajo->cita->estado === 'cancelada') {
            // Actualiza el estado del trabajo, y registra la fecha y hora de fin
            $trabajo->update([
                'estado'    => 'cancelado',
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
            ]);

            $trabajo->monitoreo()->update(['etapa' => 'cancelado']);

            return response()->json([
                'message' => 'La cita fue cancelada. Trabajo, monitoreo y fecha/hora de fin actualizados a cancelado.'
            ], 200);
        }

        // Itera por los progresos enviados y actualiza cada uno en la tabla pivote
        foreach ($validated['progresos'] as $progreso) {
            $citaSubtipo = $trabajo->cita->subtipos()
                ->wherePivot('id_subtipo', $progreso['id_subtipo'])
                ->first();

            if ($citaSubtipo) {
                $trabajo->cita->subtipos()->updateExistingPivot($progreso['id_subtipo'], [
                    'progreso' => $progreso['progreso'],
                ]);
            }
        }

        // Obtiene todos los subtipos y extrae los progresos desde la tabla pivote
        $subtipos = $trabajo->cita->subtipos()->get();
        $progresos = $subtipos->pluck('pivot.progreso');

        // Determina el estado del trabajo
        $estadoTrabajo = 'pendiente';

        // Si todos los progresos son 100%
        if ($progresos->every(fn($progreso) => $progreso == 100)) {
            $estadoTrabajo = 'completado';
        
            // 1) Actualizar el trabajo
            $trabajo->update([
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
                'estado'    => 'completado',
            ]);
        
            // 2) **Actualizar también la cita**: fecha_fin, hora_fin y estado
            $trabajo->cita->update([
                'fecha_fin' => now()->toDateString(),
                'hora_fin'  => now()->toTimeString(),
                'estado'    => 'Atendida',
            ]);
        
            // 3) Monitoreo a "finalización"
            $monitoreo = $trabajo->monitoreo()->where('id_vehiculo', $trabajo->id_vehiculo)->first();
            if ($monitoreo) {
                $monitoreo->update(['etapa' => 'finalización']);
            }
        
            // 4) Enviar correo al cliente
            $this->enviarCorreoTrabajoCompletado($trabajo);
        }
        
        // Si al menos un progreso es mayor a 0 pero no todos están al 100%
        elseif ($progresos->contains(fn($progreso) => $progreso > 0)) {
            $estadoTrabajo = 'en_proceso';
        }

        // Actualiza el estado del trabajo
        $trabajo->update(['estado' => $estadoTrabajo]);

        // Determina la etapa del monitoreo
        $etapa = 'diagnóstico';
        if ($progresos->contains(fn($progreso) => $progreso > 20) && $progresos->contains(fn($progreso) => $progreso < 100)) {
            $etapa = 'reparación';
        }
        if ($progresos->every(fn($progreso) => $progreso == 100)) {
            $etapa = 'finalización';
        }

        // Actualiza la etapa en la tabla de monitoreo_vehiculos
        $monitoreo = $trabajo->monitoreo()->where('id_vehiculo', $trabajo->id_vehiculo)->first();
        if ($monitoreo) {
            $monitoreo->update(['etapa' => $etapa]);
        }

        return response()->json([
            'message' => 'Progresos, estado del trabajo, monitoreo y fecha/hora de fin actualizados correctamente.'
        ], 200);
    }

    /**
     * Completar el trabajo: se verifica que todos los subtipos estén al 100%.
     * Se requiere que el mecánico envíe la fecha_fin y hora_fin (en formato y rango permitido).
     * Si la validación es exitosa, se actualizan la cita, el trabajo y el monitoreo, y se envía
     * el correo al cliente.
     */
    public function completarTrabajo(Request $request, $id)
    {
        try {
            $trabajo = Trabajo::with('cita.subtipos', 'monitoreo')->findOrFail($id);

            // Verificar que todos los subtipos estén al 100%
            $progresos = $trabajo->cita->subtipos->pluck('pivot.progreso');
            if (!$progresos->every(fn($p) => $p == 100)) {
                return response()->json(['error' => 'No todos los subtipos están al 100%.'], 400);
            }

            if ($trabajo->cita->id_mecanico !== auth()->id()) {
                return response()->json(['error' => 'No estás autorizado para finalizar este trabajo.'], 403);
            }

            $validated = $request->validate([
                'fecha_fin' => 'required|date_format:Y-m-d',
                'hora_fin'  => 'required|date_format:H:i'
            ]);

            $inicioCita = Carbon::createFromFormat('Y-m-d H:i:s', $trabajo->cita->fecha . ' ' . $trabajo->cita->hora);
            $finCita = Carbon::createFromFormat('Y-m-d H:i', $validated['fecha_fin'] . ' ' . $validated['hora_fin']);

            if ($finCita->lte($inicioCita)) {
                return response()->json([
                    'error' => 'La fecha/hora de finalización debe ser posterior a la de inicio.'
                ], 422);
            }

            // Validar que la hora_fin esté entre 07:00 y 15:00
            if ($validated['hora_fin'] < '07:00' || $validated['hora_fin'] > '15:00') {
                return response()->json([
                    'error' => 'La hora de finalización debe estar entre las 07:00 y las 15:00.'
                ], 422);
            }

            // Validar que la fecha de fin no sea sábado ni domingo
            if (in_array($finCita->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
                return response()->json([
                    'error' => 'La cita no puede finalizar en fin de semana (sábado o domingo).'
                ], 422);
            }

            // Actualizar la cita
            $trabajo->cita->update([
                'fecha_fin' => $validated['fecha_fin'],
                'hora_fin'  => $validated['hora_fin'],
                'estado'    => 'atendida',
            ]);

            // Actualizar el trabajo
            $trabajo->update([
                'estado'    => 'completado',
                'fecha_fin' => $finCita->format('Y-m-d H:i:s'),
            ]);

            // Actualizar el monitoreo a "finalización"
            if ($trabajo->monitoreo) {
                $trabajo->monitoreo->update(['etapa' => 'finalización']);
            }

            // Enviar correo de trabajo completado al cliente
            $this->enviarCorreoTrabajoCompletado($trabajo);

            return response()->json([
                'message'   => 'El trabajo y la cita han sido finalizados correctamente.',
                'fecha_fin' => $finCita->format('Y-m-d'),
                'hora_fin'  => $finCita->format('H:i')
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al completar el trabajo: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Ocurrió un error al completar el trabajo.'], 500);
        }
    }

    /**
     * Finalizar la cita (sin afectar progresos del trabajo).
     * Se validan fecha_fin y hora_fin según las reglas establecidas.
     */
    public function finalizarTrabajoAutomatico(Request $request, $id)
    {
        // 1) Buscar el trabajo junto con la cita, sus subtipos y monitoreo
        $trabajo = Trabajo::with('cita.subtipos', 'monitoreo')->findOrFail($id);

        // 2) Validar que el mecánico autenticado sea el asignado a la cita
        if ($trabajo->cita->id_mecanico !== auth()->id()) {
            return response()->json(['error' => 'No estás autorizado para finalizar este trabajo.'], 403);
        }

        // 3) Obtener el momento actual y generar la fecha/hora de fin automáticamente
        $finCita = now();

        // 4) Verificar que la fecha/hora de fin generada sea posterior a la fecha/hora de inicio de la cita
        $inicioCita = Carbon::createFromFormat('Y-m-d H:i:s', $trabajo->cita->fecha . ' ' . $trabajo->cita->hora);
        if ($finCita->lte($inicioCita)) {
            return response()->json([
                'error' => 'La cita aún no ha iniciado; no se puede finalizar.'
            ], 422);
        }

        // 5) Validar que la hora de finalización esté entre las 07:00 y las 15:00
        $horaFin = $finCita->format('H:i');
        if ($horaFin < '07:00' || $horaFin > '15:00') {
            return response()->json([
                'error' => 'La hora de finalización generada automáticamente (' . $horaFin . ') no está entre las 07:00 y las 15:00.'
            ], 422);
        }

        // 6) Validar que la fecha de finalización no sea sábado o domingo
        if (in_array($finCita->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
            return response()->json([
                'error' => 'La cita no puede finalizar en fin de semana (sábado o domingo).'
            ], 422);
        }

        // 7) Forzar todos los subtipos a 100% en la tabla pivote
        foreach ($trabajo->cita->subtipos as $subtipo) {
            $trabajo->cita->subtipos()->updateExistingPivot($subtipo->id, [
                'progreso' => 100,
            ]);
        }

        // 8) Actualizar la cita con la fecha y hora generadas y marcarla como "atendida"
        $trabajo->cita->update([
            'fecha_fin' => $finCita->toDateString(),
            'hora_fin'  => $finCita->toTimeString(),
            'estado'    => 'atendida',
        ]);

        // 9) Actualizar el trabajo marcándolo como "completado" y guardando la fecha/hora completa de finalización
        $trabajo->update([
            'fecha_fin' => $finCita->format('Y-m-d H:i:s'),
            'estado'    => 'completado',
        ]);

        // 10) Actualizar la etapa del monitoreo a "finalización"
        if ($trabajo->monitoreo) {
            $trabajo->monitoreo->update(['etapa' => 'finalización']);
        }

        // 11) Enviar el correo al cliente informándole que el trabajo se ha completado
        $this->enviarCorreoTrabajoCompletado($trabajo);

        return response()->json([
            'message' => 'Trabajo finalizado correctamente, subtipos al 100%, cita atendida y correo enviado al cliente.'
        ], 200);
    }   

    /**
     * Método auxiliar: enviar correo de trabajo completado.
     */
    public function enviarCorreoTrabajoCompletado($trabajo)
    {
        $cliente = $trabajo->cita->cliente;
        $vehiculo = $trabajo->vehiculo;
        $subtipos = $trabajo->cita->subtipos;

        $total = $subtipos->sum('precio');
        if (!$cliente->correo) {
            return response()->json(['message' => 'El cliente no tiene un correo registrado'], 400);
        }

        $data = [
            'cliente' => $cliente,
            'vehiculo' => $vehiculo,
            'subtipos' => $subtipos,
            'total' => $total,
        ];

        try {
            Mail::send('emails.trabajo-completado', $data, function ($message) use ($cliente) {
                $message->to($cliente->correo)
                    ->subject('¡Su trabajo está completo! 🚗');
            });
            return response()->json(['message' => 'Correo enviado al cliente'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al enviar el correo', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $trabajo = Trabajo::with(['cita', 'vehiculo', 'monitoreo'])->findOrFail($id);
        return response()->json($trabajo, 200);
    }

    /**
     * Actualizar la descripción de los subtipos asociados (en la tabla pivote).
     */
    public function actualizarDescripcion(Request $request, $id)
    {
        $validated = $request->validate([
            'descripciones' => 'required|array',
            'descripciones.*.id_subtipo' => 'required|exists:subtipos_servicios,id',
            'descripciones.*.descripcion' => 'required|string|max:255',
        ]);

        $trabajo = Trabajo::with('cita.subtipos')->findOrFail($id);

        foreach ($validated['descripciones'] as $descripcionData) {
            $citaSubtipo = $trabajo->cita->subtipos()->wherePivot('id_subtipo', $descripcionData['id_subtipo'])->first();
            if (!$citaSubtipo) {
                return response()->json([
                    'error' => "El subtipo de servicio con ID {$descripcionData['id_subtipo']} no está relacionado con esta cita."
                ], 404);
            }
            $trabajo->cita->subtipos()->updateExistingPivot($descripcionData['id_subtipo'], [
                'descripcion' => $descripcionData['descripcion'],
            ]);
            Log::info("Actualizando subtipo ID: {$descripcionData['id_subtipo']} con descripción: {$descripcionData['descripcion']}");
        }

        $trabajoActualizado = Trabajo::with(['cita.subtipos', 'vehiculo'])->find($id);
        event(new TrabajoActualizado($trabajoActualizado));

        return response()->json(['message' => 'Descripciones actualizadas correctamente.'], 200);
    }
}
