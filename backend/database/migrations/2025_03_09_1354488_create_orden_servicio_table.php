<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orden_servicio', function (Blueprint $table) {
            $table->id('id_orden'); // PK

            // FK a citas
            $table->unsignedBigInteger('id_cita');
            $table->foreign('id_cita')
                  ->references('id_cita')
                  ->on('citas')
                  ->onDelete('restrict');

            // FK a vehiculos
            $table->unsignedBigInteger('id_vehiculo');
            $table->foreign('id_vehiculo')
                  ->references('id_vehiculo')
                  ->on('vehiculos')
                  ->onDelete('restrict');

            // Campos
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->text('diagnostico')->nullable();
            $table->text('servicios_recomendados')->nullable();
            $table->text('descripcion')->nullable();
            $table->decimal('total_servicios', 10, 2)->default(0);
            $table->decimal('total_repuestos', 10, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orden_servicio');
    }
};
