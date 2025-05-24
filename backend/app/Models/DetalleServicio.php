<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleServicio extends Model
{
    protected $table = 'detalle_servicio';
    protected $primaryKey = 'id_detalle';
    public $incrementing = true;
    protected $keyType = 'int';

    // **Deshabilitamos el manejo automático de created_at / updated_at**
    public $timestamps = false;

    protected $fillable = [
        'id_orden',
        'id_servicio',
        'descripcion',
        'progreso',
    ];

    /**
     * Un detalle pertenece a una orden de servicio.
     */
    public function orden()
    {
        return $this->belongsTo(OrdenServicio::class, 'id_orden', 'id_orden');
    }

    /**
     * Un detalle pertenece a un servicio.
     */
    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'id_servicio', 'id_servicio');
    }
}
