<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadosCitasSeeder extends Seeder
{
    public function run()
    {
        DB::table('estados_citas')->insertOrIgnore([
            ['id_estado'     => 1, 'nombre_estado' => 'Confirmada'],
            ['id_estado'     => 2, 'nombre_estado' => 'Cancelada'],
            ['id_estado'     => 3, 'nombre_estado' => 'Atendida'],
            ['id_estado'     => 4, 'nombre_estado' => 'Diagnosticado'],
        ]);
    }
}
