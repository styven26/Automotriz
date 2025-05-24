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
        Schema::create('roles_usuario', function (Blueprint $table) {
            // PK compuesta
            $table->unsignedBigInteger('id_rol');
            $table->string('cedula', 10);

            // Definimos la PK compuesta
            $table->primary(['id_rol', 'cedula']);

            // FK a roles
            $table->foreign('id_rol')
                  ->references('id_rol')
                  ->on('roles')
                  ->onDelete('cascade');

            // FK a usuario
            $table->foreign('cedula')
                  ->references('cedula')
                  ->on('usuario')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles_usuario');
    }
};
