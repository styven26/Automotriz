import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleServicio {
  id_detalle: number;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class DetalleServicioService {
  private api = 'http://localhost:8000/api/mecanico/detalle-servicio';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  updateCantidad(idDetalle: number, cantidad: number): Observable<DetalleServicio> {
    const url = `${this.api}/${idDetalle}`;
    return this.http.put<DetalleServicio>(url, { cantidad }, { headers: this.getAuthHeaders() });
  }
}
