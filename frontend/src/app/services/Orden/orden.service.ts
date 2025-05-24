// src/app/services/Orden/orden.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleServicio {
  id_detalle: number;
  id_servicio: number;
  descripcion?: string;
  progreso: number;
  servicio: {
    id_servicio: number;
    nombre: string;
    descripcion?: string;
    precio_base: number;
    iva: number;
    precio: number;
  };
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
  vehiculo: { id_vehiculo: number; marca: string; modelo: string; imagen?: string; };
  detalles_servicios: DetalleServicio[];
}

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private base = 'http://localhost:8000/api/mecanico/ordenes';

  constructor(private http: HttpClient) { }

  /** Construye los headers con el token JWT */
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
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

  /** 6) Completar la orden con fecha_fin y hora_fin */
  completarOrden(id: number, fecha_fin: string, hora_fin: string): Observable<{ message: string; fecha_fin: string; hora_fin: string }> {
    return this.http.post<{ message: string; fecha_fin: string; hora_fin: string }>(
      `${this.base}/${id}/completar`,
      { fecha_fin, hora_fin },
      { headers: this.getAuthHeaders() }
    );
  }

  /** 7) Finalizar automáticamente */
  finalizarAutomatico(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/${id}/finalizar-auto`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  descargarReporte(): void {
    const url = 'http://localhost:8000/api/mecanico/reporte-trabajos';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${sessionStorage.getItem('token')}`);

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