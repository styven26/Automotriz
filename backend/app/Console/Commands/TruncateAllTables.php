<?php 

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TruncateAllTables extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'truncate:all-tables';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina todos los registros de todas las tablas incluyendo las que tienen claves foráneas';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Desactivar la verificación de claves foráneas
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Listar todas las tablas que se van a truncar
        $tables = [
            'administradores',
            'cache',
            'cache_locks',
            'citas',
            'clientes',
            'failed_jobs',
            'horarios',
            'jobs',
            'job_batches',
            'mecanicos',
            'migrations',
            'monitoreo_vehiculos',
            'password_reset_tokens',
            'personal_access_tokens',
            'subtipos_servicios',
            'tipos_servicios',
            'trabajos',
            'vehiculos',
        ];

        // Truncar todas las tablas
        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        // Reactivar la verificación de claves foráneas
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info('Todas las tablas han sido vaciadas con éxito.');
    }
}
