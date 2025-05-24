<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DetalleRepuesto extends Model
{
    use SoftDeletes;

    protected $table = 'detalle_repuesto';
    protected $primaryKey = 'id_detalle_repuesto';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'id_repuesto',
        'id_orden',
        'cantidad',
        'precio',
        'subtotal',
    ];

    /**
     * Un detalle de repuesto pertenece a un repuesto.
     */
    public function repuesto()
    {
        return $this->belongsTo(Repuesto::class, 'id_repuesto', 'id_repuesto');
    }

    /**
     * Un detalle de repuesto pertenece a una orden de servicio.
     */
    public function orden()
    {
        return $this->belongsTo(OrdenServicio::class, 'id_orden', 'id_orden');
    }
}
