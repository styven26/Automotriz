<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    /**
     * Un servicio pertenece a un tipo de servicio.
     */
    public function tipoServicio()
    {
        return $this->belongsTo(TipoServicio::class, 'id_tipo', 'id_tipo');
    }

    /**
     * Un servicio puede aparecer en muchos detalles de servicio.
     */
    public function detalles()
    {
        return $this->hasMany(DetalleServicio::class, 'id_servicio', 'id_servicio');
    }
}
