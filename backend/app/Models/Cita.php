<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cita extends Model
{
    use SoftDeletes;

    protected $table = 'citas';
    protected $primaryKey = 'id_cita';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'id_estado',
        'id_horario',
        'cedula_cliente',
        'cedula_mecanico',
        'id_vehiculo',
        'activo',
        'fecha',
        'hora',
        'fecha_fin',
        'hora_fin',
    ];

    /**
     * Relación con el modelo Usuario para el cliente.
     */
    public function cliente()
    {
        return $this->belongsTo(Usuario::class, 'cedula_cliente', 'cedula');
    }

    /**
     * Relación con el modelo Usuario para el mecánico.
     */
    public function mecanico()
    {
        return $this->belongsTo(Usuario::class, 'cedula_mecanico', 'cedula');
    }

    /**
     * Una cita pertenece a un estado.
     */
    public function estado()
    {
        return $this->belongsTo(EstadoCita::class, 'id_estado', 'id_estado');
    }

    /**
     * Una cita pertenece a un horario.
     */
    public function horario()
    {
        return $this->belongsTo(Horario::class, 'id_horario', 'id_horario');
    }

    /**
     * Una cita pertenece a un usuario (cliente).
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'cedula', 'cedula');
    }

    /**
     * Una cita pertenece a un vehículo.
     */
    public function vehiculo()
    {
        return $this->belongsTo(Vehiculo::class, 'id_vehiculo', 'id_vehiculo');
    }

    /**
     * (Opcional) Si cada cita genera una orden de servicio.
     */
    public function ordenServicio()
    {
        return $this->hasOne(OrdenServicio::class, 'id_cita', 'id_cita');
    }
}
