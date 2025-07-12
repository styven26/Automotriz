<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehiculo extends Model
{
    use SoftDeletes;

    protected $table = 'vehiculos';
    protected $primaryKey = 'id_vehiculo';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'cedula',
        'marca',
        'modelo',
        'anio',
        'numero_placa',
        'transmision',
        'tipo_combustible',
        'kilometraje',
        'fecha_ultimo_servicio',
        'detalle_ultimo_servicio',
        'imagen',
    ];

    /**
     * Un vehículo pertenece a un usuario.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'cedula', 'cedula');
    }

    /**
     * Un vehículo puede tener muchas citas.
     */
    public function citas()
    {
        return $this->hasMany(Cita::class, 'id_vehiculo', 'id_vehiculo');
    }

    /**
     * Un vehículo puede tener muchas órdenes de servicio.
     */
    public function ordenesServicio()
    {
        return $this->hasMany(OrdenServicio::class, 'id_vehiculo', 'id_vehiculo');
    }
}
