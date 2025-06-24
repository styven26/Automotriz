import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private baseUrl = 'http://localhost:8000/api/cliente/reportes';

  constructor(private http: HttpClient) {}

  // Obtener encabezados con token de autorización
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || ''; // Manejo en caso de que no exista el token
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Descargar reporte de estado de vehículos
  descargarEstadoVehiculos(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/estado-vehiculos`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }

  // Descargar historial de servicios
  descargarHistorialServicios(filtros: any): void {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (filtros.anio) { params = params.set('anio', filtros.anio); }
    if (filtros.mes)  { params = params.set('mes',  filtros.mes);  }

    this.http.get(`${this.baseUrl}/historial-servicios`, {
      headers,
      params,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) =>
        this.descargarArchivo(blob, 'historial-servicios.pdf'),
      error: err => console.error('Error al descargar el reporte:', err)
    });
  }
  
  // Descargar servicios más solicitados
  descargarServiciosMasSolicitados(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/servicios-mas-solicitados`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }

  // Método auxiliar para descargar un archivo
  descargarArchivo(data: Blob, filename: string): void {
    const blob = new Blob([data], { type: 'application/pdf' }); // Crear un Blob con el contenido del PDF
    const url = window.URL.createObjectURL(blob); // Crear una URL de objeto
    const link = document.createElement('a'); // Crear un enlace
    link.href = url;
    link.download = filename; // Asignar el nombre del archivo
    link.click(); // Forzar la descarga
    window.URL.revokeObjectURL(url); // Liberar memoria
  }
}
