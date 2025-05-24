<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenServicio extends Model
{
    protected $table = 'orden_servicio';
    protected $primaryKey = 'id_orden';
    public $incrementing = true;
    protected $keyType = 'int';

    // **Deshabilitamos el manejo automático de created_at / updated_at**
    public $timestamps = false;

    protected $fillable = [
        'id_cita',
        'id_vehiculo',
        'fecha_inicio',
        'fecha_fin',
        'diagnostico',
        'servicios_recomendados',
        'descripcion',
        'total_servicios',
        'total_repuestos',
    ];

    /**
     * Una orden pertenece a una cita.
     */
    public function cita()
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }

    /**
     * Una orden pertenece a un vehículo.
     */
    public function vehiculo()
    {
        return $this->belongsTo(Vehiculo::class, 'id_vehiculo', 'id_vehiculo');
    }

    /**
     * Una orden tiene muchos detalles de servicio.
     */
    public function detallesServicios()
    {
        return $this->hasMany(DetalleServicio::class, 'id_orden', 'id_orden');
    }

    /**
     * Una orden tiene muchos detalles de repuesto.
     */
    public function detallesRepuestos()
    {
        return $this->hasMany(DetalleRepuesto::class, 'id_orden', 'id_orden');
    }
}
