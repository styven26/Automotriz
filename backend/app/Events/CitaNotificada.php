<?php

namespace App\Events;

use App\Models\Usuario;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CitaNotificada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @var string */
    public $mensaje;

    /** @var string La cédula del mecánico que recibirá la notificación */
    public $cedulaMecanico;

    /** @var array Datos básicos del cliente */
    public $cliente;

    /**
     * @param  string   $mensaje        Texto de la notificación
     * @param  string   $cedulaMecanico Cédula del mecánico asignado
     * @param  Usuario  $cliente        Instancia del modelo Usuario (cliente)
     */
    public function __construct(string $mensaje, string $cedulaMecanico, Usuario $cliente)
    {
        $this->mensaje         = $mensaje;
        $this->cedulaMecanico  = $cedulaMecanico;
        $this->cliente         = [
            'cedula'   => $cliente->cedula,
            'nombre'   => $cliente->nombre,
            'apellido' => $cliente->apellido,
        ];
    }

    /**
     * Especifica el canal de broadcasting.
     *
     * @return Channel
     */
    public function broadcastOn()
    {
        return new Channel("notificaciones-mecanico-{$this->cedulaMecanico}");
    }

    /**
     * Nombre del evento que llegará al front.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'cita-notificada';
    }

    /**
     * Payload que se envía junto al evento.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'mensaje' => $this->mensaje,
            'cliente' => $this->cliente,
        ];
    }
}
