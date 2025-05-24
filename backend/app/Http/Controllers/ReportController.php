<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Usuario;
use App\Models\Cita;
use App\Models\Vehiculo;
use App\Models\OrdenServicio;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function descargarReporte(Request $request)
    {
        /// Obtener el mecánico autenticado
        $mecanico = Auth::user();
        
        if (!$mecanico || !$mecanico->tieneRol('mecanico')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // Filtrar los trabajos completados asignados al mecánico autenticado
        $trabajos = Trabajo::with(['cita.cliente', 'vehiculo'])
            ->where('id_mecanico', $mecanico->id)
            ->where('estado', 'completado') // Filtrar solo trabajos completados
            ->get()
            ->map(function ($trabajo) {
                // Agregar nombre completo del cliente
                $trabajo->cliente_nombre_completo = $trabajo->cita->cliente 
                    ? $trabajo->cita->cliente->nombre . ' ' . $trabajo->cita->cliente->apellido 
                    : 'Sin cliente';
                return $trabajo;
        });

        if ($trabajos->isEmpty()) {
            return response()->json(['error' => 'No hay trabajos completados para generar el reporte.'], 404);
        }

        // Generar el PDF con los trabajos filtrados
        $pdf = Pdf::loadView('reportes.trabajos', compact('trabajos'));
        return $pdf->download('reporte-trabajos.pdf');
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
    public function descargarReporteCitas(Request $request)
    {

        $admin = Auth::user();

        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // Obtener los filtros de año y mes desde el request
        $anio = $request->input('anio'); // Año
        $mes = $request->input('mes'); // Mes (1-12)

        // Consulta base de las citas
        $citasQuery = Cita::with([
            'cliente' => function ($query) {
                $query->select('id', 'nombre', 'apellido');
            },
            'vehiculo' => function ($query) {
                $query->select('id', 'marca', 'modelo');
            },
            'mecanico' => function ($query) {
                $query->select('id', 'nombre', 'apellido');
            },
            'subtipos.tipoServicio' => function ($query) {
                $query->select('id', 'nombre');
            }
        ])
        ->where('estado', 'atendida'); // Solo citas atendidas

        // Aplicar filtros por año
        if ($anio) {
            $citasQuery->whereYear('fecha', $anio);
        }

        // Aplicar filtros por mes
        if ($mes) {
            $citasQuery->whereMonth('fecha', $mes);
        }

        // Obtener las citas filtradas
        $citas = $citasQuery->get()->map(function ($cita) {
            return [
                'cliente' => optional($cita->cliente)->nombre . ' ' . optional($cita->cliente)->apellido,
                'vehiculo' => optional($cita->vehiculo)->marca . ' ' . optional($cita->vehiculo)->modelo,
                'mecanico' => optional($cita->mecanico)->nombre . ' ' . optional($cita->mecanico)->apellido,
                'estado' => ucfirst($cita->estado),
                'subtipos' => $cita->subtipos->map(function ($subtipo) {
                    return [
                        'tipo' => optional($subtipo->tipoServicio)->nombre,
                        'nombre' => $subtipo->nombre,
                    ];
                }),
            ];
        });

        // Pasar los valores seleccionados al archivo de vista
        $meses = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];

        $mesSeleccionado = $mes ? $meses[$mes] : 'Todos los meses';
        $anioSeleccionado = $anio ?: 'Todos los años';

        // Generar el PDF
        $pdf = Pdf::loadView('reportes.citas', compact('citas', 'anioSeleccionado', 'mesSeleccionado'));
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

    // Reporte financiero
    public function descargarReporteFinanciero(Request $request)
    {
        $admin = Auth::user();

        if (!$admin || !$admin->hasRole('admin')) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $anio = $request->input('anio'); // Año
        $mes = $request->input('mes');  // Mes (1-12)

        try {
            // Validar año
            if ($anio && (!is_numeric($anio) || strlen($anio) != 4)) {
                return response()->json(['error' => 'Año inválido.'], 400);
            }

            // Validar mes
            if ($mes && (!is_numeric($mes) || $mes < 1 || $mes > 12)) {
                return response()->json(['error' => 'Mes inválido.'], 400);
            }

            // Consulta de citas atendidas
            $citasQuery = Cita::where('estado', 'atendida')
                ->join('usuario as clientes', 'citas.id_cliente', '=', 'clientes.id') // Cambiar a 'usuario'
                ->join('cita_subtipos', 'citas.id', '=', 'cita_subtipos.id_cita')
                ->join('subtipos_servicios', 'cita_subtipos.id_subtipo', '=', 'subtipos_servicios.id')
                ->select(
                    'citas.fecha',
                    'clientes.nombre as cliente_nombre',
                    'clientes.apellido as cliente_apellido',
                    'subtipos_servicios.nombre as servicio_nombre',
                    'subtipos_servicios.precio'
                );

            // Aplicar filtros por año y mes
            if ($anio) {
                $citasQuery->whereYear('citas.fecha', $anio);
            }

            if ($mes) {
                $citasQuery->whereMonth('citas.fecha', $mes);
            }

            $citasAtendidas = $citasQuery->get();

            // Calcular el total de ingresos
            $totalIngresos = $citasAtendidas->sum('precio');

            // Valores dinámicos
            $meses = [
                1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
            ];

            $mesSeleccionado = $mes ? $meses[$mes] : 'Todos los meses';
            $anioSeleccionado = $anio ?: 'Todos los años';

            // Preparar mensaje en caso de no haber datos
            $mensaje = $citasAtendidas->isEmpty() 
                ? 'No hay ingresos registrados para el período seleccionado.' 
                : null;

            // Generar el PDF
            $pdf = Pdf::loadView('reportes.financiero', compact('citasAtendidas', 'totalIngresos', 'anioSeleccionado', 'mesSeleccionado', 'mensaje'));

            return $pdf->download('reporte-financiero.pdf');
        } catch (\Exception $e) {
            \Log::error('Error al generar el reporte financiero: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Ocurrió un error al generar el reporte.'], 500);
        }
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
        // 1) Obtener cliente autenticado
        $cliente = Auth::guard('cliente')->user();
        if (! $cliente) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // 2) Obtener filtros de año y mes
        $anio = $request->input('anio');
        $mes  = $request->input('mes');

        // 2.1) Validar año
        if ($anio && (! is_numeric($anio) || strlen($anio) !== 4)) {
            return response()->json(['error' => 'Año inválido.'], 400);
        }
        // 2.2) Validar mes
        if ($mes && (! is_numeric($mes) || $mes < 1 || $mes > 12)) {
            return response()->json(['error' => 'Mes inválido.'], 400);
        }

        // 3) Preparar nombres legibles de meses
        $meses = [
            1 => 'Enero',    2 => 'Febrero',  3 => 'Marzo',     4 => 'Abril',
            5 => 'Mayo',     6 => 'Junio',    7 => 'Julio',     8 => 'Agosto',
            9 => 'Septiembre',10 => 'Octubre',11 => 'Noviembre',12 => 'Diciembre',
        ];
        $mesSeleccionado  = $mes  ? $meses[intval($mes)] : 'Todos los meses';
        $anioSeleccionado = $anio ? $anio            : 'Todos los años';

        // 4) Recuperar órdenes atendidas para este cliente, aplicando filtros
        $ordenes = OrdenServicio::whereHas('cita', function($q) use($cliente, $anio, $mes) {
                // la cita debe pertenecer al cliente y estar “Atendida”
                $q->where('cedula_cliente', $cliente->cedula)
                ->whereHas('estado', fn($q2) => $q2->where('nombre_estado','Atendida'));
                if ($anio) $q->whereYear('fecha', $anio);
                if ($mes)  $q->whereMonth('fecha', $mes);
            })
            ->with([
                'cita:id_cita,fecha,fecha_fin',
                'vehiculo:id_vehiculo,marca,modelo',
                'detallesServicios.servicio:id_servicio,nombre,precio'
            ])
            ->get();

        // 5) Mapear cada detalle de servicio para el PDF
        $servicios = $ordenes->flatMap(function($orden) {
            return $orden->detallesServicios->map(function($det) use($orden) {
                $serv = $det->servicio;
                $fecha = $orden->cita->fecha_fin
                    ? \Carbon\Carbon::parse($orden->cita->fecha_fin)->format('d/m/Y')
                    : (\Carbon\Carbon::parse($orden->cita->fecha)->format('d/m/Y') ?? 'N/A');
                return [
                    'fecha'         => $fecha,
                    'vehiculo'      => "{$orden->vehiculo->marca} {$orden->vehiculo->modelo}",
                    'tipo_servicio' => $serv->nombre,
                    'precio'        => number_format($serv->precio, 2, '.', ','),
                ];
            });
        });

        // 6) Sumar los costos totales
        $totalCostos = $servicios->sum(fn($row) => floatval(str_replace(',','',$row['precio'])));

        // 7) Generar el PDF
        $pdf = Pdf::loadView('reportes.historial_servicios', [
            'servicios'        => $servicios,
            'anioSeleccionado' => $anioSeleccionado,
            'mesSeleccionado'  => $mesSeleccionado,
            'totalCostos'      => number_format($totalCostos, 2, '.', ','),
        ]);

        // 8) Devolver descarga
        return $pdf->download("historial-servicios_{$cliente->cedula}.pdf");
    }
}