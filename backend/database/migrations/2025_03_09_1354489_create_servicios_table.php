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
        Schema::create('servicios', function (Blueprint $table) {
            $table->id('id_servicio'); // PK

            // FK a tipo_orden_servicio
            $table->unsignedBigInteger('id_tipo');
            $table->foreign('id_tipo')
                  ->references('id_tipo')
                  ->on('tipo_servicio')
                  ->onDelete('restrict');

            $table->string('nombre', 50);
            $table->text('descripcion')->nullable();
            $table->decimal('precio_base', 10, 2)->default(0);
            $table->integer('iva')->default(0);
            $table->decimal('precio', 10, 2)->default(0);

            // Único para no repetir nombre
            $table->unique('nombre');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servicios');
    }
};
