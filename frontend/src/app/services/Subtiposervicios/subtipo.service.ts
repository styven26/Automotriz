import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubtipoService {

  private apiUrl = 'http://localhost:8000/api/public/servicios';

  constructor(private http: HttpClient) {}

  obtenerSubtiposServicios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  crearSubtipoServicio(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  actualizarSubtipoServicio(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  eliminarSubtipoServicio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
}