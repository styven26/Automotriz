<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoCita extends Model
{
    protected $table = 'estados_citas';
    protected $primaryKey = 'id_estado';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nombre_estado',
    ];

    /**
     * Un estado puede tener muchas citas.
     */
    public function citas()
    {
        return $this->hasMany(Cita::class, 'id_estado', 'id_estado');
    }
}
