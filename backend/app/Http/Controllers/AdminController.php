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

        // 3) Dinero total generado por servicios en citas atendidas
        $dineroTotal = Cita::whereHas('estado', fn ($q) =>
                $q->where('nombre_estado', 'Atendida'))
            ->join('orden_servicio', 'orden_servicio.id_cita', '=', 'citas.id_cita')
            ->sum('orden_servicio.total_servicios');

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

    public function actualizarCliente(Request $request, string $cedula)
    {
        // 1. Validación (nota: tabla 'usuario', PK 'cedula')
        $validated = $request->validate([
            'nombre'               => 'required|string|max:100',
            'apellido'             => 'required|string|max:100',
            'correo'               => "required|email|unique:usuario,correo,{$cedula},cedula",
            'telefono'             => 'nullable|string|max:20',
            'direccion_domicilio'  => 'nullable|string|max:255',
            'fecha_nacimiento'     => 'nullable|date',
        ]);

        // 2. Buscar cliente con rol 'cliente'
        $cliente = Usuario::whereHas('roles', fn($q) =>
            $q->where('nombre', 'cliente')
        )->find($cedula);

        if (! $cliente) {
            return response()->json([
                'error' => 'Cliente no encontrado'
            ], 404);
        }

        // 3. Actualizar y guardar
        $cliente->update($validated);

        // 4. Devolver cliente actualizado
        return response()->json([
            'message' => 'Cliente actualizado correctamente',
            'cliente' => $cliente
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
