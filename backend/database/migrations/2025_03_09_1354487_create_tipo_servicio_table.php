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
        Schema::create('tipo_servicio', function (Blueprint $table) {
            $table->id('id_tipo'); // PK
            $table->string('nombre', 100);

            // Único para no repetir nombres
            $table->unique('nombre');

            $table->boolean('activo')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipo_orden_servicio');
    }
};
