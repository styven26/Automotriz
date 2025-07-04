// src/app/services/Orden/orden.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleServicio {
  id_detalle: number;
  id_servicio: number;
  descripcion?: string;
  progreso: number;
  cantidad: number;
  servicio: {
    id_servicio: number;
    nombre: string;
    descripcion?: string;
    precio_base: number;
    iva: number;
    precio: number;
  };
}

export interface DetalleRepuesto {
  id_detalle_repuesto: number;
  cantidad: number;
  subtotal: number;
  repuesto: { id_repuesto: number; nombre: string; stock: number; precio_final: number };
}

export interface Orden {
  id_orden: number;
  id_cita: number;
  id_vehiculo: number;
  fecha_inicio: string;
  fecha_fin?: string;
  diagnostico?: string;
  servicios_recomendados?: string;
  descripcion?: string;
  total_servicios: number;
  total_repuestos: number;
  cita: {
    id_cita: number;
    estado: string;
    fecha: string;
    hora: string;
    fecha_fin?: string;
    hora_fin?: string;
    cliente: { cedula: string; nombre: string; apellido: string; correo?: string; };
    cedula_mecanico: string;    // ← agregado
  };
  vehiculo: { id_vehiculo: number; marca: string; modelo: string; imagen?: string; kilometraje?:number; numero_placa?: string; fecha_ultimo_servicio?:string; };
  detalles_servicios: DetalleServicio[];
  detalles_repuestos: DetalleRepuesto[];
}

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private base = 'http://localhost:8000/api/mecanico/ordenes';

  constructor(private http: HttpClient) { }

  /** Construye los headers con el token JWT */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /** Enviar foto + datos al cliente */
  enviarFotoGmailPorOrden(
    idOrden: number,
    payload: FormData
  ): Observable<any> {
    const token = localStorage.getItem('token') || '';
    // aquí sólo ponemos la cabecera de autenticación
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<any>(
      `${this.base}/${idOrden}/enviar-foto-gmail`,
      payload,
      { headers }   // ¡sin Content-Type!
    );
  }

  /** 1) Todas las órdenes del mecánico */
  listar(): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.base}`, {
      headers: this.getAuthHeaders()
    });
  }

  /** 2) Órdenes con cita confirmada o diagnosticado */
  listarConfirmadas(): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.base}/confirmadas`, {
      headers: this.getAuthHeaders()
    });
  }

  /** 3) Una orden por su id */
  obtener(id: number): Observable<Orden> {
    return this.http.get<Orden>(`${this.base}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /** 4) Actualizar progreso de los detalles */
  actualizarProgreso(id: number, progresos: { id_detalle: number; progreso: number; }[]): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.base}/${id}/progreso`,
      { progresos },
      { headers: this.getAuthHeaders() }
    );
  }

  /** 5) Actualizar descripciones de los detalles */
  actualizarDescripciones(id: number, descripciones: { id_detalle: number; descripcion: string; }[]): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.base}/${id}/descripciones`,
      { descripciones },
      { headers: this.getAuthHeaders() }
    );
  }

  /** 6) Finalizar automáticamente */
  finalizarAutomatico(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/${id}/finalizar-auto`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  descargarReporte(): void {
    const url = 'http://localhost:8000/api/mecanico/reporte-trabajos';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
        next: (response: Blob) => {
            const blob = new Blob([response], { type: 'application/pdf' });
            const downloadURL = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = 'reporte-trabajos.pdf';
            link.click();
        },
        error: (err) => {
            console.error('Error al descargar el reporte:', err);
        }
    });
  }
}