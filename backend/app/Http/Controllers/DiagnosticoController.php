<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Mail;
use App\Models\Diagnostico;
use App\Models\SubtipoServicio;
use App\Models\Cita;
use Illuminate\Http\Request;

class DiagnosticoController extends Controller
{
    public function index()
    {
        $diagnosticos = Diagnostico::with('cita.cliente', 'cita.vehiculo')
            ->where('correo_enviado', false)
            ->get();
        return response()->json($diagnosticos, 200);
    }

    public function store(Request $request, Cita $cita)
    {
        // Verificar que el mecánico asignado es el usuario autenticado
        if ($cita->id_mecanico !== auth()->id()) {
            return response()->json(['error' => 'No tienes permiso para agregar diagnóstico a esta cita.'], 403);
        }

        $validatedData = $request->validate([
            'descripcion' => 'required|string',
            'servicios_recomendados' => 'nullable|array',
        ]);

        $diagnostico = Diagnostico::create([
            'id_cita' => $cita->id,
            'descripcion' => $validatedData['descripcion'],
            'servicios_recomendados' => isset($validatedData['servicios_recomendados'])
                ? json_encode($validatedData['servicios_recomendados'])
                : null,
        ]);

        return response()->json([
            'message' => 'Diagnóstico guardado exitosamente',
            'diagnostico' => $diagnostico,
        ], 201);
    }

    public function update(Request $request, Diagnostico $diagnostico)
    {
        if ($diagnostico->cita->id_mecanico !== auth()->id()) {
            return response()->json(['error' => 'No tienes permiso para actualizar este diagnóstico.'], 403);
        }

        $validatedData = $request->validate([
            'descripcion' => 'required|string',
            'servicios_recomendados' => 'nullable|array',
        ]);

        $diagnostico->descripcion = $validatedData['descripcion'];
        $diagnostico->servicios_recomendados = isset($validatedData['servicios_recomendados'])
            ? json_encode($validatedData['servicios_recomendados'])
            : null;
        $diagnostico->save();

        return response()->json([
            'message' => 'Diagnóstico actualizado exitosamente',
            'diagnostico' => $diagnostico
        ], 200);
    }

    /**
     * Envía el correo al cliente con la información de servicios recomendados.
     */
    public function enviarCorreoServiciosRecomendados($diagnosticoId)
    {
        $diagnostico = Diagnostico::with('cita.cliente', 'cita.vehiculo')->findOrFail($diagnosticoId);
        $cliente = $diagnostico->cita->cliente;
        if (!$cliente->correo) {
            return response()->json(['message' => 'El cliente no tiene un correo registrado'], 400);
        }
        $vehiculo = $diagnostico->cita->vehiculo;

        // Convertir el campo servicios_recomendados a array
        $serviciosIDs = [];
        if (is_string($diagnostico->servicios_recomendados)) {
            $serviciosIDs = json_decode($diagnostico->servicios_recomendados, true);
        } elseif (is_array($diagnostico->servicios_recomendados)) {
            $serviciosIDs = $diagnostico->servicios_recomendados;
        }

        $subtipos = SubtipoServicio::whereIn('id', $serviciosIDs)->get();
        $total = $subtipos->sum('precio');

        $data = [
            'cliente'     => $cliente,
            'vehiculo'    => $vehiculo,
            'subtipos'    => $subtipos,
            'total'       => $total,
            'diagnostico' => $diagnostico,
        ];

        try {
            Mail::send('emails.servicios-recomendados', $data, function ($message) use ($cliente) {
                $message->to($cliente->correo)
                        ->subject('Servicios Recomendados - Mecánica Automotriz Don Chavo');
            });

            // **Marcar el diagnóstico como 'correo_enviado'** para no reenviarlo
            $diagnostico->correo_enviado = true;
            $diagnostico->save();

            return response()->json(['message' => 'Correo enviado correctamente al cliente'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el correo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Al hacer clic en "Aceptar" desde el correo, se actualiza la cita y el trabajo:
     * - Verifica que la cita esté en estado "diagnosticado".
     * - Actualiza la cita a "confirmada".
     * - Sincroniza los subtipos recomendados (progreso = 0 y descripción fija).
     * - Actualiza el estado del trabajo a "pendiente" y, si existe, el monitoreo a "diagnóstico".
     */
    public function aceptarServiciosRecomendados($diagnosticoId)
    {
        $diagnostico = Diagnostico::with('cita.trabajo', 'cita.subtipos')->findOrFail($diagnosticoId);

        if ($diagnostico->cita->estado !== 'diagnosticado') {
            return response()->json([
                'error' => 'La cita no está en estado diagnosticado o ya fue procesada.'
            ], 400);
        }

        $cita = $diagnostico->cita;
        $cita->estado = 'confirmada';
        $cita->save();

        // Obtener los servicios recomendados
        $serviciosIDs = [];
        if (is_string($diagnostico->servicios_recomendados)) {
            $serviciosIDs = json_decode($diagnostico->servicios_recomendados, true);
        } elseif (is_array($diagnostico->servicios_recomendados)) {
            $serviciosIDs = $diagnostico->servicios_recomendados;
        }

        // Sincronizar en la cita los subtipos recomendados con progreso = 0
        $subtiposData = [];
        foreach ($serviciosIDs as $id) {
            $subtiposData[$id] = [
                'progreso'    => 0,
                'descripcion' => 'Servicio confirmado según recomendación del mecánico.',
            ];
        }
        $cita->subtipos()->sync($subtiposData);

        // Actualizar el trabajo asociado, si existe
        if ($cita->trabajo) {
            $cita->trabajo->estado = 'pendiente';
            $cita->trabajo->save();

            if ($cita->trabajo->monitoreo) {
                $cita->trabajo->monitoreo->update(['etapa' => 'diagnóstico']);
            }
        }

        // Opcional: Si se requiere, aquí se puede llamar a enviarCorreoTrabajoCompletado($trabajo) desde otro flujo

        return response()->json([
            'message' => 'Has aceptado los servicios recomendados. La cita pasa a "confirmada" y el trabajo a "pendiente".'
        ], 200);
    }

    /**
     * Al hacer clic en "Rechazar" desde el correo, se actualiza la cita (y opcionalmente el trabajo) a "cancelado".
     */
    public function rechazarServiciosRecomendados($diagnosticoId)
    {
        $diagnostico = Diagnostico::with('cita.trabajo')->findOrFail($diagnosticoId);

        if ($diagnostico->cita->estado !== 'diagnosticado') {
            return response()->json([
                'error' => 'La cita no está en estado diagnosticado o ya fue procesada.'
            ], 400);
        }

        $cita = $diagnostico->cita;
        $cita->estado = 'cancelado';
        $cita->save();

        if ($cita->trabajo) {
            $cita->trabajo->estado = 'cancelado';
            $cita->trabajo->save();

            if ($cita->trabajo->monitoreo) {
                $cita->trabajo->monitoreo->update(['etapa' => 'cancelado']);
            }
        }

        return response()->json([
            'message' => 'Has rechazado los servicios recomendados. La cita ha sido actualizada a "cancelado".'
        ], 200);
    }

    /**
     * Envía un correo al cliente cuando NO hay servicios recomendados.
     */
    public function enviarCorreoSinServicios($diagnosticoId)
    {
        // 1) Buscar el diagnóstico incluyendo la relación con la cita, cliente, vehículo y trabajo.
        $diagnostico = Diagnostico::with('cita.cliente', 'cita.vehiculo', 'cita.trabajo')->findOrFail($diagnosticoId);
        $cliente = $diagnostico->cita->cliente;

        // 2) Verificar si el cliente tiene correo
        if (!$cliente->correo) {
            return response()->json(['message' => 'El cliente no tiene un correo registrado'], 400);
        }

        $vehiculo = $diagnostico->cita->vehiculo;
        $cita = $diagnostico->cita;

        // 3) Preparar los datos para el correo (sin servicios recomendados)
        $data = [
            'cliente'     => $cliente,
            'vehiculo'    => $vehiculo,
            'subtipos'    => [], // Lista vacía ya que no hay servicios recomendados
            'total'       => 0,  // Sin costo
            'diagnostico' => $diagnostico,
        ];

        try {
            // 4) Enviar el correo usando la plantilla 'emails.servicios-sin-recomendados'
            Mail::send('emails.servicios-sin-recomendados', $data, function ($message) use ($cliente) {
                $message->to($cliente->correo)
                        ->subject('Sin Servicios Recomendados - Mecánica Automotriz Don Chavo');
            });

            // 5) Marcar el diagnóstico como "correo_enviado" para evitar reenvíos
            $diagnostico->correo_enviado = true;
            $diagnostico->save();

            // 6) Actualizar la cita a "cancelado"
            $cita->estado = 'cancelado';
            $cita->save();

            // 7) Si existe un trabajo asociado, actualizarlo a "cancelado"
            if ($cita->trabajo) {
                $cita->trabajo->estado = 'cancelado';
                $cita->trabajo->save();

                // 8) Si el trabajo tiene monitoreo, actualizar su etapa a "cancelado"
                if ($cita->trabajo->monitoreo) {
                    $cita->trabajo->monitoreo->update(['etapa' => 'cancelado']);
                }
            }

            return response()->json(['message' => 'Correo enviado y estados actualizados correctamente'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el correo',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

}
