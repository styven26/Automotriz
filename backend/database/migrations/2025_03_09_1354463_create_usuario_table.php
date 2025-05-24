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
        Schema::create('usuario', function (Blueprint $table) {
            // cedula como PK (string)
            $table->string('cedula', 10);
            $table->primary('cedula');

            $table->string('nombre', 50);
            $table->string('apellido', 50);

            // correo único
            $table->string('correo', 100)->unique();
            $table->string('password');
            $table->string('telefono', 20)->nullable();
            $table->string('direccion_domicilio', 100)->nullable();
            $table->string('especialidad', 100)->nullable();
            $table->enum('genero', ['masculino','femenino','otro'])->nullable();
            $table->date('fecha_nacimiento')->nullable();

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
        Schema::dropIfExists('usuario');
    }
};
