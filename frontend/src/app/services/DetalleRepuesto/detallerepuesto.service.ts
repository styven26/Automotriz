import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleRepuesto {
  id_detalle_repuesto?: number;
  id_repuesto: number;
  id_orden: number;
  cantidad: number;
  precio: number;
  subtotal?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DetalleRepuestoService {
  private baseUrl = 'http://localhost:8000/api/vendedor/detalle-repuestos';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<DetalleRepuesto[]> {
    return this.http.get<DetalleRepuesto[]>(this.baseUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getById(id: number): Observable<DetalleRepuesto> {
    return this.http.get<DetalleRepuesto>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  create(data: DetalleRepuesto): Observable<DetalleRepuesto> {
    return this.http.post<DetalleRepuesto>(this.baseUrl, data, {
      headers: this.getAuthHeaders()
    });
  }

  update(id: number, data: Partial<DetalleRepuesto>): Observable<DetalleRepuesto> {
    return this.http.put<DetalleRepuesto>(`${this.baseUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
