import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MecanicoService {
  private apiUrl = 'http://localhost:8000/api/admin/mecanicos'; // URL de tu API en Laravel

  constructor(private http: HttpClient) { }

  // Crear mecánico
  crearMecanico(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Asegúrate de que el token esté almacenado correctamente
    });
  
    return this.http.post(this.apiUrl, data, { headers });
  }  

  // Actualizar mecánico
  actualizarMecanico(id: number, data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Token de autenticación
    });
  
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }

  // Eliminar mecánico
  eliminarMecanico(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Token de autenticación
    });
  
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  obtenerMecanicos(): Observable<any> {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    return this.http.get(this.apiUrl, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener los mecánicos:', error.message);
        return throwError(() => error);
      })
    );
  }  
}