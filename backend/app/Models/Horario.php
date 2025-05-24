<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    protected $table = 'horarios';
    protected $primaryKey = 'id_horario';
    public $incrementing = true;
    protected $keyType = 'int';

    // Desactivar timestamps
    public $timestamps = false;

    protected $fillable = [
        'dia_semana',
        'manana_inicio',
        'tarde_fin',
        'capacidad_max',
    ];

    /**
     * Un horario puede tener muchas citas.
     */
    public function citas()
    {
        return $this->hasMany(Cita::class, 'id_horario', 'id_horario');
    }
}
