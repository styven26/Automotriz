<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DiagnosticoController;
use App\Http\Controllers\VehiculoController;
use App\Http\Controllers\CitasController;
use App\Http\Controllers\TipoServicioController;
use App\Http\Controllers\ServicioController;
use App\Http\Controllers\RepuestoController;
use App\Http\Controllers\DetalleRepuestoController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\OrdenServicioController;
use App\Http\Controllers\DetalleServicioController;
use App\Http\Controllers\HistorialController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ReportController;

// Rutas de autenticación
Route::prefix('auth')->group(function () {
    Route::post('/login',                  [AuthenticatedSessionController::class, 'login']);
    Route::post('/cambiar-rol',            [AuthenticatedSessionController::class, 'cambiarRol']);
    Route::post('/register',               [RegisteredUserController::class, 'register']);
    Route::post('/logout',                 [AuthenticatedSessionController::class, 'logout']);

    // Recuperar contraseña
    Route::post('/password/reset',         [PasswordResetController::class, 'sendResetLink']);

    // Confirmar cambio de contraseña
    Route::post('/password/reset/confirm', [PasswordResetController::class, 'resetPassword']);
});

// Rutas protegidas para dashboards
Route::get('/cliente/dashboard',   [AuthenticatedSessionController::class, 'protectedRoute']);
Route::get('/admin/dashboard',     [AuthenticatedSessionController::class, 'protectedRoute']);
Route::get('/mecanico/dashboard',  [AuthenticatedSessionController::class, 'protectedRoute']);

// Rutas exclusivas del administrador
Route::prefix('admin')->middleware('auth:admin')->group(function () {
    Route::get('/dashboard',                [AdminController::class, 'dashboardStats']);
    
    // Listado de Citas Mecanicos
    Route::get('/cita-mecanicos',           [CitasController::class, 'listarCitasGlobal']);

    // Listar Clientes
    Route::get('/clientes',                 [AdminController::class, 'listarClientes']);

    // Reportes
    Route::get('/dashboard/citas-clientes', [AdminController::class, 'citasYClientesPorMes']);

    // Eliminar Clientes
    Route::delete('/clientes/{id}',         [AdminController::class, 'eliminarCliente']);

    // CRUD de mecanicos
    Route::apiResource('mecanicos', App\Http\Controllers\MecanicoController::class);

    // CRUD de tipos de servicios
    Route::apiResource('tipos-servicios', TipoServicioController::class);

    // CRUD de subtipos de servicios
    Route::apiResource('subtipos-servicios', ServicioController::class);

    // CRUD de horarios
    Route::apiResource('horarios', HorarioController::class);

    // Reportes
    Route::get('/reporte-clientes',    [ReportController::class, 'descargarReporteClientes']);
    Route::get('/reporte-citas',       [ReportController::class, 'descargarReporteCitas']);
    Route::get('/reporte-trabajos',    [ReportController::class, 'descargarReporteTrabajos']);
    Route::get('/reporte-financiero',  [ReportController::class, 'descargarReporteFinanciero']);
});

// Rutas exclusivas del mecánico
Route::prefix('mecanico')->middleware('auth:mecanico')->group(function () {
    Route::get('/dashboard', function () {
        return response()->json(['message' => 'Bienvenido al dashboard de mecánico']);
    });

    // Listar citas asignadas al mecánico
    Route::get('/citas',                     [CitasController::class, 'listarCitasMecanico']);
    Route::post('/citas/{cita}/diagnostico', [DiagnosticoController::class, 'store']);
    Route::apiResource('detalle-repuestos', DetalleRepuestoController::class);

    // Diagnósticos
    Route::get('/diagnosticos',                                                  [DiagnosticoController::class, 'index']);
    Route::put('/diagnosticos/{ordenServicio}',                                  [DiagnosticoController::class, 'update']);
    Route::post('diagnosticos/{idOrden}/enviarCorreoServiciosRecomendados',      [DiagnosticoController::class, 'enviarCorreoServiciosRecomendados']);
    Route::post('diagnosticos/{idOrden}/enviarCorreoSinServicios',               [DiagnosticoController::class, 'enviarCorreoSinServicios']);

    // Orden de servicio 
    Route::get   ('/ordenes',                        [OrdenServicioController::class,'index']);
    Route::get   ('/ordenes/confirmadas',            [OrdenServicioController::class,'listarOrdenesConfirmadas']);
    Route::get   ('/ordenes/{id}',                   [OrdenServicioController::class,'show']);
    Route::patch ('/ordenes/{id}/progreso',          [OrdenServicioController::class,'actualizarProgreso']);
    Route::patch ('/ordenes/{id}/descripciones',     [OrdenServicioController::class,'actualizarDescripcion']);
    Route::post  ('/ordenes/{id}/finalizar-auto',    [OrdenServicioController::class,'finalizarOrdenAutomatico']);

    // Reportes
    Route::get('/reporte-trabajos',                  [ReportController::class, 'descargarReporte']);
});

    // Rutas abiertas para que el cliente no autenticado haga clic
    Route::get('mecanico/diagnosticos/{idOrden}/aceptar',  [DiagnosticoController::class, 'aceptarServiciosRecomendados']);
    Route::get('mecanico/diagnosticos/{idOrden}/rechazar', [DiagnosticoController::class, 'rechazarServiciosRecomendados']);

// Rutas exclusivas del cliente
Route::prefix('cliente')->middleware('auth:cliente')->group(function () {
    Route::get('/dashboard', function () {
        return response()->json(['message' => 'Bienvenido al dashboard de cliente']);
    });

    // Gestión de vehículos
    Route::get('/vehiculos',                                [VehiculoController::class, 'index']);
    Route::post('/vehiculos',                               [VehiculoController::class, 'store']);
    Route::put('/vehiculos/{id}',                           [VehiculoController::class, 'update']);
    Route::delete('/vehiculos/{id}',                        [VehiculoController::class, 'destroy']);
    Route::get('/vehiculos/verificar-placa/{numero_placa}', [VehiculoController::class, 'verificarPlaca']);

    // Gestión de citas
    Route::get('/citas',                             [CitasController::class, 'index']);
    Route::post('/citas',                            [CitasController::class, 'store']);
    Route::get('/citas/listar',                      [CitasController::class, 'listarCitas']);
    Route::get('/citas/atentida',                    [CitasController::class, 'listarCitasAtentidas']);
    Route::put('/citas/{id}',                        [CitasController::class, 'update']);
    Route::delete('/citas/{id}',                     [CitasController::class, 'destroy']);
    Route::post('/citas/obtener-capacidad',          [CitasController::class, 'obtenerCapacidad']);
    Route::post('/citas/horarios-sugeridos-despues', [CitasController::class, 'obtenerHorariosSugeridosDespues']);
    Route::get('citas/ocupados',                     [CitasController::class, 'vehiculosOcupados']);

    // Reportes
    Route::get('/citas/facturacion',            [CitasController::class, 'obtenerFacturacionTotal']);
    Route::get('/citas/distribucion',           [CitasController::class, 'distribucionServiciosSolicitados']);
    Route::get('/citas/ingresos',               [CitasController::class, 'ingresosPorMes']);

    // Obtener horarios disponibles
    Route::post('/citas/horarios/almuerzo',     [CitasController::class, 'obtenerHorarioAlmuerzo']);

    // Monitoreo de vehículos
    Route::get('/monitoreos',                   [DetalleServicioController::class, 'monitoreosCliente']);
    Route::get('/monitoreo/{idVehiculo}',       [DetalleServicioController::class, 'monitoreoVehiculo']);

    // Historial de servicios
    Route::get('/historial',                    [HistorialController::class, 'index']);
    Route::put('/historial/{id}/pagar',         [HistorialController::class, 'actualizarEstadoPago']);

    // Reportes
    Route::get('/reportes/estado-vehiculos',    [ReportController::class, 'descargarEstadoVehiculos']);
    Route::get('/reportes/historial-servicios', [ReportController::class, 'descargarHistorialServicios']);
});

// Rutas exclusivas del vendedor
Route::prefix('vendedor')->middleware('auth:vendedor')->group(function () {
    Route::get('/dashboard', function () {
        return response()->json(['message' => 'Bienvenido al dashboard de vendedor']);
    });

    // Repuestos
    Route::apiResource('repuestos', RepuestoController::class);
});

// Rutas públicas
Route::prefix('public')->group(function () {
    
    // CRUD completo con Route Model Binding
    Route::get   ('tipos-servicios',                [TipoServicioController::class, 'index']);
    Route::post  ('tipos-servicios',                [TipoServicioController::class, 'store']);
    Route::get   ('tipos-servicios/{tipoServicio}', [TipoServicioController::class, 'show']);
    Route::put   ('tipos-servicios/{tipoServicio}', [TipoServicioController::class, 'update']);
    Route::delete('tipos-servicios/{tipoServicio}', [TipoServicioController::class, 'destroy']);
    Route::get('tipos-servicios/existe/{nombre}',   [TipoServicioController::class, 'verificarNombreExiste']);

    // Obtener servicios
    Route::post('/servicios',                  [ServicioController::class, 'store']);
    Route::get('/servicios',                   [ServicioController::class, 'index']);
    Route::put('/servicios/{id}',              [ServicioController::class, 'update']);
    Route::delete('/servicios/{id}',           [ServicioController::class, 'destroy']);
    Route::get   ('servicios/existe/{nombre}', [ServicioController::class,'verificarNombreExiste']);

    // Obtener horarios
    Route::get('/horarios',            [HorarioController::class, 'index']); 
    Route::post('/horarios',           [HorarioController::class, 'store']);
    Route::put('/horarios/{id}',       [HorarioController::class, 'update']);
    Route::delete('/horarios/{id}',    [HorarioController::class, 'destroy']);
    Route::post('/horarios/verificar', [HorarioController::class, 'verificarFranjaHoraria']);
});