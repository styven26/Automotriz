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
        Schema::create('horarios', function (Blueprint $table) {
            $table->id('id_horario'); // PK
            $table->string('dia_semana', 20);
            $table->time('manana_inicio')->nullable();
            $table->time('tarde_fin')->nullable();
            $table->integer('capacidad_max')->default(1);

            // Evitar duplicar el mismo día
            $table->unique('dia_semana');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('horarios');
    }
};
