import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Distribución de servicios solicitados
export interface DistribucionServicio {
  nombre: string;
  total_solicitudes: number;
}

export interface IngresoPorMes {
  mes: string;
  anio: string;
  ingresos: number;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = 'http://localhost:8000/api/cliente/citas';  // URL base para la API de citas en Laravel

  constructor(private http: HttpClient) {}

  // Método para obtener el token desde el localStorage
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Obtén el token almacenado
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

   // Crear una nueva cita
  crearCita(citaData: any): Observable<any> {
    return this.http.post(this.apiUrl, citaData, { headers: this.getHeaders() });
  }

  // Obtener la capacidad horaria de la fecha seleccionada
  obtenerCapacidad(payload: { fecha: string }): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/obtener-capacidad`, payload, { headers });
  }

  obtenerHorariosSugeridosDespues(payload: { fecha: string; cita_id: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/horarios-sugeridos-despues`, payload, { headers: this.getHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error al obtener horarios sugeridos:', error);
          return of(error);
        })
      );
  }  
  
  // Modificar una cita existente
  modificarCita(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos, { headers: this.getHeaders() });
  }
  
  // Cancelar una cita
  cancelarCita(citaId: number): Observable<any> {
    const url = `${this.apiUrl}/${citaId}`;
    return this.http.delete(url, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error al cancelar la cita:', error);
        throw new Error('No se pudo cancelar la cita. Por favor, inténtalo nuevamente.');
      })
    );
  }

  // Listar citas
  listarCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/listar`, { headers: this.getHeaders() });
  }

  // citas.service.ts
  busyVehicles(fecha: string, hora: string): Observable<number[]> {
    return this.http.get<number[]>(
      `http://localhost:8000/api/cliente/citas/ocupados`,
      { params: { fecha, hora }, headers: this.getHeaders() }
    );
  }

  // Listar citas atentidas
  listarCitasAtendidas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/atentida`, { headers: this.getHeaders() });
  }

  // Obtener horarios disponibles
  obtenerHorarioAlmuerzo(data: { fecha: string }) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`, // Token desde localStorage
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/horarios/almuerzo`, data, { headers });
  }  
  
  obtenerFacturacionTotal(): Observable<{ facturacionTotal: number }> {
    return this.http.get<{ facturacionTotal: number }>(
      `${this.apiUrl}/facturacion`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error al obtener la facturación total:', error);
        return of({ facturacionTotal: 0 }); // Devuelve un valor por defecto en caso de error
      })
    );
  }
  
  obtenerDistribucionServicios(): Observable<DistribucionServicio[]> {
    return this.http.get<DistribucionServicio[]>(`${this.apiUrl}/distribucion`, { headers: this.getHeaders() });
  }  
  
  obtenerIngresosPorMes(): Observable<{ name: string; value: number }[]> {
    return this.http.get<{ name: string; value: number }[]>(`${this.apiUrl}/ingresos`, {
      headers: this.getHeaders(),
    }).pipe(
      catchError((error) => {
        console.error('Error al obtener ingresos por mes:', error);
        return of([]); // Devuelve un array vacío en caso de error
      })
    );
  }  
}