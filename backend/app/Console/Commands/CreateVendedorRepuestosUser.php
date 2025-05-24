<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CreateVendedorRepuestosUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:vendedor';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crea un nuevo usuario vendedor de repuestos con los roles de vendedor y cliente';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Solicitar datos al usuario
        $nombre          = $this->ask('Nombre del vendedor de repuestos');
        $apellido        = $this->ask('Apellido del vendedor de repuestos');
        $correo          = $this->ask('Correo del vendedor de repuestos');
        $cedula          = $this->ask('Cédula del vendedor (10 dígitos)');
        $password        = $this->secret('Contraseña del vendedor');
        $telefono        = $this->ask('Teléfono del vendedor (sin +593)');
        $direccion       = $this->ask('Dirección del vendedor');
        $genero          = $this->choice('Género del vendedor', ['masculino', 'femenino', 'otro']);
        $fechaNacimiento = $this->ask('Fecha de nacimiento del vendedor (YYYY-MM-DD)');

        // Formatear el teléfono con +593
        $telefono = $this->formatTelefonoEcuador($telefono);

        // Validar los datos ingresados
        $validator = Validator::make([
            'nombre'             => $nombre,
            'apellido'           => $apellido,
            'correo'             => $correo,
            'cedula'             => $cedula,
            'password'           => $password,
            'telefono'           => $telefono,
            'direccion_domicilio'=> $direccion,
            'genero'             => $genero,
            'fecha_nacimiento'   => $fechaNacimiento,
        ], [
            'nombre'               => 'required|string|max:50',
            'apellido'             => 'required|string|max:50',
            'correo'               => 'required|string|email|max:100|unique:usuario,correo',
            'cedula'               => ['required','digits:10', function($attr, $value, $fail) {
                                        if (!preg_match('/^[0-9]{10}$/', $value)) {
                                            $fail('La cédula ecuatoriana no es válida.');
                                        }
                                    }],
            'password'             => 'required|string|min:8',
            'telefono'             => 'required|string|max:20',
            'direccion_domicilio'  => 'required|string|max:100',
            'genero'               => 'required|in:masculino,femenino,otro',
            'fecha_nacimiento'     => 'required|date|before:18 years ago',
        ], [
            'fecha_nacimiento.before' => 'El vendedor debe tener al menos 18 años.',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return 1;
        }

        // Crear el usuario y asignar roles en una transacción
        DB::transaction(function () use ($nombre, $apellido, $correo, $cedula, $password, $telefono, $direccion, $genero, $fechaNacimiento) {
            $usuario = Usuario::create([
                'nombre'             => $nombre,
                'apellido'           => $apellido,
                'correo'             => $correo,
                'cedula'             => $cedula,
                'password'           => Hash::make($password),
                'telefono'           => $telefono,
                'direccion_domicilio'=> $direccion,
                'genero'             => $genero,
                'fecha_nacimiento'   => $fechaNacimiento,
            ]);

            $rolVendedor = Rol::where('nombre', 'vendedor')->first();
            $rolCliente  = Rol::where('nombre', 'cliente')->first();

            if (! $rolVendedor || ! $rolCliente) {
                throw new \Exception("No existen los roles 'vendedor_repuestos' y/o 'cliente' en la tabla roles.");
            }

            $usuario->roles()->attach([
                $rolVendedor->id_rol,
                $rolCliente->id_rol,
            ]);

            $this->info("Vendedor de repuestos {$nombre} {$apellido} creado con éxito con los roles 'vendedor_repuestos' y 'cliente'.");
        });

        return 0;
    }

    /**
     * Formatea un teléfono ecuadoriano para que empiece con +593.
     */
    private function formatTelefonoEcuador(string $telefono): string
    {
        if (! str_starts_with($telefono, '+593')) {
            if (substr($telefono, 0, 1) === '0') {
                return '+593'.substr($telefono, 1);
            }
            return '+593'.$telefono;
        }
        return $telefono;
    }
}
