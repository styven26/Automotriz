<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\DetalleRepuesto;
use App\Models\OrdenServicio;

class Repuesto extends Model
{
    use SoftDeletes;

    protected $table = 'repuestos';
    protected $primaryKey = 'id_repuesto';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'cedula',
        'nombre',
        'precio_base',
        'iva',
        'precio_final',
        'stock',
        'stock_minimo',
        'created_at',
    ];

    protected static function booted()
    {
        // 1) Cada vez que cambie precio_base o iva, recalcula precio_final:
        static::saving(function(Repuesto $rep) {
            $rep->precio_final = round($rep->precio_base * (1 + $rep->iva / 100), 2);
        });

        // 2) Tras actualizar un repuesto, propaga a sus detalles:
        static::updated(function(Repuesto $rep) {
            // Actualiza cada DetalleRepuesto ligado
            $rep->detallesRepuestos()->get()->each(function(DetalleRepuesto $det) use ($rep) {
                $det->precio   = $rep->precio_final;
                $det->subtotal = round($det->cantidad * $rep->precio_final, 2);
                $det->saveQuietly();
            });

            // Recalcula total_repuestos en cada orden afectada
            $ordenIds = $rep->detallesRepuestos()->pluck('id_orden')->unique();
            OrdenServicio::whereIn('id_orden', $ordenIds)->get()->each(function(OrdenServicio $orden) {
                $orden->total_repuestos = $orden->detallesRepuestos()->sum('subtotal');
                $orden->saveQuietly();
            });
        });
    }

    /**
     * Un repuesto pertenece a un usuario (quien lo registra), si aplica.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'cedula', 'cedula');
    }

    /**
     * Un repuesto puede aparecer en muchos detalles de repuesto.
     */
    public function detallesRepuestos()
    {
        return $this->hasMany(DetalleRepuesto::class, 'id_repuesto', 'id_repuesto');
    }

    /**
     * Para acceder rápidamente a las órdenes en las que se usó el repuesto:
     */
    public function ordenes()
    {
        return $this->belongsToMany(
            OrdenServicio::class,
            'detalle_repuesto',
            'id_repuesto',
            'id_orden'
        )
        ->withPivot(['cantidad','precio','subtotal'])
        ->withTimestamps();
    }

    /**
     * Scope para filtrar repuestos cuyo stock está en o por debajo del mínimo.
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'stock_minimo');
    }
}
