import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://localhost:8000/api/cliente/vehiculos';

  constructor(private http: HttpClient) {}

  // Crear un vehículo
  crearVehiculo(data: FormData): Observable<any> {
    console.log('Datos enviados:', data); // Depuración
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}`, data, { headers }).pipe(
      catchError(this.handleError)
    );
  } 

  // Obtener vehículos del cliente autenticado
  obtenerVehiculos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(this.apiUrl, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar un vehículo
  actualizarVehiculo(idVehiculo: number, data: FormData): Observable<any> {
    // Laravel necesita _method=PUT en POST para parsear bien FormData + archivos
    data.append('_method', 'PUT');
    const headers = this.getHeaders();
    return this.http.post(
      `${this.apiUrl}/${idVehiculo}`,
    data,
    { headers }
    ).pipe(catchError(this.handleError));
   }

  // Eliminar un vehículo
  eliminarVehiculo(idVehiculo: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${idVehiculo}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Verificar número de placa
  verificarPlaca(numeroPlaca: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/verificar-placa/${numeroPlaca}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener encabezados de autorización
  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error del servicio:', error);
    return throwError(() => error);
  }
}
