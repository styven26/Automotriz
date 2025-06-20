<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use App\Models\Cita;
use App\Models\EstadoCita;
use App\Models\Horario;
use App\Models\Vehiculo;
use App\Models\OrdenServicio;
use App\Models\DetalleServicio;
use App\Models\Servicio;
use App\Models\Usuario;
use App\Events\CitaNotificada;

class CitasController extends Controller
{
    /**
     * Obtener las citas del cliente autenticado.
     */
    public function index()
    {
        $cliente = auth()->user();
        if (! $cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        $citas = Cita::where('cedula_cliente', $cliente->cedula)
            ->whereHas('estado', fn($q) => $q->where('nombre_estado', 'Confirmada'))
            ->with([
                'cliente:cedula,nombre,apellido',
                'mecanico:cedula,nombre,apellido',
                'vehiculo:id_vehiculo,marca,modelo,numero_placa',
                'estado:id_estado,nombre_estado',
                'horario:id_horario,dia_semana,manana_inicio,tarde_fin',
                'ordenServicio.detallesServicios.servicio'
            ])
            ->get()
            ->map(function ($cita) {
                // Si no hay fecha_fin/hora_fin, uso la fecha/hora de inicio
                $fechaFin = $cita->fecha_fin;
                $horaFin  = $cita->hora_fin;

                return [
                    'id_cita'   => $cita->id_cita,
                    'cliente'   => [
                        'cedula'   => $cita->cliente->cedula,
                        'nombre'   => $cita->cliente->nombre,
                        'apellido' => $cita->cliente->apellido,
                    ],
                    'mecanico'  => [
                        'cedula'   => $cita->mecanico->cedula,
                        'nombre'   => $cita->mecanico->nombre,
                        'apellido' => $cita->mecanico->apellido,
                    ],
                    'vehiculo'  => $cita->vehiculo,
                    'fecha'     => $cita->fecha,
                    'hora'      => $cita->hora,
                    'fecha_fin' => $fechaFin,
                    'hora_fin'  => $horaFin,
                    'estado'    => $cita->estado->nombre_estado,
                    'horario'   => [
                        'dia_semana'   => $cita->horario->dia_semana,
                        'manana_inicio'=> $cita->horario->manana_inicio,
                        'tarde_fin'    => $cita->horario->tarde_fin,
                    ],
                    'subtipos'  => $cita->ordenServicio
                        ? $cita->ordenServicio->detallesServicios->map(fn($det) => [
                            'nombre'               => $det->servicio->nombre,
                            'descripcion_servicio' => $det->servicio->descripcion,
                            'detalle_descripcion'  => $det->descripcion,
                            'progreso'             => $det->progreso,
                        ])->toArray()
                        : [],
                ];
            });

        return response()->json($citas, 200);
    }

    /**
     * Obtener capacidad específica.
     */
    public function obtenerCapacidad(Request $request)
    {
        $request->validate(['fecha' => 'required|date']);
        $fecha = $request->fecha;
        $dia = ucfirst(Carbon::parse($fecha)->translatedFormat('l'));

        $horario = Horario::where('dia_semana', $dia)->first();
        if (! $horario) {
            return response()->json(['error' => 'No hay horario definido para ese día'], 422);
        }

        $reservadas = Cita::where('id_horario', $horario->id_horario)
            ->where('fecha', $fecha)
            ->count();

        return response()->json([
            'reservadas' => $reservadas,
            'capacidad' => $horario->capacidad_max
        ], 200);
    }

    /**
     * Obtener una citas atentidas  específica.
     */
    public function listarCitasAtentidas()
    {
        $cliente = auth()->user();

        if (!$cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        $citas = Cita::query()
            // 1) Filtrar por la cédula del cliente
            ->where('cedula_cliente', $cliente->cedula)
            // 2) Solo los que tengan estado “Atendida”
            ->whereHas('estado', function ($q) {
                $q->where('nombre_estado', 'Atendida');
            })
            // 3) SoftDeletes de Cita ya excluye automáticamente los borrados, no necesitamos whereNull('deleted_at')
            // 4) Eager-load de relaciones útiles
            ->with([
                // traer datos básicos del cliente
                'cliente:cedula,nombre,apellido',
                // datos del mecánico asignado
                'mecanico:cedula,nombre,apellido',
                // datos del vehículo
                'vehiculo:id_vehiculo,marca,modelo,numero_placa',
                // si quieres incluir la orden de servicio y sus detalles:
                'ordenServicio.detallesServicios.servicio:id_servicio,nombre,precio'
            ])
            ->get();

        return response()->json($citas, 200);
    }

    /**
     * Crear una nueva cita.
     */
    public function store(Request $request)
    {
        \Log::info('Datos recibidos para la cita', $request->all());
    
        // 1) Validar entrada
        $validated = $request->validate([
            'id_vehiculo'           => 'required|exists:vehiculos,id_vehiculo',
            'fecha'                 => 'required|date|after_or_equal:' . Carbon::today()->toDateString(),
            'hora'                  => 'required|date_format:H:i',
            'servicios'             => 'required|array|min:1',
            'servicios.*'             => 'required|exists:servicios,id_servicio',
        ]);
    
        // Configurar Carbon en español
        Carbon::setLocale('es');
        $fecha = $validated['fecha'];
        $hora = $validated['hora'];
        $dia = ucfirst(Carbon::parse($fecha)->translatedFormat('l'));
    
        // Verificar que no sea sábado ni domingo
        if (in_array(strtolower($dia), ['sábado', 'domingo'])) {
            return response()->json([
                'error' => 'Solo se pueden programar citas de lunes a viernes.'
            ], 422);
        }

        // 1) Calcula el inicio de tu nueva cita
        $newStart = Carbon::parse("{$validated['fecha']} {$validated['hora']}");

        // 2) Busca si hay alguna cita activa para ese vehículo que NO haya terminado antes de $newStart
        $solapada = Cita::where('id_vehiculo', $validated['id_vehiculo'])
            ->where('activo', true)
            ->where(function($q) use ($newStart) {
                $q->whereNull('hora_fin') // aún en curso
                ->orWhereRaw(
                    "STR_TO_DATE(CONCAT(fecha_fin,' ',hora_fin),'%Y-%m-%d %H:%i') > ?",
                    [$newStart->format('Y-m-d H:i')]
                );
            })
            ->exists();

        if ($solapada) {
            return response()->json([
            'error' => 'El vehículo ya está en taller y no puede reservarse hasta que termine.',
            'mensaje' => 'Revisa la cita en curso o elige otro día u otro vehículo.'
            ], 422);
        }
    
        // 3) Buscar el horario configurado para ese día
        $horario = Horario::where('dia_semana', $dia)->first();
        if (!$horario) {
            return response()->json([
                'error' => 'No se encontró un horario definido para el día seleccionado.'
            ], 422);
        }
    
        // 4) Validar que la hora esté dentro del rango permitido
        $horaInicio      = Carbon::createFromFormat('H:i', $validated['hora']);
        $inicioPermitido = Carbon::createFromFormat('H:i:s', $horario->manana_inicio);
        $finPermitido    = Carbon::createFromFormat('H:i:s', $horario->tarde_fin);
    
        if ($horaInicio->lt($inicioPermitido) || $horaInicio->gt($finPermitido)) {
            return response()->json([
                'error'   => 'Fuera de horario',
                'mensaje' => "La hora {$horaInicio->format('H:i')} no está dentro del horario permitido "
                             ."{$inicioPermitido->format('H:i')} - {$finPermitido->format('H:i')}."
            ], 422);
        }
    
        // 5) Validar si la cita es para HOY y que la hora sea posterior a la actual
        $fechaCita = Carbon::parse($fecha);
        $fechaHoy   = Carbon::today();
        $horaActual = Carbon::now();
    
        if ($fechaCita->isSameDay($fechaHoy)) {
            // a) Verificar si ya pasó la hora de cierre
            if ($horaActual->gt($finPermitido)) {
                return response()->json([
                    'error'         => 'Horario finalizado',
                    'mensaje'       => 'El horario de atención para hoy ha terminado.',
                    'hora_actual'   => $horaActual->format('H:i'),
                    'hora_ingresada'=> $horaInicio->format('H:i'),
                    'sugerencia'    => 'Reserva para mañana o en otra fecha posterior.'
                ], 422);
            }
    
            // b) Validar que la hora solicitada sea posterior a la hora actual
            $horaCita = Carbon::createFromFormat('Y-m-d H:i', $fechaHoy->toDateString() . ' ' . $hora);
            if ($horaCita->lte($horaActual)) {
                return response()->json([
                    'error'         => 'Datos Inválidos',
                    'mensaje'       => 'La hora de inicio debe ser posterior a la hora actual.',
                    'hora_actual'   => $horaActual->format('H:i'),
                    'hora_ingresada'=> $horaInicio->format('H:i'),
                    'sugerencia'    => 'Elige una hora posterior a la actual o reserva para otro día.'
                ], 422);
            }
        }
    
        // 6) Verificar la capacidad del día para ese horario
        $ocupadas = Cita::where('id_horario', $horario->id_horario)
            ->where('fecha', $fecha)
            ->where('activo', true)
            ->count();

        if ($ocupadas >= $horario->capacidad_max) {
            return response()->json(['error'=>'No hay cupos disponibles para el horario seleccionado.'], 422);
        }
    
        // 7) Verificar que no exista ya una cita duplicada para este cliente, vehículo y fecha/hora
        $cliente = auth()->user();

        // Verificar que no exista ya una cita para el mismo vehículo en la misma fecha
        if (Cita::where('cedula_cliente', $cliente->cedula)
            ->where('id_vehiculo', $validated['id_vehiculo'])
            ->where('fecha', $fecha)
            ->where('activo', true)
            ->exists()) {
           return response()->json(['error'=>'Ya existe una cita para este vehículo en la fecha seleccionada.'], 422);
        }

        // 8) Determinar si el servicio "Diagnóstico" está entre los seleccionados
        $diagnosticoId = Servicio::where('nombre', 'Diagnóstico')->value('id_servicio');
        $idsServicios  = $validated['servicios'];

        // Si incluye diagnóstico → diagnosticado, sino → confirmada
        if (in_array($diagnosticoId, $idsServicios, true)) {
            $estado = EstadoCita::where('nombre_estado', 'Diagnosticado')->first();
        } else {
            $estado = EstadoCita::where('nombre_estado', 'Confirmada')->first();
        }

        if (! $estado) {
            return response()->json(['error' => "Estado indicado no existe"], 422);
        }
    
        // 7B) Verificar que NO exista otra cita para el MISMO vehículo y la MISMA fecha
        //     aunque sea distinta hora. Es decir, solo una reserva por día para ese vehículo.
        $duplicadoMismoDia = Cita::where('cedula_cliente', $cliente->cedula)
            ->where('id_vehiculo', $validated['id_vehiculo'])
            ->where('fecha', $validated['fecha'])
            ->where('activo', true)  // solo activas
            ->exists();
    
        if ($duplicadoMismoDia) {
            \Log::error('Cita duplicada (misma fecha, distinta hora) detectada.');
            return response()->json([
                'error' => 'Ya existe una cita con esta fecha para este vehículo. Solo se permite una reserva por día.'
            ], 422);
        }
    
        // 9) ENCONTRAR UN MECÁNICO REALMENTE LIBRE
        $mecanicoLibre = Usuario::whereHas('roles', function($q) {
                $q->where('nombre', 'mecanico');
            })
            ->whereDoesntHave('citasComoMecanico', function($q) use ($newStart) {
                $q->where('activo', true)
                ->where(function($q2) use ($newStart) {
                    // Citas en curso (sin hora_fin)
                    $q2->whereNull('hora_fin')
                        // O citas que terminan después del inicio propuesto
                        ->orWhereRaw(
                            "STR_TO_DATE(CONCAT(fecha_fin, ' ', hora_fin), '%Y-%m-%d %H:%i') > ?",
                            [$newStart->format('Y-m-d H:i')]
                        );
                });
            })
            ->first();

        if (! $mecanicoLibre) {
            // 9b) Si NO hay mecánico libre, buscamos cuál está ocupado y cuál es su cita actual
            $mecanicoOcupado = Usuario::whereHas('roles', function($q) {
                    $q->where('nombre', 'mecanico');
                })
                ->whereHas('citasComoMecanico', function($q) use ($newStart) {
                    $q->where('activo', true)
                    ->where(function($q2) use ($newStart) {
                        $q2->whereNull('hora_fin')
                            ->orWhereRaw(
                                "STR_TO_DATE(CONCAT(fecha_fin, ' ', hora_fin), '%Y-%m-%d %H:%i') > ?",
                                [$newStart->format('Y-m-d H:i')]
                            );
                    });
                })
                ->with(['citasComoMecanico' => function($q) use ($newStart) {
                    $q->where('activo', true)
                    ->where(function($q2) use ($newStart) {
                        $q2->whereNull('hora_fin')
                            ->orWhereRaw(
                                "STR_TO_DATE(CONCAT(fecha_fin, ' ', hora_fin), '%Y-%m-%d %H:%i') > ?",
                                [$newStart->format('Y-m-d H:i')]
                            );
                    })
                    ->with(['vehiculo', 'ordenServicio.detallesServicios.servicio'])
                    ->orderBy('fecha')
                    ->orderBy('hora');
                }])
                ->first();

            // Tomamos la primera cita activa de ese mecánico
            $citaActual = $mecanicoOcupado
                ? $mecanicoOcupado->citasComoMecanico->first()
                : null;

            // Preparamos el JSON de la cita actual
            $dataCitaActual = null;
            if ($citaActual) {
                $dataCitaActual = [
                    'vehiculo' => [
                        'marca'  => $citaActual->vehiculo->marca,
                        'modelo' => $citaActual->vehiculo->modelo,
                        'placa'  => $citaActual->vehiculo->numero_placa,
                    ],
                    'servicios_en_proceso' => $citaActual
                        ->ordenServicio
                        ->detallesServicios
                        ->map(fn($det) => $det->servicio->nombre)
                        ->toArray(),
                    'fecha_inicio' => $citaActual->fecha,
                    'hora_inicio'  => $citaActual->hora,
                ];
            }

            // Sugerir otros horarios usando el método auxiliar
            $inicioPermitido   = Carbon::createFromFormat('H:i:s', $horario->manana_inicio);
            $finPermitido      = Carbon::createFromFormat('H:i:s', $horario->tarde_fin);
            $horariosSugeridos = $this->calcularHorariosSugeridos(
                $validated['fecha'],
                $validated['hora'],
                $inicioPermitido,
                $finPermitido
            );

            return response()->json([
                'error'               => 'Mecánico Ocupado',
                'mensaje'             => 'No hay ningún mecánico disponible hasta que termine su trabajo actual.',
                'mecanico_ocupado'    => [
                    'cedula' => $mecanicoOcupado->cedula,
                    'nombre' => "{$mecanicoOcupado->nombre} {$mecanicoOcupado->apellido}"
                ],
                'cita_actual'         => $dataCitaActual,
                'horarios_sugeridos'  => $horariosSugeridos,
            ], 422);
        }
    
        // 10) Crear la cita con el mecánico que encontramos (sin fecha_fin/hora_fin)
        $cita = Cita::create([
            'id_estado'       => $estado->id_estado,
            'id_horario'      => $horario->id_horario,
            'cedula_cliente'  => $cliente->cedula,
            'cedula_mecanico' => $mecanicoLibre->cedula,
            'id_vehiculo'     => $validated['id_vehiculo'],
            'fecha'           => $fecha,
            'hora'            => $hora,
            'fecha_fin'       => null,
            'hora_fin'        => null,
            'activo'          => true,
        ]);

        \Log::info('Cita creada exitosamente', ['cita_id' => $cita->id_cita]);

        //  11) Crear orden de servicio y detalle
        $orden = OrdenServicio::create([
            'id_cita'         => $cita->id_cita,
            'id_vehiculo'     => $cita->id_vehiculo,
            'fecha_inicio'    => now()->toDateString(),
            'descripcion'     => $request->input('descripcion', null),
            'total_servicios' => 0,
            'total_repuestos' => 0,
        ]);

        $totalServicios = 0;
        foreach ($validated['servicios'] as $id_servicio) {
            DetalleServicio::create([
                'id_orden'     => $orden->id_orden,
                'id_servicio'  => $id_servicio,
                'descripcion'  => null,
                'progreso'     => 0,
            ]);
        }
        
        // (Opcional) calcular total_servicios basado en precio del servicio
        $total = \App\Models\Servicio::whereIn('id_servicio', $validated['servicios'])
            ->sum('precio');
        $orden->update(['total_servicios' => $total]);
    
        // 12) Notificar al mecánico (por ejemplo, mediante un evento)
        $clienteModelo = auth()->user();  // instancia de App\Models\Usuario

        event(new CitaNotificada(
            "La cita para el vehículo {$cita->vehiculo->marca} ha sido creada.",
            $cita->cedula_mecanico,
            $clienteModelo
        ));
    
        return response()->json($cita, 201);
    }

    /**
     * Devuelve los IDs de los vehículos que siguen en taller (activo=true y sin hora_fin o que cruce la fecha/hora dada).
     */
    public function vehiculosOcupados(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date',
            'hora'  => 'required|date_format:H:i',
        ]);

        $timestamp = Carbon::parse("{$request->fecha} {$request->hora}");

        $vehiculos = Cita::where('activo', true)
            ->where(function($q) use($timestamp) {
                $q->whereNull('hora_fin')
                  ->orWhereRaw(
                    "STR_TO_DATE(CONCAT(fecha_fin,' ',hora_fin),'%Y-%m-%d %H:%i') > ?",
                    [$timestamp->format('Y-m-d H:i')]
                  );
            })
            ->pluck('id_vehiculo')
            ->unique()
            ->values();

        return response()->json($vehiculos);
    }
    
    /**
     * Método auxiliar para sugerir horarios alternativos.
     * Recibe la fecha, la hora solicitada y el rango permitido (inicio y fin)
     * y devuelve un array de posibles horarios.
     */
    private function calcularHorariosSugeridos($fecha, $horaSolicitada, Carbon $inicioPermitido, Carbon $finPermitido)
    {
        $horaBase = Carbon::createFromFormat('H:i', $horaSolicitada);
        $horarios = [];
        // Opciones de incremento en minutos: +30, +60, +120
        $opciones = [30, 60, 120];
        foreach ($opciones as $minutos) {
            $siguiente = $horaBase->copy()->addMinutes($minutos);
            if ($siguiente->between($inicioPermitido, $finPermitido)) {
                $horarios[] = [
                    'hora_inicio' => $siguiente->format('H:i'),
                    'hora_fin'    => null, // Se asignará al finalizar el servicio
                ];
            }
        }
        return $horarios;
    }    

    /**
     * Obtiene horarios sugeridos para reservar en un día dado, a partir de una hora de referencia.
     * Solo se consideran como bloqueados los intervalos ocupados por citas finalizadas (con fecha_fin y hora_fin definidos).
     * Si el mecánico aún está trabajando (sin fecha_fin/hora_fin), ese intervalo se considera ocupado.
     *
     * Request parameters:
     *  - fecha: string (obligatorio, formato Y-m-d)
     *  - hora (opcional): string (formato H:i). Si no se envía, se usará la hora de inicio del horario.
     *
     * Retorna un array de intervalos disponibles, por ejemplo:
     *   [ { "hora_inicio": "09:00", "hora_fin": "10:30" }, { "hora_inicio": "10:30", "hora_fin": "15:00" } ]
     */
    public function obtenerHorariosSugeridosDespues(Request $request)
    {
        // Validar que se envíe la fecha y (opcionalmente) la hora de referencia.
        $validated = $request->validate([
            'fecha' => 'required|date',
            'hora'  => 'nullable|date_format:H:i'
        ]);

        $fecha = $validated['fecha'];
        // Obtener el día en español para buscar el horario
        $dia = ucfirst(Carbon::parse($fecha)->translatedFormat('l'));
        $horario = Horario::where('dia_semana', $dia)->first();
        if (!$horario) {
            return response()->json([
                'error' => 'No se encontró un horario para el día seleccionado.'
            ], 422);
        }

        // Definir el rango permitido de la jornada
        $inicioPermitido = Carbon::createFromFormat('H:i:s', $horario->manana_inicio);
        $finPermitido    = Carbon::createFromFormat('H:i:s', $horario->tarde_fin);

        // Si se envía una hora de referencia, usarla; de lo contrario, usar el inicio permitido.
        if (!empty($validated['hora'])) {
            $horaReferencia = Carbon::createFromFormat('H:i', $validated['hora']);
            // Si la hora de referencia es menor que el inicio permitido, ajustarla
            if ($horaReferencia->lt($inicioPermitido)) {
                $horaReferencia = $inicioPermitido->copy();
            }
            if ($horaReferencia->gt($finPermitido)) {
                return response()->json([
                    'error' => 'La hora de referencia está fuera del horario permitido.'
                ], 422);
            }
        } else {
            $horaReferencia = $inicioPermitido->copy();
        }

        // Convertir la fecha de la cita a Carbon para filtrar las citas del día
        // (Suponemos que en la BD la fecha está en formato Y-m-d)
        // Obtenemos todas las citas finalizadas para ese día (se ignoran las citas en curso)
        $citas = Cita::where('fecha', $fecha)
            ->whereNotNull('hora_fin')  // Solo citas finalizadas (que ya tienen fecha_fin/hora_fin)
            ->orderBy('hora')
            ->get();

        // Calcular los intervalos disponibles dentro del rango permitido
        $availableIntervals = [];
        $currentTime = $horaReferencia->copy();

        foreach ($citas as $cita) {
            // Obtener el inicio y fin de la cita en formato Carbon (asumiendo que 'hora' y 'hora_fin' son H:i:s)
            $citaInicio = Carbon::createFromFormat('H:i:s', $cita->hora);
            $citaFin    = Carbon::createFromFormat('H:i:s', $cita->hora_fin);

            // Si la cita finalizó antes de la hora actual, omitirla
            if ($citaFin->lte($currentTime)) {
                continue;
            }

            // Si el intervalo desde currentTime hasta el inicio de la cita es mayor que cero, se puede reservar
            if ($currentTime->lt($citaInicio)) {
                $availableIntervals[] = [
                    'hora_inicio' => $currentTime->format('H:i'),
                    'hora_fin'    => $citaInicio->format('H:i')
                ];
            }
            // Actualizar currentTime al final de la cita
            if ($citaFin->gt($currentTime)) {
                $currentTime = $citaFin->copy();
            }
        }

        // Si después de procesar todas las citas currentTime aún es menor que el fin permitido,
        // ese es el último intervalo disponible.
        if ($currentTime->lt($finPermitido)) {
            $availableIntervals[] = [
                'hora_inicio' => $currentTime->format('H:i'),
                'hora_fin'    => $finPermitido->format('H:i')
            ];
        }

        return response()->json($availableIntervals, 200);
    }

    /**
     * Calcula el estado del trabajo en base a los progresos.
     */
    private function calcularEstadoTrabajo($subtipos)
    {
        $progresoTotal = collect($subtipos)->sum('progreso');
        $cantidadSubtipos = count($subtipos);

        if ($cantidadSubtipos === 0) {
            return 'pendiente';
        }

        if ($progresoTotal === 100 * $cantidadSubtipos) {
            return 'completado'; // Completa si todos los subtipos están al 100%
        }

        return $progresoTotal > 0 ? 'en_proceso' : 'pendiente';
    }

    /**
     * Calcula la etapa del monitoreo en base a los progresos.
     */
    private function calcularEtapa($subtipos)
    {
        $progresoPromedio = collect($subtipos)->avg('progreso');

        if ($progresoPromedio <= 20) {
            return 'diagnóstico';
        } elseif ($progresoPromedio < 100) {
            return 'reparación';
        }

        return 'finalización';
    }

    /**
     * Eliminar una cita.
     */
    public function destroy($id)
    {
        $cliente = auth()->user();
        $cita    = Cita::findOrFail($id);

        // 1) Verificar que la cita pertenece al cliente autenticado
        if ($cita->cedula_cliente !== $cliente->cedula) {
            return response()->json(['error' => 'No tienes permiso para eliminar esta cita.'], 403);
        }

        // 2) Verificar si la cita ya está cancelada (activo = false)
        if (! $cita->activo) {
            return response()->json(['error' => 'La cita ya ha sido cancelada.'], 422);
        }

        // 3) Validar que la cita no haya iniciado
        // Asegurarnos de tener hora con segundos
        $horaConSegundos = Carbon::parse($cita->hora)->format('H:i:s');
        $inicioCita      = Carbon::createFromFormat('Y-m-d H:i:s', "{$cita->fecha} {$horaConSegundos}");
        if (Carbon::now()->gte($inicioCita)) {
            return response()->json([
                'error' => 'La cita ya ha iniciado y no puede ser eliminada.'
            ], 422);
        }

        // 4) Marcar cita como cancelada
        $estadoCancelada = EstadoCita::where('nombre_estado', 'Cancelada')->first();
        if (! $estadoCancelada) {
            return response()->json(['error' => 'El estado "Cancelada" no está definido.'], 422);
        }

        $cita->id_estado = $estadoCancelada->id_estado;
        $cita->activo    = false;
        $cita->deleted_at = now();
        $cita->save();

        // 6) Notificar al mecánico
        $clienteUsuario = $cita->cliente; // esto es un App\Models\Usuario

        event(new CitaNotificada(
            "La cita para el vehículo {$cita->vehiculo->marca} ha sido cancelada.",
            $cita->cedula_mecanico,
            $clienteUsuario
        ));

        \Log::info('Cita cancelada y evento emitido', [
            'cita_id'       => $cita->id_cita,
            'mecanico_cedula' => $cita->cedula_mecanico,
        ]);

        return response()->json([
            'message'    => 'Cita cancelada con éxito.',
            'deleted_at' => $cita->deleted_at,
        ], 200);
    }

    /**
     * Listar todas las citas.
     */
    public function listarCitas()
    {
        // 1) Obtener los IDs de los estados que queremos mostrar
        $idsEstados = EstadoCita::whereIn('nombre_estado', [
                'Confirmada',
                'En Proceso',
                'Cancelada',
                'Atendida',
                'Diagnosticado',
            ])->pluck('id_estado');

        // 2) Incluir soft-deleted (canceladas) y filtrar por esos estados
        $citas = Cita::with([
                'vehiculo',
                'cliente:cedula,nombre,apellido',
                'mecanico:cedula,nombre,apellido',
                'estado:id_estado,nombre_estado',
                'horario:id_horario,dia_semana,manana_inicio,tarde_fin,capacidad_max',
                'ordenServicio.detallesServicios.servicio'
            ])
            ->withTrashed()
            ->whereIn('id_estado', $idsEstados)
            ->get()
            ->map(function ($cita) {
                // Extraer subtipos desde la orden de servicio
                $subtipos = [];
                if ($cita->ordenServicio) {
                    $subtipos = $cita->ordenServicio
                        ->detallesServicios
                        ->map(fn($det) => [
                            'nombre'               => $det->servicio->nombre,
                            'descripcion_servicio' => $det->servicio->descripcion,
                            'detalle_descripcion'  => $det->descripcion,
                            'progreso'             => $det->progreso,
                        ])
                        ->toArray();
                }

                // Calcular orden de reserva en ese día/horario
                $reservaOrden = Cita::where('id_horario', $cita->id_horario)
                    ->where('fecha', $cita->fecha)
                    ->where('created_at', '<=', $cita->created_at)
                    ->count();

                // Fallback para fecha_fin/hora_fin
                $fechaFin = $cita->fecha_fin;
                $horaFin  = $cita->hora_fin;

                return [
                    'id'            => $cita->id_cita,
                    'cliente'       => [
                        'cedula'   => $cita->cedula_cliente,
                        'nombre'   => $cita->cliente->nombre,
                        'apellido' => $cita->cliente->apellido,
                    ],
                    'vehiculo'      => $cita->vehiculo,
                    'fecha'         => $cita->fecha,
                    'hora'          => $cita->hora,
                    'fecha_fin'     => $fechaFin,
                    'hora_fin'      => $horaFin,
                    'estado'        => $cita->estado->nombre_estado,
                    'subtipos'      => $subtipos,
                    'mecanico'      => [
                        'cedula'   => $cita->cedula_mecanico,
                        'nombre'   => $cita->mecanico->nombre,
                        'apellido' => $cita->mecanico->apellido,
                    ],
                    'capacidad'     => $cita->horario->capacidad_max ?? 0,
                    'orden_reserva' => $reservaOrden,
                ];
            });

        return response()->json($citas, 200);
    }

    /**
     * Listar las citas para el mecánico.
     */
    public function listarCitasMecanico()
    {
        $mecanico = auth()->user();
        if (!$mecanico || ! $mecanico->tieneRol('mecanico')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        $idsEstados = EstadoCita::whereIn('nombre_estado', ['Confirmada','En Proceso','Cancelada','Atendida','Diagnosticado'])
                                ->pluck('id_estado');

        $citas = Cita::with([
                    'estado',
                    'cliente:cedula,nombre,apellido',
                    'vehiculo',
                    'horario:id_horario,capacidad_max',
                    'ordenServicio.detallesServicios.servicio'
                ])
                ->withTrashed()
                ->where('cedula_mecanico', $mecanico->cedula)
                ->whereIn('id_estado', $idsEstados)
                ->get()
                ->map(function ($cita) {
                    // 1) extraigo los servicios en un array $subtipos
                    $subtipos = [];
                    if ($cita->ordenServicio) {
                        $subtipos = $cita->ordenServicio
                            ->detallesServicios
                            ->map(fn($det) => [
                                'nombre'      => $det->servicio->nombre,
                                'descripcion' => $det->servicio->descripcion,
                                'progreso'    => $det->progreso,
                            ])
                            ->toArray();
                    }

                    // 2) calculo el orden de reserva
                    $ordenReserva = Cita::where('id_horario', $cita->id_horario)
                        ->where('fecha', $cita->fecha)
                        ->where('created_at', '<=', $cita->created_at)
                        ->count();

                    return [
                        'id_cita'       => $cita->id_cita,
                        'cliente'       => $cita->cliente,
                        'vehiculo'      => $cita->vehiculo,
                        'fecha'         => $cita->fecha,
                        'hora'          => $cita->hora,
                        'fecha_fin'     => $cita->fecha_fin,
                        'hora_fin'      => $cita->hora_fin,
                        'estado'        => optional($cita->estado)->nombre_estado,
                        'subtipos'      => $subtipos,              // <-- aquí
                        'capacidad'     => $cita->horario->capacidad_max ?? 0,
                        'orden_reserva' => $ordenReserva,
                    ];
                });

        return response()->json($citas, 200);
    }

    /**
     * Listar todas las citas del mecanico.
     */
    public function listarCitasGlobal()
    {
        $admin = auth()->user();
        if (! $admin || ! $admin->tieneRol('admin')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        // Cargamos cliente, vehículo, mecánico, estado y orden + detalles→servicio
        $citas = Cita::with([
                'cliente:cedula,nombre,apellido',
                'vehiculo:id_vehiculo,marca,modelo,numero_placa',
                'mecanico:cedula,nombre,apellido',
                'estado:id_estado,nombre_estado',
                'ordenServicio:id_orden,id_cita',
                'ordenServicio.detallesServicios.servicio:id_servicio,nombre'
            ])
            ->withTrashed() // incluir soft deletes si quieres
            ->get()
            ->map(function($c) {
                return [
                    // matriz plana con sólo lo necesario
                    'id_cita'        => $c->id_cita,
                    'fecha'          => $c->fecha,
                    'hora'           => $c->hora,
                    'hora_fin'       => $c->hora_fin,
                    'cliente'        => $c->cliente,
                    'vehiculo'       => $c->vehiculo,
                    'mecanico'       => $c->mecanico,
                    'estado'         => $c->estado->nombre_estado,
                    'ordenServicio'  => [
                        'id_orden'            => $c->ordenServicio->id_orden,
                        'detalles_servicios'  => $c->ordenServicio->detallesServicios
                            ->map(fn($d) => [
                                // sólo extraemos lo que necesitamos
                                'id_detalle' => $d->id_detalle,
                                'servicio'   => [
                                    'id_servicio' => $d->servicio->id_servicio,
                                    'nombre'      => $d->servicio->nombre,
                                ]
                            ])
                    ]
                ];
            });

        return response()->json($citas, 200);
    }

    /**
     *  Facturación total del cliente.
     */
    public function obtenerFacturacionTotal(Request $request)
    {
        $cliente = auth()->user();

        if (! $cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        // 1) Obtengo el id de "Atendida" desde la tabla estados_citas
        $atendidaId = EstadoCita::where('nombre_estado', 'Atendida')->value('id_estado');

        // 2) Traigo todas las órdenes cuyas citas son de ese cliente y estén "atendidas"
        $ordenes = OrdenServicio::whereHas('cita', function($q) use ($cliente, $atendidaId) {
                $q->where('cedula_cliente', $cliente->cedula)
                ->where('id_estado', $atendidaId);
            })
            ->with([
                'detallesServicios.servicio:id_servicio,precio',
                'detallesRepuestos:id_detalle_repuesto,subtotal'
            ])
            ->get();

        // 3) Sumamos
        $facturacionTotal = 0.0;
        foreach ($ordenes as $orden) {
            foreach ($orden->detallesServicios as $detalle) {
                $facturacionTotal += (float) $detalle->servicio->precio;
            }
            foreach ($orden->detallesRepuestos as $detalle) {
                $facturacionTotal += (float) $detalle->subtotal;
            }
        }

        return response()->json([
            'facturacionTotal' => round($facturacionTotal, 2)
        ], 200);
    }

    /**
     * Distribución de servicios solicitados.
     */
    public function distribucionServiciosSolicitados(Request $request)
    {
        $cliente = auth()->user();

        if (! $cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        // 1) Obtengo el PK de "Atendida"
        $atendidaId = EstadoCita::where('nombre_estado', 'Atendida')
            ->value('id_estado');

        // 2) Para cada servicio, cuento sus detalles (detalle_servicio)
        //    cuyos órdenes pertenecen a citas de este cliente y que estén "atendidas"
        $data = Servicio::select('id_servicio', 'nombre')
            ->withCount(['detalles as total_solicitudes' => function ($q) use ($cliente, $atendidaId) {
                $q->whereHas('orden.cita', function ($q2) use ($cliente, $atendidaId) {
                    $q2->where('cedula_cliente', $cliente->cedula)
                       ->where('id_estado', $atendidaId);
                });
            }])
            ->get();

        return response()->json($data, 200);
    }

    /**
     * Obtener los ingresos por mes.
     */
    public function ingresosPorMes()
    {
        $cliente = auth()->user();

        if (! $cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        // 1) Obtengo el id_estado correspondiente a "Atendida"
        $atendidaId = EstadoCita::where('nombre_estado', 'Atendida')
            ->value('id_estado');

        // 2) Traer todas las órdenes cuyas citas sean de este cliente y estén atendidas
        $ordenes = OrdenServicio::whereHas('cita', function ($q) use ($cliente, $atendidaId) {
                $q->where('cedula_cliente', $cliente->cedula)
                  ->where('id_estado', $atendidaId);
            })
            ->with('cita','detallesServicios.servicio')
            ->get();

        if ($ordenes->isEmpty()) {
            \Log::info("No se encontraron órdenes atendidas para el cliente {$cliente->cedula}");
            return response()->json([], 200);
        }

        // 3) Aplanar detalles para extraer mes e ingreso
        $items = $ordenes->flatMap(function ($orden) {
            $mesKey = Carbon::parse($orden->cita->fecha)->format('m/Y');
            return $orden->detallesServicios->map(function ($detalle) use ($mesKey) {
                return [
                    'mes'     => $mesKey,
                    'ingreso' => (float) $detalle->servicio->precio,
                ];
            });
        });

        // 4) Agrupar por mes y sumar ingresos
        $result = $items
            ->groupBy('mes')
            ->map(function ($group, $mes) {
                return [
                    'name'  => $mes,                   // etiqueta para ngx-charts
                    'value' => $group->sum('ingreso'), // valor a graficar
                ];
            })
            ->values(); // reindex numérico

        \Log::info('Ingresos por mes procesados:', $result->toArray());

        return response()->json($result, 200);
    }

    /**
     * Obtener la cantidad de citas atendidas por mes.
     */
    public function citasAtendidasPorMes()
    {
        $cliente = auth()->user();

        if (! $cliente || ! $cliente->tieneRol('cliente')) {
            return response()->json(['error' => 'Acceso no autorizado'], 403);
        }

        // 1) Traer todas las citas atendidas del cliente, usando la relación estado()->nombre_estado = 'Atendida'
        $citas = Cita::where('cedula_cliente', $cliente->cedula)
            ->whereHas('estado', function ($q) {
                $q->where('nombre_estado', 'Atendida');
            })
            ->get();

        // 2) Agrupar por mes/año y contar
        $result = $citas
            ->groupBy(function ($cita) {
                // usar Carbon para formatear 'MM/YYYY'
                return Carbon::parse($cita->fecha)->format('m/Y');
            })
            ->map(function ($group, $mes) {
                return [
                    'mes'   => $mes,
                    'total' => $group->count(),
                ];
            })
            ->values(); // reindex numérico

        return response()->json($result, 200);
    }
}