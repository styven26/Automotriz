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
        Schema::create('detalle_servicio', function (Blueprint $table) {
            $table->id('id_detalle'); // PK
        
            // FK a orden_servicio
            $table->unsignedBigInteger('id_orden');
            $table->foreign('id_orden')
                  ->references('id_orden')
                  ->on('orden_servicio')
                  ->onDelete('cascade');
        
            // FK a servicios
            $table->unsignedBigInteger('id_servicio');
            $table->foreign('id_servicio')
                  ->references('id_servicio')
                  ->on('servicios')
                  ->onDelete('restrict');
        
            $table->text('descripcion')->nullable();
            $table->integer('progreso')->default(0);
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_servicio');
    }
};
