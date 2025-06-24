<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Repuesto;
use App\Models\OrdenServicio;

class DetalleRepuesto extends Model
{
    protected $table = 'detalle_repuesto';
    protected $primaryKey = 'id_detalle_repuesto';
    protected $keyType = 'int';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'id_repuesto',
        'id_orden',
        'cantidad',
        'precio',
        'subtotal',
    ];

    public static function boot()
    {
        parent::boot();

        // Antes de crear o actualizar: toma siempre el precio_final del repuesto y recalcula subtotal
        static::saving(function(DetalleRepuesto $det) {
            $det->precio   = $det->repuesto->precio_final;
            $det->subtotal = round($det->cantidad * $det->precio, 2);
        });

        // Después de guardar: actualiza el total_repuestos en la orden padre
        static::saved(function(DetalleRepuesto $det) {
            $orden = $det->orden;
            $orden->total_repuestos = $orden->detallesRepuestos()->sum('subtotal');
            $orden->saveQuietly();
        });
    }

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
