<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Servicio;
use App\Models\OrdenServicio;

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
    ];

    protected static function booted()
    {
        // Antes de insertar
        static::creating(function($det) {
            $precio = Servicio::where('id_servicio', $det->id_servicio)
                              ->value('precio');
            $det->precio_unitario = $precio;
            $det->subtotal        = round($precio * $det->cantidad, 2);
        });

        // Antes de actualizar cantidad o servicio
        static::updating(function($det) {
            $precio = Servicio::where('id_servicio', $det->id_servicio)
                              ->value('precio');
            $det->precio_unitario = $precio;
            $det->subtotal        = round($precio * $det->cantidad, 2);
        });

        // Después de guardar (crear o actualizar)
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
