<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Cita;

class RecordatorioCita extends Mailable
{
    use Queueable, SerializesModels;

    public Cita $cita;

    public function __construct(Cita $cita)
    {
        $this->cita = $cita;
    }

    public function build()
    {
        return $this
            ->subject('Recordatorio: Tu cita en 10 minutos')
            ->view('emails.recordatorio-cita')     // resources/views/emails/recordatorio-cita.blade.php
            ->with([
                'cita'      => $this->cita,
                'vehiculo'  => $this->cita->vehiculo,
                'servicios' => $this->cita->ordenServicio->detallesServicios,
            ]);
    }
}
