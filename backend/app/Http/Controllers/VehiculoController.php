<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\Vehiculo;
use Illuminate\Http\Request;

class VehiculoController extends Controller
{
    /**
     * Mostrar una lista de vehículos.
     */
    public function index(Request $request)
    {
        $usuario  = auth()->user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Buscar vehículos por cédula
        $vehiculos = Vehiculo::where('cedula', $usuario->cedula)->get();

        // Formatear la URL completa de las imágenes
        foreach ($vehiculos as $vehiculo) {
            $vehiculo->imagen_url = $vehiculo->imagen ? url($vehiculo->imagen) : null;
        }

        return response()->json($vehiculos);
    }

    /**
     * Guardar un nuevo vehículo.
     */
    public function store(Request $request)
    {
        $usuario = Auth::user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $validatedData = $request->validate([
            'marca' => 'required|string|max:100',
            'modelo' => 'required|string|max:100',
            'anio' => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'numero_placa' => 'required|string|max:100|unique:vehiculos',
            'transmision'      => 'required|string|max:50',
            'tipo_combustible' => 'required|string|max:50',
            'kilometraje' => 'nullable|integer|min:0',
            'fecha_ultimo_servicio' => 'nullable|date',
            'imagen' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Imagen
        if ($request->hasFile('imagen')) {
            $archivo = $request->file('imagen');
            $nombreArchivo = time() . '_' . $archivo->getClientOriginalName();
            $archivo->move(public_path('vehiculos'), $nombreArchivo);
            $validatedData['imagen'] = 'vehiculos/' . $nombreArchivo;
        }

        $validatedData['cedula'] = $usuario->cedula;

        $vehiculo = Vehiculo::create($validatedData);

        return response()->json($vehiculo, 201);
    }

    /**
     * Mostrar un vehículo específico.
     */
    public function show($id)
    {
        $vehiculo = Vehiculo::with('usuario')->findOrFail($id);
        $vehiculo->imagen_url = $vehiculo->imagen ? url($vehiculo->imagen) : null;
        return response()->json($vehiculo);
    }

    /**
     * Actualizar un vehículo específico.
     */
    public function update(Request $request, $id)
    {
        $vehiculo = Vehiculo::findOrFail($id);

        $validatedData = $request->validate([
            'marca' => 'required|string|max:100',
            'modelo' => 'required|string|max:100',
            'anio' => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'numero_placa' => 'required|string|max:100|unique:vehiculos,numero_placa,' . $vehiculo->id_vehiculo . ',id_vehiculo',
            'transmision'      => 'required|string|max:50',
            'tipo_combustible' => 'required|string|max:50',
            'kilometraje' => 'nullable|integer|min:0',
            'fecha_ultimo_servicio' => 'nullable|date',
            'imagen' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Imagen nueva
        if ($request->hasFile('imagen')) {
            if ($vehiculo->imagen && file_exists(public_path($vehiculo->imagen))) {
                unlink(public_path($vehiculo->imagen));
            }

            $archivo = $request->file('imagen');
            $nombreArchivo = time() . '_' . $archivo->getClientOriginalName();
            $archivo->move(public_path('vehiculos'), $nombreArchivo);
            $validatedData['imagen'] = 'vehiculos/' . $nombreArchivo;
        }

        $vehiculo->update($validatedData);
        $vehiculo->imagen_url = $vehiculo->imagen ? url($vehiculo->imagen) . '?t=' . now()->timestamp : null;

        return response()->json($vehiculo);
    }

    /**
     * Borrado lógico de un vehículo.
     */
    public function destroy($id)
    {
        $vehiculo = Vehiculo::findOrFail($id);

        // Eliminar la imagen del servidor si existe
        if ($vehiculo->imagen && file_exists(public_path($vehiculo->imagen))) {
            unlink(public_path($vehiculo->imagen));
        }

        // Realizar el borrado lógico
        $vehiculo->delete();

        return response()->json(['message' => 'Vehículo eliminado correctamente.']);
    }

    /**
     * Verificar si el número de placa ya está registrado.
     */
    public function verificarPlaca($numero_placa)
    {
        $existe = Vehiculo::where('numero_placa', $numero_placa)->exists();

        return response()->json(['existe' => $existe]);
    }

}