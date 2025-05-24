import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitaadminService {

  private baseUrl = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

   // Listar todas las citas (administrador)
   listarCitasGlobal(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cita-mecanicos`, { headers: this.getAuthHeaders() });
  }
  
}
