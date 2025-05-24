<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Usuario extends Authenticatable implements JWTSubject
{
    use SoftDeletes;

    protected $table = 'usuario';

    // La clave primaria es 'cedula', de tipo string y no autoincremental
    protected $primaryKey = 'cedula';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'cedula',
        'nombre',
        'apellido',
        'correo',
        'password',
        'telefono',
        'direccion_domicilio',
        'especialidad',
        'genero',
        'fecha_nacimiento',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Relación muchos a muchos con el modelo Rol.
     */
    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'roles_usuario', 'cedula', 'id_rol');
    }

    /**
     * Métodos requeridos por la interfaz JWTSubject.
     */
    public function getJWTIdentifier()
    {
        // Retorna la clave primaria del usuario
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        // Retorna un array con claims personalizados si los necesitas, o un array vacío
        return [];
    }

    // Método para verificar si tiene un rol específico
    public function hasRole($roleName)
    {
        return $this->roles->contains('nombre', $roleName);
    }

    /**
     * Verificar si un usuario tiene un rol específico.
     */
    public function tieneRol($rolNombre)
    {
        return $this->roles->contains('nombre', $rolNombre);
    }

    /**
     * Todas las citas donde este usuario es el mecánico.
     */
    public function citasComoMecanico()
    {
        return $this->hasMany(Cita::class, 'cedula_mecanico', 'cedula');
    }

    /**
     * Relación inversa en caso de que quieras acceder al cliente de una cita via $usuario->citasComoCliente()
     */
    public function citasComoCliente()
    {
        return $this->hasMany(Cita::class, 'cedula_cliente', 'cedula');
    }
}
