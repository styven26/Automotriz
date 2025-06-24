import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  private echo: Echo<any>; // Usa 'any' para evitar problemas de tipo

  constructor() {
    // Asignar manualmente Pusher al objeto global
    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'pusher',
      key: 'fuijokcwvm6o9mkb7k2l', // Clave de tu aplicación Reverb o Pusher
      wsHost: '127.0.0.1', // O la URL de tu backend
      wsPort: 8080,
      cluster: 'sa1', // Agrega esta línea
      forceTLS: false,
      disableStats: true,
    });
  }

  subscribeToNotifications(
    channelName: string,
    callback: (message: string, cliente: { nombre: string; apellido: string } | undefined) => void
  ): void {
    console.log('📡 Echo → suscribiendo a canal:', channelName);
    this.echo
      .channel(channelName)
      .listen('.cita-notificada', (payload: any) => {
        console.log('📬 Evento recibido en frontend:', payload);
        // payload.mensaje y payload.cliente vienen del broadcastWith()
        callback(payload.mensaje, payload.cliente);
      });
  }

  subscribeToTrabajoActualizado(
    clienteCedula: string,
    callback: (payload: {
      id_orden: number;
      estado: string;
      vehiculo: string;
      cliente_cedula: string;
      detalles: Array<{
        id_detalle: number;
        servicio: string;
        descripcion: string;
        progreso: number;
      }>;
    }) => void
  ): void {
    this.echo
      .channel(`notificaciones-cliente-${clienteCedula}`)
      .listen('.trabajo-actualizado', (payload: any) => {
        console.log('Evento trabajo-actualizado recibido:', payload);

        // Ahora el backend envía 'detalles' en lugar de 'subtipos'
        if (payload && Array.isArray(payload.detalles)) {
          callback(payload);
        } else {
          console.error(
            'Error: `detalles` no es un array o está indefinido.',
            payload.detalles
          );
        }
      });
  }    
}