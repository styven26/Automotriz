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
        Schema::create('estados_citas', function (Blueprint $table) {
            $table->id('id_estado'); // PK
            $table->string('nombre_estado', 100);

            // UNIQUE para que no se repita el mismo nombre de estado
            $table->unique('nombre_estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados_citas');
    }
};
