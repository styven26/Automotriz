<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run()
    {
        DB::table('roles')->insertOrIgnore([
            ['id_rol' => 1, 'nombre' => 'admin'],
            ['id_rol' => 2, 'nombre' => 'mecanico'],
            ['id_rol' => 3, 'nombre' => 'cliente'],
            ['id_rol' => 4, 'nombre' => 'vendedor'],
        ]);
    }
}
