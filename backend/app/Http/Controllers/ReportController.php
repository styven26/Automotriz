<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Usuario;
use App\Models\Cita;
use App\Models\EstadoCita;
use Illuminate\Support\Collection;
use App\Models\Vehiculo;
use App\Models\OrdenServicio;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function descargarReporte(Request $request)
    {
        // 1) Mecánico autenticado
        $mecanico = Auth::user();
        if (! $mecanico || ! $mecanico->tieneRol('mecanico')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // 2) Id del estado “Atendida”
        $atendidaId = EstadoCita::where('nombre_estado', 'Atendida')->value('id_estado');

        // 3) Órdenes atendidas con servicios y repuestos
        $trabajos = OrdenServicio::with([
                'vehiculo:id_vehiculo,marca,modelo,numero_placa',
                'cita:id_cita,cedula_cliente,cedula_mecanico,fecha,fecha_fin,hora,hora_fin,id_estado',
                'cita.cliente:cedula,nombre,apellido',
                'cita.estado:id_estado,nombre_estado',
                'detallesServicios.servicio:id_servicio,nombre',
                'detallesRepuestos.repuesto:id_repuesto,nombre',
            ])
            ->whereHas('cita', function ($q) use ($mecanico, $atendidaId) {
                $q->where('cedula_mecanico', $mecanico->cedula)
                  ->where('id_estado', $atendidaId);
            })
            ->orderByDesc('fecha_fin')
            ->get()
            ->map(function ($orden) {
                // Alias y formatos para la vista
                $orden->cita_numero    = $orden->id_cita;
                $orden->cliente_nombre = optional($orden->cita->cliente)->nombre . ' ' . optional($orden->cita->cliente)->apellido;
                $orden->vehiculo_full  = $orden->vehiculo
                                        ? "{$orden->vehiculo->marca} {$orden->vehiculo->modelo}"
                                        : 'Sin vehículo';
                $orden->estado_nombre  = optional($orden->cita->estado)->nombre_estado ?? '—';

                // Fechas formateadas
                $orden->fecha_inicio_f = $orden->fecha_inicio
                                        ? Carbon::parse($orden->fecha_inicio)->format('d/m/Y')
                                        : '—';
                $orden->fecha_fin_f    = $orden->fecha_fin
                                        ? Carbon::parse($orden->fecha_fin)->format('d/m/Y')
                                        : 'Pendiente';

                // Listas con formato numérico
                $orden->servicios = $orden->detallesServicios->map(fn($ds) => [
                    'nombre'   => $ds->servicio->nombre,
                    'cant'     => $ds->cantidad,
                    'precio'   => number_format($ds->precio_unitario, 2),
                    'subtotal' => number_format($ds->subtotal, 2),
                ]);

                $orden->repuestos = $orden->detallesRepuestos->map(fn($dr) => [
                    'nombre'   => $dr->repuesto->nombre,
                    'cant'     => $dr->cantidad,
                    'precio'   => number_format($dr->precio, 2),
                    'subtotal' => number_format($dr->subtotal, 2),
                ]);

                // Totales numéricos y formateados
                $totalServ = $orden->detallesServicios->sum('subtotal');
                $totalRep  = $orden->detallesRepuestos->sum('subtotal');
                $orden->total_servicios          = number_format($totalServ, 2);
                $orden->total_repuestos          = number_format($totalRep, 2);

                return $orden;
            });

        if ($trabajos->isEmpty()) {
            $mensaje = 'No hay órdenes atendidas para generar el reporte.';
            $pdf = Pdf::loadView('reportes.sin_trabajos', compact('mensaje','mecanico'))
                    ->setPaper('A4', 'portrait')
                    ->setOption('isRemoteEnabled', true);

            return $pdf->download("reporte-trabajos-{$mecanico->cedula}.pdf");
        }

        // 4) Generar PDF
        $pdf = Pdf::loadView('reportes.trabajos', compact('trabajos', 'mecanico'))
                  ->setPaper('A4', 'portrait')
                  ->setOption('isRemoteEnabled', true);

        return $pdf->download("reporte-trabajos-{$mecanico->cedula}.pdf");
    }

    // Reporte de clientes
    public function descargarReporteClientes(Request $request)
    {
        $admin = Auth::user();

        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $anio = $request->input('anio'); // Año
        $mes = $request->input('mes');  // Mes (nombre o número)

        try {
            // Validar filtros
            if ($anio && (!is_numeric($anio) || strlen($anio) != 4)) {
                \Log::error("Filtro de año inválido: $anio");
                return response()->json(['error' => 'Año inválido.'], 400);
            }

            $meses = [
                'Enero' => 1, 'Febrero' => 2, 'Marzo' => 3, 'Abril' => 4,
                'Mayo' => 5, 'Junio' => 6, 'Julio' => 7, 'Agosto' => 8,
                'Septiembre' => 9, 'Octubre' => 10, 'Noviembre' => 11, 'Diciembre' => 12
            ];

            if ($mes && !is_numeric($mes)) {
                $mes = $meses[$mes] ?? null;
                if (!$mes) {
                    \Log::error("Filtro de mes inválido: $mes");
                    return response()->json(['error' => 'Mes inválido.'], 400);
                }
            }

            // Crear consulta base
            $clientesQuery = Usuario::whereHas('roles', function ($query) {
                $query->where('nombre', 'cliente');
            })->select('id', 'nombre', 'apellido', 'correo', 'telefono', 'direccion_domicilio', 'created_at');

            if ($anio) {
                $clientesQuery->whereYear('created_at', $anio);
            }

            if ($mes) {
                $clientesQuery->whereMonth('created_at', $mes);
            }

            $clientes = $clientesQuery->get();

            if ($clientes->isEmpty()) {
                \Log::info("No se encontraron clientes para los filtros proporcionados.");
                return response()->json(['error' => 'No se encontraron clientes para los filtros proporcionados.'], 404);
            }

            $mesSeleccionado = $mes ? array_flip($meses)[$mes] : 'Todos los meses';
            $anioSeleccionado = $anio ?: 'Todos los años';

            $pdf = Pdf::loadView('reportes.clientes', compact('clientes', 'anioSeleccionado', 'mesSeleccionado'));

            \Log::info("Reporte de clientes generado correctamente para $mesSeleccionado de $anioSeleccionado.");
            return $pdf->download('reporte-clientes.pdf');
        } catch (\Exception $e) {
            \Log::error('Error al generar el reporte de clientes: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Error interno al generar el reporte.'], 500);
        }
    }

    // Reporte de citas
    public function descargarReporteCitas()
    {
        // 1) Usuario administrador
        $admin = Auth::user();
        if (! $admin || ! $admin->hasRole('admin')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // 2) Obtener citas con estado 'Atendida' y relaciones
        $citas = Cita::with([
                'cliente:cedula,nombre,apellido',
                'vehiculo:id_vehiculo,marca,modelo',
                'mecanico:cedula,nombre,apellido',
                'estado:id_estado,nombre_estado',
                'ordenServicio.detallesServicios.servicio:id_servicio,nombre,precio,iva'
            ])
            ->whereHas('estado', function($q) {
                $q->where('nombre_estado', 'Atendida');
            })
            ->get();

        // 3) Mes/Año para el título
        $mesAno = '';
        if ($citas->isNotEmpty()) {
            $mesAno = ucfirst(
                Carbon::parse($citas->first()->fecha)
                      ->locale('es')
                      ->isoFormat('MMMM YYYY')
            );
        }

        // 4) Mapear citas incluyendo detalles con cantidad, precio y subtotal
        $reporte = $citas->map(function($cita) {
            $servs = optional($cita->ordenServicio)
                ->detallesServicios
                ->map(function($ds) {
                    return [
                        'nombre'   => $ds->servicio->nombre,
                        'cant'     => $ds->cantidad,
                        'precio'   => number_format($ds->precio_unitario, 2),
                        'subtotal' => number_format($ds->subtotal, 2),
                    ];
                })
                ->toArray();

            $totalServ = optional($cita->ordenServicio)
                ->detallesServicios
                ->sum('subtotal');

            return [
                'cita_id'         => $cita->id_cita,
                'cliente'         => "{$cita->cliente->nombre} {$cita->cliente->apellido}",
                'vehiculo'        => "{$cita->vehiculo->marca} {$cita->vehiculo->modelo}",
                'mecanico'        => "{$cita->mecanico->nombre} {$cita->mecanico->apellido}",
                'estado'          => $cita->estado->nombre_estado,
                'fecha_inicio'    => Carbon::parse($cita->fecha)->format('d/m/Y'),
                'hora_inicio'     => Carbon::parse($cita->hora)->format('H:i'),
                'fecha_fin'       => $cita->fecha_fin
                                    ? Carbon::parse($cita->fecha_fin)->format('d/m/Y')
                                    : '—',
                'hora_fin'        => $cita->hora_fin
                                    ? Carbon::parse($cita->hora_fin)->format('H:i')
                                    : '—',
                'servicios'       => $servs,
                'total_servicios' => number_format($totalServ, 2),
            ];
        });

        // 5) Generar PDF
        $pdf = Pdf::loadView('reportes.citas', [
            'mesAno' => $mesAno,
            'citas'  => $reporte
        ]);

        return $pdf->download('reporte-citas-atendidas.pdf');
    }

    // Reporte de mecánicos
    public function descargarReporteTrabajos(Request $request)
    {
        try {

            $admin = Auth::user();

            if (!$admin || !$admin->hasRole('admin')) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
    
            // Obtener filtros de año y mes desde el request
            $anio = $request->input('anio');
            $mes = $request->input('mes');
    
            // Consulta para obtener los trabajos realizados por los mecánicos
            $trabajos = Trabajo::with([
                'mecanico' => function ($query) {
                    $query->select('id', 'nombre', 'apellido', 'cedula', 'correo');
                },
                'cita.cliente' => function ($query) {
                    $query->select('id', 'nombre', 'apellido');
                },
                'subtipos'
            ])
            ->where('estado', 'completado')
            ->whereHas('cita', function ($query) use ($anio, $mes) {
                if ($anio) {
                    $query->whereYear('fecha', $anio);
                }
                if ($mes) {
                    $query->whereMonth('fecha', $mes);
                }
            })
            ->get();
    
            // Valores dinámicos para el encabezado del reporte
            $meses = [
                1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
            ];
            $mesSeleccionado = $mes ? $meses[$mes] : 'Todos los meses';
            $anioSeleccionado = $anio ?: 'Todos los años';
    
            // Generar el PDF
            $pdf = Pdf::loadView('reportes.mecanicos', compact('trabajos', 'anioSeleccionado', 'mesSeleccionado'));
            return $pdf->download('reporte-trabajos-mecanicos.pdf');
        } catch (\Exception $e) {
            \Log::error('Error al generar el reporte de trabajos: ' . $e->getMessage());
            return response()->json(['error' => 'Ocurrió un error al generar el reporte.'], 500);
        }
    }    

    // Reporte financiero: ingreso total de todas las citas atendidas
    public function descargarReporteFinanciero()
    {
        $admin = Auth::user();
        if (! $admin || ! $admin->hasRole('admin')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // 1) Cargo citas atendidas con detalles de servicio
        $detalles = Cita::with([
                'cliente:cedula,nombre,apellido',
                'ordenServicio.detallesServicios.servicio'
            ])
            ->whereHas('estado', fn($q) => $q->where('nombre_estado', 'atendida'))
            ->get()
            ->flatMap(fn($cita) => optional($cita->ordenServicio)
                ->detallesServicios
                ->map(fn($det) => [
                    'fecha'            => $cita->fecha,
                    'cliente_nombre'   => "{$cita->cliente->nombre} {$cita->cliente->apellido}",
                    'servicio_nombre'  => $det->servicio->nombre,
                    'cantidad'         => $det->cantidad,
                    'precio_unitario'  => $det->precio_unitario,
                    'subtotal'         => $det->subtotal,
                ])
            );

        // 2) Convertir a colección y agrupar por año y luego mes
        $coleccion = collect($detalles);
        $grouped = $coleccion
            ->groupBy(fn($item) => Carbon::parse($item['fecha'])->format('Y'))
            ->map(fn(Collection $yearItems) => 
                $yearItems->groupBy(fn($item) => Carbon::parse($item['fecha'])->format('m'))
            );

        // 3) Totales
        $totalGeneral = $coleccion->sum('subtotal');
        $mensaje = $coleccion->isEmpty()
            ? 'No hay ingresos registrados para este taller.'
            : null;

        // 4) Generar PDF con la vista
        $pdf = PDF::loadView('reportes.financiero', [
            'grouped'       => $grouped,
            'totalGeneral'  => $totalGeneral,
            'mensaje'       => $mensaje,
        ]);

        return $pdf->download('reporte-financiero.pdf');
    }

    // Reporte: Estado de vehículos
    public function descargarEstadoVehiculos()
    {
        $cliente = Auth::user();

        if (!$cliente || !$cliente->hasRole('cliente')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $vehiculos = Vehiculo::where('id_cliente', $cliente->id)
            ->with(['monitoreos.trabajo.mecanico']) // Cargar relaciones
            ->get()
            ->map(function ($vehiculo) {
                return [
                    'marca' => $vehiculo->marca,
                    'modelo' => $vehiculo->modelo,
                    'placa' => $vehiculo->numero_placa,
                    'monitoreos' => $vehiculo->monitoreos->map(function ($monitoreo) {
                        return [
                            'etapa' => $monitoreo->etapa,
                            'mecanico' => optional($monitoreo->trabajo->mecanico)->nombre ?? 'No asignado',
                        ];
                    }),
                ];
            });

        if ($vehiculos->isEmpty()) {
            return response()->json(['error' => 'No hay vehículos registrados.'], 404);
        }

        // Generar el PDF
        $pdf = Pdf::loadView('reportes.estado_vehiculos', compact('vehiculos'));
        return $pdf->download('reporte-estado-vehiculos.pdf');
    }

    /**
     * Reporte de Historial de Servicios del cliente autenticado
     */
    public function descargarHistorialServicios(Request $request)
    {
        // 1) Cliente autenticado
        $cliente = Auth::guard('cliente')->user();
        if (! $cliente) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // 2) Filtros año/mes
        $anio = $request->input('anio');
        $mes  = $request->input('mes');
        if ($anio && (! is_numeric($anio) || strlen($anio) !== 4)) {
            return response()->json(['error' => 'Año inválido.'], 400);
        }
        if ($mes && (! is_numeric($mes) || $mes < 1 || $mes > 12)) {
            return response()->json(['error' => 'Mes inválido.'], 400);
        }

        // 3) Etiquetas de mes
        $meses = [
            1=>'Enero',2=>'Febrero',3=>'Marzo',4=>'Abril',
            5=>'Mayo',6=>'Junio',7=>'Julio',8=>'Agosto',
            9=>'Septiembre',10=>'Octubre',11=>'Noviembre',12=>'Diciembre',
        ];
        $mesSeleccionado  = $mes  ? $meses[intval($mes)]  : 'Todos los meses';
        $anioSeleccionado = $anio ? $anio               : 'Todos los años';

        // 4) Obtener órdenes “Atendidas” del cliente con relaciones
        $ordenes = OrdenServicio::whereHas('cita', function($q) use($cliente, $anio, $mes) {
                $q->where('cedula_cliente', $cliente->cedula)
                  ->whereHas('estado', fn($q2) => $q2->where('nombre_estado','Atendida'));
                if ($anio) $q->whereYear('fecha', $anio);
                if ($mes)  $q->whereMonth('fecha', $mes);
            })
            ->with([
                'cita:id_cita,fecha,hora,fecha_fin,hora_fin',
                'vehiculo:id_vehiculo,marca,modelo',
                'detallesServicios.servicio:id_servicio,nombre',
                'detallesRepuestos.repuesto:id_repuesto,nombre',
            ])
            ->get();

        // 5) Transformar cada orden
        $datos = $ordenes->map(function($orden) {
            $c = $orden->cita;
            $inicio = Carbon::parse("{$c->fecha} {$c->hora}")
                          ->format('d/m/Y H:i');
            $fin = $c->fecha_fin && $c->hora_fin
                   ? Carbon::parse("{$c->fecha_fin} {$c->hora_fin}")
                         ->format('d/m/Y H:i')
                   : '—';

            // Detalle de Servicios
            $servicios = $orden->detallesServicios->map(fn($ds) => [
                'nombre'          => $ds->servicio->nombre,
                'cantidad'        => $ds->cantidad,
                'precio_unitario' => number_format($ds->precio_unitario, 2, '.', ','),
                'subtotal'        => number_format($ds->subtotal,        2, '.', ','),
            ])->toArray();
            $totServ = collect($servicios)
                       ->sum(fn($s)=> (float) str_replace(',','',$s['subtotal']));

            // Detalle de Repuestos
            $repuestos = $orden->detallesRepuestos->map(fn($dr) => [
                'nombre'          => $dr->repuesto->nombre,
                'cantidad'        => $dr->cantidad,
                'precio_unitario' => number_format($dr->precio, 2, '.', ','),
                'subtotal'        => number_format($dr->subtotal, 2, '.', ','),
            ])->toArray();
            $totRep = collect($repuestos)
                      ->sum(fn($r)=> (float) str_replace(',','',$r['subtotal']));

            return [
                'cita_id'          => $orden->id_cita,
                'inicio'           => $inicio,
                'fin'              => $fin,
                'vehiculo'         => "{$orden->vehiculo->marca} {$orden->vehiculo->modelo}",
                'servicios'        => $servicios,
                'repuestos'        => $repuestos,
                'total_servicios'  => number_format($totServ, 2, '.', ','),
                'total_repuestos'  => number_format($totRep, 2, '.', ','),
                'total_general'    => number_format($totServ + $totRep, 2, '.', ','),
            ];
        })->toArray();

        // 6) Generar PDF
        $pdf = PDF::loadView('reportes.historial_servicios', [
            'cliente'          => $cliente,
            'ordenes'          => $datos,
            'anioSeleccionado' => $anioSeleccionado,
            'mesSeleccionado'  => $mesSeleccionado,
        ]);

        // 7) Descargar
        return $pdf->download("historial-servicios_{$cliente->cedula}.pdf");
    }
}