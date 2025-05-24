<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cita;
use App\Models\Usuario;

class AdminController extends Controller
{
    public function dashboard()
    {
        return response()->json(['message' => 'Bienvenido al dashboard de administradores']);
    }

    public function dashboardStats()
    {
        // 1) Total de citas atendidas
        $totalCitasConfirmadas = Cita::whereHas('estado', function($q) {
            $q->where('nombre_estado', 'atendida');
        })->count();

        // 2) Totales de roles
        $totalMecanicos = Usuario::whereHas('roles', fn($q)=> $q->where('nombre','mecánico'))->count();
        $totalClientes  = Usuario::whereHas('roles', fn($q)=> $q->where('nombre','cliente'))->count();

        // 3) Dinero total de citas atendidas (ejemplo con detalle_servicio y servicios)
        $dineroTotal = Cita::whereHas('estado', fn($q)=> $q->where('nombre_estado','atendida'))
            ->join('orden_servicio',   'citas.id_cita',         '=', 'orden_servicio.id_cita')
            ->join('detalle_servicio', 'orden_servicio.id_orden','=', 'detalle_servicio.id_orden')
            ->join('servicios',        'detalle_servicio.id_servicio','=', 'servicios.id_servicio')
            ->sum('servicios.precio');

        return response()->json([
            'totalCitas'    => $totalCitasConfirmadas,
            'totalMecanicos'=> $totalMecanicos,
            'totalClientes' => $totalClientes,
            'dineroTotal'   => $dineroTotal,
        ]);
    }

    public function citasYClientesPorMes()
    {
        // Citas atendidas por mes/año
        $citas = Cita::whereHas('estado', fn($q)=> $q->where('nombre_estado','atendida'))
            ->selectRaw('YEAR(fecha) AS anio, MONTH(fecha) AS mes, COUNT(*) AS total_citas')
            ->groupBy('anio','mes')
            ->orderBy('anio')
            ->orderBy('mes')
            ->get();

        // Clientes por mes/año
        $clientes = Usuario::whereHas('roles', fn($q)=> $q->where('nombre','cliente'))
            ->selectRaw('YEAR(created_at) AS anio, MONTH(created_at) AS mes, COUNT(*) AS total_clientes')
            ->groupBy('anio','mes')
            ->orderBy('anio')
            ->orderBy('mes')
            ->get();

        return response()->json([
            'citas'    => $citas,
            'clientes' => $clientes,
        ]);
    }

    public function listarClientes()
    {
        $clientes = Usuario::whereHas('roles', function ($query) {
            $query->where('nombre', 'cliente');
        })->select('cedula', 'nombre', 'apellido', 'correo', 'telefono', 'direccion_domicilio', 'fecha_nacimiento')
          ->get();

        return response()->json([
            'clientes' => $clientes
        ], 200);
    }

    public function eliminarCliente($cedula)
    {
        $cliente = Usuario::whereHas('roles', fn($q) => 
            $q->where('nombre','cliente')
        )->find($cedula);

        if (! $cliente) {
            return response()->json([
                'error' => 'Cliente no encontrado'
            ], 404);
        }

        $cliente->delete();

        return response()->json([
            'message' => 'Cliente eliminado correctamente'
        ], 200);
    }

}
