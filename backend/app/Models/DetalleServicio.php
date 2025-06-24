<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleServicio extends Model
{
    protected $table = 'detalle_servicio';
    protected $primaryKey = 'id_detalle';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'id_orden',
        'id_servicio',
        'descripcion',
        'progreso',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    public static function boot()
    {
        parent::boot();

        static::saving(function($det) {
            // Siempre toma el precio actualizado
            $det->precio_unitario = $det->servicio->precio;
            $det->subtotal        = round($det->precio_unitario * $det->cantidad, 2);
        });

        static::saved(function($det) {
            $orden = $det->orden;
            $orden->total_servicios = $orden->detallesServicios()->sum('subtotal');
            $orden->saveQuietly();
        });
    }

    public function orden()
    {
        return $this->belongsTo(OrdenServicio::class, 'id_orden', 'id_orden');
    }

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'id_servicio', 'id_servicio');
    }
}
