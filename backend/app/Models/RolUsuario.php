<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RolUsuario extends Pivot
{
    protected $table = 'roles_usuario';

    // La tabla tiene clave primaria compuesta, por lo que no es autoincremental.
    protected $primaryKey = null;
    public $incrementing = false;

    protected $fillable = [
        'id_rol',
        'cedula',
    ];
}
