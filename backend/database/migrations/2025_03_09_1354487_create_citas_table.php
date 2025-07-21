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
      Schema::create('citas', function (Blueprint $table) {
         $table->id('id_cita'); // PK

            // FK a estados_citas (ej. "Pendiente", "Confirmada", "Cancelada", etc.)
            $table->unsignedBigInteger('id_estado');
            $table->foreign('id_estado')
                  ->references('id_estado')
                  ->on('estados_citas')
                  ->onDelete('restrict');

            // FK a horarios (ej. horario de atención)
            $table->unsignedBigInteger('id_horario');
            $table->foreign('id_horario')
                  ->references('id_horario')
                  ->on('horarios')
                  ->onDelete('restrict');

            // FK a usuario(cedula) => el cliente que solicita la cita
            $table->string('cedula_cliente', 10);
            $table->foreign('cedula_cliente')
                  ->references('cedula')
                  ->on('usuario')
                  ->onDelete('restrict');

            // FK a usuario(cedula) => el mecánico asignado a la cita
            $table->string('cedula_mecanico', 10);
            $table->foreign('cedula_mecanico')
                  ->references('cedula')
                  ->on('usuario')
                  ->onDelete('restrict');

            // FK a vehiculos => qué vehículo se está agendando
            $table->unsignedBigInteger('id_vehiculo');
            $table->foreign('id_vehiculo')
                  ->references('id_vehiculo')
                  ->on('vehiculos')
                  ->onDelete('restrict');

            // Indica si la cita está activa (true) o no
            $table->boolean('activo')->default(true);

            // Fechas y horas
            $table->date('fecha')->nullable();
            $table->time('hora')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->time('hora_fin')->nullable();

            // Restricción única para que NO se duplique el mismo vehículo
            // en la misma fecha/hora si la cita está activa.
            // De este modo, si "activo" = true, no puede haber colisión.
            $table->unique(['id_vehiculo','fecha','hora','activo']);

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
        Schema::dropIfExists('citas');
    }
};
