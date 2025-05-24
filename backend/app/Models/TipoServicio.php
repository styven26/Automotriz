<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoServicio extends Model
{
    // Nombre de la tabla
    protected $table = 'tipo_servicio';

    // Clave primaria personalizada
    protected $primaryKey = 'id_tipo';
    public $incrementing = true;
    protected $keyType = 'int';

    // No tienes timestamps en la migración
    public $timestamps = false;

    // Campos asignables
    protected $fillable = [
        'nombre',
    ];

    /**
     * Un tipo de servicio puede tener muchos servicios.
     */
    public function servicios()
    {
        return $this->hasMany(Servicio::class, 'id_tipo', 'id_tipo');
    }
}
