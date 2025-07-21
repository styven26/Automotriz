import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TiposService {

  private apiUrl = 'http://localhost:8000/api/public/tipos-servicios';

  constructor(private http: HttpClient) {}

  obtenerTiposServicios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  crearTipoServicio(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  actualizarTipoServicio(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  eliminarTipoServicio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  reactivarTipoServicio(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reactivar`, {});
  }

  verificarNombreExiste(nombre: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/existe/${nombre}`);
  }
  
}