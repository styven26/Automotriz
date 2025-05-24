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
        Schema::create('vehiculos', function (Blueprint $table) {
            // PK autoincremental
            $table->id('id_vehiculo');

            // FK a usuario(cedula)
            $table->string('cedula', 10);
            $table->foreign('cedula')
                  ->references('cedula')
                  ->on('usuario')
                  ->onDelete('restrict');

            $table->string('marca', 100);
            $table->string('modelo', 100);
            $table->integer('anio');
            $table->string('numero_placa', 100)->unique();

            // Según tu imagen:
            $table->string('transmision', 20)->nullable();
            $table->string('tipo_combustible', 20)->nullable();

            $table->integer('kilometraje')->default(0);
            $table->date('fecha_ultimo_servicio')->nullable();

            // Imagen (ruta o nombre de archivo)
            $table->string('imagen', 255)->nullable();

            // Timestamps y borrado lógico
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehiculos');
    }
};
