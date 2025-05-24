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
        Schema::create('repuestos', function (Blueprint $table) {
            $table->id('id_repuesto');

            // FK al usuario (quien da de alta)
            $table->string('cedula', 10);
            $table->foreign('cedula')
                ->references('cedula')
                ->on('usuario')
                ->onDelete('restrict');

            // Datos del repuesto
            $table->string('nombre', 50)->unique();
            $table->decimal('precio_base', 10, 2)->default(0);
            $table->unsignedInteger('iva')->default(0);
            $table->decimal('precio_final', 10, 2)->default(0);

            // Inventario
            $table->integer('stock')
                ->default(0)
                ->comment('Cantidad disponible en inventario');
            $table->integer('stock_minimo')
                ->default(1)
                ->comment('Nivel crítico para reordenar');

            // Auditoría
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repuestos');
    }
};
