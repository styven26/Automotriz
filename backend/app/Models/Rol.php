<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    // Especifica que la tabla es 'roles'
    protected $table = 'roles';

    // La clave primaria es 'id_rol'
    protected $primaryKey = 'id_rol';

    // Por defecto, se asume que es autoincremental y de tipo integer, no es necesario cambiar si así lo definiste en la migración
    protected $fillable = [
        'nombre',
    ];

    /**
     * Relación muchos a muchos inversa con el modelo Usuario.
     */
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'roles_usuario', 'id_rol', 'cedula');
    }
}
