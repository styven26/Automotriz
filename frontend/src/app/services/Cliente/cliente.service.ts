import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  
    const params = new URLSearchParams();
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.mes) params.append('mes', filtros.mes);
  
    const url = `${this.baseUrl}/historial-servicios?${params.toString()}`;
    
    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (response: Blob) => this.descargarArchivo(response, 'reporte-historial-servicios.pdf'),
      error: (error: any) => {
        console.error('Error al descargar el reporte:', error);
      },
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
