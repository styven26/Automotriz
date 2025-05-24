<?php

namespace App\Http\Controllers;

use App\Models\Horario;
use Illuminate\Http\Request;

class HorarioController extends Controller
{
    public function index()
    {
        $horarios = Horario::all();
        return response()->json($horarios);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'dia_semana' => 'required|string|max:20',
            'manana_inicio' => 'nullable|date_format:H:i',
            'tarde_fin'     => 'nullable|date_format:H:i|after:manana_inicio',
            'capacidad_max' => 'required|integer|min:1|max:10'
        ]);

        $horario = Horario::create($validatedData);

        return response()->json(['message' => 'Horario creado exitosamente', 'horario' => $horario], 201);
    }

    public function show($id)
    {
        try {
            $horario = Horario::findOrFail($id);
            return response()->json($horario);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Horario no encontrado'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'dia_semana' => 'required|string|max:20',
            'manana_inicio' => 'nullable|date_format:H:i',
            'tarde_fin'     => 'nullable|date_format:H:i|after:manana_inicio',
            'capacidad_max' => 'required|integer|min:1|max:10'
        ]);

        $horario = Horario::findOrFail($id);
        $horario->update($validatedData);

        return response()->json(['message' => 'Horario actualizado exitosamente', 'horario' => $horario], 200);
    }

    public function verificarFranjaHoraria(Request $request)
    {
        $request->validate([
            'dia_semana' => 'required|string|max:20',
            'manana_inicio' => 'nullable|string',
            'tarde_fin' => 'nullable|string',
            'capacidad_max' => 'required|integer|min:1|max:10'
        ]);

        // Verificar solapamiento
        $existeSolapamiento = Horario::where('dia_semana', $request->dia_semana)
            ->when($request->has('id'), function ($query) use ($request) {
                $query->where('id_horario', '!=', $request->id);
            })
            ->exists();

        return response()->json(['existe' => $existeSolapamiento]);
    }

    public function destroy($id)
    {
        $horario = Horario::findOrFail($id);
        $horario->delete();
        return response()->json(['message' => 'Horario eliminado exitosamente'], 200);
    }
}