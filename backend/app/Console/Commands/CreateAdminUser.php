<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crea un nuevo usuario administrador con los roles de admin, mecánico y cliente';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Definir especialidades disponibles
        $especialidadesDisponibles = ['Mecánico General'];

        // Solicitar datos al usuario
        $nombre = $this->ask('Nombre del administrador');
        $apellido = $this->ask('Apellido del administrador');
        $correo = $this->ask('Correo del administrador');
        $cedula = $this->ask('Cédula del administrador (10 dígitos)');
        $password = $this->secret('Contraseña del administrador');
        $telefono = $this->ask('Teléfono del administrador (sin +593)');
        $direccion = $this->ask('Dirección del administrador');
        $especialidad = $this->choice('Especialidad del administrador', $especialidadesDisponibles);
        $genero = $this->choice('Género del administrador', ['masculino', 'femenino', 'otro']);
        $fechaNacimiento = $this->ask('Fecha de nacimiento del administrador (YYYY-MM-DD)');

        // Formatear el teléfono con el prefijo +593
        $telefono = $this->formatTelefonoEcuador($telefono);

        // Validar los datos ingresados
        $validator = Validator::make([
            'nombre' => $nombre,
            'apellido' => $apellido,
            'correo' => $correo,
            'cedula' => $cedula,
            'password' => $password,
            'telefono' => $telefono,
            'direccion_domicilio' => $direccion,
            'especialidad' => $especialidad,
            'genero' => $genero,
            'fecha_nacimiento' => $fechaNacimiento,
        ], [
            'nombre' => 'required|string|max:50',
            'apellido' => 'required|string|max:50',
            'correo' => 'required|string|email|max:100|unique:usuario,correo',
            'cedula' => ['required', 'digits:10', function ($attribute, $value, $fail) {
                if (!$this->isValidEcuadorianCedula($value)) {
                    $fail('La cédula ecuatoriana no es válida.');
                }
            }],
            'password' => 'required|string|min:8',
            'telefono' => 'required|string|max:20',
            'direccion_domicilio' => 'required|string|max:100',
            'especialidad' => 'required|string|max:100|in:' . implode(',', $especialidadesDisponibles),
            'genero' => 'required|in:masculino,femenino,otro',
            'fecha_nacimiento' => 'required|date|before:18 years ago',
        ], [
            'fecha_nacimiento.before' => 'El administrador debe tener al menos 18 años.',
            'especialidad.in' => 'La especialidad seleccionada no es válida.',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return 1;
        }

        // Crear el usuario y asignar roles dentro de una transacción
        DB::transaction(function () use ($nombre, $apellido, $correo, $cedula, $password, $telefono, $direccion, $especialidad, $genero, $fechaNacimiento) {
            // Crear el administrador en la tabla 'usuario'
            $usuario = Usuario::create([
                'nombre' => $nombre,
                'apellido' => $apellido,
                'correo' => $correo,
                'cedula' => $cedula,
                'password' => Hash::make($password),
                'telefono' => $telefono,
                'direccion_domicilio' => $direccion,
                'especialidad' => $especialidad,
                'genero' => $genero,
                'fecha_nacimiento' => $fechaNacimiento,
            ]);

            // Obtener los roles necesarios
            $rolAdmin = Rol::where('nombre', 'admin')->first();
            $rolMecanico = Rol::where('nombre', 'mecanico')->first();
            $rolCliente = Rol::where('nombre', 'cliente')->first();

            if (!$rolAdmin || !$rolMecanico || !$rolCliente) {
                throw new \Exception("Uno o más roles no existen en la tabla 'roles'.");
            }

            // Asignar roles al usuario; usamos la columna correcta del modelo Rol (id_rol)
            $usuario->roles()->attach([
                $rolAdmin->id_rol,
                $rolMecanico->id_rol,
                $rolCliente->id_rol,
            ]);

            $this->info("Administrador {$nombre} {$apellido} creado con éxito con los roles 'admin', 'mecanico' y 'cliente'.");
        });

        return 0;
    }

    private function isValidEcuadorianCedula($cedula)
    {
        return preg_match('/^[0-9]{10}$/', $cedula);
    }

    private function formatTelefonoEcuador($telefono)
    {
        if (!str_starts_with($telefono, '+593')) {
            if (substr($telefono, 0, 1) === '0') {
                return '+593' . substr($telefono, 1);
            } else {
                return '+593' . $telefono;
            }
        }
        return $telefono;
    }
}
