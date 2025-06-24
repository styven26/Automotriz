<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Cita;

class CitaConfirmada extends Mailable
{
    use Queueable, SerializesModels;

    public Cita $cita;

    /**
     * Create a new message instance.
     */
    public function __construct(Cita $cita)
    {
        $this->cita = $cita;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this
            ->subject('Tu cita ha sido confirmada')
            ->view('emails.cita-confirmada')        // resources/views/emails/cita-confirmada.blade.php
            ->with([
                'cita'       => $this->cita,
                'vehiculo'   => $this->cita->vehiculo,
                'servicios'  => $this->cita->ordenServicio->detallesServicios,
            ]);
    }
}
