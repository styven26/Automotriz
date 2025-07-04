<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FotoRepuestoMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $nombre;
    public int    $cantidad;
    public string $rutaFoto;   // ← público, para pasarlo a la vista

    public function __construct(string $nombre, int $cantidad, string $rutaFoto)
    {
        $this->nombre   = $nombre;
        $this->cantidad = $cantidad;
        $this->rutaFoto = $rutaFoto;
    }

    public function build()
    {
        return $this
            ->subject("Foto de repuesto solicitada")
            ->view('emails.foto_repuesto')
            ->with([
                'nombre'   => $this->nombre,
                'cantidad' => $this->cantidad,
                'rutaFoto' => $this->rutaFoto,  // ← pasa la ruta a la vista
            ])
            ->attach(public_path($this->rutaFoto), [
                'as'   => pathinfo($this->rutaFoto, PATHINFO_BASENAME),
                'mime' => mime_content_type(public_path($this->rutaFoto)),
            ]);
    }
}
