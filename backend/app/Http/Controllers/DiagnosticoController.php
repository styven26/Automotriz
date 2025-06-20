<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Models\Cita;
use App\Models\EstadoCita;
use App\Models\OrdenServicio;
use App\Models\DetalleServicio;
use App\Models\Servicio;

class DiagnosticoController extends Controller
{
    /**
     * Lista todas las órdenes de servicio que aún no han enviado correo de diagnóstico.
     */
    public function index()
    {
        // 1) Averiguas el id de “Diagnosticado” desde tu seeder
        $idDiagnosticado = EstadoCita::where('nombre_estado', 'Diagnosticado')
                        ->value('id_estado'); // ==> 4

        // 2) Filtras órdenes que NO han enviado correo Y cuyo cita.id_estado = Diagnosticado
        $ordenes = OrdenServicio::with([
                'cita.cliente',
                'cita.vehiculo',
                'detallesServicios.servicio',
            ])
            ->where('correo_enviado', false)
            ->whereHas('cita', function($q) use ($idDiagnosticado) {
                $q->where('id_estado', $idDiagnosticado);
            })
            ->get();

        return response()->json($ordenes, 200);
    }

    /**
     * Crea o actualiza el diagnóstico (OrdenServicio + DetalleServicio) para una cita.
     */
    public function store(Request $request, Cita $cita)
    {
        \Log::debug('PAYLOAD Store Diagnóstico:', $request->all());

        // 0) Sanitizar: quitar valores null de servicios_recomendados
        $raw = $request->input('servicios_recomendados', []);
        $clean = array_filter($raw, fn($v) => $v !== null);
        $request->merge(['servicios_recomendados' => $clean]);

        // 1) Permisos
        if ($cita->cedula_mecanico !== auth()->id()) {
            return response()->json(['error' => 'No tienes permiso para diagnosticar esta cita.'], 403);
        }

        // 2) Validación (ahora el array sólo contiene números o strings numéricos)
        $data = $request->validate([
            'descripcion'              => 'required|string',
            'servicios_recomendados'   => 'nullable|array',
            'servicios_recomendados.*' => 'numeric',
        ]);

        // 3) Crear o actualizar la orden...
        $orden = $cita->ordenServicio
            ? tap($cita->ordenServicio)->update([
                'descripcion'            => $data['descripcion'],
                'servicios_recomendados' => $data['servicios_recomendados'] ?? [],
            ])
            : OrdenServicio::create([
                'id_cita'                => $cita->id_cita,
                'id_vehiculo'            => $cita->id_vehiculo,
                'descripcion'            => $data['descripcion'],
                'servicios_recomendados' => $data['servicios_recomendados'] ?? [],
            ]);

        // 4) Sincronizar detalles de servicio
        $orden->detallesServicios()->delete();
        foreach ($data['servicios_recomendados'] ?? [] as $idServ) {
            DetalleServicio::create([
                'id_orden'    => $orden->id_orden,
                'id_servicio' => $idServ,
                'descripcion' => '',
                'progreso'    => 0,
            ]);
        }

        return response()->json([
            'message' => 'Diagnóstico registrado.',
            'orden'   => $orden->load('detallesServicios.servicio'),
        ], 201);
    }

    /**
     * Actualiza el diagnóstico de una orden existente.
     */
    public function update(Request $request, OrdenServicio $ordenServicio)
    {
        // 1) Recupera la cita explícitamente (incluye soft‐deletes)
        $cita = Cita::withTrashed()->find($ordenServicio->id_cita);
        if (! $cita) {
            return response()->json([
                'error' => 'No se encontró la cita asociada a este diagnóstico.'
            ], 404);
        }

        // 2) Verifica que seas el mecánico asignado
        if ($cita->cedula_mecanico !== auth()->id()) {
            return response()->json([
                'error' => 'No tienes permiso para actualizar este diagnóstico.'
            ], 403);
        }

        $data = $request->validate([
            'descripcion'              => 'required|string',
            'servicios_recomendados'   => 'nullable|array',
            'servicios_recomendados.*' => 'exists:servicios,id_servicio',
        ]);

        $ordenServicio->update([
            'descripcion'            => $data['descripcion'],
            'servicios_recomendados' => $data['servicios_recomendados'] ?? [],
        ]);

        // Sincronizar detalles de servicio
        $ordenServicio->detallesServicios()->delete();
        if (! empty($data['servicios_recomendados'])) {
            foreach ($data['servicios_recomendados'] as $idServ) {
                DetalleServicio::create([
                    'id_orden'    => $ordenServicio->id_orden,
                    'id_servicio' => $idServ,
                    'descripcion' => '',
                    'progreso'    => 0,
                ]);
            }
        }

        return response()->json([
            'message'     => 'Diagnóstico actualizado.',
            'ordenActual' => $ordenServicio->load('detallesServicios.servicio'),
        ], 200);
    }

    /**
     * Envía el correo al cliente con el detalle de servicios recomendados.
     */
   public function enviarCorreoServiciosRecomendados($idOrden)
    {
        // 1) Recupera la orden con cliente, vehículo y detalles
        $orden = OrdenServicio::with([
                    'cita.cliente',
                    'cita.vehiculo',
                    'detallesServicios.servicio'
                ])->findOrFail($idOrden);

        $cliente  = $orden->cita->cliente;
        $vehiculo = $orden->cita->vehiculo;

        // 2) Valida que el cliente tenga correo
        if (! $cliente->correo) {
            return response()->json([
                'message' => 'El cliente no tiene correo registrado.'
            ], 400);
        }

        // 3) Prepara colección de servicios y total
        $servicios = $orden->detallesServicios
                            ->map(fn($d) => $d->servicio);
        $total = $servicios->sum('precio');

        // 4) Datos para la vista
        $data = [
            'cliente'   => $cliente,
            'vehiculo'  => $vehiculo,
            'servicios' => $servicios,
            'orden'   => $orden,
            'total'     => $total,
        ];

        try {
            // 5) Envío de la plantilla Blade
            Mail::send(
                'emails.servicios-recomendados',
                $data,
                function ($msg) use ($cliente) {
                    $msg->to($cliente->correo)
                        ->subject('Servicios Recomendados - Mecánica Automotriz Don Chavo');
                }
            );

            // 6) Marca como enviado
            $orden->correo_enviado = true;
            $orden->save();

            return response()->json([
                'message' => 'Correo enviado correctamente.'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el correo.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Acepta los servicios recomendados y confirma la cita.
     */
    public function aceptarServiciosRecomendados($idOrden)
    {
        $orden = OrdenServicio::with('cita')->findOrFail($idOrden);
        $cita  = $orden->cita;

        // ← Si ya no está en estado diagnóstico, ya respondieron
        if ($cita->id_estado !== 4) {
            return view('diagnosticos.respondido', [
                'titulo'  => 'Respuesta Registrada',
                'mensaje' => 'Ya has respondido a esta solicitud de servicios.',
                'cita'    => $cita,
            ]);
        }

        // ← Si aún está en diagnóstico, procesamos la aceptación
        $cita->id_estado = 2; // confirmado
        $cita->save();

        return view('diagnosticos.confirmacion', [
            'titulo'  => 'Servicios Aceptados',
            'mensaje' => 'Tus servicios han sido aceptados. ¡Gracias!',
            'cita'    => $cita,
        ]);
    }

    /**
     * Rechaza los servicios recomendados y cancela la cita.
     */
    public function rechazarServiciosRecomendados($idOrden)
    {
        $orden = OrdenServicio::with('cita')->findOrFail($idOrden);
        $cita  = $orden->cita;

        if ($cita->id_estado !== 4) {
            return view('diagnosticos.respondido', [
                'titulo'  => 'Respuesta Registrada',
                'mensaje' => 'Ya has respondido a esta solicitud de servicios.',
                'cita'    => $cita,
            ]);
        }

        $cita->id_estado = 6; // cancelada
        $cita->save();

        return view('diagnosticos.confirmacion', [
            'titulo'  => 'Servicios Rechazados',
            'mensaje' => 'Has rechazado los servicios recomendados.',
            'cita'    => $cita,
        ]);
    }

    /**
     * Envía correo al cliente indicando que no hay servicios recomendados.
     */
    public function enviarCorreoSinServicios($idOrden)
    {
        // 1) Recupera la orden con cliente y vehículo
        $orden   = OrdenServicio::with(['cita.cliente', 'cita.vehiculo'])
                    ->findOrFail($idOrden);

        $cliente = $orden->cita->cliente;
        $vehiculo = $orden->cita->vehiculo;

        // 2) Valida que tenga correo
        if (! $cliente->correo) {
            return response()->json([
                'message' => 'El cliente no tiene correo registrado.'
            ], 400);
        }

        // 3) Datos para la vista
        $data = [
            'cliente'  => $cliente,
            'vehiculo' => $vehiculo,
            'orden'    => $orden,
        ];

        try {
            // 4) Envío de la plantilla Blade
            Mail::send(
                'emails.servicios-sin-recomendados',
                $data,
                function ($msg) use ($cliente) {
                    $msg->to($cliente->correo)
                        ->subject('Sin Servicios Recomendados - Mecánica Automotriz Don Chavo');
                }
            );

            // 5) Marca como enviado y cancela la cita
            $orden->correo_enviado = true;
            $orden->save();

            // 6) Cancela la cita y guarda fecha_fin y hora_fin
            $cita = $orden->cita;
            $cita->id_estado  = 6; // Cancelada
            $cita->activo     = false;
            $cita->fecha_fin  = now()->toDateString();
            $cita->hora_fin   = now()->format('H:i:s');
            $cita->save();

            // Soft delete: rellena deleted_at automáticamente
            $cita->delete();

            // 7) Devuelve JSON con los nuevos valores de la cita
            return response()->json([
                'message' => 'Correo enviado y cita cancelada.',
                'cita' => [
                    'activo'    => $cita->activo,
                    'fecha_fin' => $cita->fecha_fin,
                    'hora_fin'  => $cita->hora_fin,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el correo.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
