import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Repuesto {
  id_repuesto?: number;
  cedula: string;
  nombre: string;
  precio_base: number;
  iva: number;
  precio_final?: number;
  stock: number;
  stock_minimo: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RepuestoService {
  private baseUrl = 'http://localhost:8000/api/vendedor/repuestos';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(this.baseUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getById(id: number): Observable<Repuesto> {
    return this.http.get<Repuesto>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  create(data: Repuesto): Observable<Repuesto> {
    return this.http.post<Repuesto>(this.baseUrl, data, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, data: Partial<Repuesto>): Observable<Repuesto> {
    return this.http.put<Repuesto>(`${this.baseUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  descargarReporteInventario(): Observable<Blob> {
    const headers = this.getAuthHeaders().set('Accept', 'application/pdf');
    return this.http.get('http://localhost:8000/api/vendedor/reporte-inventario', {
      headers,
      responseType: 'blob'
    });
  }
}
