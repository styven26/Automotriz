<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OptionController extends Controller
{
    /** Ruta del archivo JSON donde se guardan las opciones */
    protected $path = 'vehiculo_options.json';

    /**
     * Carga el contenido del JSON (o lo inicializa si no existe).
     *
     * @return array
     */
    private function load(): array
    {
        if (! Storage::exists($this->path)) {
            // Inicializamos todas las claves incluyendo especialidades
            Storage::put($this->path, json_encode([
                'transmissions'   => [],
                'fuel_types'      => [],
                'especialidades'  => []
            ], JSON_PRETTY_PRINT));
        }

        return json_decode(Storage::get($this->path), true);
    }

    /**
     * Guarda el array de opciones en el JSON.
     *
     * @param array $opts
     */
    private function save(array $opts): void
    {
        Storage::put($this->path, json_encode($opts, JSON_PRETTY_PRINT));
    }

    /** ***********************
     *  Rutas de listado
     *************************/

    /**
     * Devuelve todas las listas: transmisiones, fuel_types y especialidades.
     */
    public function index()
    {
        return response()->json($this->load(), 200);
    }

    /** ***********************
     *  Transmissions
     *************************/

    /**
     * Agrega una nueva transmisión.
     */
    public function addTransmission(Request $r)
    {
        $r->validate(['name' => 'required|string']);
        $opts = $this->load();
        $opts['transmissions'][] = [
            'id'   => Str::uuid()->toString(),
            'name' => $r->name
        ];
        $this->save($opts);
        return response()->json($opts['transmissions'], 201);
    }

    /**
     * Elimina una transmisión existente por ID.
     */
    public function deleteTransmission(string $id)
    {
        $opts = $this->load();
        $opts['transmissions'] = array_values(
            array_filter($opts['transmissions'], fn($t) => $t['id'] !== $id)
        );
        $this->save($opts);
        return response()->noContent();
    }

    /** ***********************
     *  Fuel Types
     *************************/

    /**
     * Agrega un nuevo tipo de combustible.
     */
    public function addFuelType(Request $r)
    {
        $r->validate(['name' => 'required|string']);
        $opts = $this->load();
        $opts['fuel_types'][] = [
            'id'   => Str::uuid()->toString(),
            'name' => $r->name
        ];
        $this->save($opts);
        return response()->json($opts['fuel_types'], 201);
    }

    /**
     * Elimina un tipo de combustible existente por ID.
     */
    public function deleteFuelType(string $id)
    {
        $opts = $this->load();
        $opts['fuel_types'] = array_values(
            array_filter($opts['fuel_types'], fn($f) => $f['id'] !== $id)
        );
        $this->save($opts);
        return response()->noContent();
    }

    /** ***********************
     *  Especialidades
     *************************/

    /**
     * Agrega una nueva especialidad.
     */
    public function addEspecialidad(Request $r)
    {
        $r->validate(['name' => 'required|string']);
        $opts = $this->load();
        $opts['especialidades'][] = [
            'id'   => Str::uuid()->toString(),
            'name' => $r->name
        ];
        $this->save($opts);
        return response()->json($opts['especialidades'], 201);
    }

    /**
     * Elimina una especialidad por ID.
     */
    public function deleteEspecialidad(string $id)
    {
        $opts = $this->load();
        $opts['especialidades'] = array_values(
            array_filter($opts['especialidades'], fn($e) => $e['id'] !== $id)
        );
        $this->save($opts);
        return response()->noContent();
    }
}
