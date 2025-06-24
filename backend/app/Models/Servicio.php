<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\DetalleServicio;
use App\Models\OrdenServicio;

class Servicio extends Model
{
    protected $table = 'servicios';
    protected $primaryKey = 'id_servicio';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'id_tipo',
        'nombre',
        'descripcion',
        'precio_base',
        'iva',
        'precio',
    ];

    protected static function booted()
    {
        static::updated(function(Servicio $servicio) {
            // 1) Recalcula cada detalle
            $servicio->detalles()->each(function(DetalleServicio $det) use ($servicio) {
                $det->precio_unitario = $servicio->precio;
                $det->subtotal        = round($servicio->precio * $det->cantidad, 2);
                $det->saveQuietly();
            });

            // 2) Recalcula total_servicios por orden
            $ordenIds = $servicio->detalles()->pluck('id_orden')->unique();
            OrdenServicio::whereIn('id_orden', $ordenIds)->get()->each(function(OrdenServicio $orden) {
                $orden->total_servicios = $orden->detallesServicios()->sum('subtotal');
                $orden->saveQuietly();
            });
        });
    }

    public function tipoServicio()
    {
        return $this->belongsTo(TipoServicio::class, 'id_tipo', 'id_tipo');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleServicio::class, 'id_servicio', 'id_servicio');
    }
}
