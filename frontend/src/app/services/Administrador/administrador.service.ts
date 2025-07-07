import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Cliente {
  cedula: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  direccion_domicilio?: string;
  fecha_nacimiento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {

  private baseUrl = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  listarClientes(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.baseUrl}/clientes`, { headers });
  }

  actualizarCliente(cedula: string, datos: Omit<Cliente,'cedula'>): Observable<{ message: string; cliente: Cliente }> {
    const headers = this.getAuthHeaders();
    return this.http.put<{ message: string; cliente: Cliente }>(
      `${this.baseUrl}/clientes/${cedula}`,
      datos,
      { headers }
    );
  }

  eliminarCliente(cedula: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/clientes/${cedula}`, { headers });
  } 

  descargarReporteClientes(filtros: any): void {
    const headers = this.getAuthHeaders();
  
    // Construir los parámetros con los filtros de año y mes
    const params = new URLSearchParams();
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.mes) params.append('mes', filtros.mes);
  
    const url = `${this.baseUrl}/reporte-clientes?${params.toString()}`;
  
    this.http.get(url, { headers, responseType: 'blob' }).subscribe((response) => {
      this.descargarArchivo(response, 'reporte-clientes.pdf');
    });
  }  

  descargarReporteCitas(filtros: any): void {
    const headers = this.getAuthHeaders();
  
    // Construir los parámetros con los filtros de año y mes
    const params = new URLSearchParams();
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.mes) params.append('mes', filtros.mes);
  
    const url = `${this.baseUrl}/reporte-citas?${params.toString()}`;
  
    this.http.get(url, { headers, responseType: 'blob' }).subscribe((response) => {
      this.descargarArchivo(response, 'reporte-citas.pdf');
    });
  }  

  descargarReporteTrabajos(filtros: any): void {
    const headers = this.getAuthHeaders();
  
    // Construir los parámetros con los filtros de año y mes
    const params = new URLSearchParams();
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.mes) params.append('mes', filtros.mes);
  
    const url = `${this.baseUrl}/reporte-trabajos?${params.toString()}`;
  
    this.http.get(url, { headers, responseType: 'blob' }).subscribe((response) => {
        this.descargarArchivo(response, 'reporte-trabajos-mecanicos.pdf');
    });
  }
 
  descargarReporteFinanciero(filtros: any): void {
    const headers = this.getAuthHeaders();
  
    // Construir los parámetros con los filtros de año y mes
    const params = new URLSearchParams();
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.mes) params.append('mes', filtros.mes);
  
    const url = `${this.baseUrl}/reporte-financiero?${params.toString()}`;
  
    this.http.get(url, { headers, responseType: 'blob' }).subscribe((response) => {
      this.descargarArchivo(response, 'reporte-financiero.pdf');
    });
  }

  private descargarArchivo(data: Blob, filename: string): void {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

}