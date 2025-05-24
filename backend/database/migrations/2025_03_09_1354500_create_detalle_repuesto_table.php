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
        Schema::create('detalle_repuesto', function (Blueprint $table) {
            $table->id('id_detalle_repuesto'); // PK

            // FK a repuestos
            $table->unsignedBigInteger('id_repuesto');
            $table->foreign('id_repuesto')
                  ->references('id_repuesto')
                  ->on('repuestos')
                  ->onDelete('restrict');

            // FK a orden_servicio
            $table->unsignedBigInteger('id_orden');
            $table->foreign('id_orden')
                  ->references('id_orden')
                  ->on('orden_servicio')
                  ->onDelete('cascade');

            $table->integer('cantidad')->default(1);
            $table->decimal('precio', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_repuesto');
    }
};
