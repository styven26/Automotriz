<?php

namespace App\Events;

use App\Models\OrdenServicio;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TrabajoActualizado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @var array */
    public $trabajo;

    /**
     * Construye el payload usando las relaciones correctas.
     *
     * @param  OrdenServicio  $orden
     */
    public function __construct(OrdenServicio $orden)
    {
        // Aseguramos que las relaciones estén cargadas
        $orden->loadMissing([
            'cita.estado',
            'cita.vehiculo',
            'detallesServicios.servicio',
        ]);

        // Obtenemos la colección (puede ser emptyCollection si no hay detalles)
        $detalles = $orden->detallesServicios ?? collect();

        // Mapear cada detalle a un array simple
        $detallesArray = $detalles->map(fn($d) => [
            'id_detalle'  => $d->id_detalle,
            'servicio'    => $d->servicio->nombre,
            'descripcion' => $d->descripcion,
            'progreso'    => $d->progreso,
        ])->values()->toArray();

        $this->trabajo = [
            'id_orden'       => $orden->id_orden,
            'estado'         => optional($orden->cita->estado)->nombre_estado,
            'vehiculo'       => "{$orden->cita->vehiculo->marca} {$orden->cita->vehiculo->modelo}",
            'cliente_cedula' => $orden->cita->cedula_cliente,
            'detalles'       => $detallesArray,
        ];
    }

    /**
     * Canal público donde se emite el evento.
     */
    public function broadcastOn()
    {
        return new Channel('notificaciones-cliente-' . $this->trabajo['cliente_cedula']);
    }

    /**
     * Nombre del evento en el frontend.
     */
    public function broadcastAs()
    {
        return 'trabajo-actualizado';
    }

    /**
     * Payload que se envía.
     */
    public function broadcastWith(): array
    {
        return $this->trabajo;
    }
}